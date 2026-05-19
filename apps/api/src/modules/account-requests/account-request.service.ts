import bcrypt from "bcryptjs";
import mongoose, { type ClientSession, Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { env } from "../../shared/config/env.js";
import { Roles, type Role } from "../../shared/permissions/permissions.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { normalizeOrganizationName } from "../organizations/organization-name.js";
import { OrganizationMemberModel } from "../organizations/organization-member.model.js";
import { PostulantOrganizationModel } from "../organizations/postulant-organization.model.js";
import { UserModel } from "../users/user.model.js";
import { AccountRequestModel } from "./account-request.model.js";

const ACCOUNT_REQUEST_STATUSES = ["submitted", "under_review", "approved", "rejected"] as const;
const MEMBER_ROLES = ["primary_contact", "representative", "viewer"] as const;

type AccountRequestStatus = (typeof ACCOUNT_REQUEST_STATUSES)[number];
type MemberRole = (typeof MEMBER_ROLES)[number];

type CreateAccountRequestInput = {
  requestedOrganizationName?: string;
  requestedLegalAddress?: string;
  requestedEmail?: string;
  requestedPhone?: string;
  approvalNumberOrigin?: string;
  contactFullName?: string;
  contactEmail?: string;
  contactPhone?: string;
  password?: string;
  website?: string;
  formStartedAt?: number;
};

type ListAccountRequestsFilters = {
  status?: string;
  search?: string;
  from?: string;
  to?: string;
};

type ApproveAccountRequestInput =
  | {
      organizationMode: "existing";
      organizationId?: string;
      memberRole?: string;
    }
  | {
      organizationMode: "create";
      organization?: {
        canonicalName?: string;
        legalAddress?: string;
        email?: string;
        phone?: string;
        approvalNumberOrigin?: string;
        aliases?: string[];
      };
      memberRole?: string;
    };

type ActorInput = {
  actorId: string;
  actorRole: Role;
};

type SanitizableRecord = Record<string, unknown> & { _id: Types.ObjectId };
type ResolvedOrganization = {
  _id: Types.ObjectId;
  canonicalName: string;
  status: "active" | "suspended" | "archived";
};

const trimmed = (value?: string) => {
  const next = value?.trim();
  return next ? next : undefined;
};

const normalizeEmail = (value?: string) => trimmed(value)?.toLowerCase();

const isEmailLike = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const toIso = (value?: Date | string) =>
  value ? new Date(value).toISOString() : undefined;

const toId = (value: unknown) => {
  if (!value) {
    return undefined;
  }

  return value.toString();
};

const toRecord = (source: unknown) => source as SanitizableRecord;

const field = (request: SanitizableRecord, key: string) =>
  request[key] === null ? undefined : request[key];

const stringField = (request: SanitizableRecord, key: string) => {
  const value = field(request, key);
  return typeof value === "string" ? value : undefined;
};

const sanitizeAccountRequest = (source: unknown) => {
  const request = toRecord(source);

  return {
    id: request._id.toString(),
    requestedOrganizationName: stringField(request, "requestedOrganizationName"),
    requestedLegalAddress: stringField(request, "requestedLegalAddress"),
    requestedEmail: stringField(request, "requestedEmail"),
    requestedPhone: stringField(request, "requestedPhone"),
    approvalNumberOrigin: stringField(request, "approvalNumberOrigin"),
    contactFullName: stringField(request, "contactFullName"),
    contactEmail: stringField(request, "contactEmail"),
    contactPhone: stringField(request, "contactPhone"),
    status: stringField(request, "status"),
    matchedOrganizationId: toId(field(request, "matchedOrganizationId")),
    createdOrganizationId: toId(field(request, "createdOrganizationId")),
    resultingUserId: toId(field(request, "resultingUserId")),
    reviewedById: toId(field(request, "reviewedById")),
    reviewedAt: toIso(field(request, "reviewedAt") as Date | string | undefined),
    rejectionReason: stringField(request, "rejectionReason"),
    createdAt: toIso(field(request, "createdAt") as Date | string | undefined),
    updatedAt: toIso(field(request, "updatedAt") as Date | string | undefined),
  };
};

const sanitizeOrganization = (source: unknown) => {
  const organization = toRecord(source);

  return {
    id: organization._id.toString(),
    canonicalName: stringField(organization, "canonicalName"),
    normalizedName: stringField(organization, "normalizedName"),
    aliases: Array.isArray(organization.aliases) ? organization.aliases : [],
    legalAddress: stringField(organization, "legalAddress"),
    email: stringField(organization, "email"),
    phone: stringField(organization, "phone"),
    approvalNumberOrigin: stringField(organization, "approvalNumberOrigin"),
    status: stringField(organization, "status"),
    createdAt: toIso(field(organization, "createdAt") as Date | string | undefined),
    updatedAt: toIso(field(organization, "updatedAt") as Date | string | undefined),
  };
};

const validateMemberRole = (role?: string): MemberRole => {
  if (!role) {
    return "primary_contact";
  }

  if (!MEMBER_ROLES.includes(role as MemberRole)) {
    throw new HttpError(400, "Invalid memberRole");
  }

  return role as MemberRole;
};

const ensureObjectId = (id: string, label: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `${label} is invalid`);
  }

  return new Types.ObjectId(id);
};

