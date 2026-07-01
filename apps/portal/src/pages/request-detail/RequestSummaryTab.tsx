import { AlertCircle, Loader2, RefreshCw, Save } from "lucide-react";
import { useEffect } from "react";
import {
  Controller,
  useForm,
  type RegisterOptions,
  type SubmitHandler,
} from "react-hook-form";

import {
  Alert,
  AlertContent,
  AlertIcon,
  AlertTitle,
} from "../../components/Alert";
import { getRequestTypeLabel } from "../../components/RequestTypeLabel";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import type { PortalRequest, PortalRequestType } from "../../lib/api/requests";
import { portalStatusGuidance, requestTypeOptions } from "./constants";
import { formatDateTime } from "./formatters";

export type RequestSummaryFormValues = {
  requestType: PortalRequestType;
  subject: string;
  message: string;
};

type RequestSummaryTabProps = {
  request: PortalRequest;
  isSubmitted: boolean;
  requestType: PortalRequestType;
  subject: string;
  message: string;
  busyAction: string | null;
  isLoading: boolean;
  onRequestTypeChange: (requestType: PortalRequestType) => void;
  onSubjectChange: (subject: string) => void;
  onMessageChange: (message: string) => void;
  onSubmitBasicUpdate: (values: RequestSummaryFormValues) => void;
  onReload: () => void;
};

const messageMaxLength = 300;
const requiredBadge = <Badge variant="destructive">Requis</Badge>;
const optionalBadge = <Badge variant="outline">Optionnel</Badge>;

const rules = {
  requestType: {
    required: "Le type de demande est requis.",
  },
  subject: {
    required: "L'objet de la demande est requis.",
    minLength: {
      value: 3,
      message: "L'objet doit contenir au moins 3 caractères.",
    },
    maxLength: {
      value: 200,
      message: "L'objet doit contenir au plus 200 caractères.",
    },
  },
  message: {
    maxLength: {
      value: messageMaxLength,
      message: `Le message doit contenir au plus ${messageMaxLength} caractères.`,
    },
  },
} satisfies Record<
  keyof RequestSummaryFormValues,
  RegisterOptions<RequestSummaryFormValues>
>;

