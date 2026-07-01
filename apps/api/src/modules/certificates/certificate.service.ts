/**
 * Certificate (Phase V deliverable) service.
 *
 * Owns the certificate record itself: creation (triggered by payment
 * validation - see delivery-payment.service.ts), the corrected 6-stage
 * lifecycle (to_prepare -> printed -> sent_for_dg_signature ->
 * ready_for_collection -> collected -> archived), and cross-dossier listing
 * for the admin Certificats page.
 *
 * "collected" is deliberately not a free-text "collected by" field: per
 * business rule, only the postulant may collect their certificate in
 * person - there is no third-party collector to name. The field instead
 * records which staff member verified the postulant's identity
 * (collectionVerifiedById), always the actor performing this action.
 * Software cannot verify identity remotely; this is a procedural control
 * (staff checks ID in person), not a technical guarantee.
 */
import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { saveDocument } from "../../shared/utils/document.helpers.js";
import { ensureObjectId, toId, toIso } from "../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { DocumentModel } from "../documents/document.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { NotificationModel } from "../notifications/notification.model.js";
import { PostulantOrganizationModel } from "../organizations/postulant-organization.model.js";
import { ensureInternalActor } from "../oma-phases/helpers/access.helpers.js";
import type { Actor, GenericRecord } from "../oma-phases/types/oma.types.js";
import { CertificateModel } from "./certificate.model.js";

const CERTIFICATE_LIFECYCLE = [
  "to_prepare",
  "printed",
  "sent_for_dg_signature",
  "ready_for_collection",
  "collected",
  "archived",
] as const;

type CertificateStatus = (typeof CERTIFICATE_LIFECYCLE)[number];

const DOSSIER_TYPE_TO_CERTIFICATE_TYPE: Record<string, string> = {
  oma_approval: "agrement",
  oma_recognition: "reconnaissance",
  oma_renewal: "renewal",
  oma_modification: "modification",
};

const getNextStatus = (current: string): CertificateStatus | null => {
  const idx = CERTIFICATE_LIFECYCLE.indexOf(current as CertificateStatus);
  if (idx < 0 || idx === CERTIFICATE_LIFECYCLE.length - 1) return null;
  return CERTIFICATE_LIFECYCLE[idx + 1];
};

const serializeCertificate = (cert: GenericRecord) => ({
  id: cert._id.toString(),
  dossierId: toId(cert.dossierId),
  certificateNumber: String(cert.certificateNumber),
  certificateType: String(cert.certificateType),
  status: String(cert.status),
  holderName: String(cert.holderName),
  validUntil: toIso(cert.validUntil) ?? null,
  linkedDocumentId: toId(cert.linkedDocumentId) ?? null,
  signedDocumentId: toId(cert.signedDocumentId) ?? null,
  printedAt: toIso(cert.printedAt) ?? null,
  sentForSignatureAt: toIso(cert.sentForSignatureAt) ?? null,
  signedUploadedAt: toIso(cert.signedUploadedAt) ?? null,
  readyForCollectionAt: toIso(cert.readyForCollectionAt) ?? null,
  collectedAt: toIso(cert.collectedAt) ?? null,
  collectionVerifiedById: toId(cert.collectionVerifiedById) ?? null,
  collectionNote: (cert.collectionNote as string | null | undefined) ?? null,
  archivedAt: toIso(cert.archivedAt) ?? null,
});

// Called from delivery-payment.service.ts the moment the certificate
// delivery fee payment is validated - not a standalone admin action, and
// not tied to phase closure (closure now happens after collection, see
// delivery-closure.service.ts).
export const createCertificateForDossier = async (
  dossierId: Types.ObjectId,
  phaseId: Types.ObjectId,
  actor: Actor,
) => {
  const existing = await CertificateModel.findOne({ dossierId });
  if (existing) return existing;

  const dossier = await DossierModel.findById(dossierId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const organization = await PostulantOrganizationModel.findById(
    dossier.organizationId,
  ).select("canonicalName");

  const certificateType =
    DOSSIER_TYPE_TO_CERTIFICATE_TYPE[String(dossier.dossierType)] ??
    "agrement";

  return CertificateModel.create({
    dossierId,
    phaseId,
    certificateNumber: `CERT-${dossier.dossierNumber}`,
    certificateType,
    status: "to_prepare",
    holderName: organization?.canonicalName ?? "Organisme inconnu",
  });
};

export const getCertificateForDossier = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const cert = await CertificateModel.findOne({ dossierId: dossierObjId }).lean();
  if (!cert) throw new HttpError(404, "Certificat introuvable pour ce dossier.");
  return { certificate: serializeCertificate(cert as unknown as GenericRecord) };
};

