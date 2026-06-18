import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Controller,
  useForm,
  type RegisterOptions,
  type SubmitHandler,
} from "react-hook-form";

import { DocumentFileField } from "../../components/documents/DocumentFileField";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Field, FieldError, FieldLabel } from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { PortalCourrier, PortalDocument } from "../../lib/api/requests";
import { locationOptions } from "./constants";
import type { CourrierMode } from "./types";

type DepositLocation = "ANAC" | "DG" | "DN" | "other";

type CourrierFormValues = {
  courrierMode: CourrierMode;
  expectedDepositDate: string;
  depositLocation: DepositLocation;
  courrierNotes: string;
};

type RequestCourrierTabProps = {
  evidenceLabel: string;
  document?: PortalDocument;
  courrier?: PortalCourrier;
  isSubmitted: boolean;
  courrierMode: CourrierMode;
  uploadFile: File | null;
  expectedDepositDate: string;
  depositLocation: DepositLocation;
  courrierNotes: string;
  busyAction: string | null;
  onCourrierModeChange: (mode: CourrierMode) => void;
  onUploadFileChange: (file: File | null) => void;
  onExpectedDepositDateChange: (date: string) => void;
  onDepositLocationChange: (location: DepositLocation) => void;
  onCourrierNotesChange: (notes: string) => void;
  onSubmitRequest: () => void;
};

const notesMaxLength = 3000;
const requiredBadge = <Badge variant="destructive">Requis</Badge>;
const optionalBadge = <Badge variant="outline">Optionnel</Badge>;

const rules = {
  courrierMode: {
    required: "Le mode de dépôt du courrier est requis.",
  },
  expectedDepositDate: {},
  depositLocation: {
    required: "Le lieu de dépôt est requis.",
  },
  courrierNotes: {
    maxLength: {
      value: notesMaxLength,
      message: `Les notes doivent contenir au plus ${notesMaxLength} caractères.`,
    },
  },
} satisfies Record<keyof CourrierFormValues, RegisterOptions<CourrierFormValues>>;

