import {
  CheckCircle2,
  ExternalLink,
  FolderOpen,
  MessageSquareWarning,
  XCircle,
} from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import type { AdminRequest, AdminRequestDetail } from "../../lib/api/requests";
import { DetailField } from "./DetailField";
import type { ActionDialogState } from "./ActionDialog";
import { requestTypeLabels, sourceLabels } from "./requests.constants";
import {
  canMarkPrinted,
  canOpenDossier,
  canRecordDgReturn,
  canRecordInitialDgDecision,
  canRegisterPhysical,
  canRequestCorrection,
  getStatusLabel,
  statusBadgeVariant,
} from "./requests.helpers";
import { documentSummary, formatDate } from "./requests.utils";

export type RequestPagePermissions = {
  canReview: boolean;
  canRegister: boolean;
  canHandleDg: boolean;
};

export function RequestDetailPanel({
  detail,
  permissions,
  onConsultOrientationCourrier,
  onOpenDgCircuit,
  onSetDialog,
}: {
  detail: AdminRequestDetail | null;
  permissions: RequestPagePermissions;
  onConsultOrientationCourrier: (requestId: string, documentId: string) => void;
  onOpenDgCircuit: (
    request: AdminRequest,
    bucket: "to_transmit" | "awaiting_return",
  ) => void;
  onSetDialog: (dialog: ActionDialogState) => void;
}) {
  const { request, courrier, document: doc, dgReview } = detail ?? {};

  if (!request) {
    return (
      <Card className="mt-4 flex items-center justify-center lg:mt-0">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sélectionnez une demande dans la liste pour voir les détails.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 lg:mt-0">
      <CardHeader className="px-4 pb-3 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={statusBadgeVariant(request.status)}>
            {getStatusLabel(request)}
          </Badge>
          {canOpenDossier(request, dgReview) ? (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
              Courrier DG signe disponible
            </Badge>
          ) : null}
        </div>
        <h2 className="mt-1 text-base font-semibold leading-tight text-slate-950 dark:text-white">
          {request.subject}
        </h2>
        <div className="mt-0.5 space-y-0.5">
          <p className="text-sm text-muted-foreground">
            {request.organization?.canonicalName ?? request.organizationId}
          </p>
          <p className="text-xs text-muted-foreground">
            {request.submittedBy?.fullName ?? request.submittedBy?.email ?? "-"}
            {request.courrierSource ? (
              <span className="ml-2 text-slate-400">
                - {sourceLabels[request.courrierSource]}
              </span>
            ) : null}
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-0">
        <Tabs defaultValue="demande">
          <TabsList className="flex h-auto flex-wrap gap-0.5 bg-muted px-1 py-1">
            <TabsTrigger value="demande" className="px-2.5 py-1 text-xs">
              Demande
            </TabsTrigger>
            <TabsTrigger value="postulant" className="px-2.5 py-1 text-xs">
              Postulant
            </TabsTrigger>
            <TabsTrigger value="organisation" className="px-2.5 py-1 text-xs">
              Organisation
            </TabsTrigger>
            <TabsTrigger value="courrier" className="px-2.5 py-1 text-xs">
              Courrier
            </TabsTrigger>
            <TabsTrigger value="verification" className="px-2.5 py-1 text-xs">
              Vérification interne
            </TabsTrigger>
            <TabsTrigger value="orientation" className="px-2.5 py-1 text-xs">
              Signature DG
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demande">
            <dl className="grid gap-3 pt-3 sm:grid-cols-2">
              <DetailField
                label="Type"
                value={requestTypeLabels[request.requestType]}
              />
              <DetailField label="Statut" value={getStatusLabel(request)} />
              <DetailField
                label="Création"
                value={formatDate(request.createdAt)}
              />
              <DetailField
                label="Soumission"
                value={formatDate(request.submittedAt)}
              />
              <DetailField
                label="Objet"
                value={request.subject}
                className="sm:col-span-2"
              />
              <DetailField
                label="Message"
                value={request.message}
                className="sm:col-span-2"
              />
            </dl>
          </TabsContent>

          <TabsContent value="postulant">
            <dl className="grid gap-3 pt-3 sm:grid-cols-2">
              <DetailField label="Nom" value={request.submittedBy?.fullName} />
              <DetailField label="Email" value={request.submittedBy?.email} />
              <DetailField
                label="Téléphone"
                value={request.submittedBy?.phone}
              />
            </dl>
          </TabsContent>

          <TabsContent value="organisation">
            <dl className="grid gap-3 pt-3 sm:grid-cols-2">
              <DetailField
                label="Nom canonique"
                value={request.organization?.canonicalName}
                className="sm:col-span-2"
              />
              <DetailField label="Email" value={request.organization?.email} />
              <DetailField
                label="Téléphone"
                value={request.organization?.phone}
              />
              <DetailField
                label="Adresse légale"
                value={request.organization?.legalAddress}
                className="sm:col-span-2"
              />
            </dl>
          </TabsContent>

          <TabsContent value="courrier">
            <dl className="grid gap-3 pt-3 sm:grid-cols-2">
              <DetailField
                label="Source"
                value={
                  courrier?.source
                    ? sourceLabels[courrier.source]
                    : request.courrierSource
                      ? sourceLabels[request.courrierSource]
                      : undefined
                }
              />
              <DetailField label="Document" value={documentSummary(doc)} />
              <DetailField
                label="Référence officielle"
                value={courrier?.officialReference}
              />
              <DetailField
                label="Date dépôt physique réel"
                value={formatDate(
                  courrier?.physicalDepositDate ??
                    request.physicalDeposit?.physicalDepositDate,
                )}
              />
              <DetailField
                label="Date prévue dépôt"
                value={formatDate(request.physicalDeposit?.expectedDepositDate)}
              />
              <DetailField
                label="Notes"
                value={courrier?.notes ?? request.physicalDeposit?.notes}
                className="sm:col-span-2"
              />
            </dl>
          </TabsContent>

          <TabsContent value="verification">
            <dl className="grid gap-3 pt-3 sm:grid-cols-2">
              <DetailField
                label="Démarrée le"
                value={formatDate(request.intake?.startedAt)}
              />
              <DetailField
                label="Démarrée par"
                value={
                  request.intake?.startedBy?.fullName ??
                  request.intake?.startedById
                }
              />
              <DetailField
                label="Correction demandée le"
                value={formatDate(request.intake?.correctionRequestedAt)}
              />
              <DetailField
                label="Motif correction"
                value={request.intake?.correctionReason}
                className="sm:col-span-2"
              />
              <DetailField
                label="Imprimé le"
                value={formatDate(request.intake?.printedForDgAt)}
              />
              <DetailField
                label="Imprimé par"
                value={
                  request.intake?.printedForDgBy?.fullName ??
                  request.intake?.printedForDgById
                }
              />
              <DetailField
                label="Circuit DG depuis"
                value={formatDate(
                  request.intake?.sentToDgAt ?? request.intake?.printedForDgAt,
                )}
              />
              <DetailField
                label="Notes"
                value={request.intake?.notes}
                className="sm:col-span-2"
              />
            </dl>
          </TabsContent>

          <TabsContent value="orientation">
            <dl className="grid gap-3 pt-3 sm:grid-cols-2">
              <DetailField
                label="Date retour"
                value={formatDate(dgReview?.returnedFromDgAt)}
              />
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">
                  Courrier DG signé
                </dt>
                {dgReview?.returnedScannedDocumentId ? (
                  <dd className="mt-1 flex flex-col gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onConsultOrientationCourrier(
                          request.id,
                          dgReview.returnedScannedDocumentId!,
                        )
                      }
                    >
                      <ExternalLink
                        className="mr-1.5 h-4 w-4"
                        aria-hidden="true"
                      />
                      Consulter le courrier DG signé
                    </Button>
                    {canOpenDossier(request, dgReview) && (
                      <p className="text-xs text-muted-foreground">
                        Consultation facultative avant démarrage de la phase
                        préliminaire.
                      </p>
                    )}
                  </dd>
                ) : (
                  <dd className="mt-1 text-sm text-muted-foreground">
                    Aucun courrier DG signé disponible.
                  </dd>
                )}
              </div>
            </dl>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-wrap justify-between gap-2 px-4 pb-4 pt-4">
        <div className="flex flex-wrap gap-2">
          {permissions.canReview && canRequestCorrection(request) ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onSetDialog({ kind: "correction", request })}
            >
              <MessageSquareWarning
                className="mr-1.5 h-4 w-4"
                aria-hidden="true"
              />
              Demander correction
            </Button>
          ) : null}
          {permissions.canRegister && canRegisterPhysical(request) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDgCircuit(request, "to_transmit")}
            >
              <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Voir dans Courriers officiels
            </Button>
          ) : null}
          {permissions.canHandleDg && canMarkPrinted(request) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDgCircuit(request, "to_transmit")}
            >
              <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Voir dans Courriers officiels
            </Button>
          ) : null}
          {permissions.canHandleDg && canRecordDgReturn(request) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDgCircuit(request, "awaiting_return")}
            >
              <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Voir dans Courriers officiels
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {permissions.canReview && canRecordInitialDgDecision(request) ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onSetDialog({ kind: "dg_rejected", request })}
            >
              <XCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Enregistrer le rejet DG
            </Button>
          ) : null}
          {permissions.canReview && canOpenDossier(request, dgReview) ? (
            <Button
              size="sm"
              onClick={() => onSetDialog({ kind: "open_dossier", request })}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <FolderOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Démarrer la phase préliminaire
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