const runWithOptionalTransaction = async <T>(
  operation: (session?: ClientSession) => Promise<T>,
) => {
  const session = await mongoose.startSession();

  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await operation(session);
    });

    return result as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const transactionsUnsupported =
      message.includes("Transaction numbers are only allowed") ||
      message.includes("replica set member or mongos");

    if (transactionsUnsupported) {
      return operation();
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const submitAccountRequest = async (input: CreateAccountRequestInput) => {
  if (trimmed(input.website)) {
    throw new HttpError(400, "Demande invalide.");
  }

  const formStartedAt =
    typeof input.formStartedAt === "number" ? input.formStartedAt : Number.NaN;
  const submittedAt = Date.now();

  if (
    !Number.isFinite(formStartedAt) ||
    formStartedAt <= 0 ||
    formStartedAt > submittedAt ||
    submittedAt - formStartedAt < env.publicAccountRequestMinSubmitMs
  ) {
    throw new HttpError(400, "Demande invalide.");
  }

  const requestedOrganizationName = trimmed(input.requestedOrganizationName);
  const contactFullName = trimmed(input.contactFullName);
  const contactEmail = normalizeEmail(input.contactEmail);
  const requestedEmail = normalizeEmail(input.requestedEmail);
  const password = input.password ?? "";

  if (!requestedOrganizationName) {
    throw new HttpError(400, "requestedOrganizationName is required");
  }

  if (!contactFullName) {
    throw new HttpError(400, "contactFullName is required");
  }

  if (!contactEmail || !isEmailLike(contactEmail)) {
    throw new HttpError(400, "contactEmail must be a valid email");
  }

  if (requestedEmail && !isEmailLike(requestedEmail)) {
    throw new HttpError(400, "requestedEmail must be a valid email");
  }

  if (password.length < 8) {
    throw new HttpError(400, "password must contain at least 8 characters");
  }

  const existingOpenRequest = await AccountRequestModel.findOne({
    contactEmail,
    status: { $in: ["submitted", "under_review"] },
  }).lean();

  if (existingOpenRequest) {
    throw new HttpError(409, "Une demande est deja en cours pour cet email.");
  }

  const existingPostulant = await UserModel.findOne({
    email: contactEmail,
    userType: "postulant",
  }).lean();

  if (existingPostulant) {
    throw new HttpError(409, "Un compte existe deja pour cet email.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const request = await AccountRequestModel.create({
    requestedOrganizationName,
    requestedLegalAddress: trimmed(input.requestedLegalAddress),
    requestedEmail,
    requestedPhone: trimmed(input.requestedPhone),
    approvalNumberOrigin: trimmed(input.approvalNumberOrigin),
    contactFullName,
    contactEmail,
    contactPhone: trimmed(input.contactPhone),
    passwordHash,
    status: "submitted",
  });

  await writeAuditLog({
    actorRole: "public",
    action: "portal.account_request_submitted",
    entityType: "account_request",
    entityId: request._id,
    after: {
      status: request.status,
      requestedOrganizationName: request.requestedOrganizationName,
      contactEmail: request.contactEmail,
    },
    metadata: {
      requestedOrganizationName: request.requestedOrganizationName,
      contactEmail: request.contactEmail,
    },
  });

  return { request: sanitizeAccountRequest(request) };
};

export const listAccountRequests = async (filters: ListAccountRequestsFilters) => {
  const query: Record<string, unknown> = {};
  const status = trimmed(filters.status);
  const search = trimmed(filters.search);
  const createdAt: Record<string, Date> = {};

  if (status) {
    if (!ACCOUNT_REQUEST_STATUSES.includes(status as AccountRequestStatus)) {
      throw new HttpError(400, "Invalid account request status");
    }

    query.status = status;
  }

  if (filters.from) {
    const from = new Date(filters.from);
    if (Number.isNaN(from.getTime())) {
      throw new HttpError(400, "from must be a valid date");
    }

    createdAt.$gte = from;
  }

  if (filters.to) {
    const to = new Date(filters.to);
    if (Number.isNaN(to.getTime())) {
      throw new HttpError(400, "to must be a valid date");
    }

    createdAt.$lte = to;
  }

  if (Object.keys(createdAt).length) {
    query.createdAt = createdAt;
  }

  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { requestedOrganizationName: searchRegex },
      { contactFullName: searchRegex },
      { contactEmail: searchRegex },
      { requestedEmail: searchRegex },
    ];
  }

  const requests = await AccountRequestModel.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return requests.map(sanitizeAccountRequest);
};

