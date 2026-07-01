/**
 * Formal request courrier intake slice.
 *
 * Owns the first Phase II gate: registering the official formal request
 * courrier from portal upload or internal physical/scan intake. Downstream
 * DG, meeting, supporting-document, review, and closure workflows live in the
 * sibling formal-request-* services and are re-exported by services/index.ts.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { CourrierModel } from "../../courriers/courrier.model.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { getAdminFormalRequestPhase } from "./formal-request-overview.service.js";
import { getOwnedDossier } from "./oma-phase-access.service.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  assertPhaseNotClosed,
  validateFormalRequestFile as validateFile,
} from "../helpers/formal-request.helpers.js";
import { notifyDossierPostulant } from "../helpers/notification.helpers.js";
import { formalRequestRepository } from "../repository/formal-request.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";

type CourrierSource = "portal_upload" | "physical_deposit" | "internal_scan";

const loadFormalRequestPhaseOrThrow = async (dossierId: Types.ObjectId) => {
  const phase = await formalRequestRepository.findFormalPhaseByDossierId(
    dossierId,
  );
  if (!phase)
    throw new HttpError(404, "Phase de demande formelle non initialisée.");
  return phase;
};

export const registerFormalRequestCourrier = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: {
    source: CourrierSource;
    officialReference?: string;
    physicalDepositDate?: string;
    notes?: string;
  },
  actor: Actor,
) => {
  validateFile(file);

  // ── Resolve dossier + ownership ──────────────────────────────────────────

  let resolvedDossierId: Types.ObjectId;
  let submittedByRole: string;
  let submittedById: Types.ObjectId;

  if (actor.userType === "postulant") {
    if (payload.source !== "portal_upload") {
      throw new HttpError(400, "Source invalide pour un postulant.");
    }
    const { dossier, portalUser } = await getOwnedDossier(dossierId, actor);
    resolvedDossierId = dossier._id as Types.ObjectId;
    submittedByRole = "postulant";
    submittedById = portalUser.userId as Types.ObjectId;
  } else {
    if (payload.source === "portal_upload") {
      throw new HttpError(
        400,
        "source=portal_upload n'est pas autorisée sur l'endpoint admin.",
      );
    }
    ensureInternalActor(actor);
    const dossier = await DossierModel.findById(
      ensureObjectId(dossierId, "Dossier ID"),
    ).lean();
    if (!dossier) throw new HttpError(404, "Dossier introuvable.");
    resolvedDossierId = dossier._id as Types.ObjectId;
    submittedByRole = actor.role;
    submittedById = ensureObjectId(actor.id, "Actor ID");
  }

  // ── Resolve Phase 2 ───────────────────────────────────────────────────────

  const phase =
    await formalRequestRepository.findFormalPhaseByDossierId(
      resolvedDossierId,
    );
  if (!phase)
    throw new HttpError(404, "Phase de demande formelle non initialisée.");

  if (phase.status === "closed") {
    throw new HttpError(409, "La phase de demande formelle est déjà clôturée.");
  }

  if (phase.formalRequestCourrierId) {
    throw new HttpError(
      409,
      "La demande formelle est déjà enregistrée pour cette phase.",
    );
  }

  // ── Gate requirement ──────────────────────────────────────────────────────

  const gateRequirement =
    (await formalRequestRepository.findFormalGateRequirement()) as
      | (GenericRecord & { _id: Types.ObjectId })
      | null;

  if (!gateRequirement) {
    throw new HttpError(
      500,
      "Exigence porte (formal_request_letter) introuvable - relancez le seed.",
    );
  }

  // ── Store file + create Document ──────────────────────────────────────────

  const physDepDate = payload.physicalDepositDate
    ? new Date(payload.physicalDepositDate)
    : undefined;

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${resolvedDossierId.toString()}/formal-request/courrier`,
    ownerType: "phase",
    ownerId: phase._id as Types.ObjectId,
    category: "courrier",
    documentType: "formal_request_letter",
    title: "Demande formelle",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: submittedById,
  });

  // ── Create Courrier ───────────────────────────────────────────────────────

  const dossierDoc = (await DossierModel.findById(resolvedDossierId)
    .select("requestId postulantUserId")
    .lean()) as unknown as GenericRecord | null;

  const courrier = await CourrierModel.create({
    dossierId: resolvedDossierId,
    requestId: dossierDoc?.requestId ?? undefined,
    type: "formal_request_courrier",
    source: payload.source,
    documentId,
    uploadedAt: payload.source === "portal_upload" ? new Date() : undefined,
    physicalDepositDate: physDepDate,
    officialReference: payload.officialReference,
    notes: payload.notes,
    registeredById: submittedById,
  });

  // ── Create DocumentSubmission ─────────────────────────────────────────────

  await DocumentSubmissionModel.create({
    dossierId: resolvedDossierId,
    phaseId: phase._id,
    phaseKey: "formal_request",
    requirementId: gateRequirement._id,
    documentId,
    submittedById,
    submittedByRole,
    source: payload.source,
    status: "submitted",
  });

  // ── Update OmaPhase ───────────────────────────────────────────────────────

  phase.formalRequestCourrierId = courrier._id as Types.ObjectId;
  phase.formalRequestStatus = "formal_request_received" as never;
  phase.status = "in_progress" as never;
  phase.formalRequestReceivedAt = new Date();
  await phase.save();

  // ── Audit ─────────────────────────────────────────────────────────────────

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.courrier_registered",
    entityType: "dossier",
    entityId: resolvedDossierId,
    metadata: {
      dossierId: resolvedDossierId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      courrierId: (courrier._id as Types.ObjectId).toString(),
      documentId: documentId.toString(),
      source: payload.source,
      ...(payload.officialReference
        ? { officialReference: payload.officialReference }
        : {}),
    },
  });

  // ── Return updated read state ─────────────────────────────────────────────

  await notifyDossierPostulant(dossierDoc ?? {}, {
    title: "Demande formelle reçue",
    message:
      "Votre demande formelle a été reçue. Le traitement se poursuit par l'ANAC.",
    relatedType: "phase",
    relatedId: phase._id as Types.ObjectId,
  });

  if (actor.userType === "internal") {
    return getAdminFormalRequestPhase(resolvedDossierId.toString(), actor);
  }

  // Portal: return minimal safe subset
  return {
    phase: {
      id: (phase._id as Types.ObjectId).toString(),
      phaseKey: "formal_request" as const,
      status: "in_progress",
      formalRequestStatus: "formal_request_received",
      canSendToDg: true,
    },
    gate: {
      exists: true,
      formalRequestCourrierId: (courrier._id as Types.ObjectId).toString(),
      source: payload.source,
      receivedAt: new Date().toISOString(),
    },
    progress: {
      blockingMissing: false,
      completionRate: null,
    },
  };
};
