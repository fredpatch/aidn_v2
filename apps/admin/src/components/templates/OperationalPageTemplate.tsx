interface OperationalPageTemplateProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function OperationalPageTemplate({ title, description, actions, children }: OperationalPageTemplateProps): React.JSX.Element {
  return (
    <section className="space-y-4">
      <div className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          {description ? <p className="page-subtitle">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="surface rounded-lg p-4">{children}</div>
    </section>
  );
}
