import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps): React.JSX.Element {
  return (
    <section className="surface rounded-lg p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
        {description}
      </p>
    </section>
  );
}
