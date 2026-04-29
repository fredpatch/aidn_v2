import { useMemo, useState } from 'react';
import { ClipboardList, FileText, Stamp, TimerReset } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AIDN_OMA_PHASE_KEYS,
  getEntryChannelLabel,
  getInternalDemandeStatusLabel,
  getPortalStatusLabel,
  useAidnCertificates,
  useAidnDocuments,
  useAidnOmaPhases,
  useAidnPhaseEvidence,
  useCourriers,
  useDemandes,
  useDgDecisionRecords,
  useDossiers,
  type AidnCertificateStatus,
  type AidnEntryChannel,
  type AidnEvidenceKind,
  type AidnInternalDemandeStatus,
  type AidnOmaPhaseKey,
  type AidnPhaseEvidenceStatus,
  type AidnPortalStatus,
} from '@/features/aidn';
import { AnimatedCardGrid } from '@/components/motion/AnimatedCardGrid';
import { ErrorState, SkeletonCard } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PeriodFilter = 'all' | 'month' | 'quarter' | 'year';
type ReportView = 'summary' | 'durations' | 'requests' | 'certificates' | 'completeness';

const reportNow = new Date('2026-04-29T00:00:00Z');

const periodLabels: Record<PeriodFilter, string> = {
  all: 'Toutes',
  month: 'Ce mois',
  quarter: 'Ce trimestre',
  year: 'Cette annee',
};

const viewLabels: Record<ReportView, string> = {
  summary: 'Synthese',
  durations: 'Delais',
  requests: 'Demandes',
  certificates: 'Certificats',
  completeness: 'Completude',
};

const phaseLabels: Record<AidnOmaPhaseKey, string> = {
  preliminary: 'Phase preliminaire',
  formal_application: 'Demande formelle',
  document_evaluation: 'Evaluation documents',
  onsite_demonstration: 'Inspection sur site',
  delivery: 'Delivrance',
};

const certificateStatusLabels: Record<AidnCertificateStatus, string> = {
  to_prepare: 'A preparer',
  printed: 'Imprime',
  signed_stamped: 'Signe/cachete',
  scanned_in_aidn: 'Scanne dans AIDN',
  ready_for_collection: 'Pret au retrait',
  collected: 'Remis au postulant',
  archived: 'Archive',
};

const evidenceStatusLabels: Record<AidnPhaseEvidenceStatus, string> = {
  expected: 'Attendu',
  received: 'Recu',
  scanned: 'Scanne',
  pending_review: 'A verifier',
  validated: 'Valide',
  missing: 'Manquant',
  not_applicable: 'Non applicable',
};

const evidenceKindLabels: Record<AidnEvidenceKind, string> = {
  required_document: 'Document requis',
  formal_courrier: 'Courrier formel',
  meeting_report: 'Compte rendu',
  invoice: 'Facture',
  payment_proof: 'Preuve paiement',
  r3_opinion: 'Avis R3',
  certificate_artifact: 'Piece certificat',
  notification: 'Notification',
};

const chartColors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#4b5563'];

