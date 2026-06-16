import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasAnyPermission } from '../../lib/auth/permissions';
import { AuthLoadingScreen } from './AuthLoadingScreen';

interface ProtectedRouteProps {
  permissions?: string[];
}

export function ProtectedRoute({ permissions = [] }: ProtectedRouteProps): React.JSX.Element {
  const { isAuthenticated, isLoading, requiresPasswordChange, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresPasswordChange && location.pathname !== '/changer-mot-de-passe') {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }

  if (!hasAnyPermission(user, permissions)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
