import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadDossierDocument,
  type AdminDossierDetail,
  type AdminDossierDocumentEvidence,
  type AdminOmaPhase,
} from "@/lib/api/dossiers.api";
import { ApiError } from "@/lib/api/client";
import { openBlobInNewTab } from "@/lib/utils/blob";
import { ActionError } from "./dossier-detail.helpers";

type PreliminaryDocumentField =
  | "firstMeetingReportDocumentId"
  | "preEvaluationTemplateDocumentId"
  | "completedPreEvaluationDocumentId"
  | "preEvaluationDgAnnotatedDocumentId"
  | "preliminaryMeetingReportDocumentId"
  | "closureCourrierDocumentId";

type PreliminaryEvidenceKey =
  | "firstMeetingReportDocument"
  | "preEvaluationTemplateDocument"
  | "completedPreEvaluationDocument"
  | "preEvaluationDgAnnotatedDocument"
  | "preliminaryMeetingReportDocument"
  | "closureCourrierDocument";

type PreliminaryDocumentDefinition = {
  field: PreliminaryDocumentField;
  evidenceKey: PreliminaryEvidenceKey;
  label: string;
  optional?: boolean;
};

const PRELIMINARY_DOCUMENTS: PreliminaryDocumentDefinition[] = [
  {
    field: "firstMeetingReportDocumentId",
    evidenceKey: "firstMeetingReportDocument",
    label: "Compte rendu - 1ère réunion",
  },
  {
    field: "preEvaluationTemplateDocumentId",
    evidenceKey: "preEvaluationTemplateDocument",
    label: "Formulaire pré-évaluation - modèle",
  },
  {
    field: "completedPreEvaluationDocumentId",
    evidenceKey: "completedPreEvaluationDocument",
    label: "Formulaire pré-évaluation - soumis",
  },
  {
    field: "preEvaluationDgAnnotatedDocumentId",
    evidenceKey: "preEvaluationDgAnnotatedDocument",
    label: "Retour DG annoté",
  },
  {
    field: "preliminaryMeetingReportDocumentId",
    evidenceKey: "preliminaryMeetingReportDocument",
    label: "Compte rendu - réunion préliminaire",
  },
  {
    field: "closureCourrierDocumentId",
    evidenceKey: "closureCourrierDocument",
    label: "Courrier de clôture phase I",
    optional: true,
  },
];

const visibilityLabels: Record<string, string> = {
  internal_only: "Interne uniquement",
  postulant_visible: "Visible postulant",
};

const formatUploadedAt = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
};


function DocumentStatusBadge({
  documentId,
  optional,
}: {
  documentId?: string;
  optional?: boolean;
}): React.JSX.Element {
  if (documentId) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        Disponible
      </Badge>
    );
  }
  if (optional) {
    return <Badge variant="outline">Optionnel</Badge>;
  }
  return <Badge variant="secondary">Manquant</Badge>;
}

function VisibilityBadge({ visibility }: { visibility?: string }): React.JSX.Element | null {
  if (!visibility) return null;
  const label = visibilityLabels[visibility] ?? visibility;
  if (visibility === "postulant_visible") {
    return (
      <Badge
        variant="outline"
        className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200"
      >
        {label}
      </Badge>
    );
  }
  return <Badge variant="outline">{label}</Badge>;
}

function PhaseDocumentRow({
  dossierId,
  phase,
  evidence,
  definition,
  downloadingId,
  onDownload,
}: {
  dossierId: string;
  phase: AdminOmaPhase | null;
  evidence: AdminDossierDocumentEvidence | null | undefined;
  definition: PreliminaryDocumentDefinition;
  downloadingId: string;
  onDownload: (dossierId: string, documentId: string) => void;
}): React.JSX.Element {
  const documentId = phase?.[definition.field];
  const isDownloading = Boolean(documentId) && downloadingId === documentId;
  const uploadedDate = formatUploadedAt(evidence?.uploadedAt);

  return (
    <li className="flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {definition.label}
          </span>
          <DocumentStatusBadge
            documentId={documentId}
            optional={definition.optional}
          />
          {evidence ? <VisibilityBadge visibility={evidence.visibility} /> : null}
        </div>
        {evidence && uploadedDate ? (
          <p className="text-xs text-muted-foreground">
            Déposé le {uploadedDate}
          </p>
        ) : null}
        {!documentId ? (
          <p className="text-xs text-muted-foreground">
            {definition.optional
              ? "Document optionnel non joint."
              : "Aucun document lié à ce dossier pour le moment."}
          </p>
        ) : null}
      </div>

      {documentId ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          disabled={isDownloading}
          onClick={() => onDownload(dossierId, documentId)}
        >
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {isDownloading ? "Téléchargement..." : "Télécharger"}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Non disponible</span>
      )}
    </li>
  );
}

export function DossierDocumentsTab({
  detail,
}: {
  detail: AdminDossierDetail;
}): React.JSX.Element {
  const [downloadingId, setDownloadingId] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const preliminaryPhase = detail.preliminary?.phase ?? null;
  const documentEvidence = detail.preliminary?.documentEvidence ?? null;

  const handleDownload = async (dossierId: string, documentId: string) => {
    setDownloadingId(documentId);
    setDownloadError("");
    try {
      const { blob, fileName } = await downloadDossierDocument(
        dossierId,
        documentId,
      );
      openBlobInNewTab(blob, fileName);
    } catch (err) {
      setDownloadError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Documents du dossier
        </h2>
        <p className="text-sm text-muted-foreground">
          Documents et preuves liés aux phases OMA du dossier.
        </p>
      </div>

      {downloadError ? <ActionError message={downloadError} /> : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Phase préliminaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {PRELIMINARY_DOCUMENTS.map((definition) => (
              <PhaseDocumentRow
                key={definition.field}
                dossierId={detail.dossier.id}
                phase={preliminaryPhase}
                evidence={documentEvidence?.[definition.evidenceKey]}
                definition={definition}
                downloadingId={downloadingId}
                onDownload={(dossierId, documentId) =>
                  void handleDownload(dossierId, documentId)
                }
              />
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
