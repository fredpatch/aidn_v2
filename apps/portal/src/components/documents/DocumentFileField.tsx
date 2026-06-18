import { FileUp, X } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";

type DocumentFileFieldProps = {
  id: string;
  label: string;
  badge?: ReactNode;
  file: File | null;
  accept?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
};

export function DocumentFileField({
  id,
  label,
  badge,
  file,
  accept = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
  disabled,
  error,
  hint = "PDF, JPG ou PNG - taille maximale 10 Mo.",
  inputRef,
  onFileChange,
}: DocumentFileFieldProps): React.JSX.Element {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {badge}
      </FieldLabel>
      <label
        className={cn(
          "flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-white px-4 py-5 text-center shadow-sm transition-colors",
          "hover:border-slate-400 hover:bg-slate-50",
          error ? "border-red-300 bg-red-50/40" : "border-slate-300",
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : "text-slate-600",
        )}
      >
        <FileUp className="mb-2 size-5 text-slate-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-800">
          Choisir un fichier
        </span>
        <span className="mt-1 text-xs text-slate-500">{hint}</span>
        <input
          id={id}
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={accept}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">
              {file.name}
            </p>
            <p className="text-xs text-slate-500">
              {Math.ceil(file.size / 1024)} Ko
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label="Retirer le fichier"
            onClick={() => {
              if (inputRef?.current) inputRef.current.value = "";
              onFileChange(null);
            }}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      <p id={`${id}-hint`} className="text-xs font-medium text-slate-500">
        {hint}
      </p>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}
