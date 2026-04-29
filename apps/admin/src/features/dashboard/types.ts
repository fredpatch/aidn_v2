import type { ActivityEvent, MetricItem, RecentRecord, StatusDistributionItem } from '@/components/dashboard';

export interface DashboardSummary {
  metrics: MetricItem[];
  activity: ActivityEvent[];
  recentRecords: RecentRecord[];
  statusDistribution: StatusDistributionItem[];
}
