import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { toId, toIso } from "../../shared/utils/service.helpers.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { PostulantOrganizationModel } from "../organizations/postulant-organization.model.js";
import { OmaPhaseModel } from "../oma-phases/index.js";
import { UserModel } from "../users/user.model.js";
import { PhasePaymentModel } from "./phase-payment.model.js";

type Actor = { id: string; role: string; userType: "internal" | "postulant" };
type GenericRecord = Record<string, unknown> & { _id: Types.ObjectId };

const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Accès interne requis.");
  }
};

export type PhasePaymentTaskFilters = {
  status?: "invoice_pending" | "invoice_sent" | "payment_proof_submitted" | "all";
  phaseKey?: "document_evaluation" | "inspection" | "delivery" | "all";
  paymentType?: "study_fee" | "audit_fee" | "certificate_delivery_fee" | "all";
};

// ── listPhasePaymentTasks ─────────────────────────────────────────────────────
// Drives the S5 facturation workspace queue.
// Queries active OmaPhases first so dossiers with no PhasePayment row
// (invoice not yet sent) still appear as invoice_pending.

export const listPhasePaymentTasks = async (
  filters: PhasePaymentTaskFilters,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const resolvedPhaseKey: string =
    !filters.phaseKey || filters.phaseKey === "all"
      ? "document_evaluation"
      : filters.phaseKey;

  const resolvedPaymentType: string =
    !filters.paymentType || filters.paymentType === "all"
      ? "study_fee"
      : filters.paymentType;

  const statusFilter =
    !filters.status || filters.status === "all" ? null : filters.status;

  // 1. Find active OmaPhases (exclude closed)
  const phases = await OmaPhaseModel.find({
    phaseKey: resolvedPhaseKey,
    status: { $ne: "closed" },
  })
    .select("_id dossierId phaseKey status startedAt")
    .lean();

  if (phases.length === 0) {
    return {
      items: [],
      counts: { all: 0, invoice_pending: 0, invoice_sent: 0, payment_proof_submitted: 0 },
    };
  }

  const phaseIds = phases.map((p) => (p as unknown as GenericRecord)._id);
  const dossierIds = phases
    .map((p) => (p as unknown as GenericRecord).dossierId)
    .filter(Boolean) as Types.ObjectId[];

  // 2. Bulk load dossiers and matching payments in parallel
  const [dossiers, payments] = await Promise.all([
    DossierModel.find({ _id: { $in: dossierIds } })
      .select("_id dossierNumber status organizationId postulantUserId")
      .lean(),
    PhasePaymentModel.find({
      phaseId: { $in: phaseIds },
      paymentType: resolvedPaymentType,
    })
      .select(
        "_id dossierId phaseId paymentType status invoiceDocumentId paymentProofDocumentId invoiceSentAt paymentProofSubmittedAt",
      )
      .lean(),
  ]);

  const orgIds = dossiers
    .map((d) => (d as unknown as GenericRecord).organizationId)
    .filter(Boolean) as Types.ObjectId[];
  const userIds = dossiers
    .map((d) => (d as unknown as GenericRecord).postulantUserId)
    .filter(Boolean) as Types.ObjectId[];

  const [orgs, users] = await Promise.all([
    PostulantOrganizationModel.find({ _id: { $in: orgIds } })
      .select("_id canonicalName")
      .lean(),
    UserModel.find({ _id: { $in: userIds } })
      .select("_id fullName email")
      .lean(),
  ]);

  // 3. Build lookup maps
  const dossierMap = new Map(
    (dossiers as unknown as GenericRecord[]).map((d) => [d._id.toString(), d]),
  );
  const paymentByPhase = new Map(
    (payments as unknown as GenericRecord[]).map((p) => [
      String(p.phaseId ?? ""),
      p,
    ]),
  );
  const orgMap = new Map(
    (orgs as unknown as GenericRecord[]).map((o) => [o._id.toString(), o]),
  );
  const userMap = new Map(
    (users as unknown as GenericRecord[]).map((u) => [u._id.toString(), u]),
  );

  // 4. Build synthesized task list
  const allTasks = phases.map((phase) => {
    const phaseRec = phase as unknown as GenericRecord;
    const phaseIdStr = phaseRec._id.toString();
    const dossierIdStr = String(phaseRec.dossierId ?? "");
    const dossier = dossierMap.get(dossierIdStr) ?? null;
    const payment = paymentByPhase.get(phaseIdStr) ?? null;
    const org = dossier?.organizationId
      ? orgMap.get(String(dossier.organizationId)) ?? null
      : null;
    const user = dossier?.postulantUserId
      ? userMap.get(String(dossier.postulantUserId)) ?? null
      : null;

    const paymentStatus: "invoice_pending" | "invoice_sent" | "payment_proof_submitted" = payment
      ? (String(payment.status) as "invoice_pending" | "invoice_sent" | "payment_proof_submitted")
      : "invoice_pending";

    const lastActivityAt =
      (payment
        ? toIso(payment.paymentProofSubmittedAt) ?? toIso(payment.invoiceSentAt)
        : undefined) ??
      toIso(phaseRec.startedAt) ??
      null;

    return {
      dossierId: dossierIdStr,
      dossierNumber: dossier?.dossierNumber ? String(dossier.dossierNumber) : null,
      dossierStatus: dossier ? String(dossier.status) : "unknown",
      organizationId: dossier?.organizationId ? String(dossier.organizationId) : null,
      organizationName: org?.canonicalName ? String(org.canonicalName) : "—",
      postulantUserId: dossier?.postulantUserId ? String(dossier.postulantUserId) : null,
      postulantName: user?.fullName ? String(user.fullName) : "—",
      postulantEmail: user?.email ? String(user.email) : null,
      phaseId: phaseIdStr,
      phaseKey: String(phaseRec.phaseKey) as "document_evaluation" | "inspection" | "delivery",
      paymentId: payment ? payment._id.toString() : null,
      paymentType: payment ? String(payment.paymentType) : resolvedPaymentType,
      paymentStatus,
      invoiceDocumentId: payment ? toId(payment.invoiceDocumentId) ?? null : null,
      paymentProofDocumentId: payment ? toId(payment.paymentProofDocumentId) ?? null : null,
      invoiceSentAt: payment ? toIso(payment.invoiceSentAt) ?? null : null,
      paymentProofSubmittedAt: payment ? toIso(payment.paymentProofSubmittedAt) ?? null : null,
      lastActivityAt: lastActivityAt ?? null,
    };
  });

  // 5. Counts computed from all tasks (independent of status filter)
  const counts = {
    all: allTasks.length,
    invoice_pending: allTasks.filter((t) => t.paymentStatus === "invoice_pending").length,
    invoice_sent: allTasks.filter((t) => t.paymentStatus === "invoice_sent").length,
    payment_proof_submitted: allTasks.filter(
      (t) => t.paymentStatus === "payment_proof_submitted",
    ).length,
  };

  // 6. Apply status filter to items, sort pending-first then by activity desc
  const STATUS_ORDER: Record<string, number> = {
    invoice_pending: 0,
    invoice_sent: 1,
    payment_proof_submitted: 2,
  };

  const items = (statusFilter ? allTasks.filter((t) => t.paymentStatus === statusFilter) : allTasks)
    .sort((a, b) => {
      const diff = (STATUS_ORDER[a.paymentStatus] ?? 0) - (STATUS_ORDER[b.paymentStatus] ?? 0);
      if (diff !== 0) return diff;
      return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
    });

  return { items, counts };
};

