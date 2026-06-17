import type { PortalRequest, PortalRequestStatus } from "../../lib/api/requests";

export type RequestBucket = "active" | "draft" | "closed" | "rejected";
export type RequestViewMode = "grid" | "list";

export const requestBuckets: Array<{
  value: RequestBucket;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
}> = [
  {
    value: "active",
    label: "Actives",
    emptyTitle: "Aucune demande active.",
    emptyDescription:
      "Les demandes en cours de traitement apparaîtront ici.",
  },
  {
    value: "draft",
    label: "Brouillons",
    emptyTitle: "Aucun brouillon.",
    emptyDescription:
      "Créez une nouvelle demande pour préparer votre prochain dépôt.",
  },
  {
    value: "closed",
    label: "Clôturées",
    emptyTitle: "Aucune demande clôturée.",
    emptyDescription:
      "Les demandes arrivées au terme de leur traitement seront listées ici.",
  },
  {
    value: "rejected",
    label: "Non retenues",
    emptyTitle: "Aucune demande non retenue.",
    emptyDescription:
      "Les demandes non retenues ou annulées apparaîtront dans cet espace.",
  },
];

const inactiveStatuses = new Set<PortalRequestStatus>([
  "draft",
  "closed",
  "rejected",
]);

export function getRequestBucket(request: PortalRequest): RequestBucket {
  if (request.status === "draft") {
    return "draft";
  }

  if (request.status === "closed") {
    return "closed";
  }

  if (request.status === "rejected") {
    return "rejected";
  }

  return "active";
}

export function filterRequestsByBucket(
  requests: PortalRequest[],
  bucket: RequestBucket,
): PortalRequest[] {
  return requests.filter((request) => getRequestBucket(request) === bucket);
}

export function countRequestsByBucket(
  requests: PortalRequest[],
): Record<RequestBucket, number> {
  return requestBuckets.reduce(
    (counts, bucket) => ({
      ...counts,
      [bucket.value]: filterRequestsByBucket(requests, bucket.value).length,
    }),
    {
      active: 0,
      draft: 0,
      closed: 0,
      rejected: 0,
    } satisfies Record<RequestBucket, number>,
  );
}

export function getInitialBucket(requests: PortalRequest[]): RequestBucket {
  const active = requests.find((request) => !inactiveStatuses.has(request.status));

  if (active) {
    return "active";
  }

  return getRequestBucket(requests[0] ?? ({ status: "draft" } as PortalRequest));
}

export const formatRequestDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";
