import { useCallback, useContext, useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext } from "@/contexts/AuthContext";
import {
  adminReviewFormalRequestDocument,
  downloadDossierDocument,
  getAdminFormalRequestPhase,
  type AdminDossierDetail,
  type AdminDossierDocumentEvidence,
  type AdminFormalRequestPhaseState,
  type AdminFormalRequestRequirement,
  type AdminOmaPhase,
} from "@/lib/api/dossiers.api";
import { hasPermission } from "@/lib/auth/permissions";
import { ApiError } from "@/lib/api/client";
import { openBlobInNewTab } from "@/lib/utils/blob";
import { extractError } from "@/lib/utils/error";
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

const formalSubmissionStatusLabels: Record<string, string> = {
  missing: "Manquant",
  submitted: "Déposé",
  under_review: "En revue",
  validated: "Validé",
  requires_correction: "Correction demandée",
  incomplete: "Incomplet",
  rejected: "Rejeté",
};

function FormalStatusBadge({ status }: { status: string }): React.JSX.Element {
  const label = formalSubmissionStatusLabels[status] ?? status;
  if (status === "validated") {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        {label}
      </Badge>
    );
  }
  if (status === "requires_correction" || status === "rejected") {
    return <Badge variant="destructive">{label}</Badge>;
  }
  if (status === "incomplete") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        {label}
      </Badge>
    );
  }
  if (status === "submitted" || status === "under_review") {
    return <Badge variant="secondary">{label}</Badge>;
  }
  return <Badge variant="outline">{label}</Badge>;
}

type ReviewPending = "validate" | "correction" | "incomplete" | null;

