import { Types } from "mongoose";

import { env } from "../../../shared/config/env.js";
import { HttpError } from "../../../shared/errors/http-error.js";
import { storageAdapter } from "../../../shared/storage/storage.adapter.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId, parseDate, toId, toIso } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { CourrierModel } from "../../courriers/courrier.model.js";
import { createDgReview, recordDgReturn } from "../../dg-circuit/dg-circuit.service.js";
import { DGReviewModel } from "../../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../../documents/document.model.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { OmaPhaseModel } from "../../oma-phases/index.js";
import { PRELIMINARY_STATUS_PORTAL_LABELS } from "../../oma-phases/index.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { PostulantOrganizationModel } from "../../organizations/postulant-organization.model.js";
import { UserModel } from "../../users/user.model.js";
import { RequestModel } from "../request.model.js";
import { requestRepository } from "../repository/request.repository.js";
import {
  ALLOWED_MIME_TYPES,
  DG_RETURN_REQUIRED_MESSAGE,
  LOCATIONS,
  PHASE_INITIAL_STATUS,
  PHASE_KEYS,
} from "../constants/request.constants.js";
import {
  sanitizeCourrier,
  sanitizeDgReview,
  sanitizeDocument,
  sanitizeDossier,
  sanitizeIntake,
  sanitizePortalCourrier,
  sanitizePortalRequest,
  sanitizeRelatedOrganization,
  sanitizeRelatedUser,
  sanitizeRequest,
} from "../helpers/request.formatters.js";
import type {
  Actor,
  RequestDgReturnGuardSource,
  RequestRecord,
} from "../types/request.types.js";
import {
  ensureEditable,
  ensureInternalActor,
  ensureIntakeMutable,
  escapeRegex,
  isDgReturnComplete,
  trimmed,
  validateMessage,
  validateRequestType,
  validateStatus,
  validateSubject,
} from "../helpers/request.validators.js";


const resolvePortalUser = async (actor: Actor) => {
  if (actor.userType !== "postulant") {
    throw new HttpError(403, "Portal access denied");
  }

  const user = await requestRepository.findPortalUserById(actor.id);

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
  const request = await requestRepository.findOwnedRequest(
    ensureObjectId(requestId, "id"),
    portalUser.userId,
  );

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

  return { request: sanitizePortalRequest(request) };
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

  const sanitized = items.map(sanitizePortalRequest);

  const dossierIds = sanitized
    .map((r) => r.dossierId)
    .filter((id): id is string => Boolean(id));

  if (dossierIds.length > 0) {
    const phases = await OmaPhaseModel.find({
      dossierId: { $in: dossierIds },
      phaseKey: "preliminary",
    }).lean();

    const labelByDossierId = new Map<string, string>();
    for (const phase of phases) {
      const ps = phase.preliminaryStatus;
      if (ps) {
        labelByDossierId.set(
          phase.dossierId.toString(),
          PRELIMINARY_STATUS_PORTAL_LABELS[ps] ?? "Dossier en cours de traitement",
        );
      }
    }

    for (const item of sanitized) {
      if (item.dossierId && labelByDossierId.has(item.dossierId)) {
        item.portalStatusLabel = labelByDossierId.get(item.dossierId)!;
      }
    }
  }

  return { items: sanitized, total };
};

export const getPortalRequest = async (requestId: string, actor: Actor) => {
  const request = await getOwnedRequest(requestId, actor);
  const [courrier, document] = await Promise.all([
    request.initialCourrierId ? CourrierModel.findById(request.initialCourrierId).lean() : undefined,
    request.initialDocumentId ? DocumentModel.findById(request.initialDocumentId).lean() : undefined,
  ]);

  return {
    request: sanitizePortalRequest(request),
    courrier: sanitizePortalCourrier(courrier),
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

  return { request: sanitizePortalRequest(request) };
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
    request: sanitizePortalRequest(request),
    courrier: sanitizePortalCourrier(courrier),
    document: sanitizeDocument(document),
  };
};

