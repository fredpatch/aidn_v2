import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, Search } from "lucide-react";

import {
  approveAccountRequest,
  listPostulantOrganizations,
  type AccountRequestListItem,
  type MemberRole,
  type PostulantOrganization,
} from "../../lib/api/account-requests.api";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { isMockMode } from "../../lib/data/data-mode";
import { memberRoleOptions } from "./account-request.constants";
import { optional } from "./account-request.helpers";

export function ApproveDialog({
  request,
  onClose,
  onApproved,
  onError,
}: {
  request: AccountRequestListItem;
  onClose: () => void;
  onApproved: (request: AccountRequestListItem) => Promise<void>;
  onError: (message: string) => void;
}): React.JSX.Element {
  const [mode, setMode] = useState<"existing" | "create">("create");
  const [memberRole, setMemberRole] = useState<MemberRole>("primary_contact");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [organizations, setOrganizations] = useState<PostulantOrganization[]>(
    [],
  );
  const [organizationId, setOrganizationId] = useState("");
  const [createForm, setCreateForm] = useState(() => ({
    canonicalName: request.requestedOrganizationName,
    legalAddress: request.requestedLegalAddress ?? "",
    email: request.requestedEmail ?? "",
    phone: request.requestedPhone ?? "",
    approvalNumberOrigin: request.approvalNumberOrigin ?? "",
  }));
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const selectedOrganization = useMemo(
    () =>
      organizations.find((organization) => organization.id === organizationId),
    [organizationId, organizations],
  );
  const selectedOrganizationValue = organizationId || "none";

  const searchOrganizations = async () => {
    setLocalError("");
    setIsSearching(true);
    try {
      if (isMockMode()) {
        setOrganizations([]);
        return;
      }

      const response = await listPostulantOrganizations({
        search: organizationSearch,
        status: "active",
      });
      setOrganizations(response.items);
      if (response.items.length && !organizationId) {
        setOrganizationId(response.items[0].id);
      }
    } catch {
      setLocalError("Impossible de charger les organisations.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (mode === "existing") {
      void searchOrganizations();
    }
  }, [mode]);

  const handleSubmit = async () => {
    setLocalError("");

    if (mode === "existing" && !organizationId) {
      setLocalError("Selectionnez une organisation existante.");
      return;
    }

    if (mode === "create" && !createForm.canonicalName.trim()) {
      setLocalError("Le nom canonique est requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = isMockMode()
        ? {
            request: {
              ...request,
              status: "approved" as const,
              reviewedAt: new Date().toISOString(),
            },
          }
        : await approveAccountRequest(
            request.id,
            mode === "existing"
              ? {
                  organizationMode: "existing",
                  organizationId,
                  memberRole,
                }
              : {
                  organizationMode: "create",
                  organization: {
                    canonicalName: createForm.canonicalName.trim(),
                    legalAddress: optional(createForm.legalAddress),
                    email: optional(createForm.email),
                    phone: optional(createForm.phone),
                    approvalNumberOrigin: optional(
                      createForm.approvalNumberOrigin,
                    ),
                    aliases: [request.requestedOrganizationName],
                  },
                  memberRole,
                },
          );
      await onApproved(response.request);
    } catch {
      onError("Impossible d'approuver la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approuver la demande</DialogTitle>
          <DialogDescription>
            {request.requestedOrganizationName} - {request.contactFullName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <Card className="border-sky-200 bg-sky-50/70">
            <CardContent className="flex gap-3 p-4 text-sm text-sky-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="grid gap-1">
                <p className="font-semibold">
                  Pourquoi cette étape est importante
                </p>
                <p className="text-xs text-orange-700">
                  L’approbation crée l’accès postulant et rattache le contact à
                  une organisation canonique. Ce rattachement sert de référence
                  pour les futures demandes, l’historique et les statistiques.
                </p>
                <p className="text-xs text-sky-800">
                  Vérifiez si l’organisme existe déjà avant d’en créer un
                  nouveau : deux libellés différents peuvent désigner la même
                  entité,{" "}
                  <span className="italic font-semibold text-orange-700">
                    par exemple “Afrijet”, “Afrijjet” ou “Fly Gabon”
                  </span>
                  .{" "}
                  <span className="text-sky-800">
                    Si ces variantes sont créées séparément, les demandes seront
                    dispersées entre plusieurs fiches et les statistiques
                    pourront devenir trompeuses.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Mode de rattachement</FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card
                  className={`cursor-pointer transition-colors ${
                    mode === "existing"
                      ? "border-slate-900 bg-slate-50"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => setMode("existing")}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">
                      Organisation existante
                    </CardTitle>
                    <CardDescription>
                      Utiliser une organisation active déjà connue dans AIDN.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card
                  className={`cursor-pointer transition-colors ${
                    mode === "create"
                      ? "border-slate-900 bg-slate-50"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => setMode("create")}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">
                      Nouvelle organisation
                    </CardTitle>
                    <CardDescription>
                      Créer l’organisation canonique à partir des informations
                      demandées.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </Field>

            {mode === "existing" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Rattachement à une organisation active
                  </CardTitle>
                  <CardDescription>
                    Recherchez puis sélectionnez l’organisation qui portera ce
                    compte postulant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <form
                    className="grid gap-2 sm:grid-cols-[1fr_auto]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void searchOrganizations();
                    }}
                  >
                    <Input
                      placeholder="Rechercher une organisation active"
                      value={organizationSearch}
                      onChange={(event) =>
                        setOrganizationSearch(event.target.value)
                      }
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={isSearching}
                    >
                      <Search className="h-4 w-4" aria-hidden="true" />
                      Rechercher
                    </Button>
                  </form>

                  <Field>
                    <FieldLabel>Organisation</FieldLabel>
                    <Select
                      value={selectedOrganizationValue}
                      onValueChange={(value) =>
                        setOrganizationId(value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner une organisation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Selectionner une organisation
                        </SelectItem>
                        {organizations.map((organization) => (
                          <SelectItem
                            key={organization.id}
                            value={organization.id}
                          >
                            {organization.canonicalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedOrganization ? (
                      <FieldDescription>
                        Organisation active selectionnee :{" "}
                        {selectedOrganization.canonicalName}
                      </FieldDescription>
                    ) : null}
                  </Field>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Nouvelle organisation canonique
                  </CardTitle>
                  <CardDescription>
                    Ajustez les informations avant création. Le nom canonique
                    sera utilisé comme référence administrative.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Nom canonique</FieldLabel>
                    <Input
                      value={createForm.canonicalName}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          canonicalName: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Adresse legale</FieldLabel>
                    <Input
                      value={createForm.legalAddress}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          legalAddress: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      value={createForm.email}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Telephone</FieldLabel>
                    <Input
                      value={createForm.phone}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel>N d'agrement d'origine</FieldLabel>
                    <Input
                      value={createForm.approvalNumberOrigin}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          approvalNumberOrigin: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </CardContent>
              </Card>
            )}

            <Field>
              <FieldLabel>Role du membre</FieldLabel>
              <Select
                value={memberRole}
                onValueChange={(value) => setMemberRole(value as MemberRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un role" />
                </SelectTrigger>
                <SelectContent>
                  {memberRoleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Ce rôle définit les droits initiaux du contact dans l’espace
                postulant.
              </FieldDescription>
            </Field>
          </FieldGroup>

          {localError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localError}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Approbation..." : "Approuver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
