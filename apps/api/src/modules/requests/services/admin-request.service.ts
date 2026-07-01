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


const getInitialDgReviewForRequest = async (request: RequestDgReturnGuardSource) => {
  return requestRepository.findInitialDgReviewForRequest(request);
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

  const request = await RequestModel.findById(requestObjectId)
    .select("initialDocumentId initialCourrierId initialDgReviewId")
    .lean();
  if (!request) throw new HttpError(404, "Request not found");

  const [dgReview, courrier] = await Promise.all([
    request.initialDgReviewId
      ? DGReviewModel.findById(request.initialDgReviewId).lean()
      : DGReviewModel.findOne({
          requestId: requestObjectId,
          targetType: "initial_request",
        })
          .sort({ createdAt: -1 })
          .lean(),
    request.initialCourrierId
      ? CourrierModel.findOne({
          _id: request.initialCourrierId,
          requestId: requestObjectId,
        }).lean()
      : CourrierModel.findOne({
          requestId: requestObjectId,
          type: "initial_request_courrier",
        }).lean(),
  ]);

  const requestedId = docObjectId.toString();
  const allowedIds = [
    request.initialDocumentId?.toString(),
    courrier?.documentId?.toString(),
    dgReview?.returnedScannedDocumentId?.toString(),
  ].filter(Boolean);

  if (!allowedIds.includes(requestedId)) {
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

  const scannedDocumentId = await saveDocument({
    file,
    ownerPath: `requests/${request._id.toString()}`,
    ownerType: "request",
    ownerId: request._id,
    category: "courrier",
    documentType: "initial_courrier_scan",
    title: "Courrier initial scanne",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });
  const document = await DocumentModel.findById(scannedDocumentId).lean();

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
        documentId: scannedDocumentId,
        registeredById: actor.id,
        notes,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  request.initialCourrierId = courrier._id;
  request.initialDocumentId = scannedDocumentId;
  request.set("physicalDeposit.status", "received");
  request.set("physicalDeposit.physicalDepositDate", physicalDepositDate);
  request.status = "initial_sent_to_dg";
  request.set("intake.sentToDgAt", now);
  request.set("intake.sentToDgById", new Types.ObjectId(actor.id));
  await request.save();

  const { _id: dgReviewId } = await createDgReview({
    targetType: "initial_request",
    targetId: request._id,
    requestId: request._id,
    handledByRole: actor.role,
    handledById: new Types.ObjectId(actor.id),
    outgoingDocumentId: scannedDocumentId,
    sentToDgAt: now,
  });

  request.initialDgReviewId = dgReviewId;
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
      documentId: scannedDocumentId.toString(),
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

  const { _id: dgReviewId } = await createDgReview({
    targetType: "initial_request",
    targetId: request._id,
    requestId: request._id,
    handledByRole: actor.role,
    handledById: new Types.ObjectId(actor.id),
    outgoingDocumentId: request.initialDocumentId as Types.ObjectId | undefined,
    sentToDgAt: now,
    observations: trimmed(input.notes),
  });

  request.initialDgReviewId = dgReviewId;
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
      dgReviewId: dgReviewId.toString(),
      hasNotes: Boolean(trimmed(input.notes)),
    },
  });

  return { request: sanitizeRequest(request) };
};

export const recordAdminRequestDgReturn = async (
  requestId: string,
  file: Express.Multer.File | undefined,
  input: {
    returnedAt?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const request = await getRequestForAdminMutation(requestId);

  if (request.status !== "initial_sent_to_dg") {
    throw new HttpError(409, "DG return can only be recorded while awaiting DG signature");
  }

  if (!file) {
    throw new HttpError(400, "Le document signe par le DG est obligatoire.");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new HttpError(400, "Unsupported DG return file type");
  }

  const returnedAt = parseDate(input.returnedAt, "returnedAt") ?? new Date();

  const existingReview = await getInitialDgReviewForRequest(request);
  if (!existingReview) throw new HttpError(409, "DG review introuvable pour cette demande");

  const { documentId: dgReturnDocumentId } = await recordDgReturn({
    reviewId: existingReview._id as Types.ObjectId,
    file: file!,
    returnedFromDgAt: returnedAt,
    uploadedById: new Types.ObjectId(actor.id),
    title: "Document signe DG",
    documentType: "dg_annotated_courrier",
    ownerType: "request",
    ownerId: request._id,
    ownerPath: `requests/${request._id.toString()}/dg-return`,
  });

  request.status = "initial_dg_returned";
  request.initialDgReviewId = existingReview._id as Types.ObjectId;
  await request.save();

  const [dgReview, document] = await Promise.all([
    DGReviewModel.findById(existingReview._id).lean(),
    DocumentModel.findById(dgReturnDocumentId).lean(),
  ]);

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "admin.dg_return_recorded",
    entityType: "request",
    entityId: request._id,
    after: { status: request.status },
    metadata: {
      returnedAt: returnedAt.toISOString(),
      dgReviewId: existingReview._id.toString(),
      dgReturnDocumentId: dgReturnDocumentId.toString(),
    },
  });

  return {
    request: sanitizeRequest(request),
    dgReview: sanitizeDgReview(dgReview),
    document: sanitizeDocument(document),
  };
};

export const openAdminDossierDn = async (
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

const getRequestForAdminMutation = async (requestId: string) => {
  const request = await requestRepository.findRequestById(
    ensureObjectId(requestId, "id"),
  );

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

  const actors = await requestRepository.findUsersByIds(actorIds);

  return new Map(
    actors.map((actor) => [actor._id.toString(), sanitizeRelatedUser(actor)]),
  );
};


