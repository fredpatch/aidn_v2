import { Types } from "mongoose";

import { env } from "../../shared/config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { storageAdapter } from "../../shared/storage/storage.adapter.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { OmaPhaseModel } from "../oma-phases/oma-phase.model.js";
import { PRELIMINARY_STATUS_PORTAL_LABELS } from "../oma-phases/oma-phase.service.js";
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
const DG_RETURN_REQUIRED_MESSAGE =
  "Le retour DG annote doit etre enregistre avant de demarrer la verification DN.";

type RequestType = (typeof REQUEST_TYPES)[number];
type RequestStatus = (typeof REQUEST_STATUSES)[number];
type RequestRecord = Record<string, unknown> & { _id: Types.ObjectId };
type RequestDgReturnGuardSource = {
  _id: Types.ObjectId;
  status?: unknown;
  initialDgReviewId?: unknown;
};
type Actor = { id: string; role: string; userType: "internal" | "postulant" };
type DgReviewHandledByRole = "dg_secretariat" | "reception" | "bureau_courrier" | "dn_agent" | "admin";

const trimmed = (value?: string) => {
  const next = value?.trim();
  return next ? next : undefined;
};

const dgReviewHandledByRole = (role: string): DgReviewHandledByRole => {
  if (["dg_secretariat", "reception", "bureau_courrier", "dn_agent", "admin"].includes(role)) {
    return role as DgReviewHandledByRole;
  }

  return "admin";
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

const portalStatusLabel = (status: string, request?: RequestRecord) => {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "courrier_uploaded":
      return "Demande reçue";
    case "courrier_physical_declared":
      return "Demande reçue";
    case "submitted":
      if (request?.courrierSource === "physical_deposit") {
        return "Demande reçue - dépôt physique prévu";
      }
      return "Demande reçue";
    case "intake_in_review":
      return "En attente d’orientation administrative";
    case "intake_requires_correction":
      return "Action requise";
    case "initial_sent_to_dg":
      return "En attente d’orientation administrative";
    case "initial_dg_returned":
    case "initial_dg_decision_recorded":
      return "En cours de traitement administratif";
    case "oriented_to_dn":
      return "Transmise à la Direction de la Navigabilité";
    case "dossier_opened":
      return "Dossier en cours de traitement";
    case "rejected":
      return "Demande non retenue";
    case "reoriented":
      return "Demande réorientée";
    case "closed":
      return "Dossier en cours de traitement";
    default:
      return "Dossier en cours de traitement";
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
    portalStatusLabel: portalStatusLabel(String(request.status), request),
    courrierSource: request.courrierSource,
    initialCourrierId: toId(request.initialCourrierId),
    initialDocumentId: toId(request.initialDocumentId),
    physicalDeposit: request.physicalDeposit,
    dossierId: toId(request.dossierId),
    intake: sanitizeIntake(request.intake),
    submittedAt: toIso(request.submittedAt),
    closedAt: toIso(request.closedAt),
    createdAt: toIso(request.createdAt),
    updatedAt: toIso(request.updatedAt),
  };
};

