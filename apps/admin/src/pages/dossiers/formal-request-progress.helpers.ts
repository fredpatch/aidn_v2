import type { AdminFormalRequestPhaseState } from "@/lib/api/dossiers.api";

export type FormalRequestStep = {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
};

const SENT_OR_AFTER = new Set([
  "formal_sent_to_dg",
  "formal_dg_returned",
  "formal_dg_decision_recorded",
  "formal_meeting_invited",
  "formal_meeting_held",
  "formal_recevability_recorded",
  "formal_ready_to_close",
  "formal_requires_correction",
  "formal_closed",
]);

const RETURN_OR_AFTER = new Set([
  "formal_dg_returned",
  "formal_dg_decision_recorded",
  "formal_meeting_invited",
  "formal_meeting_held",
  "formal_recevability_recorded",
  "formal_ready_to_close",
  "formal_requires_correction",
  "formal_closed",
]);

const DECISION_OR_AFTER = new Set([
  // MVP: formal_dg_returned is treated as decision-available (scan = evidence)
  "formal_dg_returned",
  "formal_dg_decision_recorded",
  "formal_meeting_invited",
  "formal_meeting_held",
  "formal_recevability_recorded",
  "formal_ready_to_close",
  "formal_requires_correction",
  "formal_closed",
]);

const MEETING_PROGRAMMED_OR_AFTER = new Set([
  "formal_meeting_invited",
  "formal_meeting_held",
  "formal_recevability_recorded",
  "formal_ready_to_close",
  "formal_closed",
]);

const MEETING_HELD_OR_AFTER = new Set([
  "formal_meeting_held",
  "formal_recevability_recorded",
  "formal_ready_to_close",
  "formal_closed",
]);

export function getFormalRequestProgress(
  state: AdminFormalRequestPhaseState | null,
): { steps: FormalRequestStep[]; doneCount: number; totalCount: number; currentStep: FormalRequestStep | null } {
  const status = state?.phase.formalRequestStatus ?? "";
  const closureEvidence = Boolean(
    state?.closure.recevabilityCourrierDocumentId ||
      state?.closure.phaseClosureCourrierDocumentId,
  );

  const rawSteps = [
    {
      key: "courrier_received",
      label: "Courrier de demande formelle reçu",
      done: Boolean(state?.gate.exists),
    },
    {
      key: "sent_to_dg",
      label: "Demande formelle transmise au circuit DG",
      done: SENT_OR_AFTER.has(status),
    },
    {
      key: "dg_return_recorded",
      label: "Retour DG enregistré",
      done: RETURN_OR_AFTER.has(status),
    },
    {
      key: "meeting_scheduled",
      label: "Réunion formelle programmée",
      done: Boolean(state?.meeting) || MEETING_PROGRAMMED_OR_AFTER.has(status),
    },
    {
      key: "meeting_held",
      label: "Réunion formelle tenue",
      done:
        state?.meeting?.status === "held" ||
        MEETING_HELD_OR_AFTER.has(status),
    },
    {
      key: "closure_evidence",
      label: "Courrier de recevabilité / clôture joint",
      done: closureEvidence,
    },
    {
      key: "phase_closed",
      label: "Phase 2 clôturée",
      done: status === "formal_closed" || state?.phase.status === "closed",
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

export function hasFormalDgDecision(state: AdminFormalRequestPhaseState): boolean {
  return DECISION_OR_AFTER.has(state.phase.formalRequestStatus ?? "");
}

// ── Progressive reveal visibility ─────────────────────────────────────────────

export type FormalRequestVisibility = {
  /** Always true — formal request gate is the entry step */
  showFormalRequestGate: true;
  /** Show supporting document checklist once formal request exists */
  showSupportingDocuments: boolean;
  /** Show formal meeting section once DG return/decision is available */
  showFormalMeeting: boolean;
  /** Show meeting report badge once a report document is attached */
  showMeetingReport: boolean;
  /** Show closure evidence section once meeting is held or closure docs exist */
  showClosureEvidence: boolean;
};

/**
 * Derive which Phase 2 workspace sections are currently relevant.
 * All logic is frontend-only — no backend changes required.
 */
export function getFormalRequestVisibility(
  state: AdminFormalRequestPhaseState,
): FormalRequestVisibility {
  const status = state.phase.formalRequestStatus ?? "";

  // DG circuit has been reached (formal request sent to DG or further)
  const hasFormalDgCircuit = SENT_OR_AFTER.has(status);

  // A meeting object exists in state
  const hasFormalMeeting = Boolean(state.meeting);

  // Meeting has an attached report
  const hasMeetingReport = Boolean(state.meeting?.reportDocumentId);

  // Meeting was held
  const meetingHeld =
    state.meeting?.status === "held" || MEETING_HELD_OR_AFTER.has(status);

  // Closure or recevability courrier has been recorded
  const hasClosureEvidence = Boolean(
    state.closure.recevabilityCourrierDocumentId ||
      state.closure.phaseClosureCourrierDocumentId,
  );

  return {
    showFormalRequestGate: true,
    // Checklist only useful once the formal dossier exists
    showSupportingDocuments: state.gate.exists,
    // Meeting section becomes relevant once DG return scan unlocks it
    showFormalMeeting: hasFormalDgCircuit || hasFormalMeeting,
    // Report badge shown once report is attached (or meeting held = report expected)
    showMeetingReport: hasMeetingReport,
    // Closure section shown once meeting is held so DN knows next step
    showClosureEvidence: meetingHeld || hasClosureEvidence || status === "formal_closed",
  };
}
