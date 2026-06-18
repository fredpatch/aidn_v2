import { ChevronDown, ChevronUp, Download, Upload } from "lucide-react";

import type { PortalFormalRequestRequirement } from "../../lib/api/formal-request";
import { REQ_STATUS_CLASSES, REQ_STATUS_LABELS } from "./constants";

type Phase2DocumentChecklistProps = {
  requirements: PortalFormalRequestRequirement[];
  progress: {
    totalTracked: number;
    submitted: number;
    validated: number;
    missing: number;
  };
  expandedRequirementId: string | null;
  reqUploadFile: File | null;
  reqUploadNotes: string;
  reqUploadBusy: boolean;
  reqUploadError: string;
  reqUploadFileRef: React.RefObject<HTMLInputElement | null>;
  onExpand: (id: string) => void;
  onFileChange: (file: File | null) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: (requirementId: string, event: React.FormEvent) => void;
  onTemplateDownload: (templateId: string, fileName: string) => void;
};

export function Phase2DocumentChecklist({
  requirements,
  progress,
  expandedRequirementId,
  reqUploadFile,
  reqUploadNotes,
  reqUploadBusy,
  reqUploadError,
  reqUploadFileRef,
  onExpand,
  onFileChange,
  onNotesChange,
  onSubmit,
  onTemplateDownload,
}: Phase2DocumentChecklistProps): React.JSX.Element {
  return (
    <div className="rounded-md border border-slate-200">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-950">
          Documents de demande formelle
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {progress.totalTracked} pièce{progress.totalTracked !== 1 ? "s" : ""}{" "}
          suivie{progress.totalTracked !== 1 ? "s" : ""} · {progress.submitted}{" "}
          déposée{progress.submitted !== 1 ? "s" : ""} · {progress.missing}{" "}
          manquante{progress.missing !== 1 ? "s" : ""}
        </p>
      </div>

      <ul className="divide-y divide-slate-100">
        {requirements.map((req) => {
          const isExpanded = expandedRequirementId === req.requirementId;
          const isOmaApprovalForm = req.code === "oma_approval_form";
          const canUpload =
            req.status === "missing" ||
            req.status === "requires_correction" ||
            req.status === "incomplete" ||
            req.status === "rejected" ||
            req.isRepeatable;
          const uploadLabel =
            req.isRepeatable && req.submissions.length > 0
              ? "Ajouter un document"
              : req.status === "requires_correction" ||
                  req.status === "incomplete" ||
                  req.status === "rejected"
                ? "Remplacer le document"
                : "Téléverser";

          return (
            <li key={req.requirementId} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {req.label}
                    </span>
                    {req.formCode ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                        {req.formCode}
                      </span>
                    ) : null}
                    {req.requirementLevel === "optional" ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        Optionnel
                      </span>
                    ) : req.requirementLevel === "conditional" ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        Conditionnel
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded px-2 py-0.5 text-xs font-semibold",
                        REQ_STATUS_CLASSES[req.status] ??
                          "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {!isOmaApprovalForm && req.status === "submitted"
                        ? "Déposé - disponible pour consultation"
                        : (REQ_STATUS_LABELS[req.status] ?? req.status)}
                    </span>
                    {req.submissions.length > 0 ? (
                      <span className="text-xs text-slate-400">
                        {req.submissions.length} dépôt
                        {req.submissions.length !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>

                  {isOmaApprovalForm &&
                  (req.status === "requires_correction" ||
                    req.status === "incomplete" ||
                    req.status === "rejected") ? (
                    <div className="mt-1.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                      {req.status === "requires_correction"
                        ? "La DN a demandé une correction."
                        : req.status === "incomplete"
                          ? "Document incomplet - veuillez compléter et téléverser une nouvelle version."
                          : "Document rejeté - veuillez téléverser une nouvelle version."}
                      {req.submissions[0]?.reviewComment ? (
                        <span className="mt-0.5 block font-medium">
                          Note : {req.submissions[0].reviewComment}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {req.template ? (
                    <button
                      type="button"
                      className="btn btn-secondary py-1 text-xs"
                      onClick={() =>
                        onTemplateDownload(
                          req.template!.templateId,
                          req.template!.fileName,
                        )
                      }
                    >
                      <Download size={12} aria-hidden="true" />
                      Télécharger le formulaire
                    </button>
                  ) : null}

                  {canUpload &&
                  req.status !== "validated" &&
                  req.status !== "under_review" ? (
                    <button
                      type="button"
                      className="btn btn-primary py-1 text-xs"
                      onClick={() => onExpand(req.requirementId)}
                    >
                      <Upload size={12} aria-hidden="true" />
                      {isExpanded ? (
                        <>
                          Annuler <ChevronUp size={12} aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          {uploadLabel}{" "}
                          <ChevronDown size={12} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>

              {isExpanded ? (
                <form
                  className="mt-3 grid gap-3 rounded-md border border-slate-200 p-3"
                  onSubmit={(event) => onSubmit(req.requirementId, event)}
                >
                  {reqUploadError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      {reqUploadError}
                    </div>
                  ) : null}

                  <div className="field">
                    <label htmlFor={`req-file-${req.requirementId}`}>
                      {req.template ? "Formulaire rempli" : "Document"}{" "}
                      <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`req-file-${req.requirementId}`}
                      ref={reqUploadFileRef}
                      className="control"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      required
                      disabled={reqUploadBusy}
                      onChange={(event) =>
                        onFileChange(event.target.files?.[0] ?? null)
                      }
                    />
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      PDF, JPG ou PNG - taille maximale 10 Mo.
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor={`req-notes-${req.requirementId}`}>
                      Notes optionnelles
                    </label>
                    <textarea
                      id={`req-notes-${req.requirementId}`}
                      className="control min-h-16"
                      value={reqUploadNotes}
                      onChange={(event) => onNotesChange(event.target.value)}
                      maxLength={1000}
                      disabled={reqUploadBusy}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn btn-primary w-fit"
                      type="submit"
                      disabled={reqUploadBusy || !reqUploadFile}
                    >
                      <Upload size={14} aria-hidden="true" />
                      {reqUploadBusy
                        ? "Envoi en cours…"
                        : "Déposer le document"}
                    </button>
                    <button
                      className="btn btn-secondary w-fit"
                      type="button"
                      disabled={reqUploadBusy}
                      onClick={() => onExpand(req.requirementId)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
