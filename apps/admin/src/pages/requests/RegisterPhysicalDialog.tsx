import { FileCheck2 } from 'lucide-react';
import { useState } from 'react';

import { isMockMode } from '../../lib/data/data-mode';
import { registerPhysicalCourrier, type AdminRequest } from '../../lib/api/requests.api';

export function RegisterPhysicalDialog({
  request,
  onClose,
  onDone,
  onError,
}: {
  request: AdminRequest;
  onClose: () => void;
  onDone: (id: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [physicalDepositDate, setPhysicalDepositDate] = useState('');
  const [officialReference, setOfficialReference] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setLocalError('');

    if (!physicalDepositDate) {
      setLocalError('La date de dépôt physique réel est requise.');
      return;
    }

    if (!file) {
      setLocalError('Le scan du courrier reçu est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isMockMode()) {
        const form = new FormData();
        form.set('physicalDepositDate', physicalDepositDate);
        if (officialReference.trim()) form.set('officialReference', officialReference.trim());
        if (notes.trim()) form.set('notes', notes.trim());
        form.set('file', file);
        await registerPhysicalCourrier(request.id, form);
      }
      await onDone(request.id);
    } catch {
      onError("Impossible d'enregistrer le courrier physique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
      <section className="surface w-full max-w-xl rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              Enregistrer réception courrier
            </h2>
            <p className="mt-1 text-sm text-slate-500">{request.subject}</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Date dépôt physique réel *
            <input
              className="control mt-1"
              type="date"
              required
              value={physicalDepositDate}
              onChange={(event) => setPhysicalDepositDate(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Référence officielle
            <input
              className="control mt-1"
              value={officialReference}
              onChange={(event) => setOfficialReference(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
            Scan du courrier reçu *
            <input
              className="control mt-1"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
            Notes
            <textarea
              className="control mt-1 min-h-24"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

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
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </section>
    </div>
  );
}
