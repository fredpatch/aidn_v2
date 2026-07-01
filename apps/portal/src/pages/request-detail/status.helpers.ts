import type { PortalDossierDetail } from "../../lib/api/dossiers";
import type { PortalRequest } from "../../lib/api/requests";
import {
  ACTION_REQUIRED_STATUSES,
  PRELIMINARY_STATUS_LABELS,
  PRELIMINARY_STEPS,
  REQUEST_STATUS_LABELS,
  STATUS_TO_PRELIMINARY_STEP,
  STATUS_TONES,
  type PreliminaryStep,
} from "./status.constants";

/**
 * Get the display label for a preliminary phase status
 * @param status - The backend preliminary.status value
 * @returns Specific French label for the postulant
 */
export function getPreliminaryStatusLabel(status: string | null): string {
  if (!status) return "En cours de traitement par l'ANAC";
  return (
    PRELIMINARY_STATUS_LABELS[status] ?? "En cours de traitement par l'ANAC"
  );
}

/**
 * Check if a dossier is currently in the preliminary phase
 * @param dossier - The dossier object
 * @returns true if preliminary phase is active (not closed yet)
 */
export function isPreliminaryPhaseActive(
  dossier: PortalDossierDetail | null | undefined,
): boolean {
  if (!dossier?.preliminary) return false;
  return (
    dossier.preliminary.status !== "preliminary_closed" &&
    !!dossier.preliminary.status
  );
}

/**
 * Determine which sub-step of the preliminary phase the dossier is in
 * @param preliminary - The preliminary phase data
 * @returns The current step identifier
 */
export function getPreliminaryPhaseStep(
  preliminary: PortalDossierDetail["preliminary"] | null | undefined,
): PreliminaryStep {
  if (!preliminary?.status) return PRELIMINARY_STEPS.START;
  return (
    STATUS_TO_PRELIMINARY_STEP[preliminary.status] ?? PRELIMINARY_STEPS.START
  );
}

/**
 * Get the color tone for a request status
 * Ensures consistent visual hierarchy across all status displays
 * @param status - The request status
 * @returns One of: neutral, info, success, warning
 */
export function getStatusTone(
  status: string,
): "neutral" | "info" | "success" | "warning" {
  return STATUS_TONES[status as keyof typeof STATUS_TONES] ?? "info";
}

/**
 * Get the display label for a request status
 * @param status - The request status
 * @returns French label for the postulant
 */
export function getRequestStatusLabel(status: string): string {
  return (
    REQUEST_STATUS_LABELS[status as keyof typeof REQUEST_STATUS_LABELS] ??
    "En cours de traitement"
  );
}

/**
 * Determine if a request/dossier requires user action
 * More precise than just checking one status
 * @param request - The request data
 * @param dossier - The dossier data (optional)
 * @returns true if action is required from the postulant
 */
export function shouldShowActionRequired(
  request: PortalRequest | null | undefined,
  dossier: PortalDossierDetail | null | undefined,
): boolean {
  if (!request) return false;

  // Primary action trigger: intake correction required
  if (ACTION_REQUIRED_STATUSES.has(request.status)) return true;

  // Secondary action trigger: preliminary form available and not completed
  if (
    dossier?.preliminary?.status === "pre_eval_form_available" &&
    !dossier?.preliminary?.hasCompletedForm
  ) {
    return true;
  }

  // Secondary action trigger: formal request courrier expected
  if (dossier?.formalRequest?.canUploadFormalRequestCourrier) {
    return true;
  }

  // Secondary action trigger: formal documents required
  if (dossier?.formalRequest?.status === "formal_requires_correction") {
    return true;
  }

  // Secondary action trigger: Phase III payment proof expected
  if (dossier?.documentEvaluation?.canUploadPaymentProof) {
    return true;
  }

  return false;
}

/**
 * Get a contextual action message for the dashboard
 * Describes what the postulant is waiting for or what they need to do
 * @param request - The request data
 * @param dossier - The dossier data (optional)
 * @returns French action message or empty string if no action
 */
export function getActionMessage(
  request: PortalRequest | null | undefined,
  dossier: PortalDossierDetail | null | undefined,
): string {
  if (!request) return "";

  // Intake correction required
  if (request.status === "intake_requires_correction") {
    return "Action requise: Corrections demandées";
  }

  // Preliminary form available
  if (
    dossier?.preliminary?.status === "pre_eval_form_available" &&
    !dossier?.preliminary?.hasCompletedForm
  ) {
    return "Action requise: Formulaire pré-évaluation à compléter";
  }

  // Formal request courrier expected
  if (dossier?.formalRequest?.canUploadFormalRequestCourrier) {
    return "Action requise: Demande formelle a televerser";
  }

  // Formal correction required
  if (dossier?.formalRequest?.status === "formal_requires_correction") {
    return "Action requise: Corrections demandées pour demande formelle";
  }

  // Phase III payment proof expected
  if (dossier?.documentEvaluation?.canUploadPaymentProof) {
    return "Action requise: Preuve de paiement a televerser";
  }

  return "";
}

/**
 * Get a contextual phase message for the dashboard
 * Describes what phase the request is in and what's happening
 * @param request - The request data
 * @param dossier - The dossier data (optional)
 * @returns French phase message or empty string
 */
export function getPhaseMessage(
  request: PortalRequest | null | undefined,
  dossier: PortalDossierDetail | null | undefined,
): string {
  if (!request || !dossier) return "";

  // In preliminary phase
  if (isPreliminaryPhaseActive(dossier)) {
    const prelimStatus = dossier.preliminary.status;

    if (prelimStatus === "preliminary_started") {
      return "Première réunion en attente de programmation";
    }
    if (prelimStatus?.includes("first_meeting")) {
      return "Première réunion en cours";
    }
    if (prelimStatus?.includes("pre_eval")) {
      return "Pré-évaluation en cours";
    }
    if (prelimStatus?.includes("preliminary_meeting")) {
      return "Réunion préliminaire en cours";
    }

    return getPreliminaryStatusLabel(prelimStatus);
  }

  // In formal request phase
  if (
    dossier.formalRequest?.status &&
    dossier.formalRequest.status !== "formal_closed"
  ) {
    return "Demande formelle en examen";
  }

  // In evaluation phase
  if (dossier.dossier?.status === "document_evaluation_phase") {
    return "Évaluation approfondie en cours";
  }

  if (dossier.dossier?.status === "inspection_phase") {
    return "Inspection en cours";
  }

  if (dossier.dossier?.status === "delivery_phase") {
    return "En attente de finalisation";
  }

  return "";
}

/**
 * Check if preliminary phase is waiting for a specific action
 * Used to determine what sub-message to show in the timeline
 * @param preliminary - The preliminary phase data
 * @returns true if waiting (not actively being processed)
 */
export function isPreliminaryWaiting(
  preliminary: PortalDossierDetail["preliminary"] | null | undefined,
): boolean {
  if (!preliminary?.status) return false;

  const waitingStatuses = new Set([
    "preliminary_started",
    "first_meeting_invited",
    "preliminary_meeting_invited",
    "preliminary_ready_to_close",
  ]);

  return waitingStatuses.has(preliminary.status);
}

