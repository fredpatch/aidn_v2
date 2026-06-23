/**
 * OMA phase response formatters.
 *
 * Pure mappers for dossier, phase, meeting, and document evidence read models.
 * They do not perform database reads or workflow validation.
 */
import { Types } from "mongoose";

import { toId, toIso } from "../../../shared/utils/service.helpers.js";
import { REPORT_REQUIRED_MEETING_TYPES } from "../constants/preliminary.constants.js";
import type { GenericRecord } from "../types/oma.types.js";

export const sanitizeRelatedOrg = (source: unknown) => {
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

export const sanitizeRelatedUser = (source: unknown) => {
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

export const sanitizeDossierSummary = (d: GenericRecord) => ({
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

export const sanitizePhase = (p: GenericRecord) => ({
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

export const sanitizeMeeting = (m: GenericRecord) => ({
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

export const sanitizeDocumentEvidence = (
  id: Types.ObjectId,
  doc: GenericRecord,
) => ({
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
