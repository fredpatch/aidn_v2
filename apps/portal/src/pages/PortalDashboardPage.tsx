import { Bell, CalendarDays, ClipboardList, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { usePortalAuth } from "../lib/auth/PortalAuthContext";
import {
  listPortalNotifications,
  listPortalMeetings,
  listRequests,
  type PortalMeeting,
  type PortalRequest,
} from "../lib/api/portal.api";
import { portalRoutes } from "../lib/routes";

function deriveStats(
  requests: PortalRequest[],
  unreadCount: number,
  meetings: PortalMeeting[],
) {
  const now = Date.now();
  const nextMeeting = meetings.find(
    (meeting) =>
      meeting.scheduledAt &&
      meeting.status !== "cancelled" &&
      new Date(meeting.scheduledAt).getTime() >= now,
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
      : "Aucun",
  };
}

export function PortalDashboardPage(): React.JSX.Element {
  const { user } = usePortalAuth();
  const [stats, setStats] = useState({
    demandes: 0,
    actionsRequises: 0,
    notifications: 0,
    nextMeetingLabel: "Aucun",
  });

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      listRequests(),
      listPortalNotifications({ status: "unread", limit: 50 }),
      listPortalMeetings({ status: "all" }),
    ]).then(([requestsRes, notificationsRes, meetingsRes]) => {
      if (isMounted) {
        setStats(
          deriveStats(
            requestsRes.items,
            notificationsRes.unreadCount,
            meetingsRes.items,
          ),
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = [
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
    },
    {
      title: "Notifications",
      value: stats.notifications,
      icon: Bell,
      to: portalRoutes.notifications,
    },
    {
      title: "Prochain rendez-vous",
      value: stats.nextMeetingLabel,
      icon: CalendarDays,
      to: portalRoutes.rendezVous,
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Tableau de bord postulant</h1>
        <p className="page-subtitle">Bienvenue, {user?.fullName}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Organisation liée
          {user?.organizationId ? ` : ${user.organizationId}` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              to={card.to}
              className="surface rounded-lg p-5 transition-colors hover:bg-slate-100"
            >
              <Icon size={20} className="text-slate-600" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {card.title}
              </p>
              <p className="mt-1 text-3xl font-black text-slate-950">
                {card.value}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
