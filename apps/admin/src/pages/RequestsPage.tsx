import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileUp,
  FolderOpen,
  MessageSquareWarning,
  Printer,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { EmptyState, SkeletonCard } from '../components/states';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../lib/auth/permissions';
import { isMockMode } from '../lib/data/data-mode';
import {
  downloadRequestOrientationDocument,
  getRequest,
  listRequests,
  type AdminRequest,
  type AdminRequestDetail,
} from '../lib/api/requests.api';

import { SplitView } from '../components/ui/split-view';
import { ActionDialog, type ActionDialogState } from './requests/ActionDialog';
import { DetailField } from './requests/DetailField';
import { DgReturnDialog } from './requests/DgReturnDialog';
import { RegisterPhysicalDialog } from './requests/RegisterPhysicalDialog';
import { RequestListCard } from './requests/RequestListCard';
import {
  canMarkPrinted,
  canOpenDossier,
  canRecordDgReturn,
  canRegisterPhysical,
  canRequestCorrection,
  documentSummary,
  formatDate,
  getStatusLabel,
  isCancelledByDg,
  isAwaitingDgAction,
  isOrientedToDn,
  requestTypeLabels,
  sourceLabels,
  statusBadgeVariant,
  visibleStatusOptions,
} from './requests/requests.helpers';

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="surface rounded-lg p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export function RequestsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [selected, setSelected] = useState<AdminRequestDetail | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [requestType, setRequestType] = useState('');
  const [courrierSource, setCourrierSource] = useState('');
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [registerTarget, setRegisterTarget] = useState<AdminRequest | null>(null);
  const [dgReturnTarget, setDgReturnTarget] = useState<AdminRequest | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const permissions = useMemo(
    () => ({
      canReview: hasPermission(user, 'REQUEST_INTAKE_REVIEW'),
      canRegister: hasPermission(user, 'COURRIER_REGISTER_PHYSICAL'),
      canHandleDg: hasPermission(user, 'DG_CIRCUIT_HANDLE'),
    }),
    [user],
  );

  const stats = useMemo(
    () => ({
      submitted: items.filter((item) => item.status === 'submitted').length,
      portalUploads: items.filter((item) => item.courrierSource === 'portal_upload').length,
      physicalDepositsPlanned: items.filter(
        (item) =>
          item.courrierSource === 'physical_deposit' &&
          item.physicalDeposit?.status !== 'received',
      ).length,
      physicalDepositsReceived: items.filter(
        (item) =>
          item.courrierSource === 'physical_deposit' &&
          item.physicalDeposit?.status === 'received',
      ).length,
      awaitingDg: items.filter(isAwaitingDgAction).length,
      orientedToDn: items.filter(isOrientedToDn).length,
      cancelledByDg: items.filter(isCancelledByDg).length,
    }),
    [items],
  );

  const loadRequests = async (autoSelectFirst = false) => {
    setError('');
    setIsLoading(true);
    try {
      if (isMockMode()) {
        setItems([]);
        return;
      }
      const response = await listRequests({ search, status, requestType, courrierSource });
      setItems(response.items);
      if (autoSelectFirst && response.items.length > 0) {
        try {
          const detail = await getRequest(response.items[0].id);
          setSelected(detail);
        } catch {
          // auto-select failure is non-fatal
        }
      }
    } catch {
      setError('Impossible de charger les demandes reçues.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(true);
  }, []);

  const refreshDetail = async (id: string) => {
    if (isMockMode()) return;
    const nextDetail = await getRequest(id);
    setSelected(nextDetail);
  };

  const refreshAfterMutation = async (id: string, message: string) => {
    await loadRequests();
    await refreshDetail(id).catch(() => setSelected(null));
    setSuccess(message);
  };

  const openDetails = async (request: AdminRequest) => {
    setError('');
    try {
      if (isMockMode()) {
        setSelected({ request });
        return;
      }
      setSelected(await getRequest(request.id));
    } catch {
      setError('Impossible de charger le détail de la demande.');
    }
  };

  const consultOrientationCourrier = (requestId: string, documentId: string) => {
    const previewWindow = window.open('about:blank', '_blank');
    setError('');
    void (async () => {
      try {
        const { blob, fileName } = await downloadRequestOrientationDocument(requestId, documentId);
        const url = URL.createObjectURL(blob);
        const targetWindow =
          previewWindow && !previewWindow.closed
            ? previewWindow
            : window.open('about:blank', '_blank');
        if (!targetWindow) {
          window.alert(
            "Impossible d'ouvrir l'aperçu. Autorisez les fenêtres contextuelles pour consulter le document.",
          );
          return;
        }
        targetWindow.location.href = url;
        targetWindow.document.title = fileName;
      } catch {
        previewWindow?.close();
        setError("Impossible d'ouvrir le courrier orienté.");
      }
    })();
  };

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadRequests();
  };

  const { request, courrier, document: doc, dgReview } = selected ?? {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes</h1>
          <p className="page-subtitle">Suivi des demandes initiales avant orientation DG.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => void loadRequests()}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Actualiser
        </button>
      </div>

      <section className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <KpiCard title="Soumises" value={stats.submitted} />
        <KpiCard title="Téléversées portail" value={stats.portalUploads} />
        <KpiCard title="Dépôts prévus" value={stats.physicalDepositsPlanned} />
        <KpiCard title="Courriers reçus" value={stats.physicalDepositsReceived} />
        <KpiCard title="En attente DG" value={stats.awaitingDg} />
        <KpiCard title="Orientées DN" value={stats.orientedToDn} />
        <KpiCard title="Annulées DG" value={stats.cancelledByDg} />
      </section>

      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <SplitView
        left={
          <div className="space-y-3">
          <form className="space-y-2" onSubmit={handleFilter}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                className="control pl-9"
                placeholder="Organisme, postulant, objet…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                className="control"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Tous statuts</option>
                {visibleStatusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="control"
                value={requestType}
                onChange={(event) => setRequestType(event.target.value)}
              >
                <option value="">Tous types</option>
                {Object.entries(requestTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="control"
                value={courrierSource}
                onChange={(event) => setCourrierSource(event.target.value)}
              >
                <option value="">Toutes sources</option>
                <option value="portal_upload">Portail</option>
                <option value="physical_deposit">Physique</option>
              </select>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={isLoading}>
              <Search className="h-4 w-4" aria-hidden="true" />
              Filtrer
            </button>
          </form>

          {isLoading ? (
            <div className="grid gap-2">
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </div>
          ) : items.length > 0 ? (
            <div className="grid gap-2">
              {items.map((item) => (
                <RequestListCard
                  key={item.id}
                  item={item}
                  isSelected={selected?.request.id === item.id}
                  onClick={() => void openDetails(item)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="Aucune demande trouvée pour ces filtres." />
          )}
        </div>
        }
        right={
          request ? (
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
                    Prêt pour phase préliminaire
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
                  {request.submittedBy?.fullName ?? request.submittedBy?.email ?? '-'}
                  {request.courrierSource ? (
                    <span className="ml-2 text-slate-400">
                      · {sourceLabels[request.courrierSource]}
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
                    Orientation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="demande">
                  <dl className="grid gap-3 pt-3 sm:grid-cols-2">
                    <DetailField label="Type" value={requestTypeLabels[request.requestType]} />
                    <DetailField label="Statut" value={getStatusLabel(request)} />
                    <DetailField label="Création" value={formatDate(request.createdAt)} />
                    <DetailField label="Soumission" value={formatDate(request.submittedAt)} />
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
                    <DetailField label="Téléphone" value={request.submittedBy?.phone} />
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
                    <DetailField label="Téléphone" value={request.organization?.phone} />
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
                    <DetailField label="Référence officielle" value={courrier?.officialReference} />
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
                        request.intake?.startedBy?.fullName ?? request.intake?.startedById
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
                        request.intake?.printedForDgBy?.fullName ?? request.intake?.printedForDgById
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
                    <DetailField
                      label="Décision"
                      value={
                        dgReview?.decision === 'oriented_to_dn'
                          ? 'Orientée vers DN'
                          : dgReview?.decision === 'rejected'
                            ? 'Annulée par DG'
                            : undefined
                      }
                    />
                    <DetailField
                      label="Observations"
                      value={dgReview?.observations}
                      className="sm:col-span-2"
                    />
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-muted-foreground">
                        Courrier orienté scanné
                      </dt>
                      {dgReview?.returnedScannedDocumentId ? (
                        <dd className="mt-1 flex flex-col gap-1.5">
                          <button
                            type="button"
                            className="btn btn-secondary inline-flex w-fit items-center gap-1.5 text-xs"
                            onClick={() =>
                              consultOrientationCourrier(
                                request.id,
                                dgReview.returnedScannedDocumentId!,
                              )
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            Consulter le courrier orienté
                          </button>
                          {canOpenDossier(request, dgReview) && (
                            <p className="text-xs text-muted-foreground">
                              Consultation facultative avant démarrage de la phase préliminaire.
                            </p>
                          )}
                        </dd>
                      ) : (
                        <dd className="mt-1 text-sm text-muted-foreground">
                          Aucun courrier orienté scanné disponible.
                        </dd>
                      )}
                    </div>
                  </dl>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex flex-wrap justify-end gap-2 px-4 pb-4 pt-4">
              {permissions.canReview && canRequestCorrection(request) ? (
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => setDialog({ kind: 'correction', request })}
                >
                  <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
                  Demander correction
                </button>
              ) : null}
              {permissions.canRegister && canRegisterPhysical(request) ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setRegisterTarget(request)}
                >
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                  Enregistrer réception courrier
                </button>
              ) : null}
              {permissions.canHandleDg && canMarkPrinted(request) ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setDialog({ kind: 'print', request })}
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  Imprimer
                </button>
              ) : null}
              {permissions.canHandleDg && canRecordDgReturn(request) ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setDgReturnTarget(request)}
                >
                  <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                  Enregistrer le retour DG
                </button>
              ) : null}
              {permissions.canReview && canOpenDossier(request, dgReview) ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setDialog({ kind: 'open_dossier', request })}
                >
                  <FolderOpen className="h-4 w-4" aria-hidden="true" />
                  Démarrer la phase préliminaire
                </button>
              ) : null}
            </CardFooter>
          </Card>
        ) : (
          <div className="mt-4 flex items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground lg:mt-0">
            Sélectionnez une demande dans la liste pour voir les détails.
          </div>
        )
        }
      />

      {dialog ? (
        <ActionDialog
          state={dialog}
          onClose={() => setDialog(null)}
          onError={setError}
          onDone={async (id, message) => {
            setDialog(null);
            await refreshAfterMutation(id, message);
          }}
        />
      ) : null}

      {registerTarget ? (
        <RegisterPhysicalDialog
          request={registerTarget}
          onClose={() => setRegisterTarget(null)}
          onError={setError}
          onDone={async (id) => {
            setRegisterTarget(null);
            await refreshAfterMutation(id, 'Courrier physique enregistré.');
          }}
        />
      ) : null}

      {dgReturnTarget ? (
        <DgReturnDialog
          request={dgReturnTarget}
          onClose={() => setDgReturnTarget(null)}
          onError={setError}
          onDone={async (id) => {
            setDgReturnTarget(null);
            await refreshAfterMutation(id, 'Retour DG enregistré.');
          }}
        />
      ) : null}
    </div>
  );
}
