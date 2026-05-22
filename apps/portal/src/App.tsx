import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { PortalLayout } from "./layouts/PortalLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { AccountRequestPage } from "./pages/AccountRequestPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MyRequestsPage } from "./pages/MyRequestsPage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PortalDashboardPage } from "./pages/PortalDashboardPage";
import { RendezVousPage } from "./pages/RendezVousPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { usePortalAuth } from "./lib/auth/PortalAuthContext";
import { portalRoutes } from "./lib/routes";

function ProtectedPortalRoute({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const { isAuthenticated, isLoading } = usePortalAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm font-semibold text-slate-600">
        Chargement de la session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={portalRoutes.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}

export function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={portalRoutes.landing} element={<LandingPage />} />
        <Route
          path={portalRoutes.accountRequest}
          element={<AccountRequestPage />}
        />
        <Route path={portalRoutes.login} element={<LoginPage />} />
      </Route>

      <Route
        element={
          <ProtectedPortalRoute>
            <PortalLayout />
          </ProtectedPortalRoute>
        }
      >
        <Route
          path={portalRoutes.dashboard}
          element={<PortalDashboardPage />}
        />
        <Route path={portalRoutes.requests} element={<MyRequestsPage />} />
        <Route path={portalRoutes.newRequest} element={<NewRequestPage />} />
        <Route path="/demandes/:id" element={<RequestDetailPage />} />
        <Route
          path={portalRoutes.notifications}
          element={<NotificationsPage />}
        />
        <Route path={portalRoutes.rendezVous} element={<RendezVousPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
