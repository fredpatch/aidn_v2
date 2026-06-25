import { ChevronDown, ChevronUp, Download, Upload } from "lucide-react";

import { DocumentFileField } from "../../components/documents/DocumentFileField";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Field, FieldLabel } from "../../components/ui/field";
import type { PortalFormalRequestRequirement } from "../../lib/api/formal-request";
import { cn } from "../../lib/utils";
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

const REQUIREMENT_LEVEL_BADGES: Record<
  PortalFormalRequestRequirement["requirementLevel"],
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  gate: {
    label: "Obligatoire",
    variant: "destructive",
  },
  expected: {
    label: "Requis",
    variant: "secondary",
  },
  conditional: {
    label: "Conditionnel",
    variant: "outline",
  },
  optional: {
    label: "Optionnel",
    variant: "outline",
  },
};

function RequirementLevelBadge({
  level,
}: {
  level: PortalFormalRequestRequirement["requirementLevel"];
}): React.JSX.Element {
  const badge = REQUIREMENT_LEVEL_BADGES[level];
  return <Badge variant={badge.variant}>{badge.label}</Badge>;
}

function RequirementStatusBadge({
  requirement,
}: {
  requirement: PortalFormalRequestRequirement;
}): React.JSX.Element {
  const isOmaApprovalForm = requirement.code === "oma_approval_form";
  const label =
    !isOmaApprovalForm && requirement.status === "submitted"
      ? "Depose - disponible pour consultation"
      : (REQ_STATUS_LABELS[requirement.status] ?? requirement.status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border-transparent px-2 py-0.5",
        REQ_STATUS_CLASSES[requirement.status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {label}
    </Badge>
  );
}

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
    <Card className="rounded-lg">
      <CardHeader className="border-b border-slate-200">
        <CardDescription>Phase II</CardDescription>
        <CardTitle>Documents de demande formelle</CardTitle>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">
            {progress.totalTracked} piece{progress.totalTracked !== 1 ? "s" : ""}{" "}
            suivie{progress.totalTracked !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary">
            {progress.submitted} deposee
            {progress.submitted !== 1 ? "s" : ""}
          </Badge>
          <Badge variant={progress.missing > 0 ? "destructive" : "outline"}>
            {progress.missing} manquante{progress.missing !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
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
                  : "Televerser";

            return (
              <li
                key={req.requirementId}
                className={cn(
                  "px-4 py-3 transition-colors",
                  isExpanded ? "bg-slate-50/80" : "bg-white",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {req.label}
                      </span>
                      {req.formCode ? (
                        <Badge
                          variant="outline"
                          className="rounded-md font-mono text-slate-500"
                        >
                          {req.formCode}
                        </Badge>
                      ) : null}
                      <RequirementLevelBadge level={req.requirementLevel} />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <RequirementStatusBadge requirement={req} />
                      {req.submissions.length > 0 ? (
                        <span className="text-xs text-slate-400">
                          {req.submissions.length} depot
                          {req.submissions.length !== 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>

                    {isOmaApprovalForm &&
                    (req.status === "requires_correction" ||
                      req.status === "incomplete" ||
                      req.status === "rejected") ? (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {req.status === "requires_correction"
                          ? "La DN a demande une correction."
                          : req.status === "incomplete"
                            ? "Document incomplet - veuillez completer et televerser une nouvelle version."
                            : "Document rejete - veuillez televerser une nouvelle version."}
                        {req.submissions[0]?.reviewComment ? (
                          <span className="mt-1 block font-medium">
                            Note : {req.submissions[0].reviewComment}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {req.template ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onTemplateDownload(
                            req.template!.templateId,
                            req.template!.fileName,
                          )
                        }
                      >
                        <Download size={12} aria-hidden="true" />
                        Telecharger le formulaire
                      </Button>
                    ) : null}

                    {canUpload &&
                    req.status !== "validated" &&
                    req.status !== "under_review" ? (
                      <Button
                        type="button"
                        size="sm"
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
                      </Button>
                    ) : null}
                  </div>
                </div>

                {isExpanded ? (
                  <form
                    className="mt-3 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    onSubmit={(event) => onSubmit(req.requirementId, event)}
                  >
                    <DocumentFileField
                      id={`req-file-${req.requirementId}`}
                      inputRef={reqUploadFileRef}
                      label={req.template ? "Formulaire rempli" : "Document"}
                      badge={<Badge variant="secondary">Requis</Badge>}
                      file={reqUploadFile}
                      disabled={reqUploadBusy}
                      error={reqUploadError}
                      onFileChange={onFileChange}
                    />

                    <Field>
                      <FieldLabel htmlFor={`req-notes-${req.requirementId}`}>
                        Notes optionnelles
                      </FieldLabel>
                      <textarea
                        id={`req-notes-${req.requirementId}`}
                        className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10"
                        value={reqUploadNotes}
                        onChange={(event) => onNotesChange(event.target.value)}
                        maxLength={1000}
                        disabled={reqUploadBusy}
                      />
                    </Field>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        disabled={reqUploadBusy || !reqUploadFile}
                      >
                        <Upload size={14} aria-hidden="true" />
                        {reqUploadBusy
                          ? "Envoi en cours..."
                          : "Deposer le document"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={reqUploadBusy}
                        onClick={() => onExpand(req.requirementId)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
