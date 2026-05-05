import type {
  AidnCertificateStatus,
  AidnDocumentStatus,
  AidnOmaPhaseKey,
  AidnOmaPhaseStatus,
  AidnPhaseEvidenceStatus,
  AidnPortalStatus,
} from "@/features/aidn";

export type StatusTone = "default" | "success" | "warning" | "muted";

export const statusClassNames: Record<StatusTone, string> = {
  default: "border-primary/20 bg-primary/10 text-primary",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  muted:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

export const portalStatusTone: Partial<Record<AidnPortalStatus, StatusTone>> = {
  action_required: "warning",
  payment_expected: "warning",
  meeting_to_schedule: "warning",
  certificate_ready_for_collection: "success",
  certificate_collected: "success",
  request_rejected: "warning",
  dossier_closed: "muted",
};

export function formatDate(value?: string): string {
  if (!value) return "Non renseigne";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function pickDefaultOrganization(organizations: string[]): string {
  return organizations[0] ?? "";
}

export function simplifiedPortalStatusLabel(status: AidnPortalStatus): string {
  if (
    status === "action_required" ||
    status === "payment_expected" ||
    status === "meeting_to_schedule"
  )
    return "Action attendue";
  if (status === "certificate_preparation") return "Certificat en preparation";
  if (status === "certificate_ready_for_collection")
    return "Certificat en preparation";
  if (status === "decision_available") return "Notification disponible";
  if (
    status === "documents_under_review" ||
    status === "inspection_under_review"
  )
    return "Dossier en cours de traitement";
  if (status === "request_rejected") return "Notification disponible";
  if (status === "dossier_closed" || status === "certificate_collected")
    return "Dossier en cours de traitement";
  return "Dossier en cours de traitement";
}

export function actionForPortalStatus(status: AidnPortalStatus): string {
  if (status === "action_required") return "Action attendue";
  if (status === "payment_expected")
    return "Action attendue : justificatif de paiement";
  if (status === "meeting_to_schedule")
    return "Action attendue : reunion a planifier";
  if (status === "certificate_ready_for_collection")
    return "Action attendue : retrait du certificat";
  if (status === "decision_available" || status === "request_rejected")
    return "Notification disponible";
  return "Dossier en cours de traitement";
}

export function documentStatusLabel(status: AidnDocumentStatus): {
  label: string;
  tone: StatusTone;
} {
  if (status === "missing" || status === "rejected")
    return { label: "Document a fournir", tone: "warning" };
  if (status === "to_review" || status === "received")
    return { label: "En analyse", tone: "default" };
  if (status === "validated") return { label: "Valide", tone: "success" };
  return { label: "En analyse", tone: "default" };
}

export function evidenceStatusLabel(status: AidnPhaseEvidenceStatus): {
  label: string;
  tone: StatusTone;
} {
  if (status === "expected" || status === "missing")
    return { label: "Document a fournir", tone: "warning" };
  if (
    status === "received" ||
    status === "scanned" ||
    status === "pending_review"
  )
    return { label: "En analyse", tone: "default" };
  if (status === "validated") return { label: "Valide", tone: "success" };
  return { label: "Non applicable", tone: "muted" };
}

export function paymentStatusLabel(status: AidnPhaseEvidenceStatus): {
  label: string;
  tone: StatusTone;
} {
  if (status === "expected" || status === "missing")
    return { label: "Action attendue", tone: "warning" };
  if (
    status === "received" ||
    status === "scanned" ||
    status === "pending_review"
  )
    return { label: "En analyse", tone: "default" };
  if (status === "validated") return { label: "Valide", tone: "success" };
  return { label: "Non applicable", tone: "muted" };
}

export function meetingStatusLabel(
  outcome: "planned" | "held" | "postponed" | "cancelled",
  hasReport: boolean,
): { label: string; tone: StatusTone } {
  if (hasReport) return { label: "Compte rendu disponible", tone: "success" };
  if (outcome === "planned")
    return { label: "Reunion programmee", tone: "default" };
  if (outcome === "held")
    return { label: "Compte rendu a venir", tone: "default" };
  if (outcome === "postponed")
    return { label: "Reunion reportee", tone: "warning" };
  return { label: "Reunion annulee", tone: "muted" };
}

export function certificateStatusLabel(status: AidnCertificateStatus): {
  label: string;
  tone: StatusTone;
} {
  if (status === "ready_for_collection")
    return { label: "Certificat en preparation", tone: "success" };
  if (status === "collected" || status === "archived")
    return { label: "Certificat retire", tone: "success" };
  return { label: "Certificat en preparation", tone: "default" };
}

const phaseLabels: Record<AidnOmaPhaseKey, string> = {
  preliminary: "Phase preliminaire",
  formal_application: "Demande formelle",
  document_evaluation: "Evaluation des documents",
  onsite_demonstration: "Inspection sur site",
  delivery: "Preparation du certificat",
};

export function phaseLabel(phaseKey: AidnOmaPhaseKey): string {
  return phaseLabels[phaseKey];
}

export function phaseStatusLabel(status: AidnOmaPhaseStatus): string {
  if (status === "completed") return "Terminee";
  if (status === "in_progress") return "En cours";
  if (status === "blocked") return "Action attendue";
  if (status === "late") return "En cours";
  return "A venir";
}
