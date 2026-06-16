import { useEffect, useState, type ComponentType, type FormEvent, type ReactNode } from 'react';
import { CalendarCheck, Clock, Hash, ShieldCheck, UserCog, UserRound } from 'lucide-react';
import { listInternalAccounts, type InternalAccount } from '../lib/api/admin.api';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { isMockMode } from '../lib/data/data-mode';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  dn_supervisor: 'Superviseur DN',
  dn_agent: 'Agent DN',
  dg_secretariat: 'Secretariat DG',
  reception: 'Reception',
  bureau_courrier: 'Bureau courrier',
  bootstrap_admin: 'Administrateur initial',
};

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

export function InternalAccountsPage(): React.JSX.Element {
  const [items, setItems] = useState<InternalAccount[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
              </TableRow>
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  {isLoading ? 'Chargement...' : 'Aucun compte trouve.'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
