import { FolderOpen, MessageSquareWarning } from 'lucide-react';
import { useState } from 'react';

import { isMockMode } from '../../lib/data/data-mode';
import {
  openDossierDn,
  requestCorrection,
  type AdminRequest,
} from '../../lib/api/requests';
import { optional } from './requests.helpers';

export type ActionDialogState = {
  kind: 'open_dossier' | 'correction';
  request: AdminRequest;
};

export function ActionDialog({
  state,
  onClose,
  onDone,
  onError,
}: {
  state: ActionDialogState;
  onClose: () => void;
  onDone: (id: string, message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = {
    open_dossier: {
      title: 'Démarrer la phase préliminaire',
      label: 'Notes',
      button: 'Démarrer la phase préliminaire',
      success: 'Phase préliminaire démarrée.',
      icon: FolderOpen,
    },
    correction: {
      title: 'Demander correction',
      label: 'Motif',
      button: 'Demander correction',
      success: 'Correction demandée au postulant.',
      icon: MessageSquareWarning,
    },
  }[state.kind];
  const Icon = copy.icon;

  const handleSubmit = async () => {
    setLocalError('');

    if (state.kind === 'correction' && !text.trim()) {
      setLocalError('Le motif est requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isMockMode()) {
        if (state.kind === 'open_dossier') {
          await openDossierDn(state.request.id, { notes: optional(text) });
        } else if (state.kind === 'correction') {
          await requestCorrection(state.request.id, { reason: text.trim() });
        }
      }
      await onDone(state.request.id, copy.success);
    } catch {
      onError('Action impossible sur cette demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
      <section className="surface w-full max-w-lg rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
              {copy.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{state.request.subject}</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {copy.label}
          <textarea
            className="control mt-1 min-h-28"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        {localError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Traitement...' : copy.button}
          </button>
        </div>
      </section>
    </div>
  );
}
