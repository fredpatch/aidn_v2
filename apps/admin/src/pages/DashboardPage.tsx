import {
  ActivityFeed,
  ChartPlaceholderCard,
  DashboardGrid,
  DashboardHeader,
  DashboardSection,
  MetricGrid,
  RecentRecordsCard,
  StatusDistributionCard,
} from '@/components/dashboard';
import { AnimatedFadeIn } from '@/components/motion/AnimatedFadeIn';
import { ErrorState } from '../components/states';
import { CourrierDashboard } from '../features/dashboard/components/CourrierDashboard';
import { useDashboard } from '../features/dashboard/hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../lib/auth/permissions';

function isCourrierRole(user: ReturnType<typeof useAuth>['user']): boolean {
  return hasPermission(user, 'DG_CIRCUIT_HANDLE') && !hasPermission(user, 'DOSSIER_VIEW_ALL');
}

export function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();

  if (isCourrierRole(user)) {
    return <CourrierDashboard />;
  }

  return <AdminDnDashboard />;
}

function AdminDnDashboard(): React.JSX.Element {
  const { data, isLoading, error, refetch } = useDashboard();

  return (
    <div className="page-container">
      <DashboardHeader title="Tableau de bord" subtitle="Direction de la Navigabilité - Suivi des dossiers OMA." />

      {error ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}

      <AnimatedFadeIn>
        <DashboardSection title="Indicateurs AIDN">
          <MetricGrid metrics={data?.metrics ?? []} isLoading={isLoading} cols={4} />
        </DashboardSection>
      </AnimatedFadeIn>

      <AnimatedFadeIn delay={0.04}>
        <DashboardGrid cols={2}>
          <ActivityFeed title="Activité récente" items={data?.activity ?? []} isLoading={isLoading} />
          <RecentRecordsCard
            title="Suivis récents"
            records={data?.recentRecords ?? []}
            isLoading={isLoading}
            viewAllHref="/demandes"
          />
        </DashboardGrid>
      </AnimatedFadeIn>

      <AnimatedFadeIn delay={0.08}>
        <DashboardGrid cols={2}>
          <StatusDistributionCard title="Répartition des statuts" items={data?.statusDistribution ?? []} isLoading={isLoading} />
          <ChartPlaceholderCard title="Tendance OMA" description="Évolution des demandes, dossiers DN et certificats." readyFor="statistiques AIDN" />
        </DashboardGrid>
      </AnimatedFadeIn>
    </div>
  );
}
