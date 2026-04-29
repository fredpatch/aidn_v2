import { useQuery } from '@tanstack/react-query';
import { aidnApi } from '../api/aidn.api';

export function useCourriers() {
  return useQuery({
    queryKey: ['aidn', 'courriers'],
    queryFn: aidnApi.listCourriers,
    staleTime: 30_000,
  });
}

export function useDgDecisionRecords() {
  return useQuery({
    queryKey: ['aidn', 'dg-decision-records'],
    queryFn: aidnApi.listDgDecisionRecords,
    staleTime: 30_000,
  });
}
