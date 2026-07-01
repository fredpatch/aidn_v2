import { Search } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { EmptyState, SkeletonCard } from "../../components/states";
import type { AdminRequest } from "../../lib/api/requests";
import { RequestListCard } from "./RequestListCard";
import { requestTypeLabels, visibleStatusOptions } from "./requests.constants";

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
      <form className="space-y-3" onSubmit={onFilter}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Organisme, postulant, objet..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous statuts</SelectItem>
              {visibleStatusOptions.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={requestType} onValueChange={onRequestTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tous types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous types</SelectItem>
              {Object.entries(requestTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={courrierSource} onValueChange={onCourrierSourceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes sources</SelectItem>
              <SelectItem value="portal_upload">Portail</SelectItem>
              <SelectItem value="physical_deposit">Physique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Filtrer
        </Button>
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
