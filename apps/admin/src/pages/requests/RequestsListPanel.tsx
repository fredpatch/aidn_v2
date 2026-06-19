import { Search } from 'lucide-react';
import type { FormEvent } from 'react';

import { EmptyState, SkeletonCard } from '../../components/states';
import type { AdminRequest } from '../../lib/api/requests';
import { RequestListCard } from './RequestListCard';
import { requestTypeLabels, visibleStatusOptions } from './requests.helpers';

export function RequestsListPanel({
  courrierSource,
  isLoading,
  items,
  requestType,
  search,
  selectedRequestId,
  status,
  onCourrierSourceChange,
  onFilter,
  onRequestTypeChange,
  onSearchChange,
  onSelectRequest,
  onStatusChange,
}: {
  courrierSource: string;
  isLoading: boolean;
  items: AdminRequest[];
  requestType: string;
  search: string;
  selectedRequestId?: string;
  status: string;
  onCourrierSourceChange: (value: string) => void;
  onFilter: (event: FormEvent<HTMLFormElement>) => void;
  onRequestTypeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectRequest: (request: AdminRequest) => void;
  onStatusChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <form className="space-y-2" onSubmit={onFilter}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="control pl-9"
            placeholder="Organisme, postulant, objet..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select
            className="control"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="">Tous statuts</option>
            {visibleStatusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="control"
            value={requestType}
            onChange={(event) => onRequestTypeChange(event.target.value)}
          >
            <option value="">Tous types</option>
            {Object.entries(requestTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="control"
            value={courrierSource}
            onChange={(event) => onCourrierSourceChange(event.target.value)}
          >
            <option value="">Toutes sources</option>
            <option value="portal_upload">Portail</option>
            <option value="physical_deposit">Physique</option>
          </select>
        </div>
        <button className="btn btn-primary w-full" type="submit" disabled={isLoading}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Filtrer
        </button>
      </form>

      {isLoading ? (
        <div className="grid gap-2">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-2">
          {items.map((item) => (
            <RequestListCard
              key={item.id}
              item={item}
              isSelected={selectedRequestId === item.id}
              onClick={() => onSelectRequest(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="Aucune demande trouvee pour ces filtres." />
      )}
    </div>
  );
}
