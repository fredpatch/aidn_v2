import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadDossierDocument,
  type AdminDossierDetail,
} from "@/lib/api/dossiers.api";
import { downloadRequestOrientationDocument } from "@/lib/api/requests.api";
import { ApiError } from "@/lib/api/client";
import { openBlobInNewTab } from "@/lib/utils/blob";
import { ActionError } from "./dossier-detail.helpers";

type CourrierRow = {
  key: string;
  label: string;
  typeLabel: string;
  documentId?: string;
  requestId?: string;
  date?: string;
  reference?: string;
  decision?: string;
  observations?: string;
  optional?: boolean;
  source: "request" | "dossier" | "none";
};

type CourrierSection = {
  title: string;
  rows: CourrierRow[];
};

const sourceLabels: Record<string, string> = {
  portal_upload: "Portail",
  physical_deposit: "Dépôt physique",
  internal_scan: "Scan interne",
  generated_from_template: "Généré",
};

const decisionLabels: Record<string, string> = {
  oriented_to_dn: "Orienté vers DN",
  approved: "Approuvé",
  rejected: "Rejeté",
  reoriented: "Réorienté",
  pending: "En attente",
};


const formatDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
};

function StatusBadge({
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

function buildSections(detail: AdminDossierDetail): CourrierSection[] {
  const initialCourrier = detail.courriers?.initialCourrier;
  const initialDgOrientation = detail.courriers?.initialDgOrientation;
  const preliminaryPhase = detail.preliminary?.phase;

  return [
    {
      title: "Demande initiale",
      rows: [
        {
          key: "initial_courrier",
          label: "Courrier initial transmis",
          typeLabel: "Initial",
          documentId: initialCourrier?.documentId,
          requestId: initialCourrier?.requestId,
          date: initialCourrier?.date,
          reference:
            initialCourrier?.reference ??
            (initialCourrier?.source
              ? sourceLabels[initialCourrier.source] ?? initialCourrier.source
              : undefined),
          source:
            initialCourrier?.documentId && initialCourrier.requestId
              ? "request"
              : "none",
        },
        {
          key: "initial_dg_orientation",
          label: "Retour DG orientation initiale",
          typeLabel: "Orientation DG",
          documentId: initialDgOrientation?.documentId,
          requestId: initialDgOrientation?.requestId,
          date: initialDgOrientation?.returnedAt,
          decision: initialDgOrientation?.decision,
          observations: initialDgOrientation?.observations,
          source:
            initialDgOrientation?.documentId && initialDgOrientation.requestId
              ? "request"
              : "none",
        },
      ],
    },
    {
      title: "Phase préliminaire",
      rows: [
        {
          key: "pre_eval_dg_return",
          label: "Retour DG pré-évaluation",
          typeLabel: "Pré-évaluation",
          documentId: preliminaryPhase?.preEvaluationDgAnnotatedDocumentId,
          source: preliminaryPhase?.preEvaluationDgAnnotatedDocumentId
            ? "dossier"
            : "none",
        },
        {
          key: "closure_courrier",
          label: "Courrier de clôture phase I — optionnel",
          typeLabel: "Optionnel",
          documentId: preliminaryPhase?.closureCourrierDocumentId,
          optional: true,
          source: preliminaryPhase?.closureCourrierDocumentId
            ? "dossier"
            : "none",
        },
      ],
    },
  ];
}

function CourrierRowItem({
  row,
  dossierId,
  downloadingKey,
  onDownload,
}: {
  row: CourrierRow;
  dossierId: string;
  downloadingKey: string;
  onDownload: (row: CourrierRow, dossierId: string) => void;
}): React.JSX.Element {
  const isDownloadable = Boolean(row.documentId && row.source !== "none");
  const isDownloading = downloadingKey === row.key;
  const dateLabel = formatDate(row.date);
  const decision = row.decision
    ? decisionLabels[row.decision] ?? row.decision
    : undefined;

  return (
    <li className="flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {row.label}
          </span>
          <Badge variant="outline">{row.typeLabel}</Badge>
          <StatusBadge documentId={row.documentId} optional={row.optional} />
        </div>
        <p className="text-xs text-muted-foreground">
          {[
            dateLabel,
            row.reference ? `Référence : ${row.reference}` : undefined,
            decision ? `Décision : ${decision}` : undefined,
            row.observations ? `Observations: ${row.observations}` : undefined,
          ]
            .filter(Boolean)
            .join(" · ") ||
            (row.optional
              ? "Document optionnel non joint."
              : "Non disponible pour le moment.")}
        </p>
      </div>

      {isDownloadable ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          disabled={isDownloading}
          onClick={() => onDownload(row, dossierId)}
        >
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {isDownloading ? "Téléchargement..." : "Télécharger"}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">
          {row.optional ? "Non joint" : "Non disponible"}
        </span>
      )}
    </li>
  );
}

export function DossierCourriersTab({
  detail,
}: {
  detail: AdminDossierDetail;
}): React.JSX.Element {
  const [downloadingKey, setDownloadingKey] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const sections = useMemo(() => buildSections(detail), [detail]);

  const handleDownload = async (row: CourrierRow, dossierId: string) => {
    if (!row.documentId) return;

    setDownloadingKey(row.key);
    setDownloadError("");
    try {
      const result =
        row.source === "request" && row.requestId
          ? await downloadRequestOrientationDocument(row.requestId, row.documentId)
          : await downloadDossierDocument(dossierId, row.documentId);
      openBlobInNewTab(result.blob, result.fileName);
    } catch (err) {
      setDownloadError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setDownloadingKey("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Courriers du dossier
        </h2>
        <p className="text-sm text-muted-foreground">
          Courriers officiels, orientations DG et traces liées au dossier.
        </p>
      </div>

      {downloadError ? <ActionError message={downloadError} /> : null}

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {section.rows.map((row) => (
                <CourrierRowItem
                  key={row.key}
                  row={row}
                  dossierId={detail.dossier.id}
                  downloadingKey={downloadingKey}
                  onDownload={(nextRow, dossierId) =>
                    void handleDownload(nextRow, dossierId)
                  }
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Phases suivantes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Les courriers des phases suivantes seront affichés ici lorsqu'ils
          seront disponibles.
        </CardContent>
      </Card>
    </div>
  );
}
