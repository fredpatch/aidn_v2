import { useEffect, useState, type ComponentType, type FormEvent, type ReactNode } from 'react';
import {
  CalendarCheck,
  Clock,
  Copy,
  Hash,
  KeyRound,
  ShieldCheck,
  UserCog,
  UserRound,
} from 'lucide-react';
import {
  disableInternalAccount,
  listInternalAccounts,
  reactivateInternalAccount,
  resetInternalAccountPassword,
  updateInternalAccountRole,
  type InternalAccount,
  type InternalAccountCredentialResponse,
} from '../lib/api/admin';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { isMockMode } from '../lib/data/data-mode';
import { useAppToast } from '../hooks/useAppToast';
import { useAuth } from '../hooks/useAuth';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  dn_supervisor: 'Superviseur DN',
  dn_agent: 'Agent DN',
  dg_secretariat: 'Secretariat DG',
  reception: 'Reception',
  bureau_courrier: 'Bureau courrier',
  bootstrap_admin: 'Administrateur initial',
};

const manageableRoles = [
  'admin',
  'dn_supervisor',
  'dn_agent',
  'dg_secretariat',
  'reception',
  'bureau_courrier',
];

const statusLabels: Record<string, string> = {
  pending_first_login: 'Premiere connexion en attente',
  active: 'Actif',
  disabled: 'Desactive',
};

const mockAccounts: InternalAccount[] = [
  {
    id: 'demo-account',
    personnelId: 'DEMO001',
    matricule: 'DEMO001',
    userId: 'demo-user',
    fullName: 'Agent Demo',
    email: 'agent.demo@anac-gabon.com',
    role: 'dn_agent',
    status: 'pending_first_login',
    activatedAt: new Date().toISOString(),
  },
];

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'disabled') return 'destructive';
  if (status === 'pending_first_login') return 'secondary';
  return 'outline';
}

function HeaderLabel({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4" aria-hidden={true} />
      {children}
    </span>
  );
}

type AccountAction = 'reset' | 'disable' | 'reactivate' | 'role';

type ActionDialogState = {
  type: AccountAction;
  account: InternalAccount;
};

function SecurityBadges({ account }: { account: InternalAccount }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1">
      {account.mustChangePassword ? (
        <Badge variant="secondary">Changement requis</Badge>
      ) : (
        <Badge variant="outline">Mot de passe defini</Badge>
      )}
      {account.temporaryPasswordExpiresAt ? (
        <Badge variant="outline">
          Expire {formatDate(account.temporaryPasswordExpiresAt)}
        </Badge>
      ) : null}
      {account.passwordChangedAt ? (
        <Badge variant="outline">
          Modifie {formatDate(account.passwordChangedAt)}
        </Badge>
      ) : null}
    </div>
  );
}

function TemporaryPasswordResult({
  result,
}: {
  result: InternalAccountCredentialResponse;
}): React.JSX.Element {
  const toast = useAppToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.temporaryPassword);
    toast.success('Mot de passe temporaire copie.');
  };

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
      <p className="font-semibold text-emerald-700 dark:text-emerald-300">
        Nouveau mot de passe temporaire
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-white px-3 py-2 font-mono text-base font-bold text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          {result.temporaryPassword}
        </code>
        <Button type="button" size="sm" variant="outline" onClick={() => void handleCopy()}>
          <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
          Copier
        </Button>
      </div>
      <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
        A communiquer une seule fois. Expire le {formatDate(result.expiresAt)}.
      </p>
    </div>
  );
}

