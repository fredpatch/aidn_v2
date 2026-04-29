import {
  aidnCertificates,
  aidnCourriers,
  aidnDemandes,
  aidnDocuments,
  aidnDossiers,
  aidnMeetings,
  aidnOmaPhases,
  aidnPhaseEvidenceItems,
  aidnPhaseNextActions,
} from '../mocks/aidn.mock';
import type {
  AidnCertificate,
  AidnCourrier,
  AidnDemande,
  AidnDocument,
  AidnDossier,
  AidnMeeting,
  AidnOmaPhase,
  AidnPhaseEvidenceItem,
  AidnPhaseNextAction,
} from '../types/aidn.types';

export const AIDN_DEMO_STORAGE_KEY = 'aidn.demo.state.v1';

export interface AidnDemoState {
  demandes: AidnDemande[];
  courriers: AidnCourrier[];
  dossiers: AidnDossier[];
  omaPhases: AidnOmaPhase[];
  documents: AidnDocument[];
  meetings: AidnMeeting[];
  certificates: AidnCertificate[];
  phaseEvidenceItems: AidnPhaseEvidenceItem[];
  phaseNextActions: AidnPhaseNextAction[];
  updatedAt: string;
}

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

function createSeedState(): AidnDemoState {
  return {
    demandes: clone(aidnDemandes),
    courriers: clone(aidnCourriers),
    dossiers: clone(aidnDossiers),
    omaPhases: clone(aidnOmaPhases),
    documents: clone(aidnDocuments),
    meetings: clone(aidnMeetings),
    certificates: clone(aidnCertificates),
    phaseEvidenceItems: clone(aidnPhaseEvidenceItems),
    phaseNextActions: clone(aidnPhaseNextActions),
    updatedAt: new Date().toISOString(),
  };
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isAidnDemoState(value: unknown): value is AidnDemoState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Record<keyof AidnDemoState, unknown>>;

  return (
    Array.isArray(candidate.demandes) &&
    Array.isArray(candidate.courriers) &&
    Array.isArray(candidate.dossiers) &&
    Array.isArray(candidate.omaPhases) &&
    Array.isArray(candidate.documents) &&
    Array.isArray(candidate.meetings) &&
    Array.isArray(candidate.certificates) &&
    Array.isArray(candidate.phaseEvidenceItems) &&
    Array.isArray(candidate.phaseNextActions) &&
    typeof candidate.updatedAt === 'string'
  );
}

export function getAidnDemoState(): AidnDemoState {
  const storage = getStorage();
  if (!storage) return createSeedState();

  try {
    const storedState = storage.getItem(AIDN_DEMO_STORAGE_KEY);
    if (!storedState) {
      const seedState = createSeedState();
      storage.setItem(AIDN_DEMO_STORAGE_KEY, JSON.stringify(seedState));
      return seedState;
    }

    const parsedState: unknown = JSON.parse(storedState);
    if (!isAidnDemoState(parsedState)) {
      const seedState = createSeedState();
      storage.setItem(AIDN_DEMO_STORAGE_KEY, JSON.stringify(seedState));
      return seedState;
    }

    return clone(parsedState);
  } catch {
    return createSeedState();
  }
}

export function setAidnDemoState(state: AidnDemoState): AidnDemoState {
  const nextState = clone({ ...state, updatedAt: new Date().toISOString() });
  const storage = getStorage();

  if (storage) {
    try {
      storage.setItem(AIDN_DEMO_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      return nextState;
    }
  }

  return nextState;
}

export function resetAidnDemoState(): AidnDemoState {
  const seedState = createSeedState();
  const storage = getStorage();

  if (storage) {
    try {
      storage.setItem(AIDN_DEMO_STORAGE_KEY, JSON.stringify(seedState));
    } catch {
      return seedState;
    }
  }

  return seedState;
}

export function updateAidnDemoState(updater: (state: AidnDemoState) => AidnDemoState): AidnDemoState {
  const currentState = getAidnDemoState();
  return setAidnDemoState(updater(currentState));
}