export const declarePortalPhysicalDeposit = async (
  requestId: string,
  input: {
    expectedDepositDate?: string;
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
  const expectedDepositDate = parseDate(input.expectedDepositDate, "expectedDepositDate");
  const courrier = await CourrierModel.findOneAndUpdate(
    { requestId: request._id, type: "initial_request_courrier" },
    {
      $set: {
        requestId: request._id,
        type: "initial_request_courrier",
        source: "physical_deposit",
        registeredById: actor.id,
        notes,
      },
      $unset: { documentId: 1, uploadedAt: 1, physicalDepositDate: 1 },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.courrierSource = "physical_deposit";
  request.initialCourrierId = courrier._id;
  request.initialDocumentId = undefined;
  request.physicalDeposit = {
    declaredAt: new Date(),
    declaredById: new Types.ObjectId(actor.id),
    status: "planned",
    expectedDepositDate,
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
      hasExpectedDepositDate: Boolean(expectedDepositDate),
    },
  });

  return {
    request: sanitizePortalRequest(request),
    courrier: sanitizePortalCourrier(courrier),
  };
};

export const submitPortalRequest = async (
  requestId: string,
  input: {
    requestType?: string;
    subject?: string;
    message?: string;
    courrierSource?: string;
    plannedPhysicalDepositDate?: string;
    expectedDepositDate?: string;
    depositLocation?: string;
    location?: string;
    notes?: string;
  },
  file: Express.Multer.File | undefined,
  actor: Actor,
) => {
  const request = await getOwnedRequest(requestId, actor);

  if (request.status === "submitted") {
    throw new HttpError(409, "Request is already submitted");
  }

  ensureEditable(request.status);

  if (input.requestType !== undefined) {
    request.requestType = validateRequestType(input.requestType);
  }

  if (input.subject !== undefined) {
    request.subject = validateSubject(input.subject);
  }

  if (input.message !== undefined) {
    request.message = validateMessage(input.message);
  }

  if (!request.subject || !request.requestType) {
    throw new HttpError(400, "Request is incomplete");
  }

  const courrierSource = trimmed(input.courrierSource) ?? request.courrierSource;
  const notes = validateMessage(input.notes);
  const now = new Date();

  if (courrierSource === "portal_upload") {
    if (!file && !request.initialDocumentId) {
      throw new HttpError(400, "Courrier file is required");
    }

    if (file) {
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
            notes,
          },
          $unset: { physicalDepositDate: 1 },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      request.initialCourrierId = courrier._id;
      request.initialDocumentId = document._id;
    }

    request.courrierSource = "portal_upload";
    request.physicalDeposit = undefined;
  } else if (courrierSource === "physical_deposit") {
    const plannedDate = parseDate(
      input.plannedPhysicalDepositDate ?? input.expectedDepositDate,
      "plannedPhysicalDepositDate",
    );
    const location = trimmed(input.depositLocation ?? input.location);

    if (!plannedDate) {
      throw new HttpError(400, "plannedPhysicalDepositDate is required");
    }

    if (!location) {
      throw new HttpError(400, "depositLocation is required");
    }

    if (!LOCATIONS.includes(location as (typeof LOCATIONS)[number])) {
      throw new HttpError(400, "depositLocation is invalid");
    }

    const courrier = await CourrierModel.findOneAndUpdate(
      { requestId: request._id, type: "initial_request_courrier" },
      {
        $set: {
          requestId: request._id,
          type: "initial_request_courrier",
          source: "physical_deposit",
          registeredById: actor.id,
          notes,
        },
        $unset: { documentId: 1, uploadedAt: 1, physicalDepositDate: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    request.courrierSource = "physical_deposit";
    request.initialCourrierId = courrier._id;
    request.initialDocumentId = undefined;
    request.physicalDeposit = {
      declaredAt: now,
      declaredById: new Types.ObjectId(actor.id),
      status: "planned",
      expectedDepositDate: plannedDate,
      location: location as "ANAC" | "DG" | "DN" | "other",
      notes,
    };
  } else {
    throw new HttpError(400, "courrierSource is required");
  }

  request.status = "submitted";
  request.submittedAt = now;
  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "portal.request_submitted",
    entityType: "request",
    entityId: request._id,
    after: {
      status: request.status,
      courrierSource: request.courrierSource,
      submittedAt: request.submittedAt?.toISOString(),
    },
  });

  return { request: sanitizePortalRequest(request) };
};


export const getPortalRequestMaxFileSizeBytes = () =>
  env.portalRequestCourrierMaxFileSizeMb * 1024 * 1024;

