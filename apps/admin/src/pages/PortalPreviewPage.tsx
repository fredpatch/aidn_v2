import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, FolderKanban, UserRound } from "lucide-react";
import {
  useAidnCertificates,
  useAidnDocuments,
  useAidnMeetings,
  useAidnTimelineEvents,
  useAidnPhaseEvidence,
  useAidnPhaseNextActions,
  useDemandes,
  useDossiers,
} from "@/features/aidn";
import { ErrorState, SkeletonCard } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  actionForPortalStatus,
  formatDate,
  pickDefaultOrganization,
  simplifiedPortalStatusLabel,
} from "./portal-preview/portalPreview.utils";

interface HomeUpdateRow {
  id: string;
  title: string;
  detail: string;
  date?: string;
}

export function PortalPreviewPage(): React.JSX.Element {
  const demandesQuery = useDemandes();
  const dossiersQuery = useDossiers();
  const documentsQuery = useAidnDocuments();
  const meetingsQuery = useAidnMeetings();
  const certificatesQuery = useAidnCertificates();
  const evidenceQuery = useAidnPhaseEvidence();
  const nextActionsQuery = useAidnPhaseNextActions();
  const timelineQuery = useAidnTimelineEvents();

  const organizations = useMemo(
    () =>
      Array.from(
        new Set(
          (demandesQuery.data ?? []).map((demande) => demande.organizationName),
        ),
      ),
    [demandesQuery.data],
  );
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const activeOrganization =
    selectedOrganization || pickDefaultOrganization(organizations);

  const isLoading =
    demandesQuery.isLoading ||
    dossiersQuery.isLoading ||
    documentsQuery.isLoading ||
    meetingsQuery.isLoading ||
    certificatesQuery.isLoading ||
    evidenceQuery.isLoading ||
    nextActionsQuery.isLoading ||
    timelineQuery.isLoading;
  const error =
    demandesQuery.error ??
    dossiersQuery.error ??
    documentsQuery.error ??
    meetingsQuery.error ??
    certificatesQuery.error ??
    evidenceQuery.error ??
    nextActionsQuery.error ??
    timelineQuery.error;

  const portalHome = useMemo(() => {
    const demandes = (demandesQuery.data ?? []).filter(
      (demande) => demande.organizationName === activeOrganization,
    );
    const demandeIds = new Set(demandes.map((demande) => demande.id));
    const dossiers = (dossiersQuery.data ?? [])
      .filter((dossier) => demandeIds.has(dossier.demandeId))
      .sort((first, second) => second.openedAt.localeCompare(first.openedAt));
    const activeDossier =
      dossiers.find((dossier) => dossier.globalStatus !== "closed") ??
      dossiers[0];
    const activeDemande =
      demandes.find((demande) => demande.id === activeDossier?.demandeId) ??
      demandes[0];
    const dossierIds = new Set(dossiers.map((dossier) => dossier.id));

    const documents = (documentsQuery.data ?? []).filter(
      (document) => document.dossierId && dossierIds.has(document.dossierId),
    );
    const meetings = (meetingsQuery.data ?? []).filter((meeting) =>
      dossierIds.has(meeting.dossierId),
    );
    const certificates = (certificatesQuery.data ?? []).filter((certificate) =>
      dossierIds.has(certificate.dossierId),
    );
    const evidence = (evidenceQuery.data ?? []).filter((item) =>
      dossierIds.has(item.dossierId),
    );
    const nextActions = (nextActionsQuery.data ?? []).filter(
      (item) => activeDossier && item.dossierId === activeDossier.id,
    );
    const timeline = (timelineQuery.data ?? [])
      .filter(
        (event) =>
          (event.demandeId ? demandeIds.has(event.demandeId) : false) ||
          (event.dossierId ? dossierIds.has(event.dossierId) : false),
      )
      .sort((first, second) =>
        second.occurredAt.localeCompare(first.occurredAt),
      );

    const nextExpectedAction =
      nextActions.find((item) => item.status === "pending")?.label ??
      (activeDemande
        ? actionForPortalStatus(activeDemande.portalStatus)
        : "Action attendue");

    const dates = [
      ...documents.map((item) => item.updatedAt),
      ...meetings.map((item) => item.scheduledAt),
      ...certificates.map(
        (item) =>
          item.collectedAt ??
          item.readyForCollectionAt ??
          item.preparedAt ??
          "",
      ),
      ...evidence.map((item) => item.receivedAt ?? item.dueDate ?? ""),
      ...timeline.map((item) => item.occurredAt),
    ].filter(Boolean);

    const lastUpdate = dates.sort((first, second) =>
      second.localeCompare(first),
    )[0];

    const recentUpdates: HomeUpdateRow[] = timeline
      .slice(0, 5)
      .map((event) => ({
        id: event.id,
        title: event.label,
        detail: event.description,
        date: event.occurredAt,
      }));

    return {
      activeDemande,
      activeDossier,
      nextExpectedAction,
      lastUpdate,
      recentUpdates,
    };
  }, [
    activeOrganization,
    certificatesQuery.data,
    demandesQuery.data,
    documentsQuery.data,
    dossiersQuery.data,
    evidenceQuery.data,
    meetingsQuery.data,
    nextActionsQuery.data,
    timelineQuery.data,
  ]);

  const refetchAll = (): void => {
    void demandesQuery.refetch();
    void dossiersQuery.refetch();
    void documentsQuery.refetch();
    void meetingsQuery.refetch();
    void certificatesQuery.refetch();
    void evidenceQuery.refetch();
    void nextActionsQuery.refetch();
    void timelineQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <SkeletonCard lines={5} />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard lines={6} />
          <SkeletonCard lines={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portail postulant - accueil</h1>
          <p className="page-subtitle">
            Un espace simple pour suivre un dossier en lecture seule.
          </p>
        </div>
        <Badge variant="outline">Demo</Badge>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetchAll} />
      ) : null}

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
        Apercu prototype : pas d'authentification reelle, pas de depot de
        document et pas de soumission dans cette vue.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-background p-2 text-muted-foreground">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">
              Apercu pour l'organisme
            </p>
            <p className="font-semibold text-slate-950 dark:text-white">
              {activeOrganization || "Aucun organisme"}
            </p>
          </div>
        </div>
        <Select
          value={activeOrganization}
          onValueChange={setSelectedOrganization}
        >
          <SelectTrigger
            className="h-9 w-full sm:w-72"
            aria-label="Choisir un organisme pour l'apercu"
          >
            <SelectValue placeholder="Choisir un organisme" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((organization) => (
              <SelectItem key={organization} value={organization}>
                {organization}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
            Dossier actif
          </CardTitle>
        </CardHeader>
        <CardContent>
          {portalHome.activeDossier && portalHome.activeDemande ? (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Reference dossier</p>
                  <p className="font-semibold">
                    {portalHome.activeDossier.reference}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type de demande</p>
                  <p className="font-semibold">
                    {portalHome.activeDemande.requestType}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ouverture</p>
                  <p className="font-semibold">
                    {formatDate(portalHome.activeDossier.openedAt)}
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link
                  to={`/portal-preview/dossiers/${portalHome.activeDossier.id}`}
                >
                  Ouvrir le detail du dossier
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun dossier actif pour cet organisme.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Dossier en cours de traitement
            </p>
            <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
              {portalHome.activeDemande
                ? simplifiedPortalStatusLabel(
                    portalHome.activeDemande.portalStatus,
                  )
                : "Dossier en cours de traitement"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Action attendue</p>
            <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
              {portalHome.nextExpectedAction}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Derniere mise a jour
            </p>
            <p className="mt-2 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <Clock3
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              {formatDate(portalHome.lastUpdate)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mises a jour recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {portalHome.recentUpdates.length > 0 ? (
            <div className="grid gap-3">
              {portalHome.recentUpdates.map((update) => (
                <div
                  key={update.id}
                  className="rounded-md border bg-background p-3"
                >
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {update.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {update.detail}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Mis a jour : {formatDate(update.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune mise a jour recente.
            </p>
          )}
        </CardContent>
      </Card>

      {portalHome.activeDossier ? (
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link
              to={`/portal-preview/dossiers/${portalHome.activeDossier.id}`}
            >
              Voir le detail du dossier
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Cette page reste volontairement simple pour le postulant : documents,
        paiements, reunions, notifications et certificat sont centralises dans
        la fiche dossier.
      </div>
    </div>
  );
}
