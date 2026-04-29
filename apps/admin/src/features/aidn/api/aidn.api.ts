import { isMockMode, waitForMockLatency } from '@/lib/data/data-mode';
import { aidnDgDecisionRecords, aidnTimelineEvents } from '../mocks/aidn.mock';
import { mockGetAidnDashboardSummary } from '../mocks/aidn-dashboard.mock';
import { getAidnDemoState } from '../storage/aidn-demo-storage';
import type { AidnCertificate, AidnCourrier, AidnDashboardSummary, AidnDemande, AidnDgDecisionRecord, AidnDocument, AidnDossier, AidnMeeting, AidnOmaPhase, AidnPhaseEvidenceItem, AidnPhaseNextAction, AidnTimelineEvent } from '../types/aidn.types';

async function fromMock<T>(value: T): Promise<T> {
  await waitForMockLatency();
  return structuredClone(value) as T;
}

function assertMockOnly(): never {
  throw new Error('AIDN API is not configured. Phase B provides mock data only.');
}

export const aidnApi = {
  listDemandes: (): Promise<AidnDemande[]> => (isMockMode() ? fromMock(getAidnDemoState().demandes) : assertMockOnly()),
  listCourriers: (): Promise<AidnCourrier[]> => (isMockMode() ? fromMock(getAidnDemoState().courriers) : assertMockOnly()),
  listDgDecisionRecords: (): Promise<AidnDgDecisionRecord[]> => (isMockMode() ? fromMock(aidnDgDecisionRecords) : assertMockOnly()),
  listDossiers: (): Promise<AidnDossier[]> => (isMockMode() ? fromMock(getAidnDemoState().dossiers) : assertMockOnly()),
  listOmaPhases: (): Promise<AidnOmaPhase[]> => (isMockMode() ? fromMock(getAidnDemoState().omaPhases) : assertMockOnly()),
  getDossierById: async (id: string): Promise<AidnDossier | undefined> => {
    if (!isMockMode()) return assertMockOnly();
    await waitForMockLatency();
    const dossier = getAidnDemoState().dossiers.find((item) => item.id === id);
    return dossier ? structuredClone(dossier) : undefined;
  },
  listDocuments: (): Promise<AidnDocument[]> => (isMockMode() ? fromMock(getAidnDemoState().documents) : assertMockOnly()),
  listMeetings: (): Promise<AidnMeeting[]> => (isMockMode() ? fromMock(getAidnDemoState().meetings) : assertMockOnly()),
  listCertificates: (): Promise<AidnCertificate[]> => (isMockMode() ? fromMock(getAidnDemoState().certificates) : assertMockOnly()),
  listPhaseEvidenceItems: (): Promise<AidnPhaseEvidenceItem[]> => (isMockMode() ? fromMock(getAidnDemoState().phaseEvidenceItems) : assertMockOnly()),
  listPhaseNextActions: (): Promise<AidnPhaseNextAction[]> => (isMockMode() ? fromMock(getAidnDemoState().phaseNextActions) : assertMockOnly()),
  listTimelineEvents: (): Promise<AidnTimelineEvent[]> => (isMockMode() ? fromMock(aidnTimelineEvents) : assertMockOnly()),
  getAidnDashboardSummary: (): Promise<AidnDashboardSummary> => (isMockMode() ? fromMock(mockGetAidnDashboardSummary(getAidnDemoState())) : assertMockOnly()),
};
