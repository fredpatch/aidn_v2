import { FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { portalRoutes } from "../lib/routes";

export function NotFoundPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <EmptyState
          icon={FileQuestion}
          title="Page introuvable"
          description="La page demandee n'existe pas dans le portail postulant."
        />
        <div className="text-center">
          <Link to={portalRoutes.landing} className="btn btn-primary">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
