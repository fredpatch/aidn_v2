import { ArrowRight, ClipboardCheck, ShieldCheck, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";

import { PortalStatusBadge } from "../components/PortalStatusBadge";
import { portalRoutes } from "../lib/routes";

const highlights = [
  {
    icon: ClipboardCheck,
    title: "Demandes centralisées",
    text: "Un espace dédié pour préparer les futures demandes et suivre leur avancement.",
  },
  {
    icon: TimerReset,
    title: "Suivi simplifié",
    text: "Des statuts lisibles pour comprendre les prochaines étapes sans vocabulaire administratif lourd.",
  },
  {
    icon: ShieldCheck,
    title: "Accès validé",
    text: "La création de compte reste soumise à validation par les services compétents de l’ANAC.",
  },
];

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
            Le portail permet aux postulants de demander un accès, soumettre
            leurs demandes et suivre l’avancement simplifié de leurs dossiers.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={portalRoutes.accountRequest} className="btn btn-primary">
              Demander un compte
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to={portalRoutes.login} className="btn btn-secondary">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="surface rounded-lg p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">
                Statut du portail
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Squelette fonctionnel
              </h2>
            </div>
            <PortalStatusBadge label="Initialisé" tone="success" />
          </div>
          <dl className="mt-5 grid gap-4">
            <div>
              <dt className="text-sm font-semibold text-slate-500">
                Demande de compte
              </dt>
              <dd className="mt-1 text-slate-950">Formulaire préparé</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">
                Authentification
              </dt>
              <dd className="mt-1 text-slate-950">À venir</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">
                Suivi des demandes
              </dt>
              <dd className="mt-1 text-slate-950">Pages réservées</dd>
            </div>
          </dl>
        </div>
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
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
