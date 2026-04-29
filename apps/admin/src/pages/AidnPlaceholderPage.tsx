import { AnimatedCardGrid } from '@/components/motion/AnimatedCardGrid';
import { ComingSoonTemplate } from '@/components/templates/ComingSoonTemplate';

interface AidnPlaceholderPageProps {
  title: string;
  subtitle: string;
  cards: Array<{
    title: string;
    description: string;
  }>;
}

export function AidnPlaceholderPage({ title, subtitle, cards }: AidnPlaceholderPageProps): React.JSX.Element {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>

      <AnimatedCardGrid className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="surface rounded-lg p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{card.description}</p>
          </article>
        ))}
      </AnimatedCardGrid>

      <ComingSoonTemplate message="Prototype Phase A : écran de travail à détailler." eta="Les règles métier complètes seront ajoutées dans les phases suivantes." />
    </div>
  );
}
