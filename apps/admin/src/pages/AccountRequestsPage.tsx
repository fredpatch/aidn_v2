import { useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  CalendarClock,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  getAccountRequest,
  listAccountRequests,
  type AccountRequestListItem,
} from "../lib/api/account-requests";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { isMockMode } from "../lib/data/data-mode";
import { ApproveDialog } from "./account-requests/ApproveDialog";
import { DateFilterPicker } from "./account-requests/DateFilterPicker";
import { DetailModal } from "./account-requests/DetailModal";
import { HeaderLabel } from "./account-requests/HeaderLabel";
import { RejectDialog } from "./account-requests/RejectDialog";
import {
  mockRequests,
  statusLabels,
} from "./account-requests/account-request.constants";
import {
  formatDate,
  isFinalized,
  statusBadgeVariant,
} from "./account-requests/account-request.helpers";
import { Field, FieldLabel } from "@/components/ui/field";

export function AccountRequestsPage(): React.JSX.Element {
  const [items, setItems] = useState<AccountRequestListItem[]>([]);
  const [selected, setSelected] = useState<AccountRequestListItem | null>(null);
  const [approveTarget, setApproveTarget] =
    useState<AccountRequestListItem | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<AccountRequestListItem | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = async () => {
    setError("");
    setIsLoading(true);
    try {
      if (isMockMode()) {
        setItems(mockRequests);
        return;
      }

      const response = await listAccountRequests({
        search,
        status: status === "all" ? "" : status,
        from,
        to,
      });
      setItems(response.items);
    } catch {
      setError("Impossible de charger les demandes de compte.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadRequests();
  };

  const openDetails = async (request: AccountRequestListItem) => {
    setError("");
    try {
      if (isMockMode()) {
        setSelected(request);
        return;
      }

      const response = await getAccountRequest(request.id);
      setSelected(response.request);
    } catch {
      setError("Impossible de charger le detail de la demande.");
    }
  };

  const refreshAfterMutation = async (request?: AccountRequestListItem) => {
    await loadRequests();
    if (request) {
      try {
        const response = isMockMode()
          ? { request }
          : await getAccountRequest(request.id);
        setSelected(response.request);
      } catch {
        setSelected(null);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes de compte postulant</h1>
          <p className="page-subtitle">
            Validation des demandes d'acces externes et rattachement aux
            organisations canoniques.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form
            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_180px_auto]"
            onSubmit={handleFilter}
          >
            <Field>
              <FieldLabel htmlFor="account-request-search">
                Recherche
              </FieldLabel>
              <Input
                id="account-request-search"
                placeholder="..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Statut</FieldLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger aria-label="Statut">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Date début</FieldLabel>
              <DateFilterPicker
                label="Date début"
                value={from}
                onChange={setFrom}
              />
            </Field>
            <Field>
              <FieldLabel>Date fin</FieldLabel>
              <DateFilterPicker label="Date fin" value={to} onChange={setTo} />
            </Field>
            <Button type="submit" disabled={isLoading} className="self-end">
              <Search className="h-4 w-4" aria-hidden="true" />
              Filtrer
            </Button>
          </form>
        </CardContent>
      </Card>

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

      <section className="surface overflow-hidden rounded-lg">
        <Table className="min-w-[980px]">
          <TableHeader className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <TableRow>
              <TableHead>
                <HeaderLabel icon={Building2}>Nom organisme</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={UserRound}>Contact</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Mail}>Email contact</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Phone}>Telephone</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={ShieldCheck}>Statut</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={CalendarClock}>Date de demande</HeaderLabel>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.requestedOrganizationName}
                </TableCell>
                <TableCell>{item.contactFullName}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">
                  {item.contactEmail}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">
                  {item.contactPhone ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(item.status)}>
                    {statusLabels[item.status]}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                  {formatDate(item.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Actions"
                        >
                          <MoreHorizontal
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => void openDetails(item)}
                        >
                          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                          Voir le détail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isFinalized(item)}
                          onClick={() => setApproveTarget(item)}
                        >
                          Approuver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-700 focus:text-red-700"
                          disabled={isFinalized(item)}
                          onClick={() => setRejectTarget(item)}
                        >
                          Rejeter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={7}
                >
                  {isLoading
                    ? "Chargement..."
                    : "Aucune demande de compte postulant trouvee."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>

      {selected ? (
        <DetailModal
          request={selected}
          onClose={() => setSelected(null)}
          onApprove={() => setApproveTarget(selected)}
          onReject={() => setRejectTarget(selected)}
        />
      ) : null}

      {approveTarget ? (
        <ApproveDialog
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApproved={async (request) => {
            setApproveTarget(null);
            setSuccess("Demande approuvee. Le compte postulant a ete cree.");
            await refreshAfterMutation(request);
          }}
          onError={setError}
        />
      ) : null}

      {rejectTarget ? (
        <RejectDialog
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={async (request) => {
            setRejectTarget(null);
            setSuccess("Demande rejetee.");
            await refreshAfterMutation(request);
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}
