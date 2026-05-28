import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { storageAdapter } from "../../shared/storage/storage.adapter.js";
import { saveDocument } from "../../shared/utils/document.helpers.js";
import { ensureObjectId, parseOptionalDate, toId, toIso } from "../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { MeetingModel } from "../meetings/meeting.model.js";
import {
  getActivePreEvalTemplate,
  getActiveTemplatesByFormCodes,
} from "../document-templates/document-template.service.js";
import { DocumentRequirementModel } from "../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../documents/document-submission.model.js";
import { OmaPhaseModel } from "./oma-phase.model.js";
import { RequestModel } from "../requests/request.model.js";
import { UserModel } from "../users/user.model.js";
import { NotificationModel } from "../notifications/notification.model.js";

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
  preliminary_not_started: "En cours de traitement par l'ANAC",
  preliminary_started: "En cours de traitement par l'ANAC",
  first_meeting_invited: "Rendez-vous programmé",
  first_meeting_held: "En cours d'examen",
  pre_eval_form_available: "Formulaire de pré-évaluation à compléter",
  pre_eval_form_submitted: "En cours d'examen",
  pre_eval_sent_to_dg: "En cours d'examen",
  pre_eval_dg_decision_recorded: "En cours d'examen",
  preliminary_meeting_invited: "Rendez-vous programmé",
  preliminary_meeting_held: "En cours d'examen",
  preliminary_ready_to_close: "En cours d'examen",
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

const FORMAL_REQUEST_PORTAL_LABELS: Record<string, string> = {
  formal_not_started: "Demande formelle attendue",
  formal_waiting_request: "Demande formelle attendue",
  formal_request_received: "Demande formelle reçue",
  formal_documents_tracking: "Demande formelle reçue",
  formal_sent_to_dg: "Demande formelle en cours d'examen",
  formal_dg_returned: "Demande formelle en cours d'examen",
  formal_dg_decision_recorded: "Demande formelle en cours d'examen",
  formal_meeting_invited: "Réunion formelle programmée",
  formal_meeting_held: "Documents de demande formelle à compléter",
  formal_recevability_recorded: "Demande formelle en cours d'examen",
  formal_ready_to_close: "En attente de finalisation par l'ANAC",
  formal_requires_correction: "Action requise",
  formal_closed: "Phase de demande formelle clôturée",
};

const ADMIN_PRELIMINARY_DOWNLOAD_FIELDS = [
  "firstMeetingReportDocumentId",
  "preEvaluationTemplateDocumentId",
  "completedPreEvaluationDocumentId",
  "preEvaluationDgAnnotatedDocumentId",
  "preliminaryMeetingReportDocumentId",
  "closureCourrierDocumentId",
] as const;

const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
};

const notifyDossierPostulant = async (
  dossier: { postulantUserId?: unknown },
  input: {
    title: string;
    message: string;
    relatedType: "phase" | "document" | "meeting";
    relatedId: Types.ObjectId;
  },
) => {
  if (!dossier.postulantUserId) return;
  await NotificationModel.create({
    recipientUserId: dossier.postulantUserId,
    channel: "in_app",
    title: input.title,
    message: input.message,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    status: "unread",
  });
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

const REPORT_REQUIRED_MEETING_TYPES = new Set([
  "first_contact_meeting",
  "preliminary_meeting",
]);

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
  reportRequired: REPORT_REQUIRED_MEETING_TYPES.has(m.meetingType as string),
  notes: m.notes,
  createdAt: toIso(m.createdAt),
});

const sanitizeDocumentEvidence = (id: Types.ObjectId, doc: GenericRecord) => ({
  id: id.toString(),
  title: doc.title as string | undefined,
  fileName: doc.fileName as string | undefined,
  documentType: doc.documentType as string | undefined,
  category: doc.category as string | undefined,
  uploadedAt: toIso(doc.uploadedAt),
  uploadedById: toId(doc.uploadedById),
  visibility: doc.visibility as "internal_only" | "postulant_visible" | undefined,
  status: doc.status as string | undefined,
});

const buildPreliminaryDocumentEvidence = async (phase: GenericRecord) => {
  const fields = [
    { key: "preEvaluationTemplateDocument", idField: "preEvaluationTemplateDocumentId" },
    { key: "completedPreEvaluationDocument", idField: "completedPreEvaluationDocumentId" },
    { key: "preEvaluationDgAnnotatedDocument", idField: "preEvaluationDgAnnotatedDocumentId" },
    { key: "firstMeetingReportDocument", idField: "firstMeetingReportDocumentId" },
    { key: "preliminaryMeetingReportDocument", idField: "preliminaryMeetingReportDocumentId" },
    { key: "closureCourrierDocument", idField: "closureCourrierDocumentId" },
  ] as const;

  const results: Record<string, ReturnType<typeof sanitizeDocumentEvidence> | null> = {};

  await Promise.all(
    fields.map(async ({ key, idField }) => {
      const docId = phase[idField] as Types.ObjectId | undefined;
      if (!docId) {
        results[key] = null;
        return;
      }
      const doc = await DocumentModel.findById(docId)
        .select("title fileName documentType category uploadedAt uploadedById visibility status")
        .lean();
      results[key] = doc ? sanitizeDocumentEvidence(docId, doc as unknown as GenericRecord) : null;
    }),
  );

  return results;
};

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

