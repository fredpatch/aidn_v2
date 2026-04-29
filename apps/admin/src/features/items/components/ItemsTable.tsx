import { EmptyState, ErrorState, SkeletonTable } from '../../../components/states';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ItemStatusBadge } from './ItemStatusBadge';
import type { Item, PaginatedItems } from '../types';

interface ItemsTableProps {
  data: PaginatedItems | undefined;
  isLoading: boolean;
  error: Error | null;
  onRowClick: (item: Item) => void;
  onRetry: () => void;
}

export function ItemsTable({ data, isLoading, error, onRowClick, onRetry }: ItemsTableProps): React.JSX.Element {
  if (isLoading) return <SkeletonTable rows={5} cols={4} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (!data || data.items.length === 0) return <EmptyState message="Aucun élément trouvé." />;

  return (
    <div className="surface rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => onRowClick(item)}
            >
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground">{item.description}</TableCell>
              <TableCell><ItemStatusBadge status={item.status} /></TableCell>
              <TableCell className="text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
