import { useMemo, useState } from 'react';
import { Bell, CalendarDays, ClipboardList, CreditCard, FileText, PackageCheck, UserRound } from 'lucide-react';
import {
  getPortalStatusLabel,
  useAidnCertificates,
  useAidnDocuments,
  useAidnMeetings,
  useAidnPhaseEvidence,
  useAidnPhaseNextActions,
  useDemandes,
  useDossiers,
  type AidnCertificateStatus,
  type AidnDemande,
  type AidnDocumentStatus,
  type AidnPhaseEvidenceStatus,
  type AidnPortalStatus,
} from '@/features/aidn';
import { ErrorState, SkeletonCard } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type StatusTone = 'default' | 'success' | 'warning' | 'muted';

interface PortalRow {
  id: string;
  title: string;
  detail: string;
  status: string;
  date?: string;
  tone?: StatusTone;
}

const portalStatusTone: Partial<Record<AidnPortalStatus, StatusTone>> = {
  action_required: 'warning',
  payment_expected: 'warning',
  meeting_to_schedule: 'warning',
  certificate_ready_for_collection: 'success',
  certificate_collected: 'success',
  request_rejected: 'warning',
  dossier_closed: 'muted',
};

const statusClassNames: Record<StatusTone, string> = {
  default: 'border-primary/20 bg-primary/10 text-primary',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  muted: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

function formatDate(value?: string): string {
  if (!value) return 'Non renseigne';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function StatusBadge({ label, tone = 'default' }: { label: string; tone?: StatusTone }): React.JSX.Element {
  return (
    <Badge variant="outline" className={statusClassNames[tone]}>
      {label}
    </Badge>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }): React.JSX.Element {
  return <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">{message}</p>;
}

function PortalRowList({ rows, emptyMessage }: { rows: PortalRow[]; emptyMessage: string }): React.JSX.Element {
  if (rows.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-md border bg-background p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-950 dark:text-white">{row.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
              {row.date ? <p className="mt-2 text-xs text-muted-foreground">Mis a jour : {formatDate(row.date)}</p> : null}
            </div>
            <StatusBadge label={row.status} tone={row.tone} />
          </div>
        </div>
      ))}
    </div>
  );
}

function documentStatusLabel(status: AidnDocumentStatus): { label: string; tone: StatusTone } {
  if (status === 'missing') return { label: 'A fournir', tone: 'warning' };
  if (status === 'received') return { label: 'Recu', tone: 'default' };
  if (status === 'to_review') return { label: 'En analyse', tone: 'default' };
  if (status === 'validated') return { label: 'Valide', tone: 'success' };
  return { label: 'A fournir', tone: 'warning' };
}

function evidenceStatusLabel(status: AidnPhaseEvidenceStatus): { label: string; tone: StatusTone } {
  if (status === 'expected' || status === 'missing') return { label: 'A fournir', tone: 'warning' };
  if (status === 'received' || status === 'scanned') return { label: 'Recu', tone: 'default' };
  if (status === 'pending_review') return { label: 'En analyse', tone: 'default' };
  if (status === 'validated') return { label: 'Valide', tone: 'success' };
  return { label: 'Non applicable', tone: 'muted' };
}

function certificateStatusLabel(status: AidnCertificateStatus): { label: string; tone: StatusTone } {
  if (status === 'ready_for_collection') return { label: 'Certificat pret au retrait', tone: 'success' };
  if (status === 'collected' || status === 'archived') return { label: 'Certificat remis', tone: 'success' };
  return { label: 'Certificat en preparation', tone: 'default' };
}

function actionForPortalStatus(status: AidnPortalStatus): string {
  if (status === 'action_required') return 'Une action est attendue de votre part.';
  if (status === 'payment_expected') return 'Un paiement est attendu.';
  if (status === 'meeting_to_schedule') return 'Une reunion doit etre planifiee.';
  if (status === 'meeting_scheduled') return 'Une reunion est programmee.';
  if (status === 'certificate_ready_for_collection') return 'Votre certificat est pret au retrait.';
  if (status === 'certificate_collected') return 'Votre certificat a ete remis.';
  if (status === 'request_rejected') return 'La demande ne sera pas poursuivie.';
  return 'Aucune action immediate indiquee.';
}

function pickDefaultOrganization(demandes: AidnDemande[]): string {
  return demandes.find((demande) => demande.portalStatus !== 'request_received')?.organizationName ?? demandes[0]?.organizationName ?? '';
}

