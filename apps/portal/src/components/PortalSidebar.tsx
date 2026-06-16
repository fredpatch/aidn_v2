import {
  Bell,
  CalendarDays,
  ClipboardList,
  Home,
  ListChecks,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { usePortalAuth } from "../lib/auth/PortalAuthContext";
import { portalRoutes } from "../lib/routes";

const navItems = [
  { label: "Tableau de bord", to: portalRoutes.dashboard, icon: Home },
  { label: "Mes demandes", to: portalRoutes.requests, icon: ClipboardList },
  { label: "Actions requises", to: portalRoutes.requests, icon: ListChecks },
  { label: "Rendez-vous", to: portalRoutes.rendezVous, icon: CalendarDays },
  { label: "Notifications", to: portalRoutes.notifications, icon: Bell },
];

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function PortalSidebar(): React.JSX.Element {
  const { logout, user } = usePortalAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(portalRoutes.login, { replace: true });
  };

  return (
    <aside className="surface h-fit rounded-xl p-3">
      {/* User chip */}
      {user ? (
        <div className="mb-3 flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5">
          <span
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
            aria-hidden="true"
          >
            {getInitials(user.fullName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">
              {user.fullName}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {user.email}
            </span>
          </span>
        </div>
      ) : null}

      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-l-[3px] border-slate-900 bg-slate-50 pl-[9px] text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")
              }
            >
              <Icon size={15} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          onClick={() => void handleLogout()}
        >
          <LogOut size={15} aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
