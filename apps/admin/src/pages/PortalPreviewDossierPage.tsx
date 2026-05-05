import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  useAidnCertificates,
  useAidnDocuments,
  useAidnMeetings,
  useAidnOmaPhases,
  useAidnPhaseEvidence,
  useAidnPhaseNextActions,
  useAidnTimelineEvents,
  useDemandes,
  useDossiers,
} from "@/features/aidn";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  actionForPortalStatus,
  certificateStatusLabel,
  documentStatusLabel,
  evidenceStatusLabel,
  formatDate,
  meetingStatusLabel,
  paymentStatusLabel,
  phaseLabel,
  phaseStatusLabel,
  simplifiedPortalStatusLabel,
  statusClassNames,
} from "./portal-preview/portalPreview.utils";

interface DetailRow {
  id: string;
  title: string;
  detail: string;
  status: string;
  date?: string;
  tone: keyof typeof statusClassNames;
}

function DetailStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof statusClassNames;
}): React.JSX.Element {
  return (
    <Badge variant="outline" className={statusClassNames[tone]}>
      {label}
    </Badge>
  );
}

function DetailList({
  rows,
  emptyMessage,
}: {
  rows: DetailRow[];
  emptyMessage: string;
}): React.JSX.Element {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-md border bg-background p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-950 dark:text-white">
                {row.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Mis a jour : {formatDate(row.date)}
              </p>
            </div>
            <DetailStatusBadge label={row.status} tone={row.tone} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PortalPreviewDossierPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();

  const demandesQuery = useDemandes();
  const dossiersQuery = useDossiers();
  const documentsQuery = useAidnDocuments();
  const meetingsQuery = useAidnMeetings();
  const certificatesQuery = useAidnCertificates();
  const evidenceQuery = useAidnPhaseEvidence();
  const nextActionsQuery = useAidnPhaseNextActions();
  const phasesQuery = useAidnOmaPhases();
  const timelineQuery = useAidnTimelineEvents();

  const isLoading =
    demandesQuery.isLoading ||
    dossiersQuery.isLoading ||
    documentsQuery.isLoading ||
    meetingsQuery.isLoading ||
    certificatesQuery.isLoading ||
    evidenceQuery.isLoading ||
    nextActionsQuery.isLoading ||
    phasesQuery.isLoading ||
    timelineQuery.isLoading;

  const error =
    demandesQuery.error ||
    dossiersQuery.error ||
    documentsQuery.error ||
    meetingsQuery.error ||
    certificatesQuery.error ||
    evidenceQuery.error ||
    nextActionsQuery.error ||
    phasesQuery.error ||
    timelineQuery.error;

  const refetchAll = (): void => {
    void demandesQuery.refetch();
    void dossiersQuery.refetch();
    void documentsQuery.refetch();
    void meetingsQuery.refetch();
    void certificatesQuery.refetch();
    void evidenceQuery.refetch();
    void nextActionsQuery.refetch();
    void phasesQuery.refetch();
    void timelineQuery.refetch();
  };

  const pageData = useMemo(() => {
    const dossier = (dossiersQuery.data ?? []).find((item) => item.id === id);
    const demande = (demandesQuery.data ?? []).find(
      (item) => item.id === dossier?.demandeId,
    );

    const documents = (documentsQuery.data ?? []).filter(
      (item) => item.dossierId === dossier?.id,
    );
    const meetings = (meetingsQuery.data ?? []).filter(
      (item) => item.dossierId === dossier?.id,
    );
    const evidence = (evidenceQuery.data ?? []).filter(
      (item) => item.dossierId === dossier?.id,
    );
    const certificate = (certificatesQuery.data ?? []).find(
      (item) => item.dossierId === dossier?.id,
    );
    const phases = (phasesQuery.data ?? [])
      .filter((item) => item.dossierId === dossier?.id)
      .sort((first, second) => first.order - second.order);
    const nextAction = (nextActionsQuery.data ?? []).find(
      (item) => item.dossierId === dossier?.id && item.status !== "done",
    );

    const timeline = (timelineQuery.data ?? [])
      .filter(
        (event) =>
          event.dossierId === dossier?.id ||
          (demande && event.demandeId === demande.id),
      )
      .sort((first, second) =>
        second.occurredAt.localeCompare(first.occurredAt),
      );

    return {
      dossier,
      demande,
      documents,
      meetings,
      evidence,
      certificate,
      phases,
      nextAction,
      timeline,
    };
  }, [
    certificatesQuery.data,
    demandesQuery.data,
    documentsQuery.data,
    dossiersQuery.data,
    evidenceQuery.data,
    id,
    meetingsQuery.data,
    nextActionsQuery.data,
    phasesQuery.data,
    timelineQuery.data,
  ]);

  if (isLoading) {
    return (
      <div className="page-container">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorState message={error.message} onRetry={refetchAll} />
      </div>
    );
  }

  if (!pageData.dossier) {
    return (
      <div className="page-container">
        <EmptyState
          message="Dossier introuvable pour cette vue portail."
          action={
            <Button asChild variant="outline">
              <Link to="/portal-preview">Retour au portail</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const documentsRows: DetailRow[] = [
    ...pageData.documents.map((item) => {
      const status = documentStatusLabel(item.status);
      return {
        id: `doc-${item.id}`,
        title: item.title,
        detail: item.phaseKey
          ? `Etape : ${phaseLabel(item.phaseKey)}`
          : "Document lie au dossier",
        status: status.label,
        date: item.updatedAt,
        tone: status.tone,
      };
    }),
    ...pageData.evidence
      .filter((item) => item.kind === "required_document")
      .map((item) => {
        const status = evidenceStatusLabel(item.status);
        return {
          id: `evidence-${item.id}`,
          title: item.label,
          detail: item.isRequired
            ? "Document a fournir pour continuer"
            : "Document complementaire",
          status: status.label,
          date: item.receivedAt ?? item.dueDate,
          tone: status.tone,
        };
      }),
  ];

  const documentsToProvide = documentsRows.filter(
    (item) => item.status === "Document a fournir",
  );
  const documentsUnderReview = documentsRows.filter(
    (item) => item.status === "En analyse",
  );
  const documentsValidated = documentsRows.filter(
    (item) => item.status === "Valide",
  );

  const paymentRows: DetailRow[] = pageData.evidence
    .filter((item) => item.kind === "invoice" || item.kind === "payment_proof")
    .map((item) => {
      const status = paymentStatusLabel(item.status);
      return {
        id: `payment-${item.id}`,
        title:
          item.kind === "invoice"
            ? "Demande de paiement"
            : "Preuve de paiement",
        detail: item.label,
        status: status.label,
        date: item.receivedAt ?? item.dueDate,
        tone: status.tone,
      };
    });

  const meetingRows: DetailRow[] = pageData.meetings.map((item) => {
    const status = meetingStatusLabel(
      item.outcome,
      Boolean(item.reportDocumentId),
    );
    return {
      id: `meeting-${item.id}`,
      title: item.title,
      detail: `${formatDate(item.scheduledAt)} - ${item.location}`,
      status: status.label,
      date: item.scheduledAt,
      tone: status.tone,
    };
  });

  const notificationRows: DetailRow[] = [
    ...pageData.timeline.map((event) => ({
      id: `timeline-${event.id}`,
      title: event.label,
      detail: event.description,
      status: "Notification disponible",
      date: event.occurredAt,
      tone: "default" as const,
    })),
    ...pageData.evidence
      .filter((item) => item.kind === "notification")
      .map((item) => ({
        id: `notice-${item.id}`,
        title: "Notification disponible",
        detail: item.label,
        status: "Notification disponible",
        date: item.receivedAt ?? item.dueDate,
        tone: "default" as const,
      })),
  ].sort((first, second) =>
    (second.date ?? "").localeCompare(first.date ?? ""),
  );

  const certificateLifecycle = pageData.certificate
    ? certificateStatusLabel(pageData.certificate.status)
    : undefined;
  const withdrawalStatus = pageData.certificate
    ? pageData.certificate.collectedAt
      ? "Retire"
      : pageData.certificate.readyForCollectionAt
        ? "Pret au retrait"
        : "En preparation"
    : "Aucun certificat";

  return (
    <div className="page-container">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/portal-preview">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour a l'accueil du portail
            </Link>
          </Button>
          <h1 className="page-title">
            Detail du dossier {pageData.dossier.reference}
          </h1>
          <p className="page-subtitle">
            {pageData.demande?.organizationName ?? "Organisme non renseigne"}
          </p>
        </div>
        <Badge variant="outline">Lecture seule</Badge>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
        Cette page est un prototype en lecture seule : aucune action d'envoi, de
        paiement ou de depot n'est disponible.
      </div>

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="meetings">Reunions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="certificate">Certificat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vue d'ensemble</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Reference dossier</dt>
                  <dd className="font-semibold">
                    {pageData.dossier.reference}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Organisme</dt>
                  <dd className="font-semibold">
                    {pageData.demande?.organizationName ?? "Non renseigne"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Type de demande</dt>
                  <dd className="font-semibold">
                    {pageData.demande?.requestType ?? "Non renseigne"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    Dossier en cours de traitement
                  </dt>
                  <dd className="font-semibold">
                    {pageData.demande
                      ? simplifiedPortalStatusLabel(
                          pageData.demande.portalStatus,
                        )
                      : "Dossier en cours de traitement"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Etape actuelle</dt>
                  <dd className="font-semibold">
                    {phaseLabel(pageData.dossier.currentPhase)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Action attendue</dt>
                  <dd className="font-semibold">
                    {pageData.nextAction?.label ??
                      (pageData.demande
                        ? actionForPortalStatus(pageData.demande.portalStatus)
                        : "Action attendue")}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-2">
                {pageData.phases.map((phase) => (
                  <div
                    key={phase.id}
                    className="rounded-md border bg-muted/10 p-3 text-sm"
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {phase.label}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Statut: {phaseStatusLabel(phase.status)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">A fournir</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailList
                  rows={documentsToProvide}
                  emptyMessage="Aucun document a fournir."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">En analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailList
                  rows={documentsUnderReview}
                  emptyMessage="Aucun document en analyse."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Valides</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailList
                  rows={documentsValidated}
                  emptyMessage="Aucun document valide."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                rows={paymentRows}
                emptyMessage="Aucun element de paiement pour ce dossier."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reunions</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                rows={meetingRows}
                emptyMessage="Aucune reunion pour ce dossier."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                rows={notificationRows}
                emptyMessage="Aucune notification disponible."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificate">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificat</CardTitle>
            </CardHeader>
            <CardContent>
              {pageData.certificate ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">
                      Reference certificat
                    </dt>
                    <dd className="font-semibold">
                      {pageData.certificate.certificateNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Certificat en preparation
                    </dt>
                    <dd className="font-semibold">
                      {certificateLifecycle?.label ??
                        "Certificat en preparation"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Statut de retrait</dt>
                    <dd className="font-semibold">{withdrawalStatus}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Preparation</dt>
                    <dd className="font-semibold">
                      {formatDate(pageData.certificate.preparedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Pret au retrait</dt>
                    <dd className="font-semibold">
                      {formatDate(pageData.certificate.readyForCollectionAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Retrait</dt>
                    <dd className="font-semibold">
                      {formatDate(pageData.certificate.collectedAt)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun certificat rattache a ce dossier.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
