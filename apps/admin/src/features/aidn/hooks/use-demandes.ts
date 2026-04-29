import { useQuery } from '@tanstack/react-query';
import { aidnApi } from '../api/aidn.api';

export function useDemandes() {
  return useQuery({
    queryKey: ['aidn', 'demandes'],
    queryFn: aidnApi.listDemandes,
    staleTime: 30_000,
  });
}
