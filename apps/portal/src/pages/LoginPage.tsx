import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { PortalApiError } from "../lib/api/http";
import { usePortalAuth } from "../lib/auth/PortalAuthContext";
import { portalRoutes } from "../lib/routes";

export function LoginPage(): React.JSX.Element {
  const { isAuthenticated, isLoading, login } = usePortalAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={portalRoutes.dashboard} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(portalRoutes.dashboard, { replace: true });
    } catch (nextError) {
      setError(
        nextError instanceof PortalApiError && nextError.status >= 500
          ? nextError.message
          : "Email ou mot de passe incorrect.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h1 className="page-title">Connexion postulant</h1>
        <p className="page-subtitle">
          Connectez-vous avec l'email et le mot de passe utilises lors de votre
          demande de compte approuvee.
        </p>
      </div>

      <form className="surface grid gap-4 rounded-lg p-5" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <LogIn size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Acces portail</h2>
            <p className="text-sm text-slate-600">Session postulant securisee</p>
          </div>
        </div>
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="control"
            value={email}
            autoComplete="email"
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            className="control"
            value={password}
            autoComplete="current-password"
            required
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Connexion en cours..." : "Se connecter"}
        </button>
        <Link
          to={portalRoutes.accountRequest}
          className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
        >
          Pas encore de compte ? Demander un compte
        </Link>
      </form>
    </section>
  );
}
