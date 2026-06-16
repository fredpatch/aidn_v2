import { apiPost } from './client';

export type ResetTestDataPayload = {
  confirmation: string;
  deleteUploadedFiles?: boolean;
  includeAuditLogs?: boolean;
  includeNotifications?: boolean;
};

export type ResetTestDataResult = {
  ok: boolean;
  counts: Record<string, number>;
  deletedFiles: number;
};

export function resetTestData(payload: ResetTestDataPayload): Promise<ResetTestDataResult> {
  return apiPost<ResetTestDataResult>('/api/v1/admin/dev/reset-test-data', payload);
}
