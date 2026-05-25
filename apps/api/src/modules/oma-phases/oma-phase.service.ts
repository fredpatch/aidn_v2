import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { storageAdapter } from "../../shared/storage/storage.adapter.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { MeetingModel } from "../meetings/meeting.model.js";
import { getActivePreEvalTemplate } from "../document-templates/document-template.service.js";
import { OmaPhaseModel } from "./oma-phase.model.js";
import { RequestModel } from "../requests/request.model.js";
import { UserModel } from "../users/user.model.js";

type Actor = { id: string; role: string; userType: "internal" | "postulant" };
type GenericRecord = Record<string, unknown> & { _id: Types.ObjectId };

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const PRELIMINARY_STATUS_PORTAL_LABELS: Record<string, string> = {
  preliminary_not_started: "Dossier en cours de traitement",
  preliminary_started: "Dossier en cours de traitement",
  first_meeting_invited: "Rendez-vous programmé",
  first_meeting_held: "Rendez-vous tenu",
  pre_eval_form_available: "Action requise - Formulaire disponible",
  pre_eval_form_submitted: "En attente d'analyse",
  pre_eval_sent_to_dg: "En attente d'analyse",
  pre_eval_dg_decision_recorded: "En attente d'analyse",
  preliminary_meeting_invited: "Rendez-vous préliminaire programmé",
  preliminary_meeting_held: "Phase préliminaire en cours de clôture",
  preliminary_ready_to_close: "Phase préliminaire en cours de clôture",
  preliminary_closed: "Phase préliminaire clôturée",
};

const PRE_EVAL_VISIBLE_STATUSES = new Set([
  "pre_eval_form_available",
  "pre_eval_form_submitted",
  "pre_eval_sent_to_dg",
  "pre_eval_dg_decision_recorded",
  "preliminary_meeting_invited",
  "preliminary_meeting_held",
  "preliminary_ready_to_close",
  "preliminary_closed",
]);

const ADMIN_PRELIMINARY_DOWNLOAD_FIELDS = [
  "firstMeetingReportDocumentId",
  "preEvaluationTemplateDocumentId",
  "completedPreEvaluationDocumentId",
  "preEvaluationDgAnnotatedDocumentId",
  "preliminaryMeetingReportDocumentId",
  "closureCourrierDocumentId",
] as const;

const toId = (value: unknown) => value?.toString();

const toIso = (value: unknown) =>
  value instanceof Date
    ? value.toISOString()
    : value
      ? new Date(String(value)).toISOString()
      : undefined;

