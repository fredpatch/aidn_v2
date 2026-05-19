import { Bell, ClipboardList, ListChecks } from "lucide-react";

import { usePortalAuth } from "../lib/auth/PortalAuthContext";

const cards = [
  { title: "Mes demandes", value: "0", icon: ClipboardList },
  { title: "Actions requises", value: "0", icon: ListChecks },
  { title: "Notifications", value: "0", icon: Bell },
];

export function PortalDashboardPage(): React.JSX.Element {
  const { user } = usePortalAuth();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Tableau de bord postulant</h1>
        <p className="page-subtitle">Bienvenue, {user?.fullName}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Organisation liee
          {user?.organizationId ? ` : ${user.organizationId}` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.title} className="surface rounded-lg p-5">
              <Icon size={20} className="text-slate-600" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {card.title}
              </p>
              <p className="mt-1 text-3xl font-black text-slate-950">
                {card.value}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
