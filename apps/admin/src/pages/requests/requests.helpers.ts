import type {
  AdminDgReview,
  AdminRequest,
  AdminRequestStatus,
} from "../../lib/api/requests";
import {
  beforeDgStatuses,
  dgReturnCompleteStatuses,
  dgSignedAvailableStatuses,
  statusLabels,
} from "./requests.constants";
import { formatDate } from "./requests.utils";

// Get display label for a request's current status, considering special cases
export function getStatusLabel(request: AdminRequest): string {
  if (
    request.courrierSource === "physical_deposit" &&
    request.physicalDeposit?.status !== "received" &&
    request.status === "submitted"
  ) {
    return "Dépôt physique prévu";
  }
  if (
    request.courrierSource === "physical_deposit" &&
    request.physicalDeposit?.status === "received" &&
    beforeDgStatuses.includes(
      request.status as (typeof beforeDgStatuses)[number],
    )
  ) {
    return "Courrier physique reçu";
  }
  return statusLabels[request.status];
}

// Get badge variant for a request status
export function statusBadgeVariant(
  status: AdminRequestStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (
    status === "initial_sent_to_dg" ||
    status === "initial_dg_returned" ||
    status === "oriented_to_dn"
  )
    return "default";
  if (status === "intake_requires_correction" || status === "rejected")
    return "destructive";
  if (status === "intake_in_review") return "secondary";
  return "outline";
}

// Get list card left border accent color for status
export function listCardAccentBorder(status: AdminRequestStatus): string {
  if (
    status === "initial_dg_returned" ||
    status === "oriented_to_dn" ||
    status === "dossier_opened"
  )
    return "border-l-emerald-400";
  if (status === "intake_requires_correction" || status === "rejected")
    return "border-l-red-400";
  if (status === "initial_sent_to_dg") return "border-l-blue-400";
  if (status === "submitted" || status === "intake_in_review")
    return "border-l-amber-400";
  return "border-l-slate-300";
}

// Check if a request has supporting evidence (courrier or physical deposit)
export function hasEvidence(request: AdminRequest): boolean {
  if (request.courrierSource === "physical_deposit") {
    return Boolean(
      request.initialDocumentId &&
      request.physicalDeposit?.status === "received",
    );
  }
  return Boolean(
    request.initialDocumentId ||
    request.initialCourrierId ||
    request.physicalDeposit?.declaredAt,
  );
}

// Check if DG return is complete and signed document is available
export function isDgReturnComplete(
  request: AdminRequest,
  dgReview?: AdminDgReview,
): boolean {
  const review = dgReview ?? request.dgReview;
  return (
    dgReturnCompleteStatuses.includes(
      request.status as (typeof dgReturnCompleteStatuses)[number],
    ) &&
    (review?.status === "returned_scanned" ||
      review?.status === "decision_recorded") &&
    Boolean(review?.returnedScannedDocumentId)
  );
}

// Predicates for action availability

export function canOpenDossier(
  request: AdminRequest,
  dgReview?: AdminDgReview,
): boolean {
  return isDgReturnComplete(request, dgReview) && !request.dossierId;
}

export function canRequestCorrection(request: AdminRequest): boolean {
  return (
    request.status === "submitted" || request.status === "intake_in_review"
  );
}

export function canRegisterPhysical(request: AdminRequest): boolean {
  return (
    request.courrierSource === "physical_deposit" &&
    request.physicalDeposit?.status !== "received" &&
    beforeDgStatuses.includes(
      request.status as (typeof beforeDgStatuses)[number],
    )
  );
}

export function canMarkPrinted(request: AdminRequest): boolean {
  return (
    request.courrierSource !== "physical_deposit" &&
    hasEvidence(request) &&
    !request.intake?.printedForDgAt &&
    (request.status === "submitted" || request.status === "intake_in_review")
  );
}

export function canRecordDgReturn(request: AdminRequest): boolean {
  return request.status === "initial_sent_to_dg";
}

// Status check predicates

export function isAwaitingDgAction(request: AdminRequest): boolean {
  return request.status === "initial_sent_to_dg";
}

export function isDgSignedAvailable(request: AdminRequest): boolean {
  return dgSignedAvailableStatuses.includes(
    request.status as (typeof dgSignedAvailableStatuses)[number],
  );
}

export function isCancelledByDg(request: AdminRequest): boolean {
  return request.status === "rejected";
}