const sanitizePortalRequest = (source: unknown) => {
  const request = source as RequestRecord;
  return {
    id: request._id.toString(),
    organizationId: toId(request.organizationId),
    submittedById: toId(request.submittedById),
    requestType: request.requestType,
    subject: request.subject,
    message: request.message,
    status: request.status,
    portalStatusLabel: portalStatusLabel(String(request.status), request),
    courrierSource: request.courrierSource,
    initialCourrierId: toId(request.initialCourrierId),
    initialDocumentId: toId(request.initialDocumentId),
    dossierId: toId(request.dossierId),
    physicalDeposit: request.physicalDeposit,
    submittedAt: toIso(request.submittedAt),
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

const sanitizePortalCourrier = (source: unknown) => {
  if (!source) return undefined;
  const courrier = source as RequestRecord;
  return {
    id: courrier._id.toString(),
    requestId: toId(courrier.requestId),
    type: courrier.type,
    source: courrier.source,
    physicalDepositDate: toIso(courrier.physicalDepositDate),
    uploadedAt: toIso(courrier.uploadedAt),
    documentId: toId(courrier.documentId),
    notes: courrier.notes,
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

const sanitizeDgReview = (source: unknown) => {
  if (!source) {
    return undefined;
  }

  const review = source as RequestRecord;
  return {
    id: review._id.toString(),
    requestId: toId(review.requestId),
    status: review.status,
    decision: review.decision,
    returnedFromDgAt: toIso(review.returnedFromDgAt),
    observations: review.observations,
    returnedScannedDocumentId: toId(review.returnedScannedDocumentId),
    decisionRecordedById: toId(review.decisionRecordedById),
    decisionRecordedAt: toIso(review.decisionRecordedAt),
  };
};

const isDgReturnComplete = (request: RequestDgReturnGuardSource, dgReview: unknown) => {
  const review = dgReview as (RequestRecord & { returnedScannedDocumentId?: unknown; decision?: unknown }) | undefined;

  return (
    request.status === "oriented_to_dn" &&
    review?.decision === "oriented_to_dn" &&
    Boolean(review.returnedScannedDocumentId)
  );
};

const getInitialDgReviewForRequest = async (request: RequestDgReturnGuardSource) => {
  const reviewId = request.initialDgReviewId;

  if (reviewId) {
    return DGReviewModel.findById(reviewId).lean();
  }

  return DGReviewModel.findOne({ requestId: request._id, targetType: "initial_request" })
    .sort({ createdAt: -1 })
    .lean();
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
  } else {
    query.status = { $nin: ["draft", "courrier_uploaded", "courrier_physical_declared"] };
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
  const requestIds = requests.map((request) => request._id);
  const dgReviews = requestIds.length
    ? await DGReviewModel.find({ requestId: { $in: requestIds }, targetType: "initial_request" })
      .sort({ createdAt: -1 })
      .lean()
    : [];
  const dgReviewByRequestId = new Map<string, unknown>();

  for (const review of dgReviews) {
    const requestId = toId(review.requestId);
    if (requestId && !dgReviewByRequestId.has(requestId)) {
      dgReviewByRequestId.set(requestId, review);
    }
  }

  return {
    items: requests.map((request) => ({
      ...sanitizeRequest(request),
      organization: sanitizeRelatedOrganization(request.organizationId),
      submittedBy: sanitizeRelatedUser(request.submittedById),
      dgReview: sanitizeDgReview(dgReviewByRequestId.get(request._id.toString())),
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

  const [courrier, document, dgReview, actorById] = await Promise.all([
    request.initialCourrierId ? CourrierModel.findById(request.initialCourrierId).lean() : undefined,
    request.initialDocumentId ? DocumentModel.findById(request.initialDocumentId).lean() : undefined,
    getInitialDgReviewForRequest(request),
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
    dgReview: sanitizeDgReview(dgReview),
  };
};

export const downloadAdminRequestOrientationDocument = async (
  requestId: string,
  documentId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const requestObjectId = ensureObjectId(requestId, "requestId");
  const docObjectId = ensureObjectId(documentId, "documentId");

  const dgReview = await DGReviewModel.findOne({ requestId: requestObjectId }).lean();
  if (!dgReview) throw new HttpError(404, "Revue DG introuvable");

  const storedId = dgReview.returnedScannedDocumentId?.toString();
  if (!storedId || storedId !== docObjectId.toString()) {
    throw new HttpError(403, "Document non accessible");
  }

  const doc = await DocumentModel.findById(docObjectId).lean();
  if (!doc) throw new HttpError(404, "Document introuvable");

  const buffer = await storageAdapter.getBuffer(doc.storageKey as string);
  return {
    buffer,
    mimeType: doc.mimeType as string,
    fileName: doc.fileName as string,
  };
};

export const startAdminRequestIntake = async (
  requestId: string,
  input: { notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const request = await getRequestForAdminMutation(requestId);
  const dgReview = await getInitialDgReviewForRequest(request);

  if (!isDgReturnComplete(request, dgReview)) {
    throw new HttpError(400, DG_RETURN_REQUIRED_MESSAGE);
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

  if (!(request.courrierSource === "physical_deposit")) {
    throw new HttpError(409, "Enregistrement impossible : cette demande n'est pas un dépôt physique.");
  }

  if (request.physicalDeposit?.status === "received") {
    throw new HttpError(409, "Le courrier physique a déjà été réceptionné.");
  }

  ensureIntakeMutable(request.status);

  const now = new Date();
  const notes = validateMessage(input.notes);
  const physicalDepositDate = parseDate(input.physicalDepositDate, "physicalDepositDate");
  if (!physicalDepositDate) {
    throw new HttpError(400, "physicalDepositDate is required");
  }

  if (!file) {
    throw new HttpError(400, "Physical courrier scan is required");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new HttpError(400, "Unsupported courrier file type");
  }

  const stored = await storageAdapter.save({
    buffer: file.buffer,
    fileName: file.originalname,
    mimeType: file.mimetype,
    ownerPath: `requests/${request._id.toString()}`,
  });

  const document = (await DocumentModel.create({
    ownerType: "request",
    ownerId: request._id,
    category: "courrier",
    documentType: "initial_courrier_scan",
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

  const courrier = await CourrierModel.findOneAndUpdate(
    { requestId: request._id, type: "initial_request_courrier" },
    {
      $set: {
        requestId: request._id,
        type: "initial_request_courrier",
        source: "internal_scan",
        officialReference: trimmed(input.officialReference),
        physicalDepositDate,
        scannedAt: now,
        documentId: document._id,
        registeredById: actor.id,
        notes,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.initialCourrierId = courrier._id;
  request.initialDocumentId = document._id;
  request.set("physicalDeposit.status", "received");
  request.set("physicalDeposit.physicalDepositDate", physicalDepositDate);
  request.status = "initial_sent_to_dg";
  request.set("intake.sentToDgAt", now);
  request.set("intake.sentToDgById", new Types.ObjectId(actor.id));
  await request.save();

  const dgReview = await DGReviewModel.findOneAndUpdate(
    { requestId: request._id, targetType: "initial_request" },
    {
      $set: {
        targetType: "initial_request",
        targetId: request._id,
        requestId: request._id,
        status: "awaiting_return",
        handledByRole: dgReviewHandledByRole(actor.role),
        handledById: new Types.ObjectId(actor.id),
        sentToDgAt: now,
        outgoingDocumentId: document._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.initialDgReviewId = dgReview._id;
  await request.save();

  await NotificationModel.create({
    recipientUserId: request.submittedById,
    channel: "in_app",
    title: "Demande en orientation",
    message: "Votre demande est en attente d'orientation administrative.",
    relatedType: "request",
    relatedId: request._id,
    status: "unread",
  });

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.physical_courrier_registered",
    entityType: "request",
    entityId: request._id,
    after: { status: request.status },
    metadata: {
      courrierId: courrier._id.toString(),
      documentId: document._id.toString(),
      officialReference: trimmed(input.officialReference),
      sentToDgCircuit: true,
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

  if (request.courrierSource === "physical_deposit") {
    throw new HttpError(409, "Action non applicable pour un dépôt physique.");
  }

  if (!["submitted", "intake_in_review"].includes(request.status)) {
    throw new HttpError(409, "Request cannot be marked printed at this stage");
  }

  if (!request.initialDocumentId && !request.initialCourrierId) {
    throw new HttpError(400, "Courrier evidence is required before printing");
  }

  const now = new Date();
  request.status = "initial_sent_to_dg";
  request.set("intake.printedForDgAt", now);
  request.set("intake.printedForDgById", new Types.ObjectId(actor.id));
  request.set("intake.sentToDgAt", now);
  request.set("intake.sentToDgById", new Types.ObjectId(actor.id));
  request.set("intake.notes", trimmed(input.notes));
  await request.save();

  const dgReview = await DGReviewModel.findOneAndUpdate(
    { requestId: request._id, targetType: "initial_request" },
    {
      $set: {
        targetType: "initial_request",
        targetId: request._id,
        requestId: request._id,
        status: "awaiting_return",
        handledByRole: dgReviewHandledByRole(actor.role),
        handledById: new Types.ObjectId(actor.id),
        sentToDgAt: now,
        outgoingDocumentId: request.initialDocumentId,
        observations: trimmed(input.notes),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.initialDgReviewId = dgReview._id;
  await request.save();

  await NotificationModel.create({
    recipientUserId: request.submittedById,
    channel: "in_app",
    title: "Demande en orientation",
    message: "Votre demande est en attente d'orientation administrative.",
    relatedType: "request",
    relatedId: request._id,
    status: "unread",
  });

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.request_printed_for_dg",
    entityType: "request",
    entityId: request._id,
    after: { status: request.status },
    metadata: {
      dgReviewId: dgReview._id.toString(),
      hasNotes: Boolean(trimmed(input.notes)),
    },
  });

  return { request: sanitizeRequest(request) };
};

export const recordAdminRequestDgReturn = async (
  requestId: string,
  file: Express.Multer.File | undefined,
  input: {
    decision?: string;
    returnedAt?: string;
    observations?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const request = await getRequestForAdminMutation(requestId);

  if (request.status !== "initial_sent_to_dg") {
    throw new HttpError(409, "DG return can only be recorded while awaiting DG orientation");
  }

  if (!file) {
    throw new HttpError(400, "Le scan du retour DG est obligatoire.");
  }

  const decision = trimmed(input.decision);
  if (decision !== "oriented_to_dn" && decision !== "cancelled_by_dg") {
    throw new HttpError(400, "decision is invalid");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new HttpError(400, "Unsupported DG return file type");
  }

  const now = new Date();
  const returnedAt = parseDate(input.returnedAt, "returnedAt") ?? now;
  const observations = validateMessage(input.observations);
  const stored = await storageAdapter.save({
    buffer: file.buffer,
    fileName: file.originalname,
    mimeType: file.mimetype,
    ownerPath: `requests/${request._id.toString()}/dg-return`,
  });

  const document = (await DocumentModel.create({
    ownerType: "request",
    ownerId: request._id,
    category: "courrier",
    documentType: "dg_annotated_courrier",
    title: "Retour DG annoté",
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

  const persistedDecision = decision === "oriented_to_dn" ? "oriented_to_dn" : "rejected";
  const nextStatus = decision === "oriented_to_dn" ? "oriented_to_dn" : "rejected";

  const dgReview = await DGReviewModel.findOneAndUpdate(
    { requestId: request._id, targetType: "initial_request" },
    {
      $set: {
        targetType: "initial_request",
        targetId: request._id,
        requestId: request._id,
        status: "decision_recorded",
        handledByRole: dgReviewHandledByRole(actor.role),
        handledById: new Types.ObjectId(actor.id),
        sentToDgAt: request.intake?.sentToDgAt ?? request.intake?.printedForDgAt,
        returnedFromDgAt: returnedAt,
        decision: persistedDecision,
        orientedDirection: decision === "oriented_to_dn" ? "Direction de la Navigabilité" : undefined,
        observations,
        returnedScannedDocumentId: document._id,
        decisionRecordedById: new Types.ObjectId(actor.id),
        decisionRecordedAt: now,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.status = nextStatus;
  request.initialDgReviewId = dgReview._id;
  if (decision === "cancelled_by_dg") {
    request.closedAt = returnedAt;
  }
  await request.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.dg_return_recorded",
    entityType: "request",
    entityId: request._id,
    after: { status: request.status, decision },
    metadata: {
      decision,
      returnedAt: returnedAt.toISOString(),
      dgReviewId: dgReview._id.toString(),
      dgReturnDocumentId: document._id.toString(),
    },
  });

  return {
    request: sanitizeRequest(request),
    dgReview: sanitizeDgReview(dgReview),
    document: sanitizeDocument(document),
  };
};

const PHASE_KEYS = ["preliminary", "formal_request", "document_evaluation", "inspection", "delivery"] as const;
const PHASE_INITIAL_STATUS: Record<(typeof PHASE_KEYS)[number], string> = {
  preliminary: "in_progress",
  formal_request: "not_started",
  document_evaluation: "not_started",
  inspection: "not_started",
  delivery: "not_started",
};

const sanitizeDossier = (source: unknown) => {
  if (!source) return undefined;
  const dossier = source as RequestRecord;
  return {
    id: dossier._id.toString(),
    dossierNumber: dossier.dossierNumber,
    dossierType: dossier.dossierType,
    status: dossier.status,
    openedAt: toIso(dossier.openedAt),
  };
};

export const openAdminDossierDn = async (
  requestId: string,
  input: { notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const request = await getRequestForAdminMutation(requestId);

  if (request.status !== "oriented_to_dn") {
    throw new HttpError(409, "La demande n'est pas orientée vers DN.");
  }

  const dgReview = await getInitialDgReviewForRequest(request);
  if (!isDgReturnComplete(request, dgReview)) {
    throw new HttpError(400, DG_RETURN_REQUIRED_MESSAGE);
  }

  if (request.dossierId) {
    throw new HttpError(409, "Un dossier DN existe déjà pour cette demande.");
  }

  const now = new Date();
  const year = now.getFullYear();
  const suffix = new Types.ObjectId().toString().slice(-6).toUpperCase();
  const dossierNumber = `DN-${year}-${suffix}`;

  const dossier = await DossierModel.create({
    requestId: request._id,
    organizationId: request.organizationId,
    postulantUserId: request.submittedById,
    dossierNumber,
    dossierType: request.requestType,
    status: "preliminary_phase",
    openedAt: now,
  });

  await OmaPhaseModel.insertMany(
    PHASE_KEYS.map((phaseKey) => ({
      dossierId: dossier._id,
      phaseKey,
      status: PHASE_INITIAL_STATUS[phaseKey],
      startedAt: phaseKey === "preliminary" ? now : undefined,
      startedById: phaseKey === "preliminary" ? new Types.ObjectId(actor.id) : undefined,
    })),
  );

  request.dossierId = dossier._id;
  request.status = "dossier_opened";
  await request.save();

  await NotificationModel.create({
    recipientUserId: request.submittedById,
    channel: "in_app",
    title: "Dossier DN ouvert",
    message: "Votre dossier a été transmis à la Direction de la Navigabilité pour traitement.",
    relatedType: "request",
    relatedId: request._id,
    status: "unread",
  });

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.dossier_opened",
    entityType: "request",
    entityId: request._id,
    after: { status: request.status, dossierId: dossier._id.toString() },
    metadata: {
      dossierNumber,
      dossierType: request.requestType,
      hasNotes: Boolean(trimmed(input.notes)),
    },
  });

  return {
    request: sanitizeRequest(request),
    dossier: sanitizeDossier(dossier),
  };
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
    Boolean(request.initialDocumentId && request.physicalDeposit?.status === "received");
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
