import { Navigate, Route, Routes } from "react-router-dom";
import { AuthRoute } from "./components/auth/AuthRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { AccountRequestsPage } from "./pages/AccountRequestsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { CertificatsPage } from "./pages/CertificatsPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { CourriersPage } from "./pages/CourriersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { DgCircuitPage } from "./pages/DgCircuitPage";
import { FacturationS5Page } from "./pages/FacturationS5Page";
import { DossierDetailPage } from "./pages/DossierDetailPage";
import { DossiersPage } from "./pages/DossiersPage";
import { InternalAccountsPage } from "./pages/InternalAccountsPage";
import { LoginPage } from "./pages/LoginPage";
import { ManagementPage } from "./pages/ManagementPage";
import { PersonnelPage } from "./pages/PersonnelPage";
import { PortalPreviewDossierPage } from "./pages/PortalPreviewDossierPage";
import { PortalPreviewPage } from "./pages/PortalPreviewPage";
import { ReunionsPage } from "./pages/ReunionsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WorkflowOmaPage } from "./pages/WorkflowOmaPage";

export function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/changer-mot-de-passe" element={<ChangePasswordPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courriers" element={<CourriersPage />} />
          <Route path="/workflow-oma" element={<WorkflowOmaPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/reunions" element={<ReunionsPage />} />
          <Route path="/certificats" element={<CertificatsPage />} />
          <Route path="/management" element={<ManagementPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/portal-preview" element={<PortalPreviewPage />} />
          <Route
            path="/portal-preview/dossiers/:id"
            element={<PortalPreviewDossierPage />}
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute permissions={["PERSONNEL_SEARCH", "AIDN_USER_ACTIVATE"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/personnel" element={<PersonnelPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute permissions={["AIDN_USER_ACTIVATE"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/internal-accounts" element={<InternalAccountsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute permissions={["AUDIT_VIEW"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute permissions={["POSTULANT_ACCOUNT_REVIEW"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/demandes-comptes" element={<AccountRequestsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute permissions={["REQUEST_VIEW_ALL"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/demandes" element={<RequestsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute permissions={["DG_CIRCUIT_HANDLE", "COURRIER_REGISTER_PHYSICAL", "PRE_EVAL_DG_CIRCUIT_HANDLE"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/circuit-dg" element={<DgCircuitPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute permissions={["PAYMENT_VIEW"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/facturation-s5" element={<FacturationS5Page />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute permissions={["DOSSIER_VIEW_ALL"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/dossiers" element={<DossiersPage />} />
          <Route path="/dossiers/:id" element={<DossierDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
