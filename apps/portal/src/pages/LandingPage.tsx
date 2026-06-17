import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { PortalStatusBadge } from "../components/PortalStatusBadge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { portalRoutes } from "../lib/routes";
import { highlights } from "@/constants/highlight";

export function LandingPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <PortalStatusBadge label="Portail externe" tone="info" />
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Portail postulant AIDN
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Le portail permet aux postulants de demander un accès, se connecter,
            déposer leurs demandes et suivre les étapes de traitement de leurs
            dossiers.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button className="py-5 px-4" asChild>
              <Link
                to={portalRoutes.accountRequest}
                className="flex items-center gap-2"
              >
                Demander un compte
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" className="py-5 px-4" asChild>
              <Link to={portalRoutes.login} className="flex items-center gap-2">
                Se connecter
              </Link>
            </Button>
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader className="border-b border-slate-200">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase text-slate-500">
                Statut du portail
              </p>
              <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                Services postulant actifs
              </CardTitle>
            </div>
            <CardAction>
              <PortalStatusBadge label="Opérationnel" tone="success" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <div>
                <dt className="text-sm font-semibold text-slate-500">
                  Demande de compte
                </dt>
                <dd className="mt-1 text-slate-950">
                  Formulaire soumis à validation ANAC
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-500">
                  Authentification
                </dt>
                <dd className="mt-1 text-slate-950">
                  Connexion postulant disponible
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-500">
                  Suivi des demandes
                </dt>
                <dd className="mt-1 text-slate-950">
                  Gestion et suivi des dossiers activés
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="surface rounded-lg p-5">
              <Icon className="text-slate-700" size={22} aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold text-slate-950">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
