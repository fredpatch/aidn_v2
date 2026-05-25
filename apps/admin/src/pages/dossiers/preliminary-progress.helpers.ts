import type { AdminOmaPhase, PreliminaryStatus } from "@/lib/api/dossiers.api";

export type PreliminaryStep = {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
};

export type PreliminaryProgress = {
  steps: PreliminaryStep[];
  doneCount: number;
  totalCount: number;
  currentStep?: PreliminaryStep;
  nextActionLabel?: string;
};

const STATUSES_PAST_DG_SEND: PreliminaryStatus[] = [
  "pre_eval_sent_to_dg",
  "pre_eval_dg_decision_recorded",
  "preliminary_meeting_invited",
  "preliminary_meeting_held",
  "preliminary_ready_to_close",
  "preliminary_closed",
];

const NEXT_ACTION_LABELS: Record<string, string> = {
  first_meeting_invited: "Planifier la première réunion de contact",
  first_meeting_held: "Joindre le compte rendu de première réunion",
  pre_eval_form_available: "Mettre le formulaire pré-évaluation à disposition",
  pre_eval_sent_to_dg: "Mettre en circuit officiel DG",
  pre_eval_dg_decision_recorded: "Enregistrer le retour DG annoté",
  preliminary_meeting_invited: "Planifier la réunion préliminaire",
  preliminary_meeting_held: "Joindre le compte rendu de réunion préliminaire",
  preliminary_closed: "Clôturer la phase préliminaire",
};

export function getPreliminaryProgress(
  phase: AdminOmaPhase,
): PreliminaryProgress {
  const ps = phase.preliminaryStatus;

  const steps: PreliminaryStep[] = [
    {
      key: "opened",
      label: "Dossier ouvert après orientation DG",
      done: true,
      current: false,
    },
    {
      key: "first_meeting_invited",
      label: "Première réunion de contact planifiée",
      done: Boolean(phase.firstMeetingId),
      current:
        ps === null ||
        ps === "preliminary_not_started" ||
        ps === "preliminary_started",
    },
    {
      key: "first_meeting_held",
      label: "Compte rendu première réunion joint",
      done: Boolean(phase.firstMeetingReportDocumentId),
      current: ps === "first_meeting_invited",
    },
    {
      key: "pre_eval_form_available",
      label: "Formulaire pré-évaluation mis à disposition",
      done: Boolean(phase.preEvaluationTemplateDocumentId),
      current: ps === "first_meeting_held",
    },
    {
      key: "pre_eval_form_submitted",
      label: "Formulaire pré-évaluation complété reçu",
      done: Boolean(phase.completedPreEvaluationDocumentId),
      current: ps === "pre_eval_form_available",
    },
    {
      key: "pre_eval_sent_to_dg",
      label: "Pré-évaluation mise en circuit DG",
      done: ps ? STATUSES_PAST_DG_SEND.includes(ps) : false,
      current: ps === "pre_eval_form_submitted",
    },
    {
      key: "pre_eval_dg_decision_recorded",
      label: "Retour DG pré-évaluation enregistré",
      done: Boolean(phase.preEvaluationDgAnnotatedDocumentId),
      current: ps === "pre_eval_sent_to_dg",
    },
    {
      key: "preliminary_meeting_invited",
      label: "Réunion préliminaire planifiée",
      done: Boolean(phase.preliminaryMeetingId),
      current: ps === "pre_eval_dg_decision_recorded",
    },
    {
      key: "preliminary_meeting_held",
      label: "Compte rendu réunion préliminaire joint",
      done: Boolean(phase.preliminaryMeetingReportDocumentId),
      current: ps === "preliminary_meeting_invited",
    },
    {
      key: "preliminary_closed",
      label: "Phase préliminaire clôturée",
      done: ps === "preliminary_closed",
      current:
        ps === "preliminary_meeting_held" || ps === "preliminary_ready_to_close",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const currentStep = steps.find((s) => s.current);
  const nextActionLabel = currentStep
    ? NEXT_ACTION_LABELS[currentStep.key]
    : undefined;

  return { steps, doneCount, totalCount, currentStep, nextActionLabel };
}
