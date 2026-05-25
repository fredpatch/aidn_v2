import { Badge } from "@/components/ui/badge";
import type { AdminDossierDetail } from "@/lib/api/dossiers.api";
import {
  DefinitionGrid,
  Field,
  Note,
  Section,
  dossierStatusLabels,
  dossierTypeLabels,
  formatDate,
} from "./dossier-detail.helpers";

export function DossierOverviewTab({
  detail,
}: {
  detail: AdminDossierDetail;
}): React.JSX.Element {
  const { dossier } = detail;
  return (
    <Section title="Vue d'ensemble">
      <DefinitionGrid>
        <Field label="Référence">{dossier.dossierNumber ?? dossier.id}</Field>
        <Field label="Type">{dossierTypeLabels[dossier.dossierType]}</Field>
        <Field label="Statut">
          <Badge variant="outline">
            {dossierStatusLabels[dossier.status] ?? dossier.status}
          </Badge>
        </Field>
        <Field label="Organisme">
          {dossier.organization?.canonicalName ?? "Non renseigné"}
        </Field>
        <Field label="Postulant">
          {dossier.postulant?.fullName ?? "Non renseigné"}
        </Field>
        <Field label="Date d'ouverture">{formatDate(dossier.openedAt)}</Field>
        {dossier.closedAt ? (
          <Field label="Date de clôture">
            {formatDate(dossier.closedAt)}
          </Field>
        ) : null}
      </DefinitionGrid>
      {dossier.organization?.legalAddress || dossier.organization?.email ? (
        <Note>
          {[
            dossier.organization.legalAddress &&
              `Adresse : ${dossier.organization.legalAddress}`,
            dossier.organization.email &&
              `Email : ${dossier.organization.email}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Note>
      ) : null}
    </Section>
  );
}
