export type EvidenceReviewStatus =
  | 'missing'
  | 'available'
  | 'under_review'
  | 'validated'
  | 'rejected'
  | 'requires_correction'
  | 'optional';

export type EvidenceRequirement = {
  key: string;
  label: string;
  phaseKey: 'preliminary';
  requiredForClosure: boolean;
  documentField?: string;
  meetingField?: string;
  visibleToPostulantDefault?: boolean;
  submittedDocumentId?: string;
  reviewStatus?: EvidenceReviewStatus;
};

export const PRELIMINARY_EVIDENCE_REQUIREMENTS: EvidenceRequirement[] = [
  {
    key: 'first_meeting',
    label: 'Première réunion',
    phaseKey: 'preliminary',
    requiredForClosure: true,
    meetingField: 'firstMeetingId',
    visibleToPostulantDefault: false,
  },
  {
    key: 'first_meeting_report',
    label: 'Compte rendu première réunion',
    phaseKey: 'preliminary',
    requiredForClosure: true,
    documentField: 'firstMeetingReportDocument',
    visibleToPostulantDefault: false,
  },
  {
    key: 'pre_eval_blank_form',
    label: 'Formulaire de pré-évaluation vierge',
    phaseKey: 'preliminary',
    requiredForClosure: true,
    documentField: 'preEvaluationTemplateDocument',
    visibleToPostulantDefault: true,
  },
  {
    key: 'pre_eval_completed_form',
    label: 'Formulaire de pré-évaluation complété',
    phaseKey: 'preliminary',
    requiredForClosure: true,
    documentField: 'completedPreEvaluationDocument',
    visibleToPostulantDefault: false,
  },
  {
    key: 'pre_eval_dg_return',
    label: 'Retour DG pré-évaluation',
    phaseKey: 'preliminary',
    requiredForClosure: true,
    documentField: 'preEvaluationDgAnnotatedDocument',
    visibleToPostulantDefault: false,
  },
  {
    key: 'preliminary_meeting',
    label: 'Réunion préliminaire',
    phaseKey: 'preliminary',
    requiredForClosure: true,
    meetingField: 'preliminaryMeetingId',
    visibleToPostulantDefault: false,
  },
  {
    key: 'preliminary_meeting_report',
    label: 'Compte rendu réunion préliminaire',
    phaseKey: 'preliminary',
    requiredForClosure: true,
    documentField: 'preliminaryMeetingReportDocument',
    visibleToPostulantDefault: false,
  },
  {
    key: 'closure_courrier',
    label: 'Courrier de clôture phase préliminaire',
    phaseKey: 'preliminary',
    requiredForClosure: false,
    documentField: 'closureCourrierDocument',
    visibleToPostulantDefault: true,
  },
];
