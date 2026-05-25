import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDossierDetail } from "@/lib/api/dossiers.api";
import {
  DefinitionGrid,
  Field,
  Note,
  PhaseStatusBadge,
  Section,
  dossierStatusLabels,
  dossierTypeLabels,
  formatDate,
  phaseKeyLabels,
} from "./dossier-detail.helpers";
import { getPreliminaryProgress } from "./preliminary-progress.helpers";

export function DossierOverviewTab({
  detail,
}: {
  detail: AdminDossierDetail;
}): React.JSX.Element {
  const { dossier } = detail;
  const activePhase = detail.phases.find((p) => p.status === "in_progress");

  const progress =
    activePhase?.phaseKey === "preliminary" && detail.preliminary
      ? getPreliminaryProgress(detail.preliminary.phase)
      : null;

  return (
    <div className="space-y-4">
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Progression OMA</CardTitle>
        </CardHeader>
        <CardContent>
          {activePhase ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {phaseKeyLabels[activePhase.phaseKey]}
                </span>
                <PhaseStatusBadge status={activePhase.status} />
              </div>
              {progress ? (
                <dl className="space-y-1 text-sm">
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-muted-foreground">Avancement :</dt>
                    <dd className="font-medium">
                      {progress.doneCount} / {progress.totalCount} étapes
                    </dd>
                  </div>
                  {progress.currentStep ? (
                    <div className="flex items-baseline gap-1.5">
                      <dt className="text-muted-foreground">Étape en cours :</dt>
                      <dd>{progress.currentStep.label}</dd>
                    </div>
                  ) : null}
                  {progress.nextActionLabel ? (
                    <div className="flex items-baseline gap-1.5">
                      <dt className="text-muted-foreground">
                        Prochaine action DN :
                      </dt>
                      <dd>{progress.nextActionLabel}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune phase active détectée.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
