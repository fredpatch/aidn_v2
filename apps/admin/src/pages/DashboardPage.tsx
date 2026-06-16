import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  Inbox,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAdminDashboard,
  type AdminDashboardResponse,
  type DashboardPreset,
} from '@/lib/api/dashboard.api';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });
const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const PERIOD_OPTIONS: Array<{ label: string; preset: DashboardPreset }> = [
  { label: "Aujourd'hui", preset: 'today' },
  { label: '7 jours', preset: '7d' },
  { label: 'Mois en cours', preset: 'month' },
  { label: 'Année', preset: 'year' },
];

const warningMetricIds = new Set([
  'dgReturnedToRecord',
  'unassignedDossiers',
  'documentsToReview',
  'overduePhases',
]);

function formatDate(value?: string): string {
  if (!value) return 'Date non renseignée';
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value?: string): string {
  if (!value) return '';
  return dateTimeFormatter.format(new Date(value));
}

function isCertificateUnavailable(data?: AdminDashboardResponse): boolean {
  return data?.meta?.unavailableMetrics?.includes('certificates') === true;
}

function profileLabel(profile?: AdminDashboardResponse['profile']): string {
  return profile === 'courrier_dg' ? 'Vue courrier / DG' : 'Vue DN';
}

function unavailableValue(unavailable: boolean, value: number): string | number {
  return unavailable ? 'À venir' : value;
}

type Metric = {
  id: string;
  label: string;
  value: string | number;
  icon: ReactNode;
  unavailable?: boolean;
};

function buildPeriodMetrics(data: AdminDashboardResponse): Metric[] {
  const certificatesUnavailable = isCertificateUnavailable(data);

  if (data.profile === 'courrier_dg') {
    return [
      {
        id: 'requestsReceived',
        label: 'Demandes reçues',
        value: data.periodStats.requestsReceived,
        icon: <Inbox className="size-4" />,
      },
      {
        id: 'portalUpload',
        label: 'Dépôt portail',
        value: data.periodStats.requestsBySource.portalUpload,
        icon: <FileText className="size-4" />,
      },
      {
        id: 'physicalDeposit',
        label: 'Dépôt physique',
        value: data.periodStats.requestsBySource.physicalDeposit,
        icon: <FolderOpen className="size-4" />,
      },
      {
        id: 'internalScan',
        label: 'Scan interne',
        value: data.periodStats.requestsBySource.internalScan,
        icon: <CheckCircle2 className="size-4" />,
      },
    ];
  }

  return [
    {
      id: 'requestsReceived',
      label: 'Demandes reçues',
      value: data.periodStats.requestsReceived,
      icon: <Inbox className="size-4" />,
    },
    {
      id: 'requestsOrientedToDn',
      label: 'Orientées DN',
      value: data.periodStats.requestsOrientedToDn,
      icon: <FolderOpen className="size-4" />,
    },
    {
      id: 'requestsRejectedOrReoriented',
      label: 'Rejetées / réorientées',
      value: data.periodStats.requestsRejectedOrReoriented,
      icon: <AlertTriangle className="size-4" />,
    },
    {
      id: 'dossiersOpened',
      label: 'Dossiers ouverts',
      value: data.periodStats.dossiersOpened,
      icon: <FolderOpen className="size-4" />,
    },
    {
      id: 'phasesClosed',
      label: 'Phases clôturées',
      value: data.periodStats.phasesClosed,
      icon: <CheckCircle2 className="size-4" />,
    },
    {
      id: 'certificatesCollected',
      label: 'Certificats délivrés',
      value: unavailableValue(certificatesUnavailable, data.periodStats.certificatesCollected),
      icon: <FileText className="size-4" />,
      unavailable: certificatesUnavailable,
    },
  ];
}

