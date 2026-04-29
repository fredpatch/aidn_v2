import { useState } from 'react';
import clsx from 'clsx';
import { AnimatedCardGrid } from '@/components/motion/AnimatedCardGrid';

type WorkflowStatus = 'queued' | 'in_progress' | 'on_hold' | 'completed';

interface WorkflowCard {
  id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
}

const STATUS_STYLES: Record<WorkflowStatus, string> = {
  queued: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700',
  in_progress: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:text-primary dark:border-primary/30',
  on_hold: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  queued: 'En file',
  in_progress: 'En cours',
  on_hold: 'En attente',
  completed: 'Terminé',
};

const NEXT_STATUS: Record<WorkflowStatus, WorkflowStatus | null> = {
  queued: 'in_progress',
  in_progress: 'completed',
  on_hold: 'in_progress',
  completed: null,
};

const INITIAL_CARDS: WorkflowCard[] = [
  { id: '1', title: 'Traitement #001', description: 'Circuit standard de traitement', status: 'queued' },
  { id: '2', title: 'Traitement #002', description: 'Demande prioritaire', status: 'in_progress' },
  { id: '3', title: 'Traitement #003', description: 'En attente de confirmation externe', status: 'on_hold' },
  { id: '4', title: 'Traitement #004', description: 'Traitement clôturé avec succès', status: 'completed' },
];

export function OperationsPage(): React.JSX.Element {
  const [cards, setCards] = useState<WorkflowCard[]>(INITIAL_CARDS);

  const advance = (id: string) => {
    setCards((current) =>
      current.map((card) => {
        if (card.id !== id) return card;
        const next = NEXT_STATUS[card.status];
        return next ? { ...card, status: next } : card;
      }),
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Opérations</h1>
          <p className="page-subtitle">Suivi du statut et de la progression des traitements.</p>
        </div>
      </div>
      <AnimatedCardGrid className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const next = NEXT_STATUS[card.status];
          return (
            <article key={card.id} className={clsx('rounded-lg border p-4 transition-shadow hover:shadow-md', STATUS_STYLES[card.status])}>
              <span className="text-xs font-bold uppercase">{STATUS_LABELS[card.status]}</span>
              <h2 className="mt-3 text-sm font-bold">{card.title}</h2>
              <p className="mt-1 text-xs opacity-80">{card.description}</p>
              {next ? (
                <button className="btn btn-secondary mt-4 min-h-8 px-3 py-1 text-xs" type="button" onClick={() => advance(card.id)}>
                  Passer à {STATUS_LABELS[next]}
                </button>
              ) : null}
            </article>
          );
        })}
      </AnimatedCardGrid>
    </div>
  );
}
