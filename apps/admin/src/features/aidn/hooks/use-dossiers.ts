import { useQuery } from '@tanstack/react-query';
import { aidnApi } from '../api';

export function useDossiers() {
  return useQuery({
    queryKey: ['aidn', 'dossiers'],
    queryFn: aidnApi.listDossiers,
    staleTime: 30_000,
  });
}

export function useDossier(id: string | undefined) {
  return useQuery({
    queryKey: ['aidn', 'dossiers', id],
    queryFn: () => aidnApi.getDossierById(id ?? ''),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useAidnOmaPhases() {
  return useQuery({
    queryKey: ['aidn', 'oma-phases'],
    queryFn: aidnApi.listOmaPhases,
    staleTime: 30_000,
  });
}