const parseOptionalDate = (value: unknown, label: string) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${label} must be a valid date`);
  }
  return date;
};

const ensureObjectId = (id: string, label: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `${label} is invalid`);
  }
  return new Types.ObjectId(id);
};

const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
};

const sanitizeRelatedOrg = (source: unknown) => {
  if (!source || source instanceof Types.ObjectId) {
    return source ? { id: source.toString() } : undefined;
  }
  const org = source as GenericRecord;
  return {
    id: org._id.toString(),
    canonicalName: org.canonicalName,
    status: org.status,
  };
};

const sanitizeRelatedUser = (source: unknown) => {
  if (!source || source instanceof Types.ObjectId) {
    return source ? { id: source.toString() } : undefined;
  }
  const user = source as GenericRecord;
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
  };
};

const sanitizeDossierSummary = (d: GenericRecord) => ({
  id: d._id.toString(),
  dossierNumber: d.dossierNumber,
  dossierType: d.dossierType,
  status: d.status,
  openedAt: toIso(d.openedAt),
  closedAt: toIso(d.closedAt),
  organization: sanitizeRelatedOrg(d.organizationId),
  postulant: sanitizeRelatedUser(d.postulantUserId),
  requestId: toId(d.requestId),
  assignedDnAgentId: toId(d.assignedDnAgentId),
  createdAt: toIso(d.createdAt),
  updatedAt: toIso(d.updatedAt),
});

const sanitizePhase = (p: GenericRecord) => ({
  id: p._id.toString(),
  dossierId: toId(p.dossierId),
  phaseKey: p.phaseKey,
  status: p.status,
  preliminaryStatus: p.preliminaryStatus ?? null,
  firstMeetingId: toId(p.firstMeetingId),
  preliminaryMeetingId: toId(p.preliminaryMeetingId),
  preEvaluationTemplateDocumentId: toId(p.preEvaluationTemplateDocumentId),
  completedPreEvaluationDocumentId: toId(p.completedPreEvaluationDocumentId),
  preEvaluationDgAnnotatedDocumentId: toId(
    p.preEvaluationDgAnnotatedDocumentId,
  ),
  preEvaluationSentToDgAt: toIso(p.preEvaluationSentToDgAt),
  preEvaluationReturnedFromDgAt: toIso(p.preEvaluationReturnedFromDgAt),
  firstMeetingReportDocumentId: toId(p.firstMeetingReportDocumentId),
  preliminaryMeetingReportDocumentId: toId(
    p.preliminaryMeetingReportDocumentId,
  ),
  closureCourrierDocumentId: toId(p.closureCourrierDocumentId),
  startedAt: toIso(p.startedAt),
  closedAt: toIso(p.closedAt),
});

const sanitizeMeeting = (m: GenericRecord) => ({
  id: m._id.toString(),
  phaseId: toId(m.phaseId),
  dossierId: toId(m.dossierId),
  meetingType: m.meetingType,
  title: m.title,
  status: m.status,
  scheduledAt: toIso(m.scheduledAt),
  heldAt: toIso(m.heldAt),
  location: m.location,
  outlookEmailStatus: m.outlookEmailStatus,
  reportDocumentId: toId(m.reportDocumentId),
  notes: m.notes,
  createdAt: toIso(m.createdAt),
});

const buildDossierCourriers = async (requestId: unknown) => {
  const requestObjectId = requestId instanceof Types.ObjectId ? requestId : undefined;
  if (!requestObjectId) return undefined;

  const request = await RequestModel.findById(requestObjectId).lean();
  if (!request) return undefined;

  const courrier = request.initialCourrierId
    ? await CourrierModel.findOne({
        _id: request.initialCourrierId,
        requestId: requestObjectId,
      }).lean()
    : await CourrierModel.findOne({
        requestId: requestObjectId,
        type: "initial_request_courrier",
      }).lean();

  const initialDocumentId =
    toId(request.initialDocumentId) ?? toId(courrier?.documentId);
  const initialDocument = initialDocumentId
    ? await DocumentModel.findById(initialDocumentId).select("title").lean()
    : undefined;

  const dgReview = request.initialDgReviewId
    ? await DGReviewModel.findById(request.initialDgReviewId).lean()
    : await DGReviewModel.findOne({
        requestId: requestObjectId,
        targetType: "initial_request",
      })
        .sort({ createdAt: -1 })
        .lean();

  return {
    initialCourrier: {
      requestId: requestObjectId.toString(),
      documentId: initialDocumentId,
      title: initialDocument?.title ?? "Courrier initial",
      source: courrier?.source ?? request.courrierSource,
      reference: courrier?.officialReference,
      date:
        toIso(courrier?.scannedAt) ??
        toIso(courrier?.physicalDepositDate) ??
        toIso(courrier?.uploadedAt) ??
        toIso(request.submittedAt) ??
        toIso(request.createdAt),
    },
    initialDgOrientation: {
      requestId: requestObjectId.toString(),
      documentId: toId(dgReview?.returnedScannedDocumentId),
      title: "Retour DG orientation initiale",
      decision: dgReview?.decision,
      returnedAt: toIso(dgReview?.returnedFromDgAt),
      observations: dgReview?.observations,
    },
  };
};

const resolvePortalUser = async (actor: Actor) => {
  if (actor.userType !== "postulant") {
    throw new HttpError(403, "Portal access denied");
  }
  const user = await UserModel.findById(actor.id)
    .select("userType organizationId role isActive")
    .lean();
  if (!user || user.userType !== "postulant" || !user.isActive) {
    throw new HttpError(403, "Portal access denied");
  }
  if (!user.organizationId) {
    throw new HttpError(400, "Portal user must be linked to an organization");
  }
  return { userId: user._id, organizationId: user.organizationId };
};

const getOwnedDossier = async (dossierId: string, actor: Actor) => {
  const portalUser = await resolvePortalUser(actor);
  const dossier = await DossierModel.findOne({
    _id: ensureObjectId(dossierId, "id"),
    postulantUserId: portalUser.userId,
  });
  if (!dossier) {
    throw new HttpError(404, "Dossier introuvable");
  }
  return { dossier, portalUser };
};

const getOrCreatePreliminaryPhase = async (
  dossierId: Types.ObjectId,
  actor: Actor,
) => {
  let phase = await OmaPhaseModel.findOne({
    dossierId,
    phaseKey: "preliminary",
  });
  if (!phase) {
    phase = await OmaPhaseModel.create({
      dossierId,
      phaseKey: "preliminary",
      status: "in_progress",
      preliminaryStatus: "preliminary_started",
      startedAt: new Date(),
      startedById: new Types.ObjectId(actor.id),
    });
  } else if (!phase.preliminaryStatus) {
    phase.preliminaryStatus = "preliminary_started";
    await phase.save();
  }
  return phase;
};

const validateFile = (
  file: Express.Multer.File | undefined,
  required: boolean,
  label: string,
) => {
  if (required && !file) {
    throw new HttpError(400, `${label} est requis`);
  }
  if (
    file &&
    !ALLOWED_MIME_TYPES.includes(
      file.mimetype as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new HttpError(400, `Type de fichier non supporté pour ${label}`);
  }
  return file;
};

const saveDocument = async (params: {
  file: Express.Multer.File;
  ownerPath: string;
  ownerType: string;
  ownerId: Types.ObjectId;
  category: string;
  documentType: string;
  title: string;
  visibility: string;
  status: string;
  uploadedById: Types.ObjectId;
}) => {
  const stored = await storageAdapter.save({
    buffer: params.file.buffer,
    fileName: params.file.originalname,
    mimeType: params.file.mimetype,
    ownerPath: params.ownerPath,
  });

  const doc = (await DocumentModel.create({
    ownerType: params.ownerType,
    ownerId: params.ownerId,
    category: params.category,
    documentType: params.documentType,
    title: params.title,
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    fileSize: stored.fileSize,
    storageKey: stored.storageKey,
    visibility: params.visibility,
    status: params.status,
    uploadedById: params.uploadedById,
    uploadedAt: new Date(),
  })) as unknown as { _id: Types.ObjectId } & Record<string, unknown>;

  return doc._id;
};

// ── Admin read ────────────────────────────────────────────────────────────

export const listAdminDossiers = async (
  filters: { status?: string; dossierType?: string; search?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.dossierType) query.dossierType = filters.dossierType;

  const dossiers = await DossierModel.find(query)
    .populate("organizationId", "canonicalName status")
    .populate("postulantUserId", "fullName email")
    .sort({ createdAt: -1 })
    .lean();

  let items = dossiers.map((d) =>
    sanitizeDossierSummary(d as unknown as GenericRecord),
  );

  if (filters.search) {
    const search = filters.search.toLowerCase();
    items = items.filter((d) => {
      const org = d.organization as { canonicalName?: unknown } | undefined;
      const postulant = d.postulant as { fullName?: unknown } | undefined;
      return (
        String(d.dossierNumber ?? "")
          .toLowerCase()
          .includes(search) ||
        String(org?.canonicalName ?? "")
          .toLowerCase()
          .includes(search) ||
        String(postulant?.fullName ?? "")
          .toLowerCase()
          .includes(search)
      );
    });
  }

  return { items };
};

export const getAdminDossier = async (dossierId: string, actor: Actor) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"))
    .populate("organizationId", "canonicalName status legalAddress email phone")
    .populate("postulantUserId", "fullName email phone")
    .lean();

  if (!dossier) {
    throw new HttpError(404, "Dossier introuvable");
  }

  const phases = await OmaPhaseModel.find({ dossierId: dossier._id }).lean();
  const preliminaryPhase = phases.find((p) => p.phaseKey === "preliminary");

  let firstMeeting = null;
  let preliminaryMeeting = null;
  if (preliminaryPhase) {
    if (preliminaryPhase.firstMeetingId) {
      firstMeeting = await MeetingModel.findById(
        preliminaryPhase.firstMeetingId,
      ).lean();
    }
    if (preliminaryPhase.preliminaryMeetingId) {
      preliminaryMeeting = await MeetingModel.findById(
        preliminaryPhase.preliminaryMeetingId,
      ).lean();
    }
  }

  const courriers = await buildDossierCourriers(dossier.requestId);

  return {
    dossier: sanitizeDossierSummary(dossier as unknown as GenericRecord),
    phases: phases.map((p) => sanitizePhase(p as unknown as GenericRecord)),
    preliminary: preliminaryPhase
      ? {
          phase: sanitizePhase(preliminaryPhase as unknown as GenericRecord),
          firstMeeting: firstMeeting
            ? sanitizeMeeting(firstMeeting as unknown as GenericRecord)
            : null,
          preliminaryMeeting: preliminaryMeeting
            ? sanitizeMeeting(preliminaryMeeting as unknown as GenericRecord)
            : null,
        }
      : null,
    courriers,
  };
};

// ── Admin preliminary actions ─────────────────────────────────────────────

export const inviteFirstMeeting = async (
  dossierId: string,
  input: { scheduledAt?: string; location?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await getOrCreatePreliminaryPhase(dossier._id, actor);

  if (phase.preliminaryStatus !== "preliminary_started") {
    throw new HttpError(
      409,
      "La première réunion ne peut être planifiée qu'au début de la phase préliminaire.",
    );
  }

  const meeting = await MeetingModel.create({
    dossierId: dossier._id,
    phaseId: phase._id,
    meetingType: "first_contact_meeting",
    title: "Première réunion de contact",
    status: "invited",
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    location: input.location?.trim() || undefined,
    outlookEmailStatus: "to_be_sent_manually",
    notes: input.notes?.trim() || undefined,
    createdById: new Types.ObjectId(actor.id),
  });

  phase.preliminaryStatus = "first_meeting_invited";
  phase.status = "waiting_meeting";
  phase.firstMeetingId = meeting._id;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.first_meeting_invited",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "first_meeting_invited",
      meetingId: meeting._id.toString(),
    },
  });

  return {
    meeting: sanitizeMeeting(meeting.toObject() as unknown as GenericRecord),
  };
};

export const recordFirstMeeting = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: { notes?: string; visibleToPostulant?: boolean },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "first_meeting_invited") {
    throw new HttpError(
      409,
      "La première réunion n'a pas encore été planifiée.",
    );
  }

  if (!phase.firstMeetingId) {
    throw new HttpError(409, "Aucune réunion initiale enregistrée.");
  }

  const meeting = await MeetingModel.findById(phase.firstMeetingId);
  if (!meeting) throw new HttpError(404, "Réunion introuvable");

  validateFile(file, true, "compte rendu");

  let reportDocumentId: Types.ObjectId | undefined;
  if (file) {
    reportDocumentId = await saveDocument({
      file,
      ownerPath: `dossiers/${dossier._id.toString()}/preliminary/first-meeting-report`,
      ownerType: "meeting",
      ownerId: meeting._id,
      category: "meeting_report",
      documentType: "meeting_report",
      title: "Compte rendu - Première réunion",
      visibility: input.visibleToPostulant
        ? "postulant_visible"
        : "internal_only",
      status: "uploaded",
      uploadedById: new Types.ObjectId(actor.id),
    });
  }
  if (!reportDocumentId) {
    throw new HttpError(400, "Compte rendu requis");
  }

  meeting.status = "held";
  meeting.heldAt = new Date();
  if (input.notes?.trim()) meeting.notes = input.notes.trim();
  meeting.reportDocumentId = reportDocumentId;
  await meeting.save();

  phase.preliminaryStatus = "first_meeting_held";
  phase.status = "in_progress";
  phase.firstMeetingReportDocumentId = reportDocumentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.first_meeting_recorded",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "first_meeting_held",
      hasReport: Boolean(reportDocumentId),
    },
  });

  return {
    meeting: sanitizeMeeting(meeting.toObject() as unknown as GenericRecord),
  };
};

export const publishPreEvaluationForm = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "first_meeting_held") {
    throw new HttpError(
      409,
      "La première réunion doit être tenue avant de rendre le formulaire disponible.",
    );
  }

  const { fileDocumentId } = await getActivePreEvalTemplate();

  phase.preliminaryStatus = "pre_eval_form_available";
  phase.status = "waiting_postulant";
  phase.preEvaluationTemplateDocumentId = fileDocumentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.pre_evaluation_form_published",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "pre_eval_form_available",
      documentId: fileDocumentId.toString(),
    },
  });

  return { documentId: fileDocumentId.toString() };
};

export const invitePreliminaryMeeting = async (
  dossierId: string,
  input: { scheduledAt?: string; location?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "pre_eval_dg_decision_recorded") {
    throw new HttpError(
      409,
      "La décision DG doit être enregistrée avant de planifier la réunion préliminaire.",
    );
  }

  const meeting = await MeetingModel.create({
    dossierId: dossier._id,
    phaseId: phase._id,
    meetingType: "preliminary_meeting",
    title: "Réunion préliminaire",
    status: "invited",
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    location: input.location?.trim() || undefined,
    outlookEmailStatus: "to_be_sent_manually",
    notes: input.notes?.trim() || undefined,
    createdById: new Types.ObjectId(actor.id),
  });

  phase.preliminaryStatus = "preliminary_meeting_invited";
  phase.status = "waiting_meeting";
  phase.preliminaryMeetingId = meeting._id;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.preliminary_meeting_invited",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "preliminary_meeting_invited",
      meetingId: meeting._id.toString(),
    },
  });

  return {
    meeting: sanitizeMeeting(meeting.toObject() as unknown as GenericRecord),
  };
};

export const recordPreliminaryMeeting = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: { notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "preliminary_meeting_invited") {
    throw new HttpError(
      409,
      "La réunion préliminaire n'a pas encore été planifiée.",
    );
  }

  if (!phase.preliminaryMeetingId) {
    throw new HttpError(409, "Aucune réunion préliminaire enregistrée.");
  }

  const meeting = await MeetingModel.findById(phase.preliminaryMeetingId);
  if (!meeting) throw new HttpError(404, "Réunion introuvable");

  validateFile(file, true, "compte rendu");

  let reportDocumentId: Types.ObjectId | undefined;
  if (file) {
    reportDocumentId = await saveDocument({
      file,
      ownerPath: `dossiers/${dossier._id.toString()}/preliminary/preliminary-meeting-report`,
      ownerType: "meeting",
      ownerId: meeting._id,
      category: "meeting_report",
      documentType: "meeting_report",
      title: "Compte rendu - Réunion préliminaire",
      visibility: "internal_only",
      status: "uploaded",
      uploadedById: new Types.ObjectId(actor.id),
    });
  }
  if (!reportDocumentId) {
    throw new HttpError(400, "Compte rendu requis");
  }

  meeting.status = "held";
  meeting.heldAt = new Date();
  if (input.notes?.trim()) meeting.notes = input.notes.trim();
  meeting.reportDocumentId = reportDocumentId;
  await meeting.save();

  phase.preliminaryStatus = "preliminary_meeting_held";
  phase.status = "in_progress";
  phase.preliminaryMeetingReportDocumentId = reportDocumentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.preliminary_meeting_recorded",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "preliminary_meeting_held",
      hasReport: Boolean(reportDocumentId),
    },
  });

  return {
    meeting: sanitizeMeeting(meeting.toObject() as unknown as GenericRecord),
  };
};

export const uploadClosureCourrier = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: { title?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "preliminary_meeting_held") {
    throw new HttpError(
      409,
      "La réunion préliminaire doit être tenue avant de téléverser le courrier de clôture.",
    );
  }

  validateFile(file, true, "courrier de clôture");

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossier._id.toString()}/preliminary/closure-courrier`,
    ownerType: "phase",
    ownerId: phase._id,
    category: "closure_letter",
    documentType: "phase_closure_letter",
    title: input.title?.trim() || "Courrier de clôture - Phase préliminaire",
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });

  phase.preliminaryStatus = "preliminary_ready_to_close";
  phase.status = "ready_to_close";
  phase.closureCourrierDocumentId = documentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.closure_courrier_uploaded",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "preliminary_ready_to_close",
      documentId: documentId.toString(),
    },
  });

  return { documentId: documentId.toString() };
};

