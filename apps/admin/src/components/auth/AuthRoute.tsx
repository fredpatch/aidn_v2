import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export function AuthRoute(): React.JSX.Element {
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    if (requiresPasswordChange) {
      return <Navigate to="/changer-mot-de-passe" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
