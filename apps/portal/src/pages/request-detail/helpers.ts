import type { PortalDossierDetail } from "../../lib/api/dossiers";
import { PortalApiError } from "../../lib/api/http";
import type { PortalRequest } from "../../lib/api/requests";
import {
  getPreliminaryStatusLabel,
  isPreliminaryWaiting,
} from "./status.helpers";
import type { ProcessStep } from "./types";

export function getErrorMessage(caught: unknown): string {
  return caught instanceof PortalApiError
    ? caught.message
    : "Une erreur est survenue. Veuillez réessayer.";
}

export function buildProcessSteps(
  request: PortalRequest,
  isSubmitted: boolean,
  dossierDetail: PortalDossierDetail | null,
): ProcessStep[] {
  const hasDossier = !!request.dossierId;
  const prelimClosed =
    dossierDetail?.preliminary.status === "preliminary_closed";
  const formalClosed =
    dossierDetail?.formalRequest?.portalLabel ===
    "Phase de demande formelle clôturée";
  const dossierStatus = dossierDetail?.dossier?.status ?? "";
  const phase3Done = ["inspection_phase", "delivery_phase", "closed"].includes(
    dossierStatus,
  );
  const phase3Active = dossierStatus === "document_evaluation_phase";
  const prelimWaiting = isPreliminaryWaiting(dossierDetail?.preliminary);

  return [
    {
      id: "soumission",
      label: "Demande soumise",
      subtitle: isSubmitted
        ? "Votre demande a été reçue par l'ANAC."
        : "En cours de saisie.",
      state: isSubmitted ? "done" : "active",
    },
    {
      id: "orientation",
      label: "Orientation et ouverture du dossier",
      subtitle: hasDossier
        ? "Dossier ouvert à la Direction de la Navigabilité."
        : undefined,
      state: hasDossier ? "done" : isSubmitted ? "active" : "locked",
    },
    {
      id: "preliminaire",
      label: "Phase préliminaire",
      subtitle: prelimClosed
        ? "Phase préliminaire clôturée."
        : prelimWaiting && hasDossier
          ? getPreliminaryStatusLabel(dossierDetail?.preliminary.status ?? null)
          : undefined,
      state: prelimClosed ? "done" : hasDossier ? "active" : "locked",
    },
    {
      id: "formelle",
      label: "Phase de demande formelle",
      subtitle: formalClosed
        ? "Phase de demande formelle clôturée."
        : undefined,
      state: formalClosed ? "done" : prelimClosed ? "active" : "locked",
    },
    {
      id: "evaluation",
      label: "Phase III — Évaluation approfondie",
      subtitle: phase3Done ? "Évaluation approfondie finalisée." : undefined,
      state: phase3Done
        ? "done"
        : phase3Active || formalClosed
          ? "active"
          : "locked",
    },
  ];
}
