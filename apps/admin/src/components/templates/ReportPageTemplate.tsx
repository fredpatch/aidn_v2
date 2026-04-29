interface ReportPageTemplateProps {
  title: string;
  controls?: React.ReactNode;
  children?: React.ReactNode;
}

export function ReportPageTemplate({ title, controls, children }: ReportPageTemplateProps): React.JSX.Element {
  return (
    <section className="space-y-4">
      <div className="page-header">
        <h2 className="page-title">{title}</h2>
        {controls ? <div className="flex flex-wrap gap-2">{controls}</div> : null}
      </div>
      <div className="surface rounded-lg p-4">{children}</div>
    </section>
  );
}
