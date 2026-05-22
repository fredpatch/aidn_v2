import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  AlertToolbar,
} from "../components/Alert";
import {
  listPortalNotifications,
  markAllPortalNotificationsRead,
  markPortalNotificationRead,
  type PortalNotification,
} from "../lib/api/portal.api";
import { PortalApiError } from "../lib/api/http";

function formatDateTime(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(caught: unknown): string {
  return caught instanceof PortalApiError
    ? caught.message
    : "Une erreur est survenue. Veuillez réessayer.";
}

export function NotificationsPage(): React.JSX.Element {
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await listPortalNotifications({ status: "all", limit: 50 });
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      const { notification } = await markPortalNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...notification } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Notification marquée comme lue.");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setBusyAll(true);
    try {
      await markAllPortalNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, status: "read" as const })));
      setUnreadCount(0);
      toast.success("Toutes les notifications sont marquées comme lues.");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes les notifications sont lues."}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="btn btn-secondary w-fit"
            onClick={() => void markAllRead()}
            disabled={busyAll}
          >
            <CheckCheck size={16} aria-hidden="true" />
            {busyAll ? "En cours…" : "Tout marquer comme lu"}
          </button>
        ) : null}
      </div>

      {error ? (
        <Alert variant="danger" appearance="light">
          <AlertContent>
            <AlertTitle>{error}</AlertTitle>
          </AlertContent>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="surface rounded-lg p-5 text-sm font-semibold text-slate-600">
          Chargement des notifications…
        </div>
      ) : items.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 rounded-lg p-10 text-center">
          <Bell size={32} className="text-slate-300" aria-hidden="true" />
          <p className="font-semibold text-slate-700">
            Aucune notification pour le moment.
          </p>
          <p className="text-sm text-slate-500">
            Vous serez notifié ici lors des mises à jour de vos demandes.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => {
            const isUnread = n.status === "unread";

            return (
              <Alert
                key={n.id}
                variant={isUnread ? "info" : "secondary"}
                appearance={isUnread ? "light" : "outline"}
              >
                <AlertIcon>
                  <Bell
                    size={16}
                    className={isUnread ? "text-sky-500" : "text-slate-400"}
                    aria-label={
                      isUnread ? "Notification non lue" : "Notification lue"
                    }
                  />
                </AlertIcon>
                <AlertContent>
                  <AlertTitle>{n.title}</AlertTitle>
                  <AlertDescription>{n.message}</AlertDescription>
                  <p className="mt-1.5 text-xs opacity-60">
                    {formatDateTime(n.createdAt)}
                    {n.readAt
                      ? ` · Lu le ${formatDateTime(n.readAt)}`
                      : ""}
                  </p>
                  {isUnread ? (
                    <AlertToolbar>
                      <button
                        type="button"
                        className="btn btn-secondary text-xs"
                        onClick={() => void markRead(n.id)}
                        disabled={busyId === n.id}
                      >
                        {busyId === n.id ? "…" : "Marquer comme lu"}
                      </button>
                    </AlertToolbar>
                  ) : null}
                </AlertContent>
              </Alert>
            );
          })}
        </div>
      )}
    </section>
  );
}
