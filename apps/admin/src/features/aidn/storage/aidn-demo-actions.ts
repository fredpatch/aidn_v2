import type { AidnCertificateStatus, AidnPhaseEvidenceStatus } from '../types/aidn.enums';
import { resetAidnDemoState, updateAidnDemoState } from './aidn-demo-storage';

const certificateLifecycle: AidnCertificateStatus[] = [
  'to_prepare',
  'printed',
  'signed_stamped',
  'scanned_in_aidn',
  'ready_for_collection',
  'collected',
  'archived',
];

const nextCertificateActionLabels: Record<Exclude<AidnCertificateStatus, 'archived'>, string> = {
  to_prepare: 'Marquer imprime dans la demo',
  printed: 'Marquer signe/cachete dans la demo',
  signed_stamped: 'Marquer scanne dans AIDN dans la demo',
  scanned_in_aidn: 'Marquer pret au retrait dans la demo',
  ready_for_collection: 'Marquer remis dans la demo',
  collected: 'Marquer archive dans la demo',
};

export function getNextCertificateLifecycleStatus(currentStatus: AidnCertificateStatus): AidnCertificateStatus | null {
  const currentIndex = certificateLifecycle.indexOf(currentStatus);
  if (currentIndex < 0 || currentIndex === certificateLifecycle.length - 1) return null;
  return certificateLifecycle[currentIndex + 1];
}

export function getNextCertificateLifecycleActionLabel(currentStatus: AidnCertificateStatus): string | null {
  if (currentStatus === 'archived') return null;
  return nextCertificateActionLabels[currentStatus];
}

export function updatePhaseEvidenceStatus(evidenceId: string, status: AidnPhaseEvidenceStatus): void {
  updateAidnDemoState((state) => ({
    ...state,
    phaseEvidenceItems: state.phaseEvidenceItems.map((item) => {
      if (item.id !== evidenceId) return item;

      return {
        ...item,
        status,
        receivedAt: status === 'received' || status === 'validated' ? item.receivedAt ?? new Date().toISOString() : item.receivedAt,
      };
    }),
  }));
}

export function markPhaseNextActionDone(actionId: string): void {
  updateAidnDemoState((state) => ({
    ...state,
    phaseNextActions: state.phaseNextActions.map((item) => (item.id === actionId ? { ...item, status: 'done' } : item)),
  }));
}

export function markMeetingScheduled(meetingId: string): void {
  updateAidnDemoState((state) => {
    const now = new Date().toISOString();

    return {
      ...state,
      meetings: state.meetings.map((meeting) => {
        if (meeting.id !== meetingId) return meeting;

        return {
          ...meeting,
          outcome: 'planned',
          convocationSentAt: meeting.convocationSentAt ?? now,
          convocationChannel: meeting.convocationChannel ?? 'Email mock',
        };
      }),
    };
  });
}

export function markMeetingReportAvailable(meetingId: string): void {
  updateAidnDemoState((state) => ({
    ...state,
    meetings: state.meetings.map((meeting) => {
      if (meeting.id !== meetingId) return meeting;

      const existingReport =
        meeting.reportDocumentId ??
        state.documents.find((document) => document.dossierId === meeting.dossierId && document.phaseKey === meeting.phaseKey)?.id ??
        state.documents.find((document) => document.dossierId === meeting.dossierId)?.id;

      return {
        ...meeting,
        outcome: 'held',
        reportDocumentId: existingReport,
      };
    }),
  }));
}

export function markPaymentEvidenceReceived(evidenceId: string): void {
  updateAidnDemoState((state) => ({
    ...state,
    phaseEvidenceItems: state.phaseEvidenceItems.map((item) => {
      if (item.id !== evidenceId || (item.kind !== 'invoice' && item.kind !== 'payment_proof')) return item;
      return { ...item, status: 'received', receivedAt: item.receivedAt ?? new Date().toISOString() };
    }),
  }));
}

export function markPaymentEvidenceValidated(evidenceId: string): void {
  updateAidnDemoState((state) => ({
    ...state,
    phaseEvidenceItems: state.phaseEvidenceItems.map((item) => {
      if (item.id !== evidenceId || (item.kind !== 'invoice' && item.kind !== 'payment_proof')) return item;
      return { ...item, status: 'validated', receivedAt: item.receivedAt ?? new Date().toISOString() };
    }),
  }));
}

export function setCertificateLifecycleStatus(certificateId: string, status: AidnCertificateStatus): void {
  updateAidnDemoState((state) => {
    const now = new Date().toISOString();

    return {
      ...state,
      certificates: state.certificates.map((certificate) => {
        if (certificate.id !== certificateId) return certificate;

        return {
          ...certificate,
          status,
          printedAt: status === 'printed' ? certificate.printedAt ?? now : certificate.printedAt,
          signedAt: status === 'signed_stamped' ? certificate.signedAt ?? now : certificate.signedAt,
          stampedAt: status === 'signed_stamped' ? certificate.stampedAt ?? now : certificate.stampedAt,
          scannedAt: status === 'scanned_in_aidn' ? certificate.scannedAt ?? now : certificate.scannedAt,
          readyForCollectionAt: status === 'ready_for_collection' ? certificate.readyForCollectionAt ?? now : certificate.readyForCollectionAt,
          collectedAt: status === 'collected' ? certificate.collectedAt ?? now : certificate.collectedAt,
          archivedAt: status === 'archived' ? certificate.archivedAt ?? now : certificate.archivedAt,
        };
      }),
    };
  });
}

export function advanceCertificateLifecycle(certificateId: string): void {
  updateAidnDemoState((state) => {
    const certificate = state.certificates.find((item) => item.id === certificateId);
    if (!certificate) return state;
    const nextStatus = getNextCertificateLifecycleStatus(certificate.status);
    if (!nextStatus) return state;

    const now = new Date().toISOString();

    return {
      ...state,
      certificates: state.certificates.map((item) => {
        if (item.id !== certificateId) return item;

        return {
          ...item,
          status: nextStatus,
          printedAt: nextStatus === 'printed' ? item.printedAt ?? now : item.printedAt,
          signedAt: nextStatus === 'signed_stamped' ? item.signedAt ?? now : item.signedAt,
          stampedAt: nextStatus === 'signed_stamped' ? item.stampedAt ?? now : item.stampedAt,
          scannedAt: nextStatus === 'scanned_in_aidn' ? item.scannedAt ?? now : item.scannedAt,
          readyForCollectionAt: nextStatus === 'ready_for_collection' ? item.readyForCollectionAt ?? now : item.readyForCollectionAt,
          collectedAt: nextStatus === 'collected' ? item.collectedAt ?? now : item.collectedAt,
          archivedAt: nextStatus === 'archived' ? item.archivedAt ?? now : item.archivedAt,
        };
      }),
    };
  });
}

export function resetAidnDemoData(): void {
  resetAidnDemoState();
}