function buildWorkloadMetrics(data: AdminDashboardResponse): Metric[] {
  const certificatesUnavailable = isCertificateUnavailable(data);
  const shared = [
    {
      id: 'dgToPrint',
      label: 'À imprimer DG',
      value: data.currentWorkload.dgToPrint,
      icon: <FileText className="size-4" />,
    },
    {
      id: 'dgAwaitingReturn',
      label: 'En attente du retour DG',
      value: data.currentWorkload.dgAwaitingReturn,
      icon: <Clock className="size-4" />,
    },
    {
      id: 'dgReturnedToRecord',
      label: 'Retours DG à traiter',
      value: data.currentWorkload.dgReturnedToRecord,
      icon: <AlertTriangle className="size-4" />,
    },
  ];

  if (data.profile === 'courrier_dg') {
    return [
      ...shared,
      {
        id: 'requestsReceived',
        label: 'Demandes reçues',
        value: data.periodStats.requestsReceived,
        icon: <Inbox className="size-4" />,
      },
    ];
  }

  return [
    ...shared,
    {
      id: 'activeDossiers',
      label: 'Dossiers actifs',
      value: data.currentWorkload.activeDossiers,
      icon: <FolderOpen className="size-4" />,
    },
    {
      id: 'unassignedDossiers',
      label: 'Dossiers non assignés',
      value: data.currentWorkload.unassignedDossiers,
      icon: <AlertTriangle className="size-4" />,
    },
    {
      id: 'documentsToReview',
      label: 'Documents à vérifier',
      value: data.currentWorkload.documentsToReview,
      icon: <FileText className="size-4" />,
    },
    {
      id: 'correctionsWaitingPostulant',
      label: 'Corrections postulant',
      value: data.currentWorkload.correctionsWaitingPostulant,
      icon: <Inbox className="size-4" />,
    },
    {
      id: 'upcomingMeetings',
      label: 'Réunions à venir',
      value: data.currentWorkload.upcomingMeetings,
      icon: <CalendarDays className="size-4" />,
    },
    {
      id: 'overduePhases',
      label: 'Phases en retard',
      value: data.currentWorkload.overduePhases,
      icon: <Clock className="size-4" />,
    },
    {
      id: 'certificatesReadyForCollection',
      label: 'Certificats prêts',
      value: unavailableValue(
        certificatesUnavailable,
        data.currentWorkload.certificatesReadyForCollection,
      ),
      icon: <CheckCircle2 className="size-4" />,
      unavailable: certificatesUnavailable,
    },
  ];
}

function SectionTitle({ title }: { title: string }): React.JSX.Element {
  return <h2 className="text-base font-semibold text-foreground">{title}</h2>;
}

