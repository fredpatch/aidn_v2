export function AnalysisPage(): React.JSX.Element {
  const kpis = [
    { label: 'Ce mois', value: '-' },
    { label: 'Mois précédent', value: '-' },
    { label: 'Année en cours', value: '-' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analyse</h1>
          <p className="page-subtitle">Surfaces d’analyse prévues pour les sources de données configurées.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="surface rounded-lg p-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-300 dark:text-slate-600">{kpi.value}</p>
          </article>
        ))}
      </div>
      <section className="surface flex flex-wrap items-end gap-4 rounded-lg p-4">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Période
          <input className="control mt-1 block bg-slate-50 text-slate-400" type="date" disabled />
        </label>
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Catégorie
          <select className="control mt-1 block bg-slate-50 text-slate-400" disabled>
            <option>Toutes</option>
          </select>
        </label>
        <p className="pb-2 text-xs text-slate-400">Les filtres seront activés lorsqu’une source de données sera configurée.</p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {['Tendance dans le temps', 'Répartition par catégorie'].map((label) => (
          <section key={label} className="surface grid min-h-56 place-items-center rounded-lg p-6 text-center">
            <div>
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1 text-xs text-slate-400">Emplacement du graphique</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
