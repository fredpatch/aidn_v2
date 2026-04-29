import { EmptyStateTemplate } from './EmptyStateTemplate';

interface ListPageTemplateProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function ListPageTemplate({ title, description, children, actions }: ListPageTemplateProps): React.JSX.Element {
  return (
    <section className="space-y-4">
      <div className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          {description ? <p className="page-subtitle">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children ?? <EmptyStateTemplate />}
    </section>
  );
}