export const getOwnedDossier = async (dossierId: string, actor: Actor) => {
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
  const formalRequestPhase = phases.find((p) => p.phaseKey === "formal_request");

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

  const [courriers, documentEvidence] = await Promise.all([
    buildDossierCourriers(dossier.requestId),
    preliminaryPhase
      ? buildPreliminaryDocumentEvidence(preliminaryPhase as unknown as GenericRecord)
      : Promise.resolve(null),
  ]);

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
          documentEvidence,
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

  await notifyDossierPostulant(dossier, {
    title: "Rendez-vous programmé",
    message:
      "Un rendez-vous a été programmé pour votre dossier. Vous pouvez consulter les détails dans votre espace.",
    relatedType: "meeting",
    relatedId: meeting._id as Types.ObjectId,
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

  await notifyDossierPostulant(dossier, {
    title: "Formulaire de pré-évaluation disponible",
    message:
      "Le formulaire de pré-évaluation est disponible. Veuillez le télécharger, le compléter puis le téléverser dans votre dossier.",
    relatedType: "document",
    relatedId: fileDocumentId,
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

  await notifyDossierPostulant(dossier, {
    title: "Réunion préliminaire programmée",
    message:
      "Une réunion préliminaire a été programmée pour votre dossier. Vous pouvez consulter les détails dans votre espace.",
    relatedType: "meeting",
    relatedId: meeting._id as Types.ObjectId,
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

  await notifyDossierPostulant(dossier, {
    title: "Phase préliminaire clôturée",
    message: "La phase préliminaire de votre dossier est clôturée.",
    relatedType: "phase",
    relatedId: phase._id as Types.ObjectId,
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
    // Allow Phase 2 supporting document downloads: any live submission linked to
    // this dossier's formal_request phase.
    const formalSubmission = await DocumentSubmissionModel.findOne({
      dossierId: dossierObjectId,
      documentId: docObjectId,
      phaseKey: "formal_request",
      status: { $nin: ["replaced", "archived"] },
    })
      .select("_id")
      .lean();
    if (!formalSubmission) {
      throw new HttpError(403, "Document non accessible");
    }
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
  const formalRequestPhase = phases.find((p) => p.phaseKey === "formal_request");

  const preliminaryStatus = preliminaryPhase?.preliminaryStatus ?? null;
  const portalLabel = preliminaryStatus
    ? (PRELIMINARY_STATUS_PORTAL_LABELS[preliminaryStatus] ??
      "En cours de traitement par l'ANAC")
    : "En cours de traitement par l'ANAC";

  const preEvaluationFormDocumentId =
    preliminaryPhase?.preEvaluationTemplateDocumentId &&
    PRE_EVAL_VISIBLE_STATUSES.has(preliminaryStatus ?? "")
      ? preliminaryPhase.preEvaluationTemplateDocumentId.toString()
      : null;
  const formalRequestStatus =
    (formalRequestPhase?.formalRequestStatus as string | null | undefined) ??
    (formalRequestPhase ? "formal_waiting_request" : null);
  const hasFormalRequestCourrier = Boolean(
    formalRequestPhase?.formalRequestCourrierId,
  );
  const canUploadFormalRequestCourrier = Boolean(
    preliminaryStatus === "preliminary_closed" &&
      formalRequestPhase &&
      formalRequestPhase.status !== "closed" &&
      !hasFormalRequestCourrier,
  );
  const formalRequestPortalLabel = canUploadFormalRequestCourrier
    ? "Demande formelle attendue"
    : hasFormalRequestCourrier
      ? (formalRequestStatus
        ? (FORMAL_REQUEST_PORTAL_LABELS[formalRequestStatus] ??
          "Demande formelle reçue")
        : "Demande formelle reçue")
      : formalRequestStatus
        ? (FORMAL_REQUEST_PORTAL_LABELS[formalRequestStatus] ??
          "Demande formelle en cours d'examen")
        : "En cours de traitement par l'ANAC";

  // ── Phase 2 requirements + templates + formal meeting ─────────────────────

  type PortalSubmission = { submissionId: string; uploadedAt: string; status: string; reviewComment?: string };
  type PortalRequirement = {
    requirementId: string;
    code: string;
    label: string;
    formCode?: string;
    requirementLevel: string;
    isRepeatable: boolean;
    template?: { templateId: string; title: string; fileName: string };
    status: string;
    submissions: PortalSubmission[];
  };

  const PORTAL_ACTIVE_SUBMISSION_STATUSES = new Set([
    "submitted", "under_review", "validated", "requires_correction", "incomplete", "rejected",
  ]);

  const computePortalReqStatus = (subs: Array<{ status: unknown }>): string => {
    const active = subs.filter((s) => PORTAL_ACTIVE_SUBMISSION_STATUSES.has(String(s.status)));
    if (active.length === 0) return "missing";
    return String(active[0].status);
  };

  let portalRequirements: PortalRequirement[] = [];
  let formalProgress = { totalTracked: 0, submitted: 0, validated: 0, missing: 0 };
  let formalMeetingBlock: { scheduledAt: string | null; location: string | null; status: string; notes: string | null } | null = null;

  if (formalRequestPhase) {
    const [rawReqs, rawSubs] = await Promise.all([
      DocumentRequirementModel.find({
        phaseKey: "formal_request",
        isActive: true,
        requirementLevel: { $ne: "gate" },
      }).sort({ sortOrder: 1 }).lean(),
      DocumentSubmissionModel.find({
        dossierId: dossier._id,
        phaseKey: "formal_request",
      }).sort({ createdAt: -1 }).lean(),
    ]);

    const subsByReq = new Map<string, Array<{ status: unknown; _id: { toString(): string }; createdAt?: unknown; reviewComment?: unknown }>>();
    for (const s of rawSubs) {
      const key = (s as unknown as { requirementId?: { toString(): string } }).requirementId?.toString() ?? "";
      if (!key) continue;
      const list = subsByReq.get(key) ?? [];
      list.push(s as unknown as { status: unknown; _id: { toString(): string }; createdAt?: unknown; reviewComment?: unknown });
      subsByReq.set(key, list);
    }

    const formCodes = (rawReqs as unknown as Array<{ formCode?: unknown }>)
      .map((r) => r.formCode ? String(r.formCode) : "")
      .filter(Boolean);
    const templateMap = await getActiveTemplatesByFormCodes(formCodes);

    portalRequirements = (rawReqs as unknown as Array<{
      _id: { toString(): string };
      code: unknown;
      label: unknown;
      formCode?: unknown;
      requirementLevel: unknown;
      isRepeatable: unknown;
    }>).map((req) => {
      const reqId = req._id.toString();
      const subs = subsByReq.get(reqId) ?? [];
      const formCode = req.formCode ? String(req.formCode) : undefined;
      const templateEntry = formCode ? templateMap.get(formCode) : undefined;
      return {
        requirementId: reqId,
        code: String(req.code),
        label: String(req.label),
        formCode,
        requirementLevel: String(req.requirementLevel),
        isRepeatable: Boolean(req.isRepeatable),
        template: templateEntry,
        status: computePortalReqStatus(subs),
        submissions: subs.map((s) => ({
          submissionId: s._id.toString(),
          uploadedAt: toIso(s.createdAt as unknown) ?? new Date().toISOString(),
          status: String(s.status),
          reviewComment: s.reviewComment ? String(s.reviewComment) : undefined,
        })),
      };
    });

    const totalTracked = portalRequirements.length;
    const submitted = portalRequirements.filter((r) => r.submissions.length > 0).length;
    const validated = portalRequirements.filter((r) => r.status === "validated").length;
    const missing = portalRequirements.filter(
      (r) => r.requirementLevel === "expected" && r.status === "missing",
    ).length;
    formalProgress = { totalTracked, submitted, validated, missing };

    if ((formalRequestPhase as unknown as { formalMeetingId?: { toString(): string } }).formalMeetingId) {
      const mtg = await MeetingModel.findById(
        (formalRequestPhase as unknown as { formalMeetingId: { toString(): string } }).formalMeetingId,
      ).lean();
      if (mtg) {
        formalMeetingBlock = {
          scheduledAt: toIso(mtg.scheduledAt) ?? null,
          location: mtg.location ? String(mtg.location) : null,
          status: String(mtg.status),
          notes: mtg.notes ? String(mtg.notes) : null,
        };
      }
    }
  }

  // ── Preliminary meetings ───────────────────────────────────────────────────

  let firstMeeting: {
    scheduledAt: string | null;
    heldAt: string | null;
    location: string | null;
    status: string;
    notes: string | null;
  } | null = null;
  let preliminaryMeeting: {
    scheduledAt: string | null;
    heldAt: string | null;
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
          heldAt: toIso(mtg.heldAt) ?? null,
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
          heldAt: toIso(mtg.heldAt) ?? null,
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
    formalRequest: {
      status: formalRequestStatus,
      portalLabel: formalRequestPortalLabel,
      hasFormalRequestCourrier,
      canUploadFormalRequestCourrier,
      requirements: portalRequirements,
      progress: formalProgress,
      formalMeeting: formalMeetingBlock,
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
