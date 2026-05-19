import { Types } from "mongoose";

import { env } from "../../shared/config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { storageAdapter } from "../../shared/storage/storage.adapter.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { NotificationModel } from "../notifications/notification.model.js";
import { PostulantOrganizationModel } from "../organizations/postulant-organization.model.js";
import { UserModel } from "../users/user.model.js";
import { RequestModel } from "./request.model.js";

const REQUEST_TYPES = ["oma_approval", "oma_recognition", "oma_renewal", "oma_modification"] as const;
const REQUEST_STATUSES = [
  "draft",
  "courrier_uploaded",
  "courrier_physical_declared",
  "submitted",
  "intake_in_review",
  "intake_requires_correction",
  "initial_sent_to_dg",
  "initial_dg_returned",
  "initial_dg_decision_recorded",
  "oriented_to_dn",
  "rejected",
  "reoriented",
  "dossier_opened",
  "closed",
] as const;
const EDITABLE_STATUSES = ["draft", "courrier_uploaded", "courrier_physical_declared"] as const;
const INTAKE_MUTABLE_STATUSES = ["submitted", "intake_in_review", "intake_requires_correction"] as const;
const LOCATIONS = ["ANAC", "DG", "DN", "other"] as const;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

type RequestType = (typeof REQUEST_TYPES)[number];
type RequestStatus = (typeof REQUEST_STATUSES)[number];
type RequestRecord = Record<string, unknown> & { _id: Types.ObjectId };
type Actor = { id: string; role: string; userType: "internal" | "postulant" };

const trimmed = (value?: string) => {
  const next = value?.trim();
  return next ? next : undefined;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensureObjectId = (id: string, label: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `${label} is invalid`);
  }

  return new Types.ObjectId(id);
};