function percent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function countBy<T extends string>(values: T[]): Record<T, number> {
  return values.reduce(
    (acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    },
    {} as Record<T, number>,
  );
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start?: string, end?: string): number | null {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return null;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function average(values: Array<number | null>): number | null {
  const usable = values.filter((value): value is number => typeof value === 'number');
  if (usable.length === 0) return null;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function formatDuration(value: number | null): string {
  if (value === null) return 'Non calculable';
  return `${value} j`;
}

function isInPeriod(value: string | undefined, period: PeriodFilter): boolean {
  const date = parseDate(value);
  if (!date) return false;
  if (period === 'all') return true;
  if (period === 'year') return date.getFullYear() === reportNow.getFullYear();
  if (period === 'month') return date.getFullYear() === reportNow.getFullYear() && date.getMonth() === reportNow.getMonth();
  const quarter = Math.floor(reportNow.getMonth() / 3);
  return date.getFullYear() === reportNow.getFullYear() && Math.floor(date.getMonth() / 3) === quarter;
}

function isClosureEvidence(label: string): boolean {
  return label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .includes('cloture');
}

function ReportCard({ title, value, subtitle, icon: Icon }: { title: string; value: string | number; subtitle: string; icon: React.ElementType }): React.JSX.Element {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DistributionRow({ label, count, total }: { label: string; count: number; total: number }): React.JSX.Element {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <Progress value={percent(count, total)} className="h-2" />
    </div>
  );
}

function ReportBarChart({ data, valueSuffix = '' }: { data: Array<{ label: string; value: number }>; valueSuffix?: string }): React.JSX.Element {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Donnees insuffisantes.</p>;
  }

  const chartHeight = Math.max(220, data.length * 38);

  return (
    <div className="h-[var(--report-chart-height)] min-h-56" style={{ '--report-chart-height': `${chartHeight}px` } as React.CSSProperties}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 40, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            dataKey="label"
            type="category"
            width={148}
            interval={0}
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.45)' }}
            formatter={(value) => [`${value}${valueSuffix}`, 'Valeur']}
            contentStyle={{
              borderRadius: 8,
              borderColor: 'hsl(var(--border))',
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((item, index) => (
              <Cell key={item.label} fill={chartColors[index % chartColors.length]} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(value) => `${value ?? 0}${valueSuffix}`} className="fill-muted-foreground text-xs" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DurationRow({ label, value, detail }: { label: string; value: number | null; detail: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="text-xl font-bold">{formatDuration(value)}</span>
      </div>
    </div>
  );
}

function CountRow({ label, value, detail }: { label: string; value: number; detail: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="text-xl font-bold">{value}</span>
      </div>
    </div>
  );
}

export function ReportsPage(): React.JSX.Element {
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [view, setView] = useState<ReportView>('summary');

  const demandesQuery = useDemandes();
  const courriersQuery = useCourriers();
  const decisionsQuery = useDgDecisionRecords();
  const dossiersQuery = useDossiers();
  const phasesQuery = useAidnOmaPhases();
  const documentsQuery = useAidnDocuments();
  const certificatesQuery = useAidnCertificates();
  const evidenceQuery = useAidnPhaseEvidence();

  const isLoading =
    demandesQuery.isLoading ||
    courriersQuery.isLoading ||
    decisionsQuery.isLoading ||
    dossiersQuery.isLoading ||
    phasesQuery.isLoading ||
    documentsQuery.isLoading ||
    certificatesQuery.isLoading ||
    evidenceQuery.isLoading;
  const error =
    demandesQuery.error ??
    courriersQuery.error ??
    decisionsQuery.error ??
    dossiersQuery.error ??
    phasesQuery.error ??
    documentsQuery.error ??
    certificatesQuery.error ??
    evidenceQuery.error;

  const report = useMemo(() => {
    const demandes = demandesQuery.data ?? [];
    const dossiers = dossiersQuery.data ?? [];
    const phases = phasesQuery.data ?? [];
    const certificates = certificatesQuery.data ?? [];
    const evidence = evidenceQuery.data ?? [];

    const periodDemandes = period === 'all' ? demandes : demandes.filter((demande) => isInPeriod(demande.submittedAt, period));
    const periodDossiers = period === 'all' ? dossiers : dossiers.filter((dossier) => isInPeriod(dossier.openedAt, period));
    const periodCertificates = period === 'all'
      ? certificates
      : certificates.filter((certificate) => isInPeriod(certificate.collectedAt ?? certificate.deliveredAt ?? certificate.issuedAt ?? certificate.readyForCollectionAt, period));

    const demandeById = new Map(demandes.map((demande) => [demande.id, demande]));
    const dossierById = new Map(dossiers.map((dossier) => [dossier.id, dossier]));
    const collectedCertificates = periodCertificates.filter((certificate) => certificate.status === 'collected' || Boolean(certificate.collectedAt));
    const readyCertificates = periodCertificates.filter((certificate) => certificate.status === 'ready_for_collection');
    const rejectedRequests = periodDemandes.filter((demande) => demande.internalStatus === 'rejected' || demande.portalStatus === 'request_rejected').length;

    const globalDurations = certificates.map((certificate) => {
      const dossier = dossierById.get(certificate.dossierId);
      const demande = dossier ? demandeById.get(dossier.demandeId) : undefined;
      return daysBetween(demande?.submittedAt, certificate.collectedAt ?? certificate.deliveredAt ?? certificate.issuedAt);
    });

    const phaseDurations = AIDN_OMA_PHASE_KEYS.map((key) => {
      const phaseRows = phases.filter((phase) => phase.key === key);
      return {
        key,
        average: average(phaseRows.map((phase) => daysBetween(phase.startedAt, phase.completedAt))),
        completed: phaseRows.filter((phase) => phase.completedAt).length,
        lateOrBlocked: phaseRows.filter((phase) => phase.status === 'late' || phase.status === 'blocked').length,
      };
    });
    const calculablePhaseDurations = phaseDurations.filter((phase): phase is typeof phase & { average: number } => typeof phase.average === 'number');
    const longestPhase = calculablePhaseDurations.length > 0
      ? calculablePhaseDurations.reduce((longest, phase) => (phase.average > longest.average ? phase : longest))
      : null;
    const formalPhaseAverage = phaseDurations.find((phase) => phase.key === 'formal_application')?.average ?? null;

    const longestActiveDossiers = dossiers
      .filter((dossier) => dossier.globalStatus !== 'closed')
      .map((dossier) => ({
        id: dossier.id,
        reference: dossier.reference,
        age: daysBetween(dossier.openedAt, reportNow.toISOString()),
        status: dossier.globalStatus,
      }))
      .sort((first, second) => (second.age ?? 0) - (first.age ?? 0))
      .slice(0, 5);

    const evidenceStatuses = countBy(evidence.map((item) => item.status));
    const evidenceKinds = countBy(evidence.map((item) => item.kind));
    const missingRequiredEvidence = evidence.filter((item) => item.isRequired && (item.status === 'missing' || item.status === 'expected')).length;
    const missingClosureCourriers = evidence.filter((item) => item.kind === 'formal_courrier' && isClosureEvidence(item.label) && !['received', 'scanned', 'validated'].includes(item.status)).length;
    const missingPaymentProofs = evidence.filter((item) => item.kind === 'payment_proof' && (item.status === 'missing' || item.status === 'expected')).length;

    return {
      demandesReceived: periodDemandes.length,
      dossiersOpened: periodDossiers.length,
      rejectedRequests,
      readyCertificates: readyCertificates.length,
      collectedCertificates: collectedCertificates.length,
      averageGlobalDuration: average(globalDurations),
      phaseDurations,
      longestPhase,
      formalPhaseAverage,
      longestActiveDossiers,
      lateOrBlockedPhases: phases.filter((phase) => phase.status === 'late' || phase.status === 'blocked').length,
      demandesByRequestType: countBy(periodDemandes.map((demande) => demande.requestType)),
      demandesByEntryChannel: countBy(periodDemandes.map((demande) => demande.entryChannel)),
      demandesByInternalStatus: countBy(periodDemandes.map((demande) => demande.internalStatus)),
      demandesByPortalStatus: countBy(periodDemandes.map((demande) => demande.portalStatus)),
      certificatesByStatus: countBy(periodCertificates.map((certificate) => certificate.status)),
      certificatesByType: countBy(periodCertificates.map((certificate) => certificate.certificateType)),
      archivedCertificates: periodCertificates.filter((certificate) => certificate.status === 'archived').length,
      evidenceStatuses,
      evidenceKinds,
      missingRequiredEvidence,
      missingClosureCourriers,
      missingPaymentProofs,
      entryChannelChartData: (['portal', 'physical_deposit', 'hybrid'] as AidnEntryChannel[]).map((channel) => ({
        label: getEntryChannelLabel(channel),
        value: countBy(periodDemandes.map((demande) => demande.entryChannel))[channel] ?? 0,
      })),
      phaseDurationChartData: phaseDurations
        .filter((phase): phase is typeof phase & { average: number } => typeof phase.average === 'number')
        .map((phase) => ({ label: phaseLabels[phase.key], value: phase.average })),
      certificateLifecycleChartData: Object.entries(certificateStatusLabels).map(([status, label]) => ({
        label,
        value: countBy(periodCertificates.map((certificate) => certificate.status))[status as AidnCertificateStatus] ?? 0,
      })),
      requestStatusChartData: [
        ...Object.entries(countBy(periodDemandes.map((demande) => demande.internalStatus))).map(([status, value]) => ({
          label: getInternalDemandeStatusLabel(status as AidnInternalDemandeStatus),
          value,
        })),
        ...Object.entries(countBy(periodDemandes.map((demande) => demande.portalStatus))).map(([status, value]) => ({
          label: getPortalStatusLabel(status as AidnPortalStatus),
          value,
        })),
      ],
    };
  }, [certificatesQuery.data, demandesQuery.data, dossiersQuery.data, evidenceQuery.data, period, phasesQuery.data]);

  const refetchAll = (): void => {
    void demandesQuery.refetch();
    void courriersQuery.refetch();
    void decisionsQuery.refetch();
    void dossiersQuery.refetch();
    void phasesQuery.refetch();
    void documentsQuery.refetch();
    void certificatesQuery.refetch();
    void evidenceQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <SkeletonCard lines={5} />
        <div className="grid gap-4 md:grid-cols-2">
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
          <h1 className="page-title">Rapports & statistiques</h1>
          <p className="page-subtitle">Indicateurs de suivi des demandes, delais OMA, certificats et completude documentaire.</p>
        </div>
        <Badge variant="outline">Prototype lecture seule</Badge>
      </div>

      {error ? <ErrorState message={error.message} onRetry={refetchAll} /> : null}

      <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium" htmlFor="report-period">Periode</label>
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodFilter)}>
            <SelectTrigger id="report-period" className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium" htmlFor="report-view">Vue</label>
          <Select value={view} onValueChange={(value) => setView(value as ReportView)}>
            <SelectTrigger id="report-view" className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(viewLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
        Les volumes indiquent des nombres. Les delais sont exprimes en jours.
      </p>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Synthese d'activite</h2>
        <AnimatedCardGrid className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard title="Demandes recues" value={report.demandesReceived} subtitle={periodLabels[period]} icon={ClipboardList} />
          <ReportCard title="Dossiers DN ouverts" value={report.dossiersOpened} subtitle="Ouvertures de dossiers" icon={FileText} />
          <ReportCard title="Demandes non retenues" value={report.rejectedRequests} subtitle="Rejetees ou non poursuivies" icon={ClipboardList} />
          <ReportCard title="Certificats remis" value={report.collectedCertificates} subtitle="Remise/collection tracee" icon={Stamp} />
        </AnimatedCardGrid>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Delais cles</h2>
        <AnimatedCardGrid className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard title="Delai moyen du processus" value={formatDuration(report.averageGlobalDuration)} subtitle="Demande initiale -> remise certificat" icon={TimerReset} />
          <ReportCard title="Phase la plus longue" value={report.longestPhase ? formatDuration(report.longestPhase.average) : 'Non calculable'} subtitle={report.longestPhase ? phaseLabels[report.longestPhase.key] : 'Donnees insuffisantes'} icon={TimerReset} />
          <ReportCard title="Phases en retard/bloquees" value={report.lateOrBlockedPhases} subtitle="Nombre de phases a surveiller" icon={TimerReset} />
          <ReportCard title="Delai phase formelle" value={formatDuration(report.formalPhaseAverage)} subtitle="Moyenne Phase 2" icon={TimerReset} />
        </AnimatedCardGrid>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Analyse visuelle</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Demandes par canal d'entree">
            <ReportBarChart data={report.entryChannelChartData} />
          </SectionCard>
          <SectionCard title="Delai moyen par phase">
            <ReportBarChart data={report.phaseDurationChartData} valueSuffix=" j" />
            {report.phaseDurationChartData.length < AIDN_OMA_PHASE_KEYS.length ? (
              <p className="mt-3 text-xs text-muted-foreground">Les phases sans dates de debut et cloture sont affichees comme non calculables et omises du graphique.</p>
            ) : null}
          </SectionCard>
          <SectionCard title="Demandes par statut">
            <ReportBarChart data={report.requestStatusChartData} />
          </SectionCard>
          <SectionCard title="Certificats par cycle de vie">
            <ReportBarChart data={report.certificateLifecycleChartData} />
          </SectionCard>
        </div>
      </section>

      {(view === 'summary' || view === 'durations') ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <SectionCard title="Synthese periode">
            <div className="grid gap-3 sm:grid-cols-2">
              <CountRow label="Demandes recues" value={report.demandesReceived} detail="Nombre de demandes sur la periode" />
              <CountRow label="Dossiers DN ouverts" value={report.dossiersOpened} detail="Ouvertures apres orientation favorable" />
              <CountRow label="Demandes rejetees/non retenues" value={report.rejectedRequests} detail="Demandes non poursuivies" />
              <CountRow label="Certificats prets/remis" value={report.readyCertificates + report.collectedCertificates} detail={`${report.readyCertificates} pret(s), ${report.collectedCertificates} remis`} />
            </div>
          </SectionCard>

          <SectionCard title="Durees de traitement">
            <p className="mb-3 text-sm text-muted-foreground">Les delais sont exprimes en jours.</p>
            <div className="grid gap-3">
              <DurationRow label="Delai moyen du processus" value={report.averageGlobalDuration} detail="Calculable seulement quand demande et remise certificat existent" />
              {report.phaseDurations.map((phase) => (
                <DurationRow key={phase.key} label={phaseLabels[phase.key]} value={phase.average} detail={`${phase.completed} phase(s) cloturee(s), ${phase.lateOrBlocked} retard/blocage`} />
              ))}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {view === 'durations' ? (
        <SectionCard title="Dossiers actifs les plus longs">
          <div className="grid gap-2">
            {report.longestActiveDossiers.map((dossier) => (
              <div key={dossier.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm">
                <span className="font-medium">{dossier.reference}</span>
                <span className="text-muted-foreground">{formatDuration(dossier.age)} depuis ouverture</span>
                <Badge variant="secondary">{dossier.status}</Badge>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Phases en retard ou bloquees : {report.lateOrBlockedPhases}</p>
        </SectionCard>
      ) : null}

      {(view === 'summary' || view === 'requests') ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Demandes par type">
            <div className="space-y-4">
              {Object.entries(report.demandesByRequestType).map(([label, count]) => <DistributionRow key={label} label={label} count={count} total={report.demandesReceived} />)}
            </div>
          </SectionCard>
          <SectionCard title="Demandes par canal et statut">
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Par canal d'entree</h3>
              {Object.entries(report.demandesByEntryChannel).map(([key, count]) => <DistributionRow key={key} label={getEntryChannelLabel(key as AidnEntryChannel)} count={count} total={report.demandesReceived} />)}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Par statut</h3>
              {Object.entries(report.demandesByInternalStatus).map(([key, count]) => <DistributionRow key={key} label={getInternalDemandeStatusLabel(key as AidnInternalDemandeStatus)} count={count} total={report.demandesReceived} />)}
              {Object.entries(report.demandesByPortalStatus).map(([key, count]) => <DistributionRow key={key} label={getPortalStatusLabel(key as AidnPortalStatus)} count={count} total={report.demandesReceived} />)}
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {(view === 'summary' || view === 'certificates') ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Certificats par cycle de vie">
            <div className="space-y-4">
              {Object.entries(certificateStatusLabels).map(([key, label]) => (
                <DistributionRow key={key} label={label} count={report.certificatesByStatus[key as AidnCertificateStatus] ?? 0} total={Object.values(report.certificatesByStatus).reduce((sum, count) => sum + count, 0)} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">Pret au retrait: {report.readyCertificates}</Badge>
              <Badge variant="secondary">Remis: {report.collectedCertificates}</Badge>
              <Badge variant="secondary">Archives: {report.archivedCertificates}</Badge>
            </div>
          </SectionCard>
          <SectionCard title="Certificats par type">
            <div className="space-y-4">
              {Object.entries(report.certificatesByType).map(([label, count]) => <DistributionRow key={label} label={label} count={count} total={Object.values(report.certificatesByType).reduce((sum, item) => sum + item, 0)} />)}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {(view === 'summary' || view === 'completeness') ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Completude / preuves par statut">
            <div className="space-y-4">
              {Object.entries(evidenceStatusLabels).map(([key, label]) => (
                <DistributionRow key={key} label={label} count={report.evidenceStatuses[key as AidnPhaseEvidenceStatus] ?? 0} total={Object.values(report.evidenceStatuses).reduce((sum, count) => sum + count, 0)} />
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Alertes de completude">
            <div className="grid gap-3">
              <CountRow label="Preuves attendues ou manquantes" value={report.missingRequiredEvidence} detail="Mock evidence required avec statut attendu ou manquant" />
              <CountRow label="Courriers de cloture a rattacher" value={report.missingClosureCourriers} detail="Courriers de cloture pas encore recus/scannes/valides" />
              <CountRow label="Preuves de paiement manquantes" value={report.missingPaymentProofs} detail="Phases avec quittance/preuve paiement attendue" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(evidenceKindLabels).map(([key, label]) => <Badge key={key} variant="secondary">{label}: {report.evidenceKinds[key as AidnEvidenceKind] ?? 0}</Badge>)}
            </div>
          </SectionCard>
        </div>
      ) : null}

      <SectionCard title="Note de lecture">
        <p className="text-sm text-muted-foreground">
          Les volumes sont des nombres de dossiers/demandes/documents. Les delais sont exprimes en jours. Ces indicateurs sont calcules a partir des donnees mock du prototype. Les exports PDF/Excel et les agregations backend seront etudies apres validation du MVP.
        </p>
      </SectionCard>
    </div>
  );
}
