import { getRequestTypeLabel } from "../../components/RequestTypeLabel";
import type { PortalRequestType } from "../../lib/api/requests";
import type { RequestDetailTab } from "./types";

export const requestTypeOptions: Array<{
  value: PortalRequestType;
  label: string;
}> = [
  { value: "oma_approval", label: getRequestTypeLabel("oma_approval") },
  { value: "oma_recognition", label: getRequestTypeLabel("oma_recognition") },
  { value: "oma_renewal", label: getRequestTypeLabel("oma_renewal") },
  { value: "oma_modification", label: getRequestTypeLabel("oma_modification") },
];

export const locationOptions = [
  { value: "ANAC", label: "ANAC" },
  { value: "DG", label: "DG" },
  { value: "DN", label: "DN" },
  { value: "other", label: "Autre" },
] as const;

export const dossierTypeLabels: Record<string, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

export const portalStatusGuidance: Record<string, string> = {
  "En cours de traitement par l'ANAC":
    "Votre dossier est en cours de traitement par l'ANAC.",
  "Dossier en cours de traitement":
    "Votre dossier est en cours de traitement par l'ANAC.",
  "Rendez-vous programmé":
    "Un rendez-vous a été programmé. Votre correspondant ANAC vous contactera avec les détails.",
  "Formulaire de pré-évaluation à compléter":
    "Un formulaire de pré-évaluation est disponible. Téléchargez-le, complétez-le et soumettez-le dans l'onglet Actions requises.",
  "En cours d'examen":
    "Votre dossier est en cours d'examen par l'ANAC.",
  "Rendez-vous préliminaire programmé":
    "La réunion préliminaire a été programmée. Votre correspondant ANAC vous contactera.",
  "Phase préliminaire en cours de clôture":
    "La phase préliminaire est en cours de finalisation.",
  "Phase préliminaire clôturée":
    "La phase préliminaire est clôturée.",
  "Demande formelle attendue":
    "La demande formelle doit être téléversée pour poursuivre le traitement.",
  "Demande formelle reçue":
    "Votre demande formelle a été reçue par l'ANAC.",
  "Demande formelle en cours d'examen":
    "Votre demande formelle est en cours d'examen par l'ANAC.",
  "Réunion formelle programmée":
    "La réunion formelle a été programmée. Votre correspondant ANAC vous contactera avec les détails.",
  "Documents de demande formelle à compléter":
    "Des documents de demande formelle sont attendus pour poursuivre le traitement.",
  "En attente de finalisation par l'ANAC":
    "Votre demande formelle est en attente de finalisation par l'ANAC.",
  "Phase de demande formelle clôturée":
    "La phase de demande formelle est clôturée.",
  "Action requise": "Une action est attendue de votre part.",
};

export const REQ_STATUS_LABELS: Record<string, string> = {
  missing: "Manquant",
  submitted: "Déposé",
  under_review: "En revue",
  validated: "Validé",
  requires_correction: "Correction demandée",
  incomplete: "Incomplet",
  rejected: "Rejeté",
};

export const REQ_STATUS_CLASSES: Record<string, string> = {
  missing: "bg-slate-100 text-slate-600",
  submitted: "bg-sky-100 text-sky-700",
  under_review: "bg-amber-100 text-amber-700",
  validated: "bg-emerald-100 text-emerald-700",
  requires_correction: "bg-red-100 text-red-700",
  incomplete: "bg-amber-100 text-amber-700",
  rejected: "bg-red-200 text-red-800",
};

export const TABS: Array<{ key: RequestDetailTab; label: string }> = [
  { key: "resume", label: "Résumé" },
  { key: "courrier", label: "Courrier initial" },
  { key: "actions", label: "Actions requises" },
  { key: "dossier", label: "Dossier" },
  { key: "historique", label: "Historique" },
];
