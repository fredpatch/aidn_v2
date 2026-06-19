import { apiGet } from '../client';
import type { PhasePaymentTaskFilters, PhasePaymentTaskList } from './types';
import { buildPhasePaymentTasksPath } from './utils';

export type {
  PhasePaymentPhaseKey,
  PhasePaymentTask,
  PhasePaymentTaskCounts,
  PhasePaymentTaskFilters,
  PhasePaymentTaskList,
  PhasePaymentTaskStatus,
  PhasePaymentType,
} from './types';

export function listPhasePaymentTasks(
  filters: PhasePaymentTaskFilters = {},
): Promise<PhasePaymentTaskList> {
  return apiGet<PhasePaymentTaskList>(buildPhasePaymentTasksPath(filters));
}