export function RequestSummaryTab({
  request,
  isSubmitted,
  requestType,
  subject,
  message,
  busyAction,
  isLoading,
  onRequestTypeChange,
  onSubjectChange,
  onMessageChange,
  onSubmitBasicUpdate,
  onReload,
}: RequestSummaryTabProps): React.JSX.Element {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RequestSummaryFormValues>({
    defaultValues: {
      requestType,
      subject,
      message,
    },
    mode: "onBlur",
  });

  const isBusy = busyAction === "update";
  const messageLength = watch("message").length;
  const remainingMessageCharacters = messageMaxLength - messageLength;

  useEffect(() => {
    reset({
      requestType: request.requestType,
      subject: request.subject,
      message: request.message ?? "",
    });
  }, [
    request.id,
    request.message,
    request.requestType,
    request.subject,
    reset,
  ]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (values.requestType) {
        onRequestTypeChange(values.requestType);
      }
      onSubjectChange(values.subject ?? "");
      onMessageChange(values.message ?? "");
    });

    return () => subscription.unsubscribe();
  }, [onMessageChange, onRequestTypeChange, onSubjectChange, watch]);

  const onSubmit: SubmitHandler<RequestSummaryFormValues> = (values) => {
    onSubmitBasicUpdate({
      requestType: values.requestType,
      subject: values.subject.trim(),
      message: values.message.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {isSubmitted && !request.dossierId ? (
        <Alert variant="info" appearance="light">
          <AlertIcon>
            <AlertCircle
              size={16}
              className="text-sky-600"
              aria-hidden="true"
            />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>
              Votre demande a été reçue. Elle est en attente d'orientation
              administrative.
            </AlertTitle>
          </AlertContent>
        </Alert>
      ) : null}

      {request.portalStatusLabel &&
      portalStatusGuidance[request.portalStatusLabel] ? (
        <Alert variant="info" appearance="light">
          <AlertIcon>
            <AlertCircle
              size={16}
              className="text-sky-600"
              aria-hidden="true"
            />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>{request.portalStatusLabel}</AlertTitle>
            <p className="mt-1 text-sm text-sky-700">
              {portalStatusGuidance[request.portalStatusLabel]}
            </p>
          </AlertContent>
        </Alert>
      ) : null}

      <dl className="grid gap-x-8 gap-y-4 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm sm:grid-cols-3">
        <div className="field-readonly">
          <dt>Type de demande</dt>
          <dd>{getRequestTypeLabel(request.requestType)}</dd>
        </div>
        <div className="field-readonly">
          <dt>Date de création</dt>
          <dd>{formatDateTime(request.createdAt)}</dd>
        </div>
        <div className="field-readonly">
          <dt>Date de soumission</dt>
          <dd>
            {request.submittedAt ? (
              formatDateTime(request.submittedAt)
            ) : (
              <span className="text-slate-400">Non soumise</span>
            )}
          </dd>
        </div>
      </dl>

      {isSubmitted ? (
        <Card>
          <CardHeader>
            <CardTitle>Détails de la demande</CardTitle>
            <CardDescription>
              La demande soumise ne peut plus être modifiée.
            </CardDescription>
            <CardAction>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReload}
                disabled={isLoading}
              >
                <RefreshCw aria-hidden="true" />
                Actualiser
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2 field-readonly">
              <div>
                <dt>Type de demande</dt>
                <dd>{getRequestTypeLabel(requestType)}</dd>
              </div>
              <div>
                <dt>Objet</dt>
                <dd>{subject || <span className="text-slate-400">-</span>}</dd>
              </div>
              {message ? (
                <div className="sm:col-span-2">
                  <dt>Message complémentaire</dt>
                  <dd className="whitespace-pre-line">{message}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Modifiables jusqu'à la soumission de la demande.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => void handleSubmit(onSubmit)(event)}
              noValidate
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="requestType">
                    Type de demande
                    {requiredBadge}
                  </FieldLabel>
                  <Controller
                    name="requestType"
                    control={control}
                    rules={rules.requestType}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isBusy}
                      >
                        <SelectTrigger
                          id="requestType"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          aria-invalid={errors.requestType ? "true" : "false"}
                          aria-describedby={
                            errors.requestType ? "requestType-error" : undefined
                          }
                          className={
                            errors.requestType
                              ? "border-red-300 bg-red-50/40"
                              : undefined
                          }
                        >
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {requestTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError id="requestType-error">
                    {errors.requestType?.message}
                  </FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="subject">
                    Objet de la demande
                    {requiredBadge}
                  </FieldLabel>
                  <Input
                    id="subject"
                    type="text"
                    maxLength={200}
                    disabled={isBusy}
                    invalid={Boolean(errors.subject)}
                    aria-invalid={errors.subject ? "true" : "false"}
                    aria-describedby={
                      errors.subject ? "subject-error" : undefined
                    }
                    placeholder="Ex. Demande de certificat OMA"
                    {...register("subject", rules.subject)}
                  />
                  <FieldError id="subject-error">
                    {errors.subject?.message}
                  </FieldError>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="message">
                  Message complémentaire
                  {optionalBadge}
                </FieldLabel>
                <textarea
                  id="message"
                  rows={4}
                  maxLength={messageMaxLength}
                  disabled={isBusy}
                  className={[
                    "min-h-28 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                    errors.message
                      ? "border-red-300 bg-red-50/40"
                      : "border-slate-300",
                    "focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10",
                  ].join(" ")}
                  aria-invalid={errors.message ? "true" : "false"}
                  aria-describedby={
                    errors.message ? "message-error" : undefined
                  }
                  placeholder="Ajoutez une précision utile pour l'instruction du dossier."
                  {...register("message", rules.message)}
                />
                <div className="flex items-start justify-between gap-3">
                  <FieldError id="message-error">
                    {errors.message?.message}
                  </FieldError>
                  <p className="ml-auto shrink-0 text-xs font-medium text-slate-500">
                    {remainingMessageCharacters} caractères restants
                  </p>
                </div>
              </Field>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="outline" disabled={isBusy}>
                  {isBusy ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save aria-hidden="true" />
                      Enregistrer
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy || isLoading}
                  onClick={onReload}
                >
                  <RefreshCw aria-hidden="true" />
                  Actualiser
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
