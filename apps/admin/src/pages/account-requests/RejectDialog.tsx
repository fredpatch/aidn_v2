import { useState } from 'react';
import { XCircle } from 'lucide-react';

import {
  rejectAccountRequest,
  type AccountRequestListItem,
} from '../../lib/api/account-requests';
import { isMockMode } from '../../lib/data/data-mode';

export function RejectDialog({
  request,
  onClose,
  onRejected,
  onError,
}: {
  request: AccountRequestListItem;
  onClose: () => void;
  onRejected: (request: AccountRequestListItem) => Promise<void>;
  onError: (message: string) => void;
}): React.JSX.Element {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    setLocalError('');
    if (!reason.trim()) {
      setLocalError('Le motif du rejet est requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = isMockMode()
        ? {
            request: {
              ...request,
              status: 'rejected' as const,
              rejectionReason: reason.trim(),
              reviewedAt: new Date().toISOString(),
            },
          }
        : await rejectAccountRequest(request.id, { reason: reason.trim() });

      await onRejected({
        ...request,
        status: response.request.status,
        rejectionReason: response.request.rejectionReason,
        reviewedAt: response.request.reviewedAt,
      });
    } catch {
      onError('Impossible de rejeter la demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
      <section className="surface w-full max-w-lg rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Rejeter la demande
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {request.requestedOrganizationName} - {request.contactFullName}
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Motif du rejet
          <textarea
            className="control mt-1 min-h-28"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Informations insuffisantes"
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
            className="btn btn-danger"
            type="button"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Rejet...' : 'Rejeter'}
          </button>
        </div>
      </section>
    </div>
  );
}
