/**
 * Formal request supporting-document slice.
 *
 * Owns Phase II non-gate document uploads from portal and internal users,
 * including non-repeatable replacement/archive behavior after DN correction.
 * Gate courrier intake and DN review decisions are handled by sibling slices.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { DocumentModel } from "../../documents/document.model.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { DossierModel } from "../../dossiers/dossier.model.js";

import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  assertPhaseNotClosed,
  mapRequirementToDocumentCategory,
  validateFormalRequestFile as validateFile,
} from "../helpers/formal-request.helpers.js";
import { ACTIVE_SUBMISSION_STATUS_SET } from "../constants/formal-request.constants.js";
import { formalRequestRepository } from "../repository/formal-request.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";
import { getOwnedDossier } from "./oma-phase.service.js";
import { getAdminFormalRequestPhase } from "./formal-request-overview.service.js";

const loadFormalRequestPhaseOrThrow = async (dossierId: Types.ObjectId) => {
  const phase =
    await formalRequestRepository.findFormalPhaseByDossierId(dossierId);
  if (!phase) {
    throw new HttpError(404, "Phase de demande formelle non initialisée.");
  }
  return phase;
};

export const uploadFormalRequestSupportingDocument = async (
  dossierId: string,
  requirementId: string,
  file: Express.Multer.File | undefined,
  payload: {
    source: "portal_upload" | "physical_deposit" | "internal_scan";
    notes?: string;
  },
  actor: Actor,
) => {
  validateFile(file);

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

  const phase = await loadFormalRequestPhaseOrThrow(resolvedDossierId);
  assertPhaseNotClosed(phase);

  const reqObjId = ensureObjectId(requirementId, "Requirement ID");
  const requirement = await formalRequestRepository.findRequirementById(reqObjId);

  if (!requirement) {
    throw new HttpError(404, "Exigence documentaire introuvable.");
  }
  if (String(requirement.phaseKey) !== "formal_request") {
    throw new HttpError(
      400,
      "Cette exigence n'appartient pas à la phase de demande formelle.",
    );
  }
  if (!requirement.isActive) {
    throw new HttpError(400, "Cette exigence n'est plus active.");
  }
  if (String(requirement.requirementLevel) === "gate") {
    throw new HttpError(
      409,
      "La demande formelle doit être déposée via l'action dédiée.",
    );
  }

  let submissionToReplace: GenericRecord | null = null;

  if (!requirement.isRepeatable) {
    const existingActive =
      await formalRequestRepository.findActiveSubmissionForRequirement(
        phase._id,
        reqObjId,
        [...ACTIVE_SUBMISSION_STATUS_SET],
      );

    if (existingActive) {
      if (
        String(existingActive.status) === "requires_correction" ||
        String(existingActive.status) === "incomplete"
      ) {
        submissionToReplace = existingActive;
      } else {
        throw new HttpError(
          409,
          "Un document est déjà déposé pour cette exigence.",
        );
      }
    }
  }

  const reqDocType = String(requirement.documentType);
  const reqLabel = String(requirement.label ?? "Document");
  const category = mapRequirementToDocumentCategory(reqDocType);

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${resolvedDossierId.toString()}/formal-request/documents/${reqDocType}`,
    ownerType: "phase",
    ownerId: phase._id as Types.ObjectId,
    category,
    documentType: "other",
    title: reqLabel,
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: submittedById,
  });

  const submission = await DocumentSubmissionModel.create({
    dossierId: resolvedDossierId,
    phaseId: phase._id,
    phaseKey: "formal_request",
    requirementId: reqObjId,
    documentId,
    submittedById,
    submittedByRole,
    source: payload.source,
    status: "submitted",
  });

  const isReplacement = submissionToReplace !== null;
  if (isReplacement) {
    await DocumentModel.findByIdAndUpdate(submissionToReplace!.documentId, {
      status: "archived",
      replacedByDocumentId: documentId,
    });
    await DocumentSubmissionModel.findByIdAndUpdate(submissionToReplace!._id, {
      status: "replaced",
    });
  }

  if (isReplacement) {
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "formal_request.supporting_document_reuploaded",
      entityType: "dossier",
      entityId: resolvedDossierId,
      metadata: {
        dossierId: resolvedDossierId.toString(),
        phaseId: (phase._id as Types.ObjectId).toString(),
        requirementId: reqObjId.toString(),
        requirementCode: String(requirement.code),
        oldSubmissionId: (
          submissionToReplace!._id as Types.ObjectId
        ).toString(),
        oldDocumentId: (
          submissionToReplace!.documentId as Types.ObjectId
        ).toString(),
        newSubmissionId: (submission._id as Types.ObjectId).toString(),
        newDocumentId: documentId.toString(),
        source: payload.source,
      },
    });
  } else {
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "formal_request.supporting_document_uploaded",
      entityType: "dossier",
      entityId: resolvedDossierId,
      metadata: {
        dossierId: resolvedDossierId.toString(),
        phaseId: (phase._id as Types.ObjectId).toString(),
        requirementId: reqObjId.toString(),
        requirementCode: String(requirement.code),
        documentId: documentId.toString(),
        submissionId: (submission._id as Types.ObjectId).toString(),
        source: payload.source,
      },
    });
  }

  if (actor.userType === "internal") {
    return getAdminFormalRequestPhase(resolvedDossierId.toString(), actor);
  }

  return {
    uploaded: true,
    replaced: isReplacement,
    previousSubmissionId: isReplacement
      ? (submissionToReplace!._id as Types.ObjectId).toString()
      : undefined,
    documentId: documentId.toString(),
    submissionId: (submission._id as Types.ObjectId).toString(),
    requirementId: reqObjId.toString(),
    requirementCode: String(requirement.code),
    source: payload.source,
  };
};
