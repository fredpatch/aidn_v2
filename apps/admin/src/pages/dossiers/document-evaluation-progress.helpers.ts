import type {
  AdminDocumentEvaluationItem,
  AdminDocumentEvaluationPaymentState,
  AdminDocumentEvaluationState,
  DocumentEvaluationStatus,
  PhasePaymentStatus,
} from "@/lib/api/dossiers";

export type DocEvalStep = {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
};

export type DocEvalProgress = {
  steps: DocEvalStep[];
  doneCount: number;
  totalCount: number;
  currentStep: DocEvalStep | null;
};

export type DocEvalVisibility = {
  showPayment: true;
  showInvoiceUpload: boolean;
  showProofState: boolean;
  showEvaluationBoard: boolean;
  showCorrections: boolean;
  showClose: boolean;
};

export function getDocumentEvaluationProgress(
  paymentState: AdminDocumentEvaluationPaymentState | null,
  evalState: AdminDocumentEvaluationState | null,
): DocEvalProgress {
  const docEvalStatus = paymentState?.phase.documentEvaluationStatus ?? null;
  const invoiceExists = Boolean(paymentState?.payment.invoiceDocumentId);
  const paymentValidated = paymentState?.canStartDocumentEvaluation ?? false;
  const evalTotal = evalState?.progress.total ?? 0;

  const correctionSubmitted = evalState
    ? evalState.evaluations.filter((e) => e.status === "correction_submitted").length
    : 0;
  const nonSatisfaisant = evalState?.progress.nonSatisfaisant ?? 0;
  const isClosed = docEvalStatus === "document_evaluation_closed";
  const isReadyToClose =
    docEvalStatus === "document_evaluation_ready_to_close" || isClosed;
  const correctionsResolved =
    evalTotal > 0 && nonSatisfaisant === 0 && correctionSubmitted === 0;

  const rawSteps = [
    {
      key: "formal_closed",
      label: "Phase 2 clôturée",
      done: Boolean(paymentState?.phase),
    },
    {
      key: "invoice_sent",
      label: "Facture S5 téléversée",
      done: invoiceExists,
    },
    {
      key: "payment_received",
      label: "Paiement validé",
      done: paymentValidated,
    },
    {
      key: "evaluation_started",
      label: "Évaluation documentaire en cours",
      done: evalTotal > 0,
    },
    {
      key: "corrections_resolved",
      label: "Corrections résolues",
      done: correctionsResolved || isReadyToClose,
    },
    {
      key: "ready_to_close",
      label: "Prête à clôturer",
      done: isReadyToClose,
    },
    {
      key: "phase_closed",
      label: "Phase III clôturée",
      done: isClosed,
    },
  ];

  const currentIdx = rawSteps.findIndex((step) => !step.done);
  const steps = rawSteps.map((step, index) => ({
    ...step,
    current: currentIdx === index,
  }));

  return {
    steps,
    doneCount: steps.filter((step) => step.done).length,
    totalCount: steps.length,
    currentStep: currentIdx === -1 ? null : steps[currentIdx],
  };
}

export function getDocumentEvaluationVisibility(
  paymentState: AdminDocumentEvaluationPaymentState | null,
  evalState: AdminDocumentEvaluationState | null,
): DocEvalVisibility {
  const invoiceDocumentId = paymentState?.payment.invoiceDocumentId ?? null;
  const proofDocumentId = paymentState?.payment.paymentProofDocumentId ?? null;
  const docEvalStatus = paymentState?.phase.documentEvaluationStatus ?? null;
  const isClosed = docEvalStatus === "document_evaluation_closed";

  const hasCorrections = evalState
    ? evalState.evaluations.some(
        (e) =>
          e.status === "non_satisfaisant" || e.status === "correction_submitted",
      )
    : false;

  return {
    showPayment: true,
    showInvoiceUpload: !invoiceDocumentId && !isClosed,
    showProofState: Boolean(invoiceDocumentId),
    showEvaluationBoard: Boolean(proofDocumentId),
    showCorrections: hasCorrections,
    showClose: docEvalStatus === "document_evaluation_ready_to_close",
  };
}

export function getDocumentEvaluationReviewBadgeVariant(
  status: DocumentEvaluationStatus,
): "secondary" | "outline" | "destructive" {
  if (status === "satisfaisant") return "outline";
  if (status === "non_satisfaisant") return "destructive";
  return "secondary";
}

export function getDocumentEvaluationReviewBadgeClass(
  status: DocumentEvaluationStatus,
): string {
  if (status === "satisfaisant") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  }
  if (status === "correction_submitted") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
  }
  return "";
}

export function getPhasePaymentStatusBadgeVariant(
  status: PhasePaymentStatus | string,
): "secondary" | "outline" {
  if (
    status === "invoice_sent" ||
    status === "payment_proof_submitted" ||
    status === "payment_proof_validated" ||
    status === "payment_proof_rejected"
  ) {
    return "outline";
  }
  return "secondary";
}

export function getPhasePaymentStatusBadgeClass(
  status: PhasePaymentStatus | string,
): string {
  if (status === "payment_proof_validated") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  }
  if (status === "payment_proof_rejected") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
  }
  if (status === "payment_proof_submitted" || status === "invoice_sent") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
  }
  return "";
}

export function hasPendingCorrections(
  evaluations: AdminDocumentEvaluationItem[],
): boolean {
  return evaluations.some(
    (e) =>
      e.status === "non_satisfaisant" || e.status === "correction_submitted",
  );
}
