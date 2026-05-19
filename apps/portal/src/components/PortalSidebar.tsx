import { Bell, ClipboardList, Home, ListChecks, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { usePortalAuth } from "../lib/auth/PortalAuthContext";
import { portalRoutes } from "../lib/routes";

const navItems = [
  {
    label: "Tableau de bord",
    to: portalRoutes.dashboard,
    icon: Home,
  },
  {
    label: "Mes demandes",
    to: portalRoutes.requests,
    icon: ClipboardList,
  },
  {
    label: "Actions requises",
    to: portalRoutes.dashboard,
    icon: ListChecks,
  },
  {
    label: "Notifications",
    to: portalRoutes.dashboard,
    icon: Bell,
  },
];

export function PortalSidebar(): React.JSX.Element {
  const { logout, user } = usePortalAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(portalRoutes.login, { replace: true });
  };

  return (
    <aside className="surface h-fit rounded-lg p-3">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`
              }
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-slate-200 pt-3">
        <p className="px-3 text-xs font-semibold uppercase text-slate-500">
          Bienvenue
        </p>
        <p className="truncate px-3 text-sm font-bold text-slate-950">
          {user?.fullName}
        </p>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          onClick={handleLogout}
        >
          <LogOut size={16} aria-hidden="true" />
          Se deconnecter
        </button>
      </div>
    </aside>
  );
}