export function InternalAccountsPage(): React.JSX.Element {
  const { user } = useAuth();
  const toast = useAppToast();
  const [items, setItems] = useState<InternalAccount[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [credentialResult, setCredentialResult] =
    useState<InternalAccountCredentialResponse | null>(null);

  const loadAccounts = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (isMockMode()) {
        setItems(mockAccounts);
        return;
      }

      const response = await listInternalAccounts({ search, role, status });
      setItems(response.items);
    } catch {
      setError('Connexion impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadAccounts();
  };

  const openDialog = (type: AccountAction, account: InternalAccount) => {
    setCredentialResult(null);
    setError('');
    setSelectedRole(account.role);
    setDialog({ type, account });
  };

  const applyAccountUpdate = (account: InternalAccount) => {
    setItems((current) =>
      current.map((item) => (item.id === account.id ? account : item)),
    );
  };

  const handleDialogAction = async () => {
    if (!dialog) return;

    setIsMutating(true);
    setError('');
    setCredentialResult(null);

    try {
      if (dialog.type === 'reset') {
        const result = await resetInternalAccountPassword(dialog.account.id);
        setCredentialResult(result);
        applyAccountUpdate(result.account);
        toast.success('Mot de passe reinitialise.');
        return;
      }

      if (dialog.type === 'reactivate') {
        const result = await reactivateInternalAccount(dialog.account.id);
        setCredentialResult(result);
        applyAccountUpdate(result.account);
        toast.success('Compte reactive.');
        return;
      }

      if (dialog.type === 'disable') {
        const result = await disableInternalAccount(dialog.account.id);
        applyAccountUpdate(result.account);
        setDialog(null);
        toast.success('Compte desactive.');
        return;
      }

      const result = await updateInternalAccountRole(
        dialog.account.id,
        selectedRole,
      );
      applyAccountUpdate(result.account);
      setDialog(null);
      toast.success('Role mis a jour.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible.');
    } finally {
      setIsMutating(false);
    }
  };

  const selectedAccountIsCurrentUser = dialog?.account.userId === user?.id;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comptes internes</h1>
          <p className="page-subtitle">Liste des comptes AIDN crees pour les agents ANAC.</p>
        </div>
      </div>

      <form className="surface grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_180px_220px_auto]" onSubmit={handleSubmit}>
        <input className="control" placeholder="Rechercher" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="control" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">Tous les roles</option>
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select className="control" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit" disabled={isLoading}>Filtrer</button>
      </form>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="surface overflow-hidden rounded-lg">
        <Table className="min-w-[820px]">
          <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <TableRow>
              <TableHead>
                <HeaderLabel icon={UserRound}>Nom complet</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Hash}>Matricule</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={UserCog}>Role</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={ShieldCheck}>Statut</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={CalendarCheck}>Active le</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Clock}>Derniere connexion</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={KeyRound}>Securite</HeaderLabel>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.fullName}
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.matricule}
                  </span>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">
                  {roleLabels[item.role] ?? item.role}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(item.status)}>
                    {statusLabels[item.status] ?? item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">
                  {formatDate(item.activatedAt)}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">
                  {formatDate(item.lastLoginAt)}
                </TableCell>
                <TableCell>
                  <SecurityBadges account={item} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog('reset', item)}
                      disabled={item.userId === user?.id}
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog('role', item)}
                      disabled={item.userId === user?.id}
                    >
                      Role
                    </Button>
                    {item.status === 'disabled' ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openDialog('reactivate', item)}
                        disabled={item.userId === user?.id}
                      >
                        Reactiver
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => openDialog('disable', item)}
                        disabled={item.userId === user?.id}
                      >
                        Desactiver
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  {isLoading ? 'Chargement...' : 'Aucun compte trouve.'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>

      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open && !isMutating) {
            setDialog(null);
            setCredentialResult(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === 'reset'
                ? 'Reinitialiser le mot de passe'
                : dialog?.type === 'disable'
                  ? 'Desactiver le compte'
                  : dialog?.type === 'reactivate'
                    ? 'Reactiver le compte'
                    : 'Modifier le role'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.account.fullName} - {dialog?.account.matricule}
            </DialogDescription>
          </DialogHeader>

          {dialog?.type === 'role' ? (
            <div className="space-y-2">
              <Label htmlFor="internal-account-role">Role AIDN</Label>
              <select
                id="internal-account-role"
                className="control w-full"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                disabled={isMutating}
              >
                {manageableRoles.map((value) => (
                  <option key={value} value={value}>
                    {roleLabels[value] ?? value}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {dialog?.type === 'reset' ? (
            <p className="text-sm text-muted-foreground">
              Un nouveau mot de passe temporaire sera genere. L'utilisateur
              devra le changer a la prochaine connexion.
            </p>
          ) : null}

          {dialog?.type === 'reactivate' ? (
            <p className="text-sm text-muted-foreground">
              Le compte sera reactive avec un nouveau mot de passe temporaire.
            </p>
          ) : null}

          {dialog?.type === 'disable' ? (
            <p className="text-sm text-muted-foreground">
              Le compte sera bloque et l'utilisateur ne pourra plus se
              connecter.
            </p>
          ) : null}

          {selectedAccountIsCurrentUser ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Vous ne pouvez pas appliquer cette action a votre propre compte.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {credentialResult ? (
            <TemporaryPasswordResult result={credentialResult} />
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialog(null);
                setCredentialResult(null);
              }}
              disabled={isMutating}
            >
              Fermer
            </Button>
            {!credentialResult ? (
              <Button
                type="button"
                variant={dialog?.type === 'disable' ? 'destructive' : 'default'}
                onClick={() => void handleDialogAction()}
                disabled={isMutating || selectedAccountIsCurrentUser}
              >
                {isMutating ? 'Traitement...' : 'Confirmer'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
