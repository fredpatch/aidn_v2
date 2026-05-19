import { FileText, LogIn, LogOut, UserRound } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { usePortalAuth } from "../lib/auth/PortalAuthContext";
import { portalRoutes } from "../lib/routes";

export function PortalHeader(): React.JSX.Element {
  const { isAuthenticated, logout, user } = usePortalAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(portalRoutes.login, { replace: true });
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={portalRoutes.landing}
          className="flex items-center gap-3 text-slate-950"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
            <FileText size={20} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide text-slate-500">
              AIDN
            </span>
            <span className="block text-base font-bold">Portail postulant</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden items-center gap-2 text-sm font-semibold text-slate-700 sm:inline-flex">
                <UserRound size={16} aria-hidden="true" />
                Bienvenue, {user?.fullName}
              </span>
              <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                <LogOut size={16} aria-hidden="true" />
                Se deconnecter
              </button>
            </>
          ) : (
            <>
              <NavLink
                to={portalRoutes.accountRequest}
                className={({ isActive }) =>
                  `btn ${isActive ? "btn-primary" : "btn-secondary"}`
                }
              >
                Demander un compte
              </NavLink>
              <NavLink
                to={portalRoutes.login}
                className={({ isActive }) =>
                  `btn ${isActive ? "btn-primary" : "btn-secondary"}`
                }
              >
                <LogIn size={16} aria-hidden="true" />
                Se connecter
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
