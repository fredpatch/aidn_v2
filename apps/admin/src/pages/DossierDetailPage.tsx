import { useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Info, RotateCcw } from 'lucide-react';
import {
  AidnStatusBadge,
  DgDecisionBadge,
  OmaPhaseBadge,
  advanceCertificateLifecycle,
  getNextCertificateLifecycleActionLabel,
  markMeetingReportAvailable,
  markMeetingScheduled,
  markPaymentEvidenceReceived,
  markPaymentEvidenceValidated,
  markPhaseNextActionDone,
  resetAidnDemoData,
  updatePhaseEvidenceStatus,
  getEntryChannelLabel,
  getInternalDemandeStatusLabel,
  getPortalStatusLabel,
  useAidnCertificates,
  useAidnDocuments,
  useAidnMeetings,
  useAidnOmaPhases,
  useAidnPhaseEvidence,
  useAidnPhaseNextActions,
  useAidnTimelineEvents,
  useCourriers,
  useDemandes,
  useDgDecisionRecords,
  useDossier,
  type AidnCertificate,
  type AidnDocument,
  type AidnMeeting,
  type AidnOmaPhase,
  type AidnOmaPhaseKey,
  type AidnPhaseEvidenceItem,
  type AidnPhaseEvidenceStatus,
  type AidnPhaseNextAction,
  type AidnTimelineEvent,
} from '@/features/aidn';
import { EmptyState, SkeletonCard } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppToast } from '@/hooks/useAppToast';

const phaseLabels: Record<AidnOmaPhaseKey, string> = {
  preliminary: 'Phase 1 - Preliminaire',
  formal_application: 'Phase 2 - Demande formelle',
  document_evaluation: 'Phase 3 - Evaluation approfondie',
  onsite_demonstration: 'Phase 4 - Inspection / R3',
  delivery: 'Phase 5 - Delivrance',
};

const phaseTouchpoints: Record<AidnOmaPhaseKey, string> = {
  preliminary: 'DG / DN / EC',
  formal_application: 'DG / DN',
  document_evaluation: 'S5 / compta',
  onsite_demonstration: 'S5 / compta / R3',
  delivery: 'S5 / compta / DN',
};

const certificateTypeLabels: Record<AidnCertificate['certificateType'], string> = {
  initial: 'Initial',
  renewal: 'Renouvellement',
  extension: 'Extension',
};

const certificateStatusLabels: Record<AidnCertificate['status'], string> = {
  to_prepare: 'A preparer',
  printed: 'Imprime',
  signed_stamped: 'Signe/cachete',
  scanned_in_aidn: 'Scanne dans AIDN',
  ready_for_collection: 'Pret au retrait',
  collected: 'Remis au postulant',
  archived: 'Archive',
};

const deadlineLabels = {
  on_track: 'Dans les delais',
  at_risk: 'A surveiller',
  late: 'En retard',
} as const;

const phaseOrder: AidnOmaPhaseKey[] = ['preliminary', 'formal_application', 'document_evaluation', 'onsite_demonstration', 'delivery'];

