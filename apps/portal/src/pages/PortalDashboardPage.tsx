import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ListChecks,
} from "lucide-react";
import { Link } from "react-router-dom";

import { usePortalAuth } from "../lib/auth/PortalAuthContext";
import type { PortalMeeting } from "../lib/api/meetings";
import type { PortalRequest } from "../lib/api/requests";
import {
  usePortalMeetings,
  usePortalNotifications,
  usePortalRequests,
} from "../lib/query";
import { portalRoutes } from "../lib/routes";

function deriveStats(
  requests: PortalRequest[],
  unreadCount: number,
  meetings: PortalMeeting[],
) {
  const now = Date.now();
  const nextMeeting = meetings.find(
    (m) =>
      m.scheduledAt &&
      m.status !== "cancelled" &&
      new Date(m.scheduledAt).getTime() >= now,
  );

  return {
    demandes: requests.filter((r) => r.status !== "draft").length,
    actionsRequises: requests.filter(
      (r) => r.status === "intake_requires_correction",
    ).length,
    notifications: unreadCount,
    nextMeetingLabel: nextMeeting?.scheduledAt
      ? new Intl.DateTimeFormat("fr-FR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(nextMeeting.scheduledAt))
      : null,
    lastActiveRequest: requests.find((r) => r.status !== "draft") ?? null,
  };
}

type Stats = ReturnType<typeof deriveStats>;

type KpiCard = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  to: string;
  urgent?: boolean;
  attention?: boolean;
  sub?: string;
};

function buildCards(stats: Stats): KpiCard[] {
  return [
    {
      title: "Mes demandes",
      value: stats.demandes,
      icon: ClipboardList,
      to: portalRoutes.requests,
    },
    {
      title: "Actions requises",
      value: stats.actionsRequises,
      icon: ListChecks,
      to: portalRoutes.requests,
      urgent: stats.actionsRequises > 0,
    },
    {
      title: "Notifications non lues",
      value: stats.notifications,
      icon: Bell,
      to: portalRoutes.notifications,
      attention: stats.notifications > 0,
    },
    {
      title: "Prochain rendez-vous",
      value: stats.nextMeetingLabel ?? "Aucun",
      icon: CalendarDays,
      to: portalRoutes.rendezVous,
    },
  ];
}

export function PortalDashboardPage(): React.JSX.Element {
  const { user } = usePortalAuth();
  const requestsQuery = usePortalRequests();
  const notificationsQuery = usePortalNotifications({
    status: "unread",
    limit: 50,
  });
  const meetingsQuery = usePortalMeetings({ status: "all" });
  const stats = deriveStats(
    requestsQuery.data?.items ?? [],
    notificationsQuery.data?.unreadCount ?? 0,
    meetingsQuery.data?.items ?? [],
  );

  const cards = buildCards(stats);
  const firstName = user?.fullName?.split(" ")[0] ?? "Bienvenue";

  return (
    <section className="flex flex-col gap-8">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Tableau de bord
        </p>
        <h1 className="mt-1 page-title">Bonjour, {firstName}</h1>
        <p className="page-subtitle">
          Retrouvez ici l'état de vos demandes et vos prochaines étapes.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className={[
                "kpi-card group",
                card.urgent
                  ? "border-amber-200 bg-amber-50 hover:bg-amber-50"
                  : card.attention
                    ? "border-sky-200 bg-sky-50 hover:bg-sky-50"
                    : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <Icon
                  size={18}
                  className={
                    card.urgent
                      ? "text-amber-600"
                      : card.attention
                        ? "text-sky-600"
                        : "text-slate-400"
                  }
                  aria-hidden="true"
                />
                <ArrowRight
                  size={14}
                  className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p
                  className={[
                    "text-2xl font-black",
                    card.urgent
                      ? "text-amber-900"
                      : card.attention
                        ? "text-sky-900"
                        : "text-slate-900",
                  ].join(" ")}
                >
                  {card.value}
                </p>
                <p
                  className={[
                    "mt-0.5 text-xs font-medium",
                    card.urgent
                      ? "text-amber-700"
                      : card.attention
                        ? "text-sky-700"
                        : "text-slate-500",
                  ].join(" ")}
                >
                  {card.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Contextual next-step banner */}
      {stats.actionsRequises > 0 ? (
        <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <ListChecks
            size={20}
            className="mt-0.5 flex-shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-900">
              {stats.actionsRequises === 1
                ? "Une action est requise de votre part"
                : `${stats.actionsRequises} actions requises de votre part`}
            </p>
            <p className="mt-0.5 text-sm text-amber-700">
              Consultez votre demande pour voir les étapes à compléter.
            </p>
          </div>
          <Link
            to={portalRoutes.requests}
            className="btn btn-secondary flex-shrink-0 border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
          >
            Voir
          </Link>
        </div>
      ) : stats.lastActiveRequest ? (
        <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <CheckCircle2
            size={20}
            className="mt-0.5 flex-shrink-0 text-emerald-500"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">
              Aucune action requise pour le moment
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {stats.lastActiveRequest.portalStatusLabel}
            </p>
          </div>
          <Link
            to={portalRoutes.requests}
            className="btn btn-secondary flex-shrink-0"
          >
            Voir ma demande
          </Link>
        </div>
      ) : null}
    </section>
  );
}
