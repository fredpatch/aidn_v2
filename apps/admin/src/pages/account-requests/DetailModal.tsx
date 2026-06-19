import type { ReactNode } from "react";

import type { AccountRequestListItem } from "../../lib/api/account-requests";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../../components/ui/drawer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { statusLabels } from "./account-request.constants";
import {
  formatDate,
  isFinalized,
  statusBadgeVariant,
} from "./account-request.helpers";

function DetailField({
  label,
  value,
  required,
}: {
  label: string;
  value?: string;
  required?: boolean;
}): React.JSX.Element | null {
  if (!value && !required) {
    return null;
  }

  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
        {value || "-"}
      </dd>
    </div>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

function hasDecisionDetails(request: AccountRequestListItem): boolean {
  return Boolean(
    request.rejectionReason ||
      request.matchedOrganizationId ||
      request.createdOrganizationId ||
      request.resultingUserId,
  );
}

export function DetailModal({
  request,
  onClose,
  onApprove,
  onReject,
}: {
  request: AccountRequestListItem;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}): React.JSX.Element {
  return (
    <Drawer open direction="right" onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="inset-y-0 left-auto right-0 mt-0 h-full w-full max-w-2xl rounded-none border-l bg-background">
        <DrawerHeader className="border-b text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DrawerTitle className="text-xl">
                Détail de la demande
              </DrawerTitle>
              <DrawerDescription>
                Données sanitisees de la demande postulant.
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="outline" type="button" size="sm">
                Fermer
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="organization" className="grid gap-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="organization">Organisation</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="decision">Décision</TabsTrigger>
            </TabsList>

            <TabsContent value="organization" className="mt-0">
              <DetailCard title="Informations organisme">
                <DetailField
                  label="Organisme demandé"
                  value={request.requestedOrganizationName}
                  required
                />
                <DetailField
                  label="Adresse légale"
                  value={request.requestedLegalAddress}
                />
                <DetailField
                  label="Email organisme"
                  value={request.requestedEmail}
                />
                <DetailField
                  label="Téléphone organisme"
                  value={request.requestedPhone}
                />
                <DetailField
                  label="N d'agrément d'origine"
                  value={request.approvalNumberOrigin}
                />
              </DetailCard>
            </TabsContent>

            <TabsContent value="contact" className="mt-0">
              <DetailCard title="Contact postulant">
                <DetailField
                  label="Nom du contact"
                  value={request.contactFullName}
                  required
                />
                <DetailField
                  label="Email du contact"
                  value={request.contactEmail}
                  required
                />
                <DetailField
                  label="Téléphone du contact"
                  value={request.contactPhone}
                />
              </DetailCard>
            </TabsContent>

            <TabsContent value="decision" className="mt-0">
              <div className="grid gap-4">
                <DetailCard title="Statut de la demande">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">
                      Statut
                    </dt>
                    <dd className="mt-1">
                      <Badge variant={statusBadgeVariant(request.status)}>
                        {statusLabels[request.status]}
                      </Badge>
                    </dd>
                  </div>
                  <DetailField
                    label="Date de soumission"
                    value={formatDate(request.createdAt)}
                    required
                  />
                  <DetailField
                    label="Date de revue"
                    value={
                      request.reviewedAt
                        ? formatDate(request.reviewedAt)
                        : undefined
                    }
                  />
                </DetailCard>

                {hasDecisionDetails(request) ? (
                  <DetailCard title="Décision">
                    <DetailField
                      label="Motif de rejet"
                      value={request.rejectionReason}
                    />
                    <DetailField
                      label="Organisation liée"
                      value={request.matchedOrganizationId}
                    />
                    <DetailField
                      label="Organisation créée"
                      value={request.createdOrganizationId}
                    />
                    <DetailField
                      label="Utilisateur créé"
                      value={request.resultingUserId}
                    />
                  </DetailCard>
                ) : (
                  <Card>
                    <CardContent className="p-4 text-sm text-slate-500">
                      Aucune décision enregistrée pour le moment.
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DrawerFooter className="flex-row justify-end border-t">
          <DrawerClose asChild>
            <Button variant="outline" type="button" size="sm">
              Fermer
            </Button>
          </DrawerClose>
          <Button
            type="button"
            size="sm"
            disabled={isFinalized(request)}
            onClick={onApprove}
          >
            Approuver
          </Button>
          <Button
            variant="destructive"
            size="sm"
            type="button"
            disabled={isFinalized(request)}
            onClick={onReject}
          >
            Rejeter
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