export const getAccountRequestDetails = async (id: string) => {
  const request = await AccountRequestModel.findById(ensureObjectId(id, "id")).lean();

  if (!request) {
    throw new HttpError(404, "Account request not found");
  }

  return sanitizeAccountRequest(request);
};

export const listOrganizations = async (filters: {
  search?: string;
  status?: string;
}) => {
  const query: Record<string, unknown> = {};
  const status = trimmed(filters.status);
  const search = trimmed(filters.search);

  if (status) {
    if (!["active", "suspended", "archived"].includes(status)) {
      throw new HttpError(400, "Invalid organization status");
    }

    query.status = status;
  }

  if (search) {
    const normalizedSearch = normalizeOrganizationName(search);
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { canonicalName: searchRegex },
      { normalizedName: { $regex: normalizedSearch, $options: "i" } },
      { aliases: { $regex: normalizedSearch, $options: "i" } },
      { email: searchRegex },
    ];
  }

  const organizations = await PostulantOrganizationModel.find(query)
    .sort({ canonicalName: 1 })
    .lean();

  return organizations.map(sanitizeOrganization);
};

export const approveAccountRequest = async (
  id: string,
  input: ApproveAccountRequestInput,
  actor: ActorInput,
) => {
  const requestId = ensureObjectId(id, "id");
  const memberRole = validateMemberRole(input.memberRole);

  return runWithOptionalTransaction(async (session) => {
    const sessionOptions = session ? { session } : {};
    const request = await AccountRequestModel.findById(requestId).session(session ?? null);

    if (!request) {
      throw new HttpError(404, "Account request not found");
    }

    if (request.status === "approved" || request.status === "rejected") {
      throw new HttpError(409, "Account request is already finalized");
    }

    const existingUser = await UserModel.findOne({
      email: request.contactEmail,
      userType: "postulant",
    }).session(session ?? null);

    if (existingUser) {
      throw new HttpError(409, "A postulant user with this email already exists");
    }

    let organization: ResolvedOrganization;
    let organizationAuditAction: string;

    if (input.organizationMode === "existing") {
      if (!input.organizationId) {
        throw new HttpError(400, "organizationId is required");
      }

      const existingOrganization = await PostulantOrganizationModel.findById(
        ensureObjectId(input.organizationId, "organizationId"),
      ).session(session ?? null);

      if (!existingOrganization || existingOrganization.status !== "active") {
        throw new HttpError(400, "Active organization not found");
      }

      organization = existingOrganization as unknown as ResolvedOrganization;
      request.matchedOrganizationId = organization._id;
      organizationAuditAction = "admin.organization_linked_from_account_request";
    } else if (input.organizationMode === "create") {
      const canonicalName = trimmed(input.organization?.canonicalName);

      if (!canonicalName) {
        throw new HttpError(400, "organization.canonicalName is required");
      }

      const normalizedName = normalizeOrganizationName(canonicalName);
      const duplicate = await PostulantOrganizationModel.findOne({
        normalizedName,
        status: "active",
      }).session(session ?? null);

      if (duplicate) {
        throw new HttpError(409, "An active organization with this name already exists");
      }

      const aliases = Array.from(
        new Set(
          [request.requestedOrganizationName, ...(input.organization?.aliases ?? [])]
            .map(normalizeOrganizationName)
            .filter(Boolean),
        ),
      );

      [organization] = await PostulantOrganizationModel.create(
        [
          {
            canonicalName,
            normalizedName,
            aliases,
            legalAddress: trimmed(input.organization?.legalAddress),
            email: normalizeEmail(input.organization?.email),
            phone: trimmed(input.organization?.phone),
            approvalNumberOrigin: trimmed(input.organization?.approvalNumberOrigin),
            status: "active",
          },
        ],
        sessionOptions,
      );
      request.createdOrganizationId = organization._id;
      organizationAuditAction = "admin.organization_created_from_account_request";
    } else {
      throw new HttpError(400, "Invalid organizationMode");
    }

    const [user] = await UserModel.create(
      [
        {
          userType: "postulant",
          fullName: request.contactFullName,
          email: request.contactEmail,
          phone: request.contactPhone,
          role: Roles.POSTULANT,
          organizationId: organization._id,
          passwordHash: request.passwordHash,
          isActive: true,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      ],
      sessionOptions,
    );

    const [membership] = await OrganizationMemberModel.create(
      [
        {
          organizationId: organization._id,
          userId: user._id,
          memberRole,
          status: "active",
          approvedById: actor.actorId,
          approvedAt: new Date(),
        },
      ],
      sessionOptions,
    );

    request.status = "approved";
    request.resultingUserId = user._id;
    request.reviewedById = new Types.ObjectId(actor.actorId);
    request.reviewedAt = new Date();
    await request.save(sessionOptions);

    await writeAuditLog({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: organizationAuditAction,
      entityType: "postulant_organization",
      entityId: organization._id,
      session,
      metadata: {
        accountRequestId: request._id.toString(),
        organizationMode: input.organizationMode,
      },
    });

    await writeAuditLog({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "admin.account_request_approved",
      entityType: "account_request",
      entityId: request._id,
      session,
      after: {
        status: request.status,
        organizationId: organization._id.toString(),
        resultingUserId: user._id.toString(),
        membershipId: membership._id.toString(),
      },
      metadata: {
        organizationMode: input.organizationMode,
        memberRole,
      },
    });

    return {
      request: sanitizeAccountRequest(request),
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: Roles.POSTULANT,
        organizationId: organization._id.toString(),
      },
      organization: {
        id: organization._id.toString(),
        canonicalName: organization.canonicalName,
      },
      membership: {
        id: membership._id.toString(),
        memberRole: membership.memberRole,
        status: membership.status,
      },
    };
  });
};

export const rejectAccountRequest = async (
  id: string,
  input: { reason?: string },
  actor: ActorInput,
) => {
  const reason = trimmed(input.reason);

  if (!reason) {
    throw new HttpError(400, "reason is required");
  }

  const request = await AccountRequestModel.findById(ensureObjectId(id, "id"));

  if (!request) {
    throw new HttpError(404, "Account request not found");
  }

  if (request.status === "approved" || request.status === "rejected") {
    throw new HttpError(409, "Account request is already finalized");
  }

  request.status = "rejected";
  request.rejectionReason = reason;
  request.reviewedById = new Types.ObjectId(actor.actorId);
  request.reviewedAt = new Date();
  await request.save();

  await writeAuditLog({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "admin.account_request_rejected",
    entityType: "account_request",
    entityId: request._id,
    after: {
      status: request.status,
      rejectionReason: request.rejectionReason,
      reviewedById: request.reviewedById.toString(),
    },
  });

  return {
    request: {
      id: request._id.toString(),
      status: request.status,
      rejectionReason: request.rejectionReason,
      reviewedAt: request.reviewedAt?.toISOString(),
    },
  };
};