export function PortalPreviewPage(): React.JSX.Element {
  const demandesQuery = useDemandes();
  const dossiersQuery = useDossiers();
  const documentsQuery = useAidnDocuments();
  const meetingsQuery = useAidnMeetings();
  const certificatesQuery = useAidnCertificates();
  const evidenceQuery = useAidnPhaseEvidence();
  const nextActionsQuery = useAidnPhaseNextActions();

  const organizations = useMemo(
    () => Array.from(new Set((demandesQuery.data ?? []).map((demande) => demande.organizationName))),
    [demandesQuery.data],
  );
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const activeOrganization = selectedOrganization || pickDefaultOrganization(demandesQuery.data ?? []);

  const isLoading =
    demandesQuery.isLoading ||
    dossiersQuery.isLoading ||
    documentsQuery.isLoading ||
    meetingsQuery.isLoading ||
    certificatesQuery.isLoading ||
    evidenceQuery.isLoading ||
    nextActionsQuery.isLoading;
  const error =
    demandesQuery.error ??
    dossiersQuery.error ??
    documentsQuery.error ??
    meetingsQuery.error ??
    certificatesQuery.error ??
    evidenceQuery.error ??
    nextActionsQuery.error;

  const portal = useMemo(() => {
    const demandes = (demandesQuery.data ?? []).filter((demande) => demande.organizationName === activeOrganization);
    const demandeIds = new Set(demandes.map((demande) => demande.id));
    const dossiers = (dossiersQuery.data ?? []).filter((dossier) => demandeIds.has(dossier.demandeId));
    const dossierIds = new Set(dossiers.map((dossier) => dossier.id));
    const documents = (documentsQuery.data ?? []).filter((document) => (document.demandeId && demandeIds.has(document.demandeId)) || (document.dossierId && dossierIds.has(document.dossierId)));
    const meetings = (meetingsQuery.data ?? []).filter((meeting) => dossierIds.has(meeting.dossierId));
    const certificates = (certificatesQuery.data ?? []).filter((certificate) => dossierIds.has(certificate.dossierId));
    const evidence = (evidenceQuery.data ?? []).filter((item) => dossierIds.has(item.dossierId));

    const demandeRows: PortalRow[] = demandes.map((demande) => ({
      id: demande.id,
      title: demande.reference,
      detail: `${demande.requestType} - ${demande.organizationName}`,
      status: getPortalStatusLabel(demande.portalStatus),
      date: demande.submittedAt,
      tone: portalStatusTone[demande.portalStatus],
    }));

    const documentRows: PortalRow[] = [
      ...documents.map((document) => {
        const status = documentStatusLabel(document.status);
        return {
          id: document.id,
          title: document.title,
          detail: document.phaseKey ? 'Piece rattachee au dossier' : 'Piece rattachee a la demande',
          status: status.label,
          date: document.updatedAt,
          tone: status.tone,
        };
      }),
      ...evidence
        .filter((item) => item.kind === 'required_document' && ['expected', 'missing', 'pending_review', 'received', 'validated'].includes(item.status))
        .map((item) => {
          const status = evidenceStatusLabel(item.status);
          return {
            id: item.id,
            title: 'Piece justificative',
            detail: item.isRequired ? 'Piece requise pour poursuivre le dossier' : 'Piece complementaire',
            status: status.label,
            date: item.receivedAt ?? item.dueDate,
            tone: status.tone,
          };
        }),
    ];

    const paymentRows: PortalRow[] = evidence
      .filter((item) => item.kind === 'invoice' || item.kind === 'payment_proof')
      .map((item) => {
        const isInvoice = item.kind === 'invoice';
        const status = evidenceStatusLabel(item.status);
        return {
          id: item.id,
          title: isInvoice ? 'Facture disponible' : 'Preuve de paiement',
          detail: isInvoice ? 'Element de paiement rattache au dossier' : 'Justificatif attendu ou recu',
          status: item.status === 'expected' || item.status === 'missing' ? 'Paiement attendu' : status.label,
          date: item.receivedAt ?? item.dueDate,
          tone: item.status === 'expected' || item.status === 'missing' ? 'warning' : status.tone,
        };
      });

    const meetingRows: PortalRow[] = meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      detail: `${meeting.location} - ${meeting.outcome === 'planned' ? 'A venir' : meeting.outcome === 'held' ? 'Tenue' : 'Reprogrammee'}`,
      status: meeting.reportDocumentId ? 'Compte rendu disponible' : meeting.outcome === 'planned' ? 'Reunion programmee' : 'Compte rendu a venir',
      date: meeting.scheduledAt,
      tone: meeting.outcome === 'planned' ? 'default' : 'success',
    }));

    const certificateRows: PortalRow[] = certificates.map((certificate) => {
      const status = certificateStatusLabel(certificate.status);
      return {
        id: certificate.id,
        title: certificate.certificateNumber,
        detail: `${certificate.holderName} - ${certificate.certificateType}`,
        status: status.label,
        date: certificate.collectedAt ?? certificate.readyForCollectionAt ?? certificate.preparedAt,
        tone: status.tone,
      };
    });

    const actionRows: PortalRow[] = [
      ...demandes
        .filter((demande) => ['action_required', 'payment_expected', 'meeting_to_schedule', 'meeting_scheduled', 'certificate_ready_for_collection'].includes(demande.portalStatus))
        .map((demande) => ({
          id: `action-${demande.id}`,
          title: actionForPortalStatus(demande.portalStatus),
          detail: demande.reference,
          status: getPortalStatusLabel(demande.portalStatus),
          date: demande.submittedAt,
          tone: portalStatusTone[demande.portalStatus] ?? 'default',
        })),
      ...documentRows.filter((row) => row.status === 'A fournir').slice(0, 3).map((row) => ({ ...row, id: `action-${row.id}`, title: 'Document a fournir' })),
      ...paymentRows.filter((row) => row.status === 'Paiement attendu').slice(0, 2).map((row) => ({ ...row, id: `action-${row.id}`, title: 'Paiement attendu' })),
      ...certificateRows.filter((row) => row.status === 'Certificat pret au retrait').map((row) => ({ ...row, id: `action-${row.id}`, title: 'Retrait du certificat' })),
    ];

    const notificationRows: PortalRow[] = [
      ...demandes.map((demande) => ({
        id: `notice-${demande.id}`,
        title: getPortalStatusLabel(demande.portalStatus),
        detail: `${demande.reference} - ${actionForPortalStatus(demande.portalStatus)}`,
        status: 'Notification',
        date: demande.submittedAt,
        tone: portalStatusTone[demande.portalStatus] ?? 'default',
      })),
      ...evidence
        .filter((item) => item.kind === 'notification')
        .map((item) => {
          const status = evidenceStatusLabel(item.status);
          return {
            id: `notice-${item.id}`,
            title: 'Notification disponible',
            detail: 'Information publiee dans le suivi du dossier',
            status: status.label,
            date: item.receivedAt ?? item.dueDate,
            tone: status.tone,
          };
        }),
    ];

    return {
      demandes: demandeRows,
      actions: actionRows,
      documents: documentRows,
      meetings: meetingRows,
      payments: paymentRows,
      notifications: notificationRows,
      certificates: certificateRows,
    };
  }, [activeOrganization, certificatesQuery.data, demandesQuery.data, documentsQuery.data, dossiersQuery.data, evidenceQuery.data, meetingsQuery.data]);

  const refetchAll = (): void => {
    void demandesQuery.refetch();
    void dossiersQuery.refetch();
    void documentsQuery.refetch();
    void meetingsQuery.refetch();
    void certificatesQuery.refetch();
    void evidenceQuery.refetch();
    void nextActionsQuery.refetch();
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
          <h1 className="page-title">Portail postulant - apercu</h1>
          <p className="page-subtitle">Vue simplifiee des informations visibles par un postulant. Prototype lecture seule.</p>
        </div>
        <Badge variant="outline">Demo</Badge>
      </div>

      {error ? <ErrorState message={error.message} onRetry={refetchAll} /> : null}

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
        Apercu prototype : cette page ne contient pas d'authentification, d'upload reel ou de soumission.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-background p-2 text-muted-foreground">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Apercu pour</p>
            <p className="font-semibold text-slate-950 dark:text-white">{activeOrganization || 'Aucun organisme'}</p>
          </div>
        </div>
        <Select value={activeOrganization} onValueChange={setSelectedOrganization}>
          <SelectTrigger className="h-9 w-full sm:w-72" aria-label="Choisir un organisme pour l'apercu">
            <SelectValue placeholder="Choisir un organisme" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((organization) => (
              <SelectItem key={organization} value={organization}>{organization}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Mes demandes" icon={ClipboardList}>
          <PortalRowList rows={portal.demandes} emptyMessage="Aucune demande visible pour cet organisme." />
        </SectionCard>

        <SectionCard title="Actions attendues" icon={Bell}>
          <PortalRowList rows={portal.actions} emptyMessage="Aucune action immediate indiquee." />
        </SectionCard>

        <SectionCard title="Documents / pieces a fournir" icon={FileText}>
          <PortalRowList rows={portal.documents} emptyMessage="Aucune piece visible pour cet organisme." />
        </SectionCard>

        <SectionCard title="Reunions" icon={CalendarDays}>
          <PortalRowList rows={portal.meetings} emptyMessage="Aucune reunion programmee." />
        </SectionCard>

        <SectionCard title="Paiements" icon={CreditCard}>
          <PortalRowList rows={portal.payments} emptyMessage="Aucun paiement visible pour cet organisme." />
        </SectionCard>

        <SectionCard title="Decisions / notifications" icon={Bell}>
          <PortalRowList rows={portal.notifications} emptyMessage="Aucune notification disponible." />
        </SectionCard>

        <SectionCard title="Certificat / retrait" icon={PackageCheck}>
          <PortalRowList rows={portal.certificates} emptyMessage="Aucun certificat visible pour cet organisme." />
        </SectionCard>
      </div>
    </div>
  );
}