export const listCertificatesAdmin = async (
  filters: { status?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;

  const certs = await CertificateModel.find(query).sort({ createdAt: -1 }).lean();
  const dossierIds = certs.map((c) => c.dossierId);
  const dossiers = await DossierModel.find({ _id: { $in: dossierIds } })
    .populate("organizationId", "canonicalName")
    .lean();
  const dossierById = new Map(dossiers.map((d) => [String(d._id), d]));

  return {
    items: certs.map((cert) => {
      const dossier = dossierById.get(String(cert.dossierId));
      return {
        ...serializeCertificate(cert as unknown as GenericRecord),
        dossier: dossier
          ? {
              id: String(dossier._id),
              dossierNumber: dossier.dossierNumber,
              dossierType: dossier.dossierType,
              status: dossier.status,
              organizationName:
                (dossier.organizationId as unknown as GenericRecord | null)
                  ?.canonicalName ?? null,
            }
          : null,
      };
    }),
  };
};

export const advanceCertificateLifecycle = async (
  certificateId: string,
  file: Express.Multer.File | undefined,
  payload: { collectionNote?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const cert = await CertificateModel.findById(certificateId);
  if (!cert) throw new HttpError(404, "Certificat introuvable.");

  const nextStatus = getNextStatus(String(cert.status));
  if (!nextStatus) {
    throw new HttpError(409, "Ce certificat a atteint son statut final.");
  }

  if (nextStatus === "ready_for_collection" && !file) {
    throw new HttpError(
      400,
      "Le certificat signe doit etre televerse pour marquer le dossier pret au retrait.",
    );
  }

  const now = new Date();
  const previousStatus = String(cert.status);

  if (nextStatus === "printed") {
    cert.printedAt = cert.printedAt ?? now;
    cert.printedById = cert.printedById ?? actorObjId;
  } else if (nextStatus === "sent_for_dg_signature") {
    cert.sentForSignatureAt = cert.sentForSignatureAt ?? now;
    cert.sentForSignatureById = cert.sentForSignatureById ?? actorObjId;
  } else if (nextStatus === "ready_for_collection" && file) {
    // Uploading the signed certificate does two things at once: archives
    // the signed document and marks the certificate ready for pickup -
    // there is no separate "mark signed" click before this.
    const signedDocumentId = await saveDocument({
      file,
      ownerPath: `certificates/${String(cert._id)}`,
      ownerType: "certificate",
      ownerId: cert._id,
      category: "certificate",
      documentType: "certificate_signed",
      title: `Certificat signe - ${String(cert.certificateNumber)}`,
      // Stays internal-only until "collected" - the postulant retrieves
      // the physical original in person; making the digital copy
      // available earlier would undercut that requirement.
      visibility: "internal_only",
      status: "uploaded",
      uploadedById: actorObjId,
    });
    cert.signedDocumentId =
      signedDocumentId as unknown as typeof cert.signedDocumentId;
    cert.signedUploadedAt = now;
    cert.signedUploadedById = actorObjId;
    cert.readyForCollectionAt = now;
  } else if (nextStatus === "collected") {
    cert.collectedAt = now;
    cert.collectionVerifiedById = actorObjId;
    cert.collectionNote =
      (payload.collectionNote?.trim() ||
        null) as unknown as typeof cert.collectionNote;
    if (cert.signedDocumentId) {
      await DocumentModel.updateOne(
        { _id: cert.signedDocumentId },
        { $set: { visibility: "postulant_visible" } },
      );
    }
  } else if (nextStatus === "archived") {
    cert.archivedAt = now;
  }

  cert.status = nextStatus as never;
  await cert.save();

  if (nextStatus === "ready_for_collection") {
    const dossier = await DossierModel.findById(cert.dossierId).select(
      "postulantUserId dossierNumber",
    );
    if (dossier?.postulantUserId) {
      await NotificationModel.create({
        recipientUserId: dossier.postulantUserId,
        channel: "in_app",
        title: "Certificat pret au retrait",
        message: `Votre certificat ${String(
          cert.certificateNumber,
        )} est pret. Veuillez vous presenter en personne pour le retirer.`,
        relatedType: "certificate",
        relatedId: cert._id,
        status: "unread",
      });
    }
  }

  await writeAuditLog({
    action: "certificate.lifecycle_advanced",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "certificate",
    entityId: (cert._id as Types.ObjectId).toString(),
    metadata: {
      dossierId: toId(cert.dossierId),
      previousStatus,
      newStatus: nextStatus,
    },
  });

  return {
    certificate: serializeCertificate(cert as unknown as GenericRecord),
  };
};
