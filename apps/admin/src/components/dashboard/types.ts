import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface ActivityEvent {
  id: string;
  label: string;
  description?: string;
  timestamp: string;
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  icon?: ReactNode;
}

export interface RecentRecord {
  id: string;
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  timestamp?: string;
  href?: string;
}

export interface StatusDistributionItem {
  label: string;
  count: number;
  percentage: number;
  badgeVariant?: BadgeVariant;
}