export function RequestCourrierTab({
  evidenceLabel,
  document,
  courrier,
  isSubmitted,
  courrierMode,
  uploadFile,
  expectedDepositDate,
  depositLocation,
  courrierNotes,
  busyAction,
  onCourrierModeChange,
  onUploadFileChange,
  onExpectedDepositDateChange,
  onDepositLocationChange,
  onCourrierNotesChange,
  onSubmitRequest,
}: RequestCourrierTabProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CourrierFormValues>({
    defaultValues: {
      courrierMode,
      expectedDepositDate,
      depositLocation,
      courrierNotes,
    },
    mode: "onBlur",
  });

  const selectedMode = watch("courrierMode");
  const notesLength = watch("courrierNotes").length;
  const remainingNotesCharacters = notesMaxLength - notesLength;
  const isBusy = busyAction === "submit";

  useEffect(() => {
    reset({
      courrierMode,
      expectedDepositDate,
      depositLocation,
      courrierNotes,
    });
  }, [
    courrierMode,
    courrierNotes,
    depositLocation,
    expectedDepositDate,
    reset,
  ]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (values.courrierMode) {
        onCourrierModeChange(values.courrierMode);
      }
      onExpectedDepositDateChange(values.expectedDepositDate ?? "");
      if (values.depositLocation) {
        onDepositLocationChange(values.depositLocation);
      }
      onCourrierNotesChange(values.courrierNotes ?? "");
    });

    return () => subscription.unsubscribe();
  }, [
    onCourrierModeChange,
    onCourrierNotesChange,
    onDepositLocationChange,
    onExpectedDepositDateChange,
    watch,
  ]);

  const handleFileChange = (file: File | null) => {
    setFileError("");
    onUploadFileChange(file);
  };

  const onSubmit: SubmitHandler<CourrierFormValues> = (values) => {
    if (values.courrierMode === "portal_upload" && !uploadFile && !document) {
      setFileError("Le courrier initial est requis.");
      return;
    }

    setFileError("");
    onSubmitRequest();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Courrier initial</CardTitle>
        <CardDescription>{evidenceLabel}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5">
        {document ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-800">
              Fichier : {document.fileName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {Math.ceil(document.fileSize / 1024)} Ko
            </p>
          </div>
        ) : null}

        {courrier?.notes ? (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Notes</p>
            <p className="mt-1 whitespace-pre-line">{courrier.notes}</p>
          </div>
        ) : null}

        {!isSubmitted ? (
          <form
            id="courrier-submission-form"
            className="grid gap-4"
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <Field>
              <FieldLabel htmlFor="courrierMode">
                Mode de dépôt du courrier
                {requiredBadge}
              </FieldLabel>
              <Controller
                name="courrierMode"
                control={control}
                rules={rules.courrierMode}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(nextValue) => {
                      field.onChange(nextValue);
                      if (nextValue === "physical_deposit") {
                        handleFileChange(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }
                    }}
                    disabled={isBusy}
                  >
                    <SelectTrigger
                      id="courrierMode"
                      ref={field.ref}
                      onBlur={field.onBlur}
                      aria-invalid={errors.courrierMode ? "true" : "false"}
                      aria-describedby={
                        errors.courrierMode ? "courrierMode-error" : undefined
                      }
                      className={
                        errors.courrierMode
                          ? "border-red-300 bg-red-50/40"
                          : undefined
                      }
                    >
                      <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portal_upload">
                        Téléversement portail
                      </SelectItem>
                      <SelectItem value="physical_deposit">
                        Dépôt physique à l'ANAC
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError id="courrierMode-error">
                {errors.courrierMode?.message}
              </FieldError>
            </Field>

            {selectedMode === "portal_upload" ? (
              <DocumentFileField
                id="courrierFile"
                label="Courrier initial"
                badge={requiredBadge}
                file={uploadFile}
                disabled={isBusy}
                error={fileError}
                inputRef={fileInputRef}
                onFileChange={handleFileChange}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="expectedDepositDate">
                    Date prévue de dépôt
                    {requiredBadge}
                  </FieldLabel>
                  <Input
                    id="expectedDepositDate"
                    type="date"
                    disabled={isBusy}
                    invalid={Boolean(errors.expectedDepositDate)}
                    aria-invalid={
                      errors.expectedDepositDate ? "true" : "false"
                    }
                    aria-describedby={
                      errors.expectedDepositDate
                        ? "expectedDepositDate-error"
                        : undefined
                    }
                    {...register("expectedDepositDate", {
                      validate: (value, formValues) =>
                        formValues.courrierMode !== "physical_deposit" ||
                        Boolean(value) ||
                        "La date prévue de dépôt est requise.",
                    })}
                  />
                  <FieldError id="expectedDepositDate-error">
                    {errors.expectedDepositDate?.message}
                  </FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="depositLocation">
                    Lieu de dépôt
                    {requiredBadge}
                  </FieldLabel>
                  <Controller
                    name="depositLocation"
                    control={control}
                    rules={rules.depositLocation}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isBusy}
                      >
                        <SelectTrigger
                          id="depositLocation"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          aria-invalid={
                            errors.depositLocation ? "true" : "false"
                          }
                          aria-describedby={
                            errors.depositLocation
                              ? "depositLocation-error"
                              : undefined
                          }
                          className={
                            errors.depositLocation
                              ? "border-red-300 bg-red-50/40"
                              : undefined
                          }
                        >
                          <SelectValue placeholder="Sélectionner un lieu" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError id="depositLocation-error">
                    {errors.depositLocation?.message}
                  </FieldError>
                </Field>
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="courrierNotes">
                Notes
                {optionalBadge}
              </FieldLabel>
              <textarea
                id="courrierNotes"
                rows={3}
                maxLength={notesMaxLength}
                disabled={isBusy}
                className={[
                  "min-h-24 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                  errors.courrierNotes
                    ? "border-red-300 bg-red-50/40"
                    : "border-slate-300",
                  "focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10",
                ].join(" ")}
                aria-invalid={errors.courrierNotes ? "true" : "false"}
                aria-describedby={
                  errors.courrierNotes ? "courrierNotes-error" : undefined
                }
                placeholder="Ajoutez une note utile pour le dépôt du courrier."
                {...register("courrierNotes", rules.courrierNotes)}
              />
              <div className="flex items-start justify-between gap-3">
                <FieldError id="courrierNotes-error">
                  {errors.courrierNotes?.message}
                </FieldError>
                <p className="ml-auto shrink-0 text-xs font-medium text-slate-500">
                  {remainingNotesCharacters} caractères restants
                </p>
              </div>
            </Field>
          </form>
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            Une demande soumise ne peut plus être modifiée depuis le portail.
          </div>
        )}
      </CardContent>

      {!isSubmitted ? (
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-slate-950">Soumettre la demande</p>
            <p className="mt-1 text-sm text-slate-500">
              Cette action transmet la demande à l'ANAC.
            </p>
          </div>
          <Button
            form="courrier-submission-form"
            type="submit"
            disabled={isBusy}
          >
            {isBusy ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Soumission...
              </>
            ) : (
              <>
                <Send aria-hidden="true" />
                Soumettre
              </>
            )}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