export const closePreliminaryPhase = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  const closableStatuses = [
    "preliminary_meeting_held",
    "preliminary_ready_to_close",
  ];
  if (!phase || !closableStatuses.includes(phase.preliminaryStatus ?? "")) {
    throw new HttpError(
      409,
      "La réunion préliminaire doit être tenue avant de clôturer la phase.",
    );
  }

  const now = new Date();
  phase.preliminaryStatus = "preliminary_closed";
  phase.status = "closed";
  phase.closedAt = now;
  phase.closedById = new Types.ObjectId(actor.id);
  await phase.save();

  dossier.status = "formal_request_phase";
  await dossier.save();

  await OmaPhaseModel.updateOne(
    { dossierId: dossier._id, phaseKey: "formal_request" },
    {
      $set: { status: "not_started" },
      $unset: { startedAt: "", startedById: "" },
    },
    { upsert: true },
  );

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.closed",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "preliminary_closed",
      dossierId: dossier._id.toString(),
    },
  });

  return { ok: true };
};

// ── Portal ────────────────────────────────────────────────────────────────

export const sendPreEvalToDg = async (
  dossierId: string,
  input: { sentAt?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "pre_eval_form_submitted") {
    throw new HttpError(
      409,
      "Le formulaire de pré-évaluation doit être soumis avant l'envoi au DG.",
    );
  }

  const sentAt = parseOptionalDate(input.sentAt, "sentAt") ?? new Date();

  phase.preliminaryStatus = "pre_eval_sent_to_dg";
  phase.status = "waiting_dg";
  phase.preEvaluationSentToDgAt = sentAt;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.pre_eval_sent_to_dg",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "pre_eval_sent_to_dg",
      sentAt: sentAt.toISOString(),
      notes: input.notes,
    },
  });

  return { ok: true };
};