function MetricBand({
  title,
  metrics,
  isLoading,
}: {
  title: string;
  metrics: Metric[];
  isLoading: boolean;
}): React.JSX.Element {
  return (
    <section className="space-y-3">
      <SectionTitle title={title} />
      <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div className="bg-card p-4" key={index}>
                <Skeleton className="mb-4 h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          : metrics.map((metric) => {
              const warning = warningMetricIds.has(metric.id) && Number(metric.value) > 0;
              const muted = metric.unavailable === true;
              return (
                <div className="bg-card p-4" key={metric.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <span className={warning ? 'text-amber-600' : 'text-muted-foreground'} aria-hidden="true">
                      {metric.icon}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className={muted ? 'text-3xl font-semibold tabular-nums text-muted-foreground' : 'text-3xl font-semibold tabular-nums text-foreground'}>{metric.value}</p>
                    <Badge variant="outline" className={muted ? 'text-muted-foreground' : undefined}>
                      {muted ? 'Non disponible' : warning ? 'À suivre' : 'Normal'}
                    </Badge>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }): React.JSX.Element {
  return (
    <Card role="alert">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="font-medium">Impossible de charger le tableau de bord.</p>
          <p className="text-sm text-muted-foreground">La connexion API n'a pas renvoyé les données attendues.</p>
        </div>
        <Button type="button" variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardPage(): React.JSX.Element {
  const [preset, setPreset] = useState<DashboardPreset>('month');
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard', preset, undefined, undefined],
    queryFn: () => getAdminDashboard({ preset }),
    staleTime: 30_000,
  });

  const data = dashboardQuery.data;
  const periodMetrics = useMemo(() => (data ? buildPeriodMetrics(data) : []), [data]);
  const workloadMetrics = useMemo(() => (data ? buildWorkloadMetrics(data) : []), [data]);
  const certificatesUnavailable = isCertificateUnavailable(data);
  const isDnProfile = data?.profile !== 'courrier_dg';

  return (
    <div className="page-container space-y-6">
      <header className="space-y-4 border-b pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="page-title">Tableau de bord</h1>
            <p className="page-subtitle">Vue d'ensemble opérationnelle de la Direction de la Navigabilité</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{profileLabel(data?.profile)}</Badge>
            {certificatesUnavailable ? <Badge variant="outline">Certificats : À venir</Badge> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.preset}
                type="button"
                size="sm"
                variant={preset === option.preset ? 'default' : 'outline'}
                onClick={() => setPreset(option.preset)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Période : {formatDate(data?.period.from)} - {formatDate(data?.period.to)}
          </p>
        </div>
      </header>

      {dashboardQuery.isError ? <DashboardError onRetry={() => void dashboardQuery.refetch()} /> : null}

      <MetricBand title="Indicateurs de période" metrics={periodMetrics} isLoading={dashboardQuery.isLoading} />
      <MetricBand title="Charge courante" metrics={workloadMetrics} isLoading={dashboardQuery.isLoading} />

      <div className={isDnProfile ? 'grid gap-4 xl:grid-cols-[1.4fr_1fr]' : 'grid gap-4'}>
        {isDnProfile ? <PhaseFocusCard data={data} isLoading={dashboardQuery.isLoading} /> : null}
        <PriorityActionsCard data={data} isLoading={dashboardQuery.isLoading} />
      </div>

      <RecentActivityCard data={data} isLoading={dashboardQuery.isLoading} />
    </div>
  );
}

function PhaseFocusCard({
  data,
  isLoading,
}: {
  data?: AdminDashboardResponse;
  isLoading: boolean;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Focus par phase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => <Skeleton className="h-16" key={index} />)
          : data?.phaseFocus.map((phase) => (
              <div
                className={phase.implemented ? 'rounded-md border p-3' : 'rounded-md border bg-muted/40 p-3 text-muted-foreground'}
                key={phase.phaseKey}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{phase.label}</p>
                  <Badge variant={phase.implemented || phase.currentDossiers > 0 ? 'secondary' : 'outline'}>
                    {phase.implemented ? 'Actif' : phase.currentDossiers > 0 ? 'Phase ouverte' : 'À venir'}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                  <span>Dossiers actuels : <strong>{phase.currentDossiers}</strong></span>
                  <span>Clôturées période : <strong>{phase.closedInPeriod}</strong></span>
                  <span>En retard : <strong>{phase.overdue}</strong></span>
                  <span>Délai prévu : <strong>{phase.expectedBusinessDays} jours ouvrés</strong></span>
                </div>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

function PriorityActionsCard({
  data,
  isLoading,
}: {
  data?: AdminDashboardResponse;
  isLoading: boolean;
}): React.JSX.Element {
  const actions = data?.priorityActions ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions prioritaires</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <Skeleton className="h-14" key={index} />)
        ) : actions.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Aucune action prioritaire pour le moment.
          </p>
        ) : (
          actions.map((action, index) => (
            <div className="rounded-md border p-3" key={`${action.type}-${index}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{action.label}</p>
                <Badge variant={action.priority === 'warning' ? 'secondary' : 'outline'}>
                  {action.priority === 'warning' ? 'À suivre' : 'Normal'}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {action.entityLabel ? <p className="font-medium text-foreground">{action.entityLabel}</p> : null}
                {action.dueLabel ? <p>{action.dueLabel}</p> : null}
                {action.occurredAt ? <p>{formatDateTime(action.occurredAt)}</p> : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({
  data,
  isLoading,
}: {
  data?: AdminDashboardResponse;
  isLoading: boolean;
}): React.JSX.Element {
  const activity = data?.recentActivity ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Activité récente</CardTitle>
        <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => <Skeleton className="h-12" key={index} />)
        ) : activity.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Aucune activité récente.
          </p>
        ) : (
          activity.map((item, index) => (
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3" key={`${item.type}-${index}`}>
              <div className="space-y-1">
                <p className="font-medium">{item.label}</p>
                <div className="space-y-0.5 text-sm text-muted-foreground">
                  {item.actorName ? <p>{item.actorName}</p> : null}
                  {item.entityLabel ? <p>{item.entityLabel}</p> : null}
                  {item.documentName ? <p>{item.documentName}</p> : null}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{formatDateTime(item.occurredAt)}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