const parseDate = (value: unknown, label: string) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${label} must be a valid date`);
  }

  return date;
};

const validateRequestType = (value?: string): RequestType => {
  if (!value || !REQUEST_TYPES.includes(value as RequestType)) {
    throw new HttpError(400, "requestType is invalid");
  }

  return value as RequestType;
};

const validateSubject = (value?: string) => {
  const subject = trimmed(value);
  if (!subject || subject.length < 3 || subject.length > 200) {
    throw new HttpError(400, "subject must contain between 3 and 200 characters");
  }

  return subject;
};

const validateMessage = (value?: string) => {
  const message = trimmed(value);
  if (message && message.length > 3000) {
    throw new HttpError(400, "message must contain at most 3000 characters");
  }

  return message;
};

const validateStatus = (value?: string) => {
  if (!value) {
    return undefined;
  }

  if (!REQUEST_STATUSES.includes(value as RequestStatus)) {
    throw new HttpError(400, "status is invalid");
  }

  return value as RequestStatus;
};

const ensureEditable = (status: string) => {
  if (!EDITABLE_STATUSES.includes(status as (typeof EDITABLE_STATUSES)[number])) {
    throw new HttpError(409, "Request cannot be modified after submission");
  }
};

const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
};

const ensureIntakeMutable = (status: string) => {
  if (!INTAKE_MUTABLE_STATUSES.includes(status as (typeof INTAKE_MUTABLE_STATUSES)[number])) {
    throw new HttpError(409, "Request cannot be processed at this stage");
  }
};

const toIso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : value ? new Date(String(value)).toISOString() : undefined;

const toId = (value: unknown) => value?.toString();

const portalStatusLabel = (status: string) => {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "courrier_uploaded":
      return "Courrier charge";
    case "courrier_physical_declared":
      return "Depot physique declare";
    case "submitted":
      return "Demande recue";
    case "intake_in_review":
      return "Demande en verification";
    case "intake_requires_correction":
      return "Action requise";
    case "initial_sent_to_dg":
      return "En attente d'orientation administrative";
    case "rejected":
      return "Demande rejetee";
    case "closed":
      return "Cloturee";
    default:
      return "En traitement";
  }
};

const sanitizeRequest = (source: unknown) => {
  const request = source as RequestRecord;

  return {
    id: request._id.toString(),
    organizationId: toId(request.organizationId),
    submittedById: toId(request.submittedById),
    requestType: request.requestType,
    subject: request.subject,
    message: request.message,
    status: request.status,
    portalStatusLabel: portalStatusLabel(String(request.status)),
    courrierSource: request.courrierSource,
    initialCourrierId: toId(request.initialCourrierId),
    initialDocumentId: toId(request.initialDocumentId),
    physicalDeposit: request.physicalDeposit,
    intake: sanitizeIntake(request.intake),
    submittedAt: toIso(request.submittedAt),
    closedAt: toIso(request.closedAt),
    createdAt: toIso(request.createdAt),
    updatedAt: toIso(request.updatedAt),
  };
};

const sanitizeIntake = (
  source: unknown,
  actorById: Map<string, ReturnType<typeof sanitizeRelatedUser>> = new Map(),
) => {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const intake = source as Record<string, unknown>;
  const startedById = toId(intake.startedById);
  const correctionRequestedById = toId(intake.correctionRequestedById);
  const printedForDgById = toId(intake.printedForDgById);
  const sentToDgById = toId(intake.sentToDgById);

  return {
    startedAt: toIso(intake.startedAt),
    startedById,
    startedBy: startedById ? actorById.get(startedById) : undefined,
    correctionRequestedAt: toIso(intake.correctionRequestedAt),
    correctionRequestedById,
    correctionRequestedBy: correctionRequestedById
      ? actorById.get(correctionRequestedById)
      : undefined,
    correctionReason: intake.correctionReason,
    printedForDgAt: toIso(intake.printedForDgAt),
    printedForDgById,
    printedForDgBy: printedForDgById ? actorById.get(printedForDgById) : undefined,
    sentToDgAt: toIso(intake.sentToDgAt),
    sentToDgById,
    sentToDgBy: sentToDgById ? actorById.get(sentToDgById) : undefined,
    notes: intake.notes,
  };
};

const sanitizeCourrier = (source: unknown) => {
  if (!source) {
    return undefined;
  }

  const courrier = source as RequestRecord;
  return {
    id: courrier._id.toString(),
    requestId: toId(courrier.requestId),
    dossierId: toId(courrier.dossierId),
    type: courrier.type,
    source: courrier.source,
    officialReference: courrier.officialReference,
    physicalDepositDate: toIso(courrier.physicalDepositDate),
    scannedAt: toIso(courrier.scannedAt),
    uploadedAt: toIso(courrier.uploadedAt),
    documentId: toId(courrier.documentId),
    registeredById: toId(courrier.registeredById),
    notes: courrier.notes,
    createdAt: toIso(courrier.createdAt),
    updatedAt: toIso(courrier.updatedAt),
  };
};

const sanitizeDocument = (source: unknown) => {
  if (!source) {
    return undefined;
  }

  const document = source as RequestRecord;
  return {
    id: document._id.toString(),
    ownerType: document.ownerType,
    ownerId: toId(document.ownerId),
    category: document.category,
    documentType: document.documentType,
    title: document.title,
    fileName: document.fileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    visibility: document.visibility,
    status: document.status,
    version: document.version,
    uploadedAt: toIso(document.uploadedAt),
    uploadedById: toId(document.uploadedById),
  };
};

const resolvePortalUser = async (actor: Actor) => {
  if (actor.userType !== "postulant") {
    throw new HttpError(403, "Portal access denied");
  }

  const user = await UserModel.findById(actor.id).select("userType organizationId role isActive").lean();

  if (!user || user.userType !== "postulant" || !user.isActive) {
    throw new HttpError(403, "Portal access denied");
  }

  if (!user.organizationId) {
    throw new HttpError(400, "Portal user must be linked to an organization");
  }

  return {
    userId: user._id,
    organizationId: user.organizationId,
  };
};

const getOwnedRequest = async (requestId: string, actor: Actor) => {
  const portalUser = await resolvePortalUser(actor);
  const request = await RequestModel.findOne({
    _id: ensureObjectId(requestId, "id"),
    submittedById: portalUser.userId,
  });

  if (!request) {
    throw new HttpError(404, "Request not found");
  }

  return request;
};

export const createPortalRequest = async (
  input: { requestType?: string; subject?: string; message?: string },
  actor: Actor,
) => {
  const portalUser = await resolvePortalUser(actor);
  const request = await RequestModel.create({
    organizationId: portalUser.organizationId,
    submittedById: portalUser.userId,
    requestType: validateRequestType(input.requestType),
    subject: validateSubject(input.subject),
    message: validateMessage(input.message),
    status: "draft",
  });

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "portal.request_created",
    entityType: "request",
    entityId: request._id,
    after: { status: request.status, requestType: request.requestType },
  });

  return { request: sanitizeRequest(request) };
};

export const listPortalRequests = async (
  filters: { status?: string; requestType?: string; search?: string; from?: string; to?: string },
  actor: Actor,
) => {
  const portalUser = await resolvePortalUser(actor);
  const query: Record<string, unknown> = { submittedById: portalUser.userId };
  const createdAt: Record<string, Date> = {};
  const status = validateStatus(trimmed(filters.status));
  const requestType = trimmed(filters.requestType);
  const search = trimmed(filters.search);

  if (status) {
    query.status = status;
  }

  if (requestType) {
    query.requestType = validateRequestType(requestType);
  }

  if (filters.from) {
    createdAt.$gte = parseDate(filters.from, "from")!;
  }

  if (filters.to) {
    createdAt.$lte = parseDate(filters.to, "to")!;
  }

  if (Object.keys(createdAt).length) {
    query.createdAt = createdAt;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ subject: regex }, { message: regex }];
  }

  const [items, total] = await Promise.all([
    RequestModel.find(query).sort({ createdAt: -1 }).lean(),
    RequestModel.countDocuments(query),
  ]);

  return { items: items.map(sanitizeRequest), total };
};

export const getPortalRequest = async (requestId: string, actor: Actor) => {
  const request = await getOwnedRequest(requestId, actor);
  const [courrier, document] = await Promise.all([
    request.initialCourrierId ? CourrierModel.findById(request.initialCourrierId).lean() : undefined,
    request.initialDocumentId ? DocumentModel.findById(request.initialDocumentId).lean() : undefined,
  ]);

  return {
    request: sanitizeRequest(request),
    courrier: sanitizeCourrier(courrier),
    document: sanitizeDocument(document),
  };
};

export const updatePortalRequest = async (
  requestId: string,
  input: { requestType?: string; subject?: string; message?: string },
  actor: Actor,
) => {
  const request = await getOwnedRequest(requestId, actor);
  ensureEditable(request.status);
  const before = sanitizeRequest(request);

  if (input.requestType !== undefined) {
    request.requestType = validateRequestType(input.requestType);
  }

  if (input.subject !== undefined) {
    request.subject = validateSubject(input.subject);
  }

  if (input.message !== undefined) {
    request.message = validateMessage(input.message);
  }

  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "portal.request_updated",
    entityType: "request",
    entityId: request._id,
    before,
    after: sanitizeRequest(request),
  });

  return { request: sanitizeRequest(request) };
};

export const uploadPortalRequestCourrier = async (
  requestId: string,
  file: Express.Multer.File | undefined,
  input: { notes?: string },
  actor: Actor,
) => {
  const request = await getOwnedRequest(requestId, actor);
  ensureEditable(request.status);

  if (!file) {
    throw new HttpError(400, "file is required");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new HttpError(400, "Unsupported courrier file type");
  }

  const previousDocumentId = request.initialDocumentId;
  const stored = await storageAdapter.save({
    buffer: file.buffer,
    fileName: file.originalname,
    mimeType: file.mimetype,
    ownerPath: `requests/${request._id.toString()}`,
  });
  const now = new Date();
  const previousDocument = previousDocumentId
    ? await DocumentModel.findById(previousDocumentId)
    : undefined;
  const version = (previousDocument?.version ?? 0) + 1;
  const document = await DocumentModel.create({
    ownerType: "request",
    ownerId: request._id,
    category: "courrier",
    documentType: "initial_courrier",
    title: "Courrier initial",
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    fileSize: stored.fileSize,
    storageKey: stored.storageKey,
    uploadedById: actor.id,
    uploadedAt: now,
    visibility: "internal_only",
    status: "uploaded",
    version,
  });

  if (previousDocument) {
    previousDocument.status = "archived";
    previousDocument.replacedByDocumentId = document._id;
    await previousDocument.save();
  }

  const courrier = await CourrierModel.findOneAndUpdate(
    { requestId: request._id, type: "initial_request_courrier" },
    {
      $set: {
        requestId: request._id,
        type: "initial_request_courrier",
        source: "portal_upload",
        uploadedAt: now,
        documentId: document._id,
        registeredById: actor.id,
        notes: trimmed(input.notes),
      },
      $unset: { physicalDepositDate: 1 },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.courrierSource = "portal_upload";
  request.initialCourrierId = courrier._id;
  request.initialDocumentId = document._id;
  request.status = "courrier_uploaded";
  request.physicalDeposit = undefined;
  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "portal.request_courrier_uploaded",
    entityType: "request",
    entityId: request._id,
    metadata: {
      courrierId: courrier._id.toString(),
      documentId: document._id.toString(),
      mimeType: document.mimeType,
      fileSize: document.fileSize,
    },
  });

  return {
    request: sanitizeRequest(request),
    courrier: sanitizeCourrier(courrier),
    document: sanitizeDocument(document),
  };
};

export const declarePortalPhysicalDeposit = async (
  requestId: string,
  input: {
    expectedDepositDate?: string;
    physicalDepositDate?: string;
    location?: string;
    notes?: string;
  },
  actor: Actor,
) => {
  const request = await getOwnedRequest(requestId, actor);
  ensureEditable(request.status);
  const location = trimmed(input.location);

  if (location && !LOCATIONS.includes(location as (typeof LOCATIONS)[number])) {
    throw new HttpError(400, "location is invalid");
  }

  const notes = validateMessage(input.notes);
  const physicalDepositDate = parseDate(input.physicalDepositDate, "physicalDepositDate");
  const courrier = await CourrierModel.findOneAndUpdate(
    { requestId: request._id, type: "initial_request_courrier" },
    {
      $set: {
        requestId: request._id,
        type: "initial_request_courrier",
        source: "physical_deposit",
        physicalDepositDate,
        registeredById: actor.id,
        notes,
      },
      $unset: { documentId: 1, uploadedAt: 1 },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.courrierSource = "physical_deposit";
  request.initialCourrierId = courrier._id;
  request.initialDocumentId = undefined;
  request.status = "courrier_physical_declared";
  request.physicalDeposit = {
    declaredAt: new Date(),
    declaredById: new Types.ObjectId(actor.id),
    expectedDepositDate: parseDate(input.expectedDepositDate, "expectedDepositDate"),
    physicalDepositDate,
    location: location as "ANAC" | "DG" | "DN" | "other" | undefined,
    notes,
  };
  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "portal.request_physical_deposit_declared",
    entityType: "request",
    entityId: request._id,
    metadata: {
      courrierId: courrier._id.toString(),
      location,
      hasPhysicalDepositDate: Boolean(physicalDepositDate),
    },
  });

  return {
    request: sanitizeRequest(request),
    courrier: sanitizeCourrier(courrier),
  };
};

export const submitPortalRequest = async (requestId: string, actor: Actor) => {
  const request = await getOwnedRequest(requestId, actor);

  if (request.status === "submitted") {
    throw new HttpError(409, "Request is already submitted");
  }

  ensureEditable(request.status);

  if (!request.subject || !request.requestType) {
    throw new HttpError(400, "Request is incomplete");
  }

  if (!request.initialDocumentId && request.courrierSource !== "physical_deposit") {
    throw new HttpError(400, "Courrier evidence or physical deposit declaration is required");
  }

  request.status = "submitted";
  request.submittedAt = new Date();
  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "portal.request_submitted",
    entityType: "request",
    entityId: request._id,
    after: {
      status: request.status,
      submittedAt: request.submittedAt?.toISOString(),
    },
  });

  return { request: sanitizeRequest(request) };
};

export const listAdminRequests = async (filters: {
  status?: string;
  requestType?: string;
  organizationId?: string;
  submittedById?: string;
  courrierSource?: string;
  search?: string;
  from?: string;
  to?: string;
}) => {
  const query: Record<string, unknown> = {};
  const createdAt: Record<string, Date> = {};
  const status = validateStatus(trimmed(filters.status));
  const requestType = trimmed(filters.requestType);
  const search = trimmed(filters.search);

  if (status) {
    query.status = status;
  }

  if (requestType) {
    query.requestType = validateRequestType(requestType);
  }

  if (filters.organizationId) {
    query.organizationId = ensureObjectId(filters.organizationId, "organizationId");
  }

  if (filters.submittedById) {
    query.submittedById = ensureObjectId(filters.submittedById, "submittedById");
  }

  if (filters.courrierSource) {
    if (!["portal_upload", "physical_deposit"].includes(filters.courrierSource)) {
      throw new HttpError(400, "courrierSource is invalid");
    }

    query.courrierSource = filters.courrierSource;
  }

  if (filters.from) {
    createdAt.$gte = parseDate(filters.from, "from")!;
  }

  if (filters.to) {
    createdAt.$lte = parseDate(filters.to, "to")!;
  }

  if (Object.keys(createdAt).length) {
    query.createdAt = createdAt;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const [organizations, users] = await Promise.all([
      PostulantOrganizationModel.find({ canonicalName: regex }).select("_id").lean(),
      UserModel.find({
        userType: "postulant",
        $or: [{ fullName: regex }, { email: regex }],
      })
        .select("_id")
        .lean(),
    ]);

    query.$or = [
      { subject: regex },
      { message: regex },
      { organizationId: { $in: organizations.map((organization) => organization._id) } },
      { submittedById: { $in: users.map((user) => user._id) } },
    ];
  }

  const requests = await RequestModel.find(query)
    .sort({ createdAt: -1 })
    .populate("organizationId", "canonicalName status")
    .populate("submittedById", "fullName email")
    .lean();

  return {
    items: requests.map((request) => ({
      ...sanitizeRequest(request),
      organization: sanitizeRelatedOrganization(request.organizationId),
      submittedBy: sanitizeRelatedUser(request.submittedById),
    })),
  };
};

export const getAdminRequest = async (requestId: string, actor: Actor) => {
  const request = await RequestModel.findById(ensureObjectId(requestId, "id"))
    .populate("organizationId", "canonicalName status legalAddress email phone")
    .populate("submittedById", "fullName email phone")
    .lean();

  if (!request) {
    throw new HttpError(404, "Request not found");
  }

  const [courrier, document, actorById] = await Promise.all([
    request.initialCourrierId ? CourrierModel.findById(request.initialCourrierId).lean() : undefined,
    request.initialDocumentId ? DocumentModel.findById(request.initialDocumentId).lean() : undefined,
    getIntakeActors(request.intake),
  ]);

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.request_viewed_optional",
    entityType: "request",
    entityId: request._id,
  });

  return {
    request: {
      ...sanitizeRequest(request),
      intake: sanitizeIntake(request.intake, actorById),
      organization: sanitizeRelatedOrganization(request.organizationId),
      submittedBy: sanitizeRelatedUser(request.submittedById),
    },
    courrier: sanitizeCourrier(courrier),
    document: sanitizeDocument(document),
  };
};

export const startAdminRequestIntake = async (
  requestId: string,
  input: { notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const request = await getRequestForAdminMutation(requestId);

  if (request.status !== "submitted") {
    throw new HttpError(409, "Intake can only start for submitted requests");
  }

  request.status = "intake_in_review";
  request.set("intake.startedAt", new Date());
  request.set("intake.startedById", new Types.ObjectId(actor.id));
  request.set("intake.notes", trimmed(input.notes));
  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.request_intake_started",
    entityType: "request",
    entityId: request._id,
    after: { status: request.status },
    metadata: { hasNotes: Boolean(trimmed(input.notes)) },
  });

  return { request: sanitizeRequest(request) };
};

export const requestAdminRequestCorrection = async (
  requestId: string,
  input: { reason?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const reason = trimmed(input.reason);

  if (!reason) {
    throw new HttpError(400, "reason is required");
  }

  const request = await getRequestForAdminMutation(requestId);

  if (!["submitted", "intake_in_review"].includes(request.status)) {
    throw new HttpError(409, "Correction can only be requested during intake");
  }

  request.status = "intake_requires_correction";
  request.set("intake.correctionRequestedAt", new Date());
  request.set("intake.correctionRequestedById", new Types.ObjectId(actor.id));
  request.set("intake.correctionReason", reason);
  await request.save();

  await NotificationModel.create({
    recipientUserId: request.submittedById,
    channel: "in_app",
    title: "Correction requise",
    message: "Votre demande necessite une correction.",
    relatedType: "request",
    relatedId: request._id,
    status: "unread",
  });

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.request_correction_requested",
    entityType: "request",
    entityId: request._id,
    metadata: { reasonLength: reason.length },
  });

  return { request: sanitizeRequest(request) };
};

export const registerAdminPhysicalCourrier = async (
  requestId: string,
  file: Express.Multer.File | undefined,
  input: {
    physicalDepositDate?: string;
    officialReference?: string;
    notes?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const request = await getRequestForAdminMutation(requestId);
  ensureIntakeMutable(request.status);

  const now = new Date();
  const notes = validateMessage(input.notes);
  const physicalDepositDate = parseDate(input.physicalDepositDate, "physicalDepositDate");
  let document: ({ _id: Types.ObjectId } & Record<string, unknown>) | undefined;

  if (file) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new HttpError(400, "Unsupported courrier file type");
    }

    const stored = await storageAdapter.save({
      buffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      ownerPath: `requests/${request._id.toString()}`,
    });

    document = (await DocumentModel.create({
      ownerType: "request",
      ownerId: request._id,
      category: "courrier",
      documentType: "initial_courrier",
      title: "Courrier initial scanne",
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
      storageKey: stored.storageKey,
      uploadedById: actor.id,
      uploadedAt: now,
      visibility: "internal_only",
      status: "uploaded",
      version: 1,
    })) as unknown as { _id: Types.ObjectId } & Record<string, unknown>;
  }

  const courrier = await CourrierModel.findOneAndUpdate(
    { requestId: request._id, type: "initial_request_courrier" },
    {
      $set: {
        requestId: request._id,
        type: "initial_request_courrier",
        source: file ? "internal_scan" : "physical_deposit",
        officialReference: trimmed(input.officialReference),
        physicalDepositDate,
        scannedAt: file ? now : undefined,
        documentId: document?._id,
        registeredById: actor.id,
        notes,
      },
      ...(file ? {} : { $unset: { scannedAt: 1 } }),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.initialCourrierId = courrier._id;
  if (document) {
    request.initialDocumentId = document._id;
  }
  if (physicalDepositDate) {
    request.set("physicalDeposit.physicalDepositDate", physicalDepositDate);
  }
  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.physical_courrier_registered",
    entityType: "request",
    entityId: request._id,
    metadata: {
      courrierId: courrier._id.toString(),
      documentId: document?._id.toString(),
      hasFile: Boolean(file),
      officialReference: trimmed(input.officialReference),
    },
  });

  return {
    request: sanitizeRequest(request),
    courrier: sanitizeCourrier(courrier),
    document: sanitizeDocument(document),
  };
};

export const markAdminRequestPrintedForDg = async (
  requestId: string,
  input: { notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const request = await getRequestForAdminMutation(requestId);

  if (!["submitted", "intake_in_review"].includes(request.status)) {
    throw new HttpError(409, "Request cannot be marked printed at this stage");
  }

  if (!request.initialDocumentId && !request.initialCourrierId) {
    throw new HttpError(400, "Courrier evidence is required before printing");
  }

  request.set("intake.printedForDgAt", new Date());
  request.set("intake.printedForDgById", new Types.ObjectId(actor.id));
  request.set("intake.notes", trimmed(input.notes));
  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.request_printed_for_dg",
    entityType: "request",
    entityId: request._id,
    metadata: { hasNotes: Boolean(trimmed(input.notes)) },
  });

  return { request: sanitizeRequest(request) };
};

export const sendAdminRequestToDg = async (
  requestId: string,
  input: { notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const request = await getRequestForAdminMutation(requestId);
  ensureIntakeMutable(request.status);

  const hasPhysicalEvidence =
    request.courrierSource === "physical_deposit" &&
    Boolean(request.initialCourrierId || request.physicalDeposit?.declaredAt);
  const hasUploadedEvidence = Boolean(request.initialDocumentId);

  if (!hasPhysicalEvidence && !hasUploadedEvidence) {
    throw new HttpError(400, "Courrier evidence is required before DG circuit");
  }

  if (request.courrierSource === "portal_upload" && !request.intake?.printedForDgAt) {
    throw new HttpError(400, "Portal-uploaded courrier must be marked printed before DG circuit");
  }

  request.status = "initial_sent_to_dg";
  request.set("intake.sentToDgAt", new Date());
  request.set("intake.sentToDgById", new Types.ObjectId(actor.id));
  request.set("intake.notes", trimmed(input.notes));
  await request.save();

  await NotificationModel.create({
    recipientUserId: request.submittedById,
    channel: "in_app",
    title: "Demande transmise",
    message: "Votre demande est en attente d'orientation administrative.",
    relatedType: "request",
    relatedId: request._id,
    status: "unread",
  });

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.request_sent_to_dg",
    entityType: "request",
    entityId: request._id,
    after: { status: request.status },
    metadata: { hasNotes: Boolean(trimmed(input.notes)) },
  });

  return { request: sanitizeRequest(request) };
};

const sanitizeRelatedOrganization = (source: unknown) => {
  if (!source || source instanceof Types.ObjectId) {
    return source ? { id: source.toString() } : undefined;
  }

  const organization = source as RequestRecord;
  return {
    id: organization._id.toString(),
    canonicalName: organization.canonicalName,
    status: organization.status,
    legalAddress: organization.legalAddress,
    email: organization.email,
    phone: organization.phone,
  };
};

const sanitizeRelatedUser = (source: unknown) => {
  if (!source || source instanceof Types.ObjectId) {
    return source ? { id: source.toString() } : undefined;
  }

  const user = source as RequestRecord;
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
  };
};

const getRequestForAdminMutation = async (requestId: string) => {
  const request = await RequestModel.findById(ensureObjectId(requestId, "id"));

  if (!request) {
    throw new HttpError(404, "Request not found");
  }

  return request;
};

const getIntakeActors = async (source: unknown) => {
  if (!source || typeof source !== "object") {
    return new Map<string, ReturnType<typeof sanitizeRelatedUser>>();
  }

  const intake = source as Record<string, unknown>;
  const actorIds = [
    toId(intake.startedById),
    toId(intake.correctionRequestedById),
    toId(intake.printedForDgById),
    toId(intake.sentToDgById),
  ].filter((actorId): actorId is string => Boolean(actorId));

  if (!actorIds.length) {
    return new Map<string, ReturnType<typeof sanitizeRelatedUser>>();
  }

  const actors = await UserModel.find({ _id: { $in: actorIds } })
    .select("fullName email role userType")
    .lean();

  return new Map(
    actors.map((actor) => [actor._id.toString(), sanitizeRelatedUser(actor)]),
  );
};

export const getPortalRequestMaxFileSizeBytes = () =>
  env.portalRequestCourrierMaxFileSizeMb * 1024 * 1024;