function Phase2RequirementRow({
  dossierId,
  req,
  isReviewable,
  canReview,
  downloadingId,
  onDownload,
  onReviewed,
}: {
  dossierId: string;
  req: AdminFormalRequestRequirement;
  isReviewable: boolean;
  canReview: boolean;
  downloadingId: string;
  onDownload: (dossierId: string, documentId: string) => void;
  onReviewed: () => void;
}): React.JSX.Element {
  const [reviewPending, setReviewPending] = useState<ReviewPending>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const activeSubmissions = req.submissions.filter(
    (s) => s.status !== "replaced" && s.status !== "archived",
  );
  const latestSubmission = activeSubmissions.sort(
    (a, b) => ((b.uploadedAt ?? "") > (a.uploadedAt ?? "") ? 1 : -1),
  )[0];

  const handleReview = async () => {
    if (!reviewPending || !latestSubmission) return;
    const needsComment = reviewPending === "correction" || reviewPending === "incomplete";
    if (needsComment && !reviewComment.trim()) return;
    const statusMap = { validate: "validated", correction: "requires_correction", incomplete: "incomplete" } as const;
    setReviewBusy(true);
    setReviewError("");
    try {
      await adminReviewFormalRequestDocument(latestSubmission.submissionId, {
        status: statusMap[reviewPending],
        comment: needsComment ? reviewComment.trim() : undefined,
      });
      setReviewPending(null);
      setReviewComment("");
      onReviewed();
    } catch (err) {
      setReviewError(extractError(err, "Impossible d'enregistrer la décision."));
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <li className="space-y-2 border-b py-3 last:border-b-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100">{req.label}</span>
            {req.formCode ? (
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {req.formCode}
              </span>
            ) : null}
            <FormalStatusBadge status={req.status} />
          </div>
          {activeSubmissions.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {activeSubmissions.length} dépôt{activeSubmissions.length !== 1 ? "s" : ""}
              {latestSubmission?.uploadedAt
                ? ` · Dernier : ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(latestSubmission.uploadedAt))}`
                : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Aucun fichier déposé.</p>
          )}
          {/* Correction / incomplete review note */}
          {isReviewable &&
          (req.status === "requires_correction" || req.status === "incomplete") &&
          latestSubmission?.reviewComment ? (
            <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Note DN : {latestSubmission.reviewComment}
            </p>
          ) : null}
        </div>

        {/* Download buttons */}
        {activeSubmissions.length > 0 ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {activeSubmissions.map((s) => (
              <Button
                key={s.submissionId}
                type="button"
                size="sm"
                variant="outline"
                disabled={downloadingId === s.documentId}
                onClick={() => onDownload(dossierId, s.documentId)}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {downloadingId === s.documentId ? "Téléchargement..." : "Télécharger"}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Inline review — only for oma_approval_form, only if file exists */}
      {isReviewable && canReview && latestSubmission && req.status !== "validated" ? (
        <div className="space-y-2 rounded-md border bg-muted/10 p-3">
          {reviewPending === null ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setReviewPending("validate")}
                disabled={reviewBusy}
              >
                Valider
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReviewPending("correction")} disabled={reviewBusy}>
                Demander correction
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReviewPending("incomplete")} disabled={reviewBusy}>
                Marquer incomplet
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {reviewPending === "validate"
                  ? "Confirmer la validation du formulaire DN-AIR-R2-3-F-E-010"
                  : reviewPending === "correction"
                    ? "Demander une correction"
                    : "Marquer le formulaire comme incomplet"}
              </p>
              {reviewPending !== "validate" ? (
                <div className="space-y-1">
                  <Label htmlFor={`review-comment-${req.requirementId}`} className="text-xs">
                    Commentaire (obligatoire)
                  </Label>
                  <Textarea
                    id={`review-comment-${req.requirementId}`}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={2}
                    className="text-sm"
                    placeholder="Indiquer ce qui est attendu ou incomplet…"
                  />
                </div>
              ) : null}
              {reviewError ? <p className="text-xs text-destructive">{reviewError}</p> : null}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleReview()}
                  disabled={reviewBusy || (reviewPending !== "validate" && !reviewComment.trim())}
                >
                  {reviewBusy ? "En cours…" : "Confirmer"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setReviewPending(null); setReviewComment(""); setReviewError(""); }}
                  disabled={reviewBusy}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}

function Phase2DocumentsCard({
  dossierId,
  formalState,
  canReview,
  downloadingId,
  onDownload,
  onReviewed,
}: {
  dossierId: string;
  formalState: AdminFormalRequestPhaseState;
  canReview: boolean;
  downloadingId: string;
  onDownload: (dossierId: string, documentId: string) => void;
  onReviewed: () => void;
}): React.JSX.Element {
  const nonGateReqs = formalState.requirements.filter((r) => r.requirementLevel !== "gate");
  const omaApprovalFormReq = nonGateReqs.find((r) => r.code === "oma_approval_form");
  const consultationReqs = nonGateReqs.filter((r) => r.code !== "oma_approval_form");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Phase 2 — Demande formelle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reviewable form */}
        {omaApprovalFormReq ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Formulaire soumis à décision DN
            </p>
            <ul>
              <Phase2RequirementRow
                dossierId={dossierId}
                req={omaApprovalFormReq}
                isReviewable={true}
                canReview={canReview}
                downloadingId={downloadingId}
                onDownload={onDownload}
                onReviewed={onReviewed}
              />
            </ul>
          </div>
        ) : null}

        {/* Consultation-only requirements */}
        {consultationReqs.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pièces consultatives
            </p>
            <ul>
              {consultationReqs.map((req) => (
                <Phase2RequirementRow
                  key={req.requirementId}
                  dossierId={dossierId}
                  req={req}
                  isReviewable={false}
                  canReview={false}
                  downloadingId={downloadingId}
                  onDownload={onDownload}
                  onReviewed={onReviewed}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DossierDocumentsTab({
  detail,
  dossierId,
}: {
  detail: AdminDossierDetail;
  dossierId: string;
}): React.JSX.Element {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const canReview = hasPermission(user, "DOCUMENT_REVIEW");

  const [downloadingId, setDownloadingId] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [formalState, setFormalState] = useState<AdminFormalRequestPhaseState | null>(null);

  const loadFormalPhase = useCallback(async () => {
    try {
      const state = await getAdminFormalRequestPhase(dossierId);
      setFormalState(state);
    } catch {
      // Phase 2 not started — no-op
    }
  }, [dossierId]);

  useEffect(() => {
    void loadFormalPhase();
  }, [loadFormalPhase]);

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

      {formalState ? (
        <Phase2DocumentsCard
          dossierId={dossierId}
          formalState={formalState}
          canReview={canReview}
          downloadingId={downloadingId}
          onDownload={(did, docId) => void handleDownload(did, docId)}
          onReviewed={() => void loadFormalPhase()}
        />
      ) : null}
    </div>
  );
}
