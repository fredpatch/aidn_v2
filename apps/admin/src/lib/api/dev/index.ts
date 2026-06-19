import { apiPost } from '../client';
import type { ResetTestDataPayload, ResetTestDataResult } from './types';

export type { ResetTestDataPayload, ResetTestDataResult } from './types';

export function resetTestData(payload: ResetTestDataPayload): Promise<ResetTestDataResult> {
  return apiPost<ResetTestDataResult>('/api/v1/admin/dev/reset-test-data', payload);
}
