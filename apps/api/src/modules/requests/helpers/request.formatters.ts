import { Types } from "mongoose";

import { toId, toIso } from "../../../shared/utils/service.helpers.js";
import type { RequestRecord } from "../types/request.types.js";

export const portalStatusLabel = (
  status: string,
  request?: RequestRecord,
) => {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "courrier_uploaded":
      return "Demande reÃ§ue";
    case "courrier_physical_declared":
      return "Demande reÃ§ue";
    case "submitted":
      if (request?.courrierSource === "physical_deposit") {
        return "Demande reÃ§ue - dÃ©pÃ´t physique prÃ©vu";
      }
      return "Demande reÃ§ue";
    case "intake_in_review":
      return "En attente dâ€™orientation administrative";
    case "intake_requires_correction":
      return "Action requise";
    case "initial_sent_to_dg":
      return "En attente dâ€™orientation administrative";
    case "initial_dg_returned":
    case "initial_dg_decision_recorded":
      return "En cours de traitement administratif";
    case "oriented_to_dn":
      return "Transmise Ã  la Direction de la NavigabilitÃ©";
    case "dossier_opened":
      return "Dossier en cours de traitement";
    case "rejected":
      return "Demande non retenue";
    case "reoriented":
      return "Demande rÃ©orientÃ©e";
    case "closed":
      return "Dossier en cours de traitement";
    default:
      return "Dossier en cours de traitement";
  }
};

export const sanitizeRelatedOrganization = (source: unknown) => {
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

export const sanitizeRelatedUser = (source: unknown) => {
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

export const sanitizeIntake = (
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
    printedForDgBy: printedForDgById
      ? actorById.get(printedForDgById)
      : undefined,
    sentToDgAt: toIso(intake.sentToDgAt),
    sentToDgById,
    sentToDgBy: sentToDgById ? actorById.get(sentToDgById) : undefined,
    notes: intake.notes,
  };
};

export const sanitizeRequest = (source: unknown) => {
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

export const sanitizePortalRequest = (source: unknown) => {
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

export const sanitizeCourrier = (source: unknown) => {
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

export const sanitizePortalCourrier = (source: unknown) => {
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

export const sanitizeDocument = (source: unknown) => {
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

export const sanitizeDgReview = (source: unknown) => {
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

export const sanitizeDossier = (source: unknown) => {
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