export const recordPreEvalDgReturn = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: { returnedAt?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "pre_eval_sent_to_dg") {
    throw new HttpError(
      409,
      "Le formulaire doit être envoyé au DG avant d'enregistrer le retour.",
    );
  }

  validateFile(file, true, "document retourné par le DG");

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossier._id.toString()}/preliminary/dg-return`,
    ownerType: "phase",
    ownerId: phase._id,
    category: "decision",
    documentType: "pre_evaluation_dg_return",
    title: "Document retourné par le DG - Pré-évaluation",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });

  const returnedAt =
    parseOptionalDate(input.returnedAt, "returnedAt") ?? new Date();

  // Jump directly to decision_recorded - the DG return upload is sufficient evidence
  phase.preliminaryStatus = "pre_eval_dg_decision_recorded";
  phase.status = "in_progress";
  phase.preEvaluationReturnedFromDgAt = returnedAt;
  (
    phase as unknown as Record<string, unknown>
  ).preEvaluationDgAnnotatedDocumentId = documentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.pre_eval_dg_returned",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "pre_eval_dg_decision_recorded",
      documentId: documentId.toString(),
      returnedAt: returnedAt.toISOString(),
    },
  });

  return { documentId: documentId.toString() };
};

export const downloadAdminDossierDocument = async (
  dossierId: string,
  documentId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjectId = ensureObjectId(dossierId, "dossierId");
  const docObjectId = ensureObjectId(documentId, "documentId");

  const dossier = await DossierModel.findById(dossierObjectId)
    .select("_id")
    .lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossierObjectId,
    phaseKey: "preliminary",
  }).lean();
  if (!phase) throw new HttpError(404, "Phase préliminaire introuvable");

  const requestedDocumentId = docObjectId.toString();
  const isLinkedToPreliminaryEvidence = ADMIN_PRELIMINARY_DOWNLOAD_FIELDS.some(
    (field) => phase[field]?.toString() === requestedDocumentId,
  );

  if (!isLinkedToPreliminaryEvidence) {
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

export const getPortalDossier = async (dossierId: string, actor: Actor) => {
  const { dossier } = await getOwnedDossier(dossierId, actor);

  const phases = await OmaPhaseModel.find({ dossierId: dossier._id }).lean();
  const preliminaryPhase = phases.find((p) => p.phaseKey === "preliminary");

  const preliminaryStatus = preliminaryPhase?.preliminaryStatus ?? null;
  const portalLabel = preliminaryStatus
    ? (PRELIMINARY_STATUS_PORTAL_LABELS[preliminaryStatus] ??
      "Dossier en cours de traitement")
    : "Dossier en cours de traitement";

  const preEvaluationFormDocumentId =
    preliminaryPhase?.preEvaluationTemplateDocumentId &&
    PRE_EVAL_VISIBLE_STATUSES.has(preliminaryStatus ?? "")
      ? preliminaryPhase.preEvaluationTemplateDocumentId.toString()
      : null;

  let firstMeeting: {
    scheduledAt: string | null;
    location: string | null;
    status: string;
    notes: string | null;
  } | null = null;
  let preliminaryMeeting: {
    scheduledAt: string | null;
    location: string | null;
    status: string;
    notes: string | null;
  } | null = null;
  let firstMeetingReportDocumentId: string | null = null;

  if (preliminaryPhase) {
    if (preliminaryPhase.firstMeetingId) {
      const mtg = await MeetingModel.findById(
        preliminaryPhase.firstMeetingId,
      ).lean();
      if (mtg) {
        firstMeeting = {
          scheduledAt: toIso(mtg.scheduledAt) ?? null,
          location: (mtg.location as string | undefined) ?? null,
          status: mtg.status as string,
          notes: (mtg.notes as string | undefined) ?? null,
        };
      }
    }

    if (preliminaryPhase.firstMeetingReportDocumentId) {
      const reportDoc = await DocumentModel.findById(
        preliminaryPhase.firstMeetingReportDocumentId,
      )
        .select("visibility")
        .lean();
      if (reportDoc?.visibility === "postulant_visible") {
        firstMeetingReportDocumentId =
          preliminaryPhase.firstMeetingReportDocumentId.toString();
      }
    }

    if (preliminaryPhase.preliminaryMeetingId) {
      const mtg = await MeetingModel.findById(
        preliminaryPhase.preliminaryMeetingId,
      ).lean();
      if (mtg) {
        preliminaryMeeting = {
          scheduledAt: toIso(mtg.scheduledAt) ?? null,
          location: (mtg.location as string | undefined) ?? null,
          status: mtg.status as string,
          notes: (mtg.notes as string | undefined) ?? null,
        };
      }
    }
  }

  return {
    dossier: {
      id: dossier._id.toString(),
      dossierNumber: dossier.dossierNumber,
      dossierType: dossier.dossierType,
      status: dossier.status,
      openedAt: dossier.openedAt.toISOString(),
    },
    preliminary: {
      status: preliminaryStatus,
      portalLabel,
      preEvaluationFormDocumentId,
      firstMeetingReportDocumentId,
      hasCompletedForm: Boolean(
        preliminaryPhase?.completedPreEvaluationDocumentId,
      ),
      canSubmitForm: preliminaryStatus === "pre_eval_form_available",
      firstMeeting,
      preliminaryMeeting,
    },
  };
};

export const downloadPortalDossierDocument = async (
  dossierId: string,
  documentId: string,
  actor: Actor,
) => {
  await getOwnedDossier(dossierId, actor);

  const docObjectId = ensureObjectId(documentId, "documentId");
  const doc = await DocumentModel.findById(docObjectId).lean();

  if (!doc) throw new HttpError(404, "Document introuvable");
  if (doc.visibility !== "postulant_visible")
    throw new HttpError(403, "Document non accessible");

  const dossierObjectId = ensureObjectId(dossierId, "dossierId");
  const phase = await OmaPhaseModel.findOne({
    dossierId: dossierObjectId,
    phaseKey: "preliminary",
  }).lean();
  if (!phase) throw new HttpError(403, "Document non accessible");

  // Allow document if directly linked to this dossier's phase (template-owned docs included)
  const isLinkedToPhase =
    phase.preEvaluationTemplateDocumentId?.toString() === doc._id.toString() ||
    phase.firstMeetingReportDocumentId?.toString() === doc._id.toString();

  if (!isLinkedToPhase) {
    const allowedOwnerIds = [
      phase._id,
      phase.firstMeetingId,
      phase.preliminaryMeetingId,
    ]
      .filter(Boolean)
      .map((id) => id!.toString());

    if (!allowedOwnerIds.includes(doc.ownerId.toString())) {
      throw new HttpError(403, "Document non accessible");
    }
  }

  const buffer = await storageAdapter.getBuffer(doc.storageKey as string);

  return {
    buffer,
    mimeType: doc.mimeType as string,
    fileName: doc.fileName as string,
  };
};

export const uploadCompletedPreEvaluationForm = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  actor: Actor,
) => {
  const { dossier, portalUser } = await getOwnedDossier(dossierId, actor);

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "pre_eval_form_available") {
    throw new HttpError(
      409,
      "Le formulaire de pré-évaluation n'est pas disponible ou a déjà été soumis.",
    );
  }

  validateFile(file, true, "formulaire de pré-évaluation complété");

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossier._id.toString()}/preliminary/completed-pre-evaluation-form`,
    ownerType: "phase",
    ownerId: phase._id,
    category: "form",
    documentType: "pre_evaluation_completed_form",
    title: "Formulaire de pré-évaluation complété",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: portalUser.userId as Types.ObjectId,
  });

  phase.preliminaryStatus = "pre_eval_form_submitted";
  phase.status = "in_progress";
  phase.completedPreEvaluationDocumentId = documentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.pre_evaluation_form_uploaded",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "pre_eval_form_submitted",
      documentId: documentId.toString(),
    },
  });

  return { ok: true };
};