const evidenceKindLabels: Record<AidnPhaseEvidenceItem['kind'], string> = {
  required_document: 'Document attendu',
  formal_courrier: 'Courrier formel',
  meeting_report: 'Compte rendu',
  invoice: 'Facture',
  payment_proof: 'Preuve paiement',
  r3_opinion: 'Avis R3',
  certificate_artifact: 'Certificat',
  notification: 'Notification',
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

const evidenceStatusClasses: Partial<Record<AidnPhaseEvidenceStatus, string>> = {
  validated: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  scanned: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  pending_review: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  missing: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

function formatDate(value?: string): string {
  if (!value) return 'Non renseigne';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DefinitionGrid({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-slate-900 dark:text-slate-100">{children}</dd>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function findClosureDocument(phaseKey: AidnOmaPhaseKey, documents: AidnDocument[]): AidnDocument | undefined {
  const closureTerms = ['cloture', 'closure'];
  return documents.find((document) => {
    const title = normalize(document.title);
    return document.phaseKey === phaseKey && closureTerms.some((term) => title.includes(term));
  });
}

function getFallbackNextAction(phase: AidnOmaPhase | undefined): string {
  if (!phase) return 'Initialiser la phase dans le prototype mock.';

  switch (phase.status) {
    case 'not_started':
      return 'Verifier les prealables et preparer le lancement de phase.';
    case 'in_progress':
      return 'Completer les pieces attendues et rattacher les preuves disponibles.';
    case 'blocked':
      return 'Identifier le blocage interne et relancer le touchpoint concerne.';
    case 'late':
      return 'Prioriser le traitement et documenter la cause du retard.';
    case 'completed':
      return 'Conserver le courrier de cloture et verifier la phase suivante.';
    default:
      return 'Suivre la prochaine action DN.';
  }
}

function EvidenceStatusBadge({ status }: { status: AidnPhaseEvidenceStatus }): React.JSX.Element {
  return (
    <Badge variant="outline" className={evidenceStatusClasses[status]}>
      {evidenceStatusLabels[status]}
    </Badge>
  );
}

function EvidenceChecklist({
  evidenceItems,
  documents,
  onSetStatus,
  onMarkPaymentReceived,
  onMarkPaymentValidated,
}: {
  evidenceItems: AidnPhaseEvidenceItem[];
  documents: AidnDocument[];
  onSetStatus: (evidenceId: string, status: AidnPhaseEvidenceStatus) => void;
  onMarkPaymentReceived: (evidenceId: string) => void;
  onMarkPaymentValidated: (evidenceId: string) => void;
}): React.JSX.Element {
  if (evidenceItems.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune checklist de preuves mock rattachee a cette phase.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {evidenceItems.map((item) => {
        const linkedDocument = item.documentId ? documents.find((document) => document.id === item.documentId) : undefined;
        const isPaymentEvidence = item.kind === 'invoice' || item.kind === 'payment_proof';
        return (
          <li key={item.id} className="rounded-md border bg-background px-3 py-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {evidenceKindLabels[item.kind]} - Source : {item.sourceActor} - {item.isRequired ? 'Obligatoire' : 'Optionnel'}
                </p>
              </div>
              <EvidenceStatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Document lie : {linkedDocument?.title ?? 'Non rattache'} - Echeance : {formatDate(item.dueDate)} - Reception : {formatDate(item.receivedAt)}
            </p>
            {item.notes ? <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" disabled={item.status === 'not_applicable'} onClick={() => onSetStatus(item.id, 'received')}>
                Recu dans la demo
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={item.status === 'not_applicable'} onClick={() => onSetStatus(item.id, 'validated')}>
                Valide dans la demo
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={item.status === 'not_applicable'} onClick={() => onSetStatus(item.id, 'missing')}>
                Manquant dans la demo
              </Button>
              {isPaymentEvidence ? (
                <>
                  <Button type="button" size="sm" variant="outline" disabled={item.status === 'not_applicable'} onClick={() => onMarkPaymentReceived(item.id)}>
                    Preuve recue dans la demo
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={item.status === 'not_applicable'} onClick={() => onMarkPaymentValidated(item.id)}>
                    Paiement valide dans la demo
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DocumentList({ documents }: { documents: AidnDocument[] }): React.JSX.Element {
  if (documents.length === 0) return <p className="text-sm text-muted-foreground">Aucun document lie.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-2 pr-3">Document</th>
            <th className="py-2 pr-3">Source</th>
            <th className="py-2 pr-3">Statut</th>
            <th className="py-2 pr-3">Phase</th>
            <th className="py-2">Date upload/reception</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="py-3 pr-3 font-medium">{document.title}</td>
              <td className="py-3 pr-3">{document.source}</td>
              <td className="py-3 pr-3"><Badge variant="secondary">{document.status}</Badge></td>
              <td className="py-3 pr-3">{document.phaseKey ? phaseLabels[document.phaseKey] : 'Sans phase'}</td>
              <td className="py-3">{formatDate(document.receivedAt ?? document.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MeetingList({
  meetings,
  documents,
  onMarkScheduled,
  onMarkReportAvailable,
}: {
  meetings: AidnMeeting[];
  documents: AidnDocument[];
  onMarkScheduled: (meetingId: string) => void;
  onMarkReportAvailable: (meetingId: string) => void;
}): React.JSX.Element {
  if (meetings.length === 0) return <p className="text-sm text-muted-foreground">Aucune reunion liee.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-2 pr-3">Objet</th>
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Phase</th>
            <th className="py-2 pr-3">Convocation</th>
            <th className="py-2">Compte rendu</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {meetings.map((meeting) => {
            const report = meeting.reportDocumentId ? documents.find((document) => document.id === meeting.reportDocumentId) : undefined;
            return (
              <tr key={meeting.id}>
                <td className="py-3 pr-3">
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">{meeting.location} - {meeting.participants.length} participant(s)</p>
                </td>
                <td className="py-3 pr-3">{formatDate(meeting.scheduledAt)}</td>
                <td className="py-3 pr-3">{meeting.phaseKey ? phaseLabels[meeting.phaseKey] : 'Sans phase'}</td>
                <td className="py-3 pr-3">{meeting.convocationSentAt ? `Envoyee (${meeting.convocationChannel ?? 'canal non precise'})` : 'Non envoyee'}</td>
                <td className="py-3">
                  <p>{report ? `${report.status} - ${report.title}` : 'Non joint'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(!meeting.convocationSentAt && meeting.outcome !== 'cancelled') ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => onMarkScheduled(meeting.id)}>
                        Programmer dans la demo
                      </Button>
                    ) : null}
                    {!report ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => onMarkReportAvailable(meeting.id)}>
                        CR disponible dans la demo
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryList({ events }: { events: AidnTimelineEvent[] }): React.JSX.Element {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun evenement historique lie dans le prototype.</p>;
  }

  return (
    <ol className="space-y-3 text-sm">
      {events.map((event) => (
        <li key={event.id} className="rounded-md border bg-background px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{event.label}</p>
            <span className="text-xs text-muted-foreground">{formatDate(event.occurredAt)}</span>
          </div>
          <p className="mt-1 text-muted-foreground">{event.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">Acteur : {event.actor}</p>
        </li>
      ))}
    </ol>
  );
}

function PhaseWorkspaceSection({
  phaseKey,
  phase,
  documents,
  meetings,
  evidenceItems,
  nextAction,
  onSetEvidenceStatus,
  onMarkPaymentReceived,
  onMarkPaymentValidated,
  onMarkNextActionDone,
}: {
  phaseKey: AidnOmaPhaseKey;
  phase: AidnOmaPhase | undefined;
  documents: AidnDocument[];
  meetings: AidnMeeting[];
  evidenceItems: AidnPhaseEvidenceItem[];
  nextAction: AidnPhaseNextAction | undefined;
  onSetEvidenceStatus: (evidenceId: string, status: AidnPhaseEvidenceStatus) => void;
  onMarkPaymentReceived: (evidenceId: string) => void;
  onMarkPaymentValidated: (evidenceId: string) => void;
  onMarkNextActionDone: (actionId: string) => void;
}): React.JSX.Element {
  const phaseDocuments = documents.filter((document) => document.phaseKey === phaseKey);
  const phaseMeetings = meetings.filter((meeting) => meeting.phaseKey === phaseKey);
  const closureDocument = findClosureDocument(phaseKey, phaseDocuments);
  const closureEvidence = evidenceItems.find((item) => item.kind === 'formal_courrier' && normalize(item.label).includes('cloture'));
  const notificationEvidence = evidenceItems.find((item) => item.kind === 'notification');

  return (
    <Section title={phaseLabels[phaseKey]}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
        <DefinitionGrid>
          <Field label="Phase">{phase?.label ?? phaseLabels[phaseKey]}</Field>
          <Field label="Statut">{phase ? <OmaPhaseBadge status={phase.status} /> : 'Non renseigne dans le prototype'}</Field>
          <Field label="Debut">{formatDate(phase?.startedAt)}</Field>
          <Field label="Echeance">{formatDate(phase?.dueAt)}</Field>
          <Field label="Cloture">{formatDate(phase?.completedAt)}</Field>
          <Field label="Touchpoint">{phaseTouchpoints[phaseKey]}</Field>
          <Field label="Documents rattaches">{phaseDocuments.length}</Field>
          <Field label="Reunions rattachees">{phaseMeetings.length}</Field>
          <Field label="Courrier de cloture">{closureEvidence?.label ?? closureDocument?.title ?? (phase?.status === 'completed' ? 'Courrier de cloture a rattacher' : 'Non renseigne dans le prototype')}</Field>
        </DefinitionGrid>
        <div className="space-y-3 rounded-md bg-muted/30 p-4 text-sm">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Notification</p>
            <p className="mt-1 text-muted-foreground">{notificationEvidence ? `${notificationEvidence.label} - ${evidenceStatusLabels[notificationEvidence.status]}` : 'Notification prevue / simulee'}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Prochaine action recommandee</p>
            <p className="mt-1 text-muted-foreground">{nextAction?.label ?? getFallbackNextAction(phase)}</p>
            {nextAction ? <p className="mt-1 text-xs text-muted-foreground">Acteur : {nextAction.recommendedActor} - Priorite : {nextAction.priority} - Etat : {nextAction.status}</p> : null}
            {nextAction ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                disabled={nextAction.status === 'done'}
                onClick={() => onMarkNextActionDone(nextAction.id)}
              >
                Marquer fait dans la demo
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Checklist preuves / evidence</p>
        <EvidenceChecklist
          evidenceItems={evidenceItems}
          documents={documents}
          onSetStatus={onSetEvidenceStatus}
          onMarkPaymentReceived={onMarkPaymentReceived}
          onMarkPaymentValidated={onMarkPaymentValidated}
        />
      </div>
    </Section>
  );
}

export function DossierDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const dossierQuery = useDossier(id);
  const demandesQuery = useDemandes();
  const courriersQuery = useCourriers();
  const decisionsQuery = useDgDecisionRecords();
  const phasesQuery = useAidnOmaPhases();
  const documentsQuery = useAidnDocuments();
  const meetingsQuery = useAidnMeetings();
  const certificatesQuery = useAidnCertificates();
  const phaseEvidenceQuery = useAidnPhaseEvidence();
  const phaseNextActionsQuery = useAidnPhaseNextActions();
  const timelineQuery = useAidnTimelineEvents();

  const dossier = dossierQuery.data;
  const demande = demandesQuery.data?.find((item) => item.id === dossier?.demandeId);
  const courrier = courriersQuery.data?.find((item) => item.demandeId === dossier?.demandeId);
  const decision = decisionsQuery.data?.find((item) => item.demandeId === dossier?.demandeId);
  const phases = (phasesQuery.data ?? []).filter((item) => item.dossierId === dossier?.id).sort((first, second) => first.order - second.order);
  const documents = (documentsQuery.data ?? []).filter((item) => item.dossierId === dossier?.id || item.demandeId === dossier?.demandeId);
  const meetings = (meetingsQuery.data ?? []).filter((item) => item.dossierId === dossier?.id);
  const certificate = certificatesQuery.data?.find((item) => item.dossierId === dossier?.id);
  const phaseEvidence = (phaseEvidenceQuery.data ?? []).filter((item) => item.dossierId === dossier?.id);
  const phaseNextActions = (phaseNextActionsQuery.data ?? []).filter((item) => item.dossierId === dossier?.id);
  const history = (timelineQuery.data ?? [])
    .filter((event) => event.dossierId === dossier?.id || event.demandeId === dossier?.demandeId)
    .sort((first, second) => second.occurredAt.localeCompare(first.occurredAt));
  const currentPhase = phases.find((phase) => phase.key === dossier?.currentPhase);
  const linkedCertificateDocument = certificate?.linkedDocumentId ? documentsQuery.data?.find((item) => item.id === certificate.linkedDocumentId) : undefined;
  const scannedCertificateDocument = certificate?.scannedDocumentId ? documentsQuery.data?.find((item) => item.id === certificate.scannedDocumentId) : undefined;
  const phaseByKey = new Map(phases.map((phase) => [phase.key, phase]));

  const refreshAidnQueries = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['aidn'] });
  };

  const handleResetDemo = (): void => {
    resetAidnDemoData();
    refreshAidnQueries();
    toast.info('Demo reinitialisee localement');
  };

  const handleSetEvidenceStatus = (evidenceId: string, status: AidnPhaseEvidenceStatus): void => {
    updatePhaseEvidenceStatus(evidenceId, status);
    refreshAidnQueries();
    toast.success('Demo mise a jour localement');
  };

  const handleMarkPaymentReceived = (evidenceId: string): void => {
    markPaymentEvidenceReceived(evidenceId);
    refreshAidnQueries();
    toast.success('Demo mise a jour localement');
  };

  const handleMarkPaymentValidated = (evidenceId: string): void => {
    markPaymentEvidenceValidated(evidenceId);
    refreshAidnQueries();
    toast.success('Demo mise a jour localement');
  };

  const handleMarkNextActionDone = (actionId: string): void => {
    markPhaseNextActionDone(actionId);
    refreshAidnQueries();
    toast.success('Demo mise a jour localement');
  };

  const handleAdvanceCertificateLifecycle = (certificateId: string): void => {
    advanceCertificateLifecycle(certificateId);
    refreshAidnQueries();
    toast.success('Cycle certificat mis a jour localement');
  };

  const handleMarkMeetingScheduled = (meetingId: string): void => {
    markMeetingScheduled(meetingId);
    refreshAidnQueries();
    toast.success('Demo mise a jour localement');
  };

  const handleMarkMeetingReportAvailable = (meetingId: string): void => {
    markMeetingReportAvailable(meetingId);
    refreshAidnQueries();
    toast.success('Demo mise a jour localement');
  };

  const isLoading =
    dossierQuery.isLoading ||
    demandesQuery.isLoading ||
    courriersQuery.isLoading ||
    decisionsQuery.isLoading ||
    phasesQuery.isLoading ||
    documentsQuery.isLoading ||
    meetingsQuery.isLoading ||
    certificatesQuery.isLoading ||
    phaseEvidenceQuery.isLoading ||
    phaseNextActionsQuery.isLoading ||
    timelineQuery.isLoading;

  if (isLoading) {
    return (
      <div className="page-container">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={8} />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="page-container">
        <EmptyState
          message="Dossier introuvable."
          action={
            <Button asChild variant="outline">
              <Link to="/dossiers">Retour aux dossiers DN</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/dossiers">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour aux dossiers DN
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title">{dossier.reference}</h1>
            <AidnStatusBadge status={dossier.globalStatus} />
          </div>
          <p className="page-subtitle">
            {demande?.organizationName ?? 'Organisme non renseigne'} - {demande?.postulantName ?? 'Postulant non renseigne'}
          </p>
        </div>
        <div className="grid gap-1 text-left text-sm sm:text-right">
          <span className="text-muted-foreground">Agent DN</span>
          <span className="font-semibold">{dossier.assignedAgent}</span>
          <span className="text-muted-foreground">Phase courante</span>
          <span className="font-semibold">{currentPhase?.label ?? phaseLabels[dossier.currentPhase]}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Progression OMA</p>
            <p className="mt-2 text-2xl font-bold">{dossier.progressPercent}%</p>
            <Progress value={dossier.progressPercent} className="mt-3 h-2" />
          </CardContent>
        </Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Statut dossier</p><div className="mt-2"><AidnStatusBadge status={dossier.globalStatus} /></div></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Documents lies</p><p className="mt-2 text-2xl font-bold">{documents.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Reunions</p><p className="mt-2 text-2xl font-bold">{meetings.length}</p></CardContent></Card>
      </div>

      <Note>
        Les phases OMA sont affichees comme sections operationnelles. La cloture d'une phase doit etre soutenue par un courrier formel. S5/R3 restent des touchpoints dans le prototype, pas des modules autonomes.
      </Note>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
        <p>Mode demonstration : les changements sont sauvegardes localement dans ce navigateur.</p>
        <Button type="button" variant="outline" size="sm" onClick={handleResetDemo}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reinitialiser la demo
        </Button>
      </div>

      <Section title="Vue d'ensemble">
        <DefinitionGrid>
          <Field label="Reference dossier">{dossier.reference}</Field>
          <Field label="Organisme">{demande?.organizationName ?? 'Non renseigne'}</Field>
          <Field label="Postulant">{demande?.postulantName ?? 'Non renseigne'}</Field>
          <Field label="Agent DN">{dossier.assignedAgent}</Field>
          <Field label="Ouverture">{formatDate(dossier.openedAt)}</Field>
          <Field label="Phase courante">{currentPhase?.label ?? phaseLabels[dossier.currentPhase]}</Field>
          <Field label="Statut dossier"><AidnStatusBadge status={dossier.globalStatus} /></Field>
          <Field label="Progression">{dossier.progressPercent}%</Field>
          <Field label="Delai">{deadlineLabels[dossier.deadlineStatus]}</Field>
        </DefinitionGrid>
      </Section>

      <Section title="Origine / Courriers DG">
        <DefinitionGrid>
          <Field label="Demande source">{demande?.reference ?? 'Non liee'}</Field>
          <Field label="Statut interne demande">{demande ? getInternalDemandeStatusLabel(demande.internalStatus) : 'Non renseigne'}</Field>
          <Field label="Statut postulant">{demande ? getPortalStatusLabel(demande.portalStatus) : 'Non renseigne'}</Field>
          <Field label="Canal d'entree">{demande ? getEntryChannelLabel(demande.entryChannel) : 'Non renseigne'}</Field>
          <Field label="Courrier lie">{courrier?.reference ?? 'Non lie'}</Field>
          <Field label="Mode courrier">{courrier?.mode ?? 'Non renseigne'}</Field>
          <Field label="Decision DG">{courrier ? <DgDecisionBadge decision={courrier.decisionDg} /> : 'Non renseignee'}</Field>
          <Field label="Retour DG">{formatDate(courrier?.dateRetourDg ?? decision?.decidedAt)}</Field>
          <Field label="Direction orientee">{courrier?.directionOrientee ?? decision?.directionOrientee ?? 'Non definie'}</Field>
        </DefinitionGrid>
        <Note>
          Ce dossier DN existe uniquement parce qu'une instruction favorable permet a la DN de poursuivre le traitement.
        </Note>
      </Section>

      {phaseOrder.map((phaseKey) => (
        <PhaseWorkspaceSection
          key={phaseKey}
          phaseKey={phaseKey}
          phase={phaseByKey.get(phaseKey)}
          documents={documents}
          meetings={meetings}
          evidenceItems={phaseEvidence.filter((item) => item.phaseKey === phaseKey)}
          nextAction={phaseNextActions.find((item) => item.phaseKey === phaseKey)}
          onSetEvidenceStatus={handleSetEvidenceStatus}
          onMarkPaymentReceived={handleMarkPaymentReceived}
          onMarkPaymentValidated={handleMarkPaymentValidated}
          onMarkNextActionDone={handleMarkNextActionDone}
        />
      ))}

      <Section title="Documents">
        <DocumentList documents={documents} />
      </Section>

      <Section title="Reunions">
        <MeetingList
          meetings={meetings}
          documents={documents}
          onMarkScheduled={handleMarkMeetingScheduled}
          onMarkReportAvailable={handleMarkMeetingReportAvailable}
        />
      </Section>

      <Section title="Certificat">
        {certificate ? (
          <div className="space-y-4">
            <DefinitionGrid>
              <Field label="Numero">{certificate.certificateNumber}</Field>
              <Field label="Type">{certificateTypeLabels[certificate.certificateType]}</Field>
              <Field label="Statut">{certificateStatusLabels[certificate.status]}</Field>
              <Field label="Preparation">{formatDate(certificate.preparedAt)}</Field>
              <Field label="Impression">{formatDate(certificate.printedAt)}</Field>
              <Field label="Signature">{formatDate(certificate.signedAt)}</Field>
              <Field label="Cachet">{formatDate(certificate.stampedAt)}</Field>
              <Field label="Scan AIDN">{formatDate(certificate.scannedAt)}</Field>
              <Field label="Pret au retrait">{formatDate(certificate.readyForCollectionAt)}</Field>
              <Field label="Remise">{formatDate(certificate.collectedAt ?? certificate.deliveredAt ?? certificate.issuedAt)}</Field>
              <Field label="Archivage">{formatDate(certificate.archivedAt)}</Field>
              <Field label="Document scanne">{scannedCertificateDocument?.title ?? 'Non renseigne'}</Field>
              <Field label="Document support">{linkedCertificateDocument?.title ?? 'Non renseigne'}</Field>
              <Field label="Retire par">{certificate.collectedBy ?? 'Non renseigne'}</Field>
            </DefinitionGrid>
            {getNextCertificateLifecycleActionLabel(certificate.status) ? (
              <Button type="button" size="sm" variant="outline" onClick={() => handleAdvanceCertificateLifecycle(certificate.id)}>
                Action demo : {getNextCertificateLifecycleActionLabel(certificate.status)}
              </Button>
            ) : (
              <Badge variant="secondary">Cycle archive dans la demo</Badge>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun certificat lie.</p>
        )}
        <Note>
          Le prototype trace le certificat signe/scanne et le retrait. La generation automatique n'est pas active.
        </Note>
      </Section>

      <Section title="Historique">
        <HistoryList events={history} />
      </Section>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Page de demonstration. Les changements disponibles ici modifient uniquement l'etat local du navigateur.</p>
        </div>
      </div>
    </div>
  );
}
