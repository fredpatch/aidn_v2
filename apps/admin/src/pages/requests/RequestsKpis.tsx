export type RequestStats = {
  submitted: number;
  portalUploads: number;
  physicalDepositsPlanned: number;
  physicalDepositsReceived: number;
  awaitingDg: number;
  dgSignedAvailable: number;
  cancelledByDg: number;
};

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="surface rounded-lg p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export function RequestsKpis({ stats }: { stats: RequestStats }) {
  return (
    <section className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
      <KpiCard title="Soumises" value={stats.submitted} />
      <KpiCard title="Televersees portail" value={stats.portalUploads} />
      <KpiCard title="Depots prevus" value={stats.physicalDepositsPlanned} />
      <KpiCard title="Courriers recus" value={stats.physicalDepositsReceived} />
      <KpiCard title="En attente DG" value={stats.awaitingDg} />
      <KpiCard title="Signes DG" value={stats.dgSignedAvailable} />
      <KpiCard title="Annulees DG" value={stats.cancelledByDg} />
    </section>
  );
}
