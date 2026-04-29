import { useQuery } from '@tanstack/react-query';
import { aidnApi } from '../api/aidn.api';

export function useAidnDashboardSummary() {
  return useQuery({
    queryKey: ['aidn', 'dashboard-summary'],
    queryFn: aidnApi.getAidnDashboardSummary,
    staleTime: 30_000,
  });
}

export function useAidnDocuments() {
  return useQuery({
    queryKey: ['aidn', 'documents'],
    queryFn: aidnApi.listDocuments,
    staleTime: 30_000,
  });
}

export function useAidnMeetings() {
  return useQuery({
    queryKey: ['aidn', 'meetings'],
    queryFn: aidnApi.listMeetings,
    staleTime: 30_000,
  });
}

export function useAidnCertificates() {
  return useQuery({
    queryKey: ['aidn', 'certificates'],
    queryFn: aidnApi.listCertificates,
    staleTime: 30_000,
  });
}

export function useAidnPhaseEvidence() {
  return useQuery({
    queryKey: ['aidn', 'phase-evidence'],
    queryFn: aidnApi.listPhaseEvidenceItems,
    staleTime: 30_000,
  });
}

export function useAidnPhaseNextActions() {
  return useQuery({
    queryKey: ['aidn', 'phase-next-actions'],
    queryFn: aidnApi.listPhaseNextActions,
    staleTime: 30_000,
  });
}

export function useAidnTimelineEvents() {
  return useQuery({
    queryKey: ['aidn', 'timeline-events'],
    queryFn: aidnApi.listTimelineEvents,
    staleTime: 30_000,
  });
}
