import {
  Award,
  Circle,
  Clock,
  FileText,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDossierDetail, AdminOmaPhase } from "@/lib/api/dossiers";
import {
  dossierStatusLabels,
  dossierTypeLabels,
  formatDate,
  phaseKeyLabels,
} from "./dossier-detail.labels";
import {
  PhaseStatusBadge,
} from "./dossier-detail.helpers";

const certificateStatusSteps = [
  "Non demarre",
  "Modele disponible",
  "Certificat genere",
  "Imprime pour signature",
  "Envoye a la signature DG",
  "Signe/cachete par DG",
  "Rendez-vous retrait planifie",
  "Signe et retire par le postulant",
  "Scanne et archive dans AIDN",
  "Phase delivrance cloturee",
];

const certificateDocuments = [
  "Modele certificat",
  "Certificat genere",
  "Scan signe/cachete DG",
  "Scan final signe DG + postulant",
];

function getDeliveryPhase(detail: AdminDossierDetail): AdminOmaPhase | undefined {
  return detail.phases.find((phase) => phase.phaseKey === "delivery");
}

function getCurrentStatus(
  detail: AdminDossierDetail,
  deliveryPhase?: AdminOmaPhase,
): {
  label: string;
  tone: "ready" | "waiting" | "blocked";
  description: string;
} {
  if (detail.dossier.status === "closed") {
    return {
      label: "Dossier cloture",
      tone: "ready",
      description:
        "Le dossier est cloture. Le futur suivi certificat devra lire le certificat archive.",
    };
  }

  if (
    detail.dossier.status === "delivery_phase" ||
    deliveryPhase?.status === "in_progress"
  ) {
    return {
      label: "Phase delivrance active",
      tone: "waiting",
      description:
        "Le dossier est en phase de delivrance. Le backend certificat reste a implementer avant toute action.",
    };
  }

  return {
    label: "Non demarre",
    tone: "blocked",
    description:
      "Le certificat intervient uniquement en Phase 5 - Delivrance, apres completion des phases precedentes.",
  };
}

function StatusBadge({
  tone,
  label,
}: {
  tone: "ready" | "waiting" | "blocked";
  label: string;
}): React.JSX.Element {
  if (tone === "ready") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        {label}
      </Badge>
    );
  }
  if (tone === "waiting") {
    return <Badge variant="secondary">{label}</Badge>;
  }
  return <Badge variant="outline">{label}</Badge>;
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function ReadonlySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DossierCertificatTab({
  detail,
}: {
  detail: AdminDossierDetail;
}): React.JSX.Element {
  const deliveryPhase = getDeliveryPhase(detail);
  const currentStatus = getCurrentStatus(detail, deliveryPhase);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Certificat
        </h2>
        <p className="text-sm text-muted-foreground">
          Suivi de generation, signature DG, retrait postulant et archivage.
        </p>
      </div>

      <ReadonlySection
        title="Statut actuel"
        icon={<Award className="h-4 w-4" aria-hidden="true" />}
      >
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={currentStatus.tone} label={currentStatus.label} />
            <Badge variant="outline">Lecture seule</Badge>
          </div>
          <p className="text-muted-foreground">{currentStatus.description}</p>
        </div>
      </ReadonlySection>

      <ReadonlySection
        title="Informations certificat"
        icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <InfoField
            label="Organisme"
            value={detail.dossier.organization?.canonicalName ?? "Non renseigne"}
          />
          <InfoField
            label="Postulant"
            value={detail.dossier.postulant?.fullName ?? "Non renseigne"}
          />
          <InfoField
            label="Type certificat"
            value={dossierTypeLabels[detail.dossier.dossierType]}
          />
          <InfoField label="Numero certificat" value="A creer" />
          <InfoField label="Date delivrance" value="Non renseignee" />
          <InfoField label="Date expiration" value="Non renseignee" />
          <InfoField
            label="Dossier lie"
            value={detail.dossier.dossierNumber ?? detail.dossier.id}
          />
          <InfoField
            label="Statut dossier"
            value={
              dossierStatusLabels[detail.dossier.status] ?? detail.dossier.status
            }
          />
          <InfoField
            label="Phase liee"
            value={
              deliveryPhase
                ? phaseKeyLabels[deliveryPhase.phaseKey]
                : "Phase 5 non demarree"
            }
          />
        </dl>
      </ReadonlySection>

      <ReadonlySection
        title="Phase de delivrance"
        icon={<Clock className="h-4 w-4" aria-hidden="true" />}
      >
        {deliveryPhase ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <InfoField
              label="Statut phase"
              value={<PhaseStatusBadge status={deliveryPhase.status} />}
            />
            <InfoField label="Debut" value={formatDate(deliveryPhase.startedAt)} />
            <InfoField label="Cloture" value={formatDate(deliveryPhase.closedAt)} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune phase de delivrance active n'est exposee dans le dossier pour
            le moment.
          </p>
        )}
      </ReadonlySection>

      <ReadonlySection
        title="Documents attendus"
        icon={<FileText className="h-4 w-4" aria-hidden="true" />}
      >
        <ul className="divide-y text-sm">
          {certificateDocuments.map((label) => (
            <li
              key={label}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {label}
              </span>
              <Badge variant="outline">Non disponible</Badge>
            </li>
          ))}
        </ul>
      </ReadonlySection>

      <ReadonlySection
        title="Cycle cible"
        icon={<Circle className="h-4 w-4" aria-hidden="true" />}
      >
        <ol className="grid gap-2 text-sm sm:grid-cols-2">
          {certificateStatusSteps.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </ReadonlySection>

      <ReadonlySection
        title="Actions disponibles"
        icon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />}
      >
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Aucune action certificat n'est activee dans cette tranche. Les
            actions de generation, impression, circuit DG, retrait, scan final et
            cloture seront ajoutees apres le modele certificat et les permissions
            dediees.
          </p>
          <p>
            Le parcours officiel reste physique : signature/cachet DG, retrait
            par le postulant, puis scan final archive dans AIDN.
          </p>
        </div>
      </ReadonlySection>
    </div>
  );
}
