interface AnalysisPageTemplateProps {
  title: string;
  filters?: React.ReactNode;
  children?: React.ReactNode;
}

export function AnalysisPageTemplate({ title, filters, children }: AnalysisPageTemplateProps): React.JSX.Element {
  return (
    <section className="space-y-4">
      <div className="page-header">
        <h2 className="page-title">{title}</h2>
      </div>
      {filters ? <div className="surface rounded-lg p-4">{filters}</div> : null}
      {children ?? <div className="surface grid min-h-64 place-items-center rounded-lg p-4 text-sm text-slate-500">Chart placeholder</div>}
    </section>
  );
}
