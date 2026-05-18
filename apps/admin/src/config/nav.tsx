import {
  BarChart3,
  ClipboardCheck,
  FileArchive,
  FolderOpen,
  LayoutDashboard,
  MailCheck,
  MessagesSquare,
  MonitorSmartphone,
  Search,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';

export interface NavItemConfig {
  label: string;
  to: string;
  icon: React.ReactNode;
  permissions?: string[];
}

export interface NavGroupConfig {
  label: string;
  storageKey: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    label: 'Pilotage',
    storageKey: 'pilotage',
    items: [
      { label: 'Tableau de bord', to: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> },
      { label: 'Rapports', to: '/reports', icon: <BarChart3 className="h-4 w-4" aria-hidden="true" /> },
    ],
  },
  {
    label: 'Traitement',
    storageKey: 'traitement',
    items: [
      { label: 'Demandes', to: '/demandes', icon: <ScrollText className="h-4 w-4" aria-hidden="true" /> },
      { label: 'Courriers / Orientation DG', to: '/courriers', icon: <MailCheck className="h-4 w-4" aria-hidden="true" /> },
      { label: 'Dossiers DN', to: '/dossiers', icon: <FolderOpen className="h-4 w-4" aria-hidden="true" /> },
      { label: 'Workflow OMA', to: '/workflow-oma', icon: <Workflow className="h-4 w-4" aria-hidden="true" /> },
    ],
  },
  {
    label: 'Suivi',
    storageKey: 'suivi',
    items: [
      { label: 'Documents', to: '/documents', icon: <FileArchive className="h-4 w-4" aria-hidden="true" /> },
      { label: 'Reunions', to: '/reunions', icon: <MessagesSquare className="h-4 w-4" aria-hidden="true" /> },
      { label: 'Certificats', to: '/certificats', icon: <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> },
    ],
  },
  {
    label: 'Prototype',
    storageKey: 'prototype',
    items: [
      { label: 'Portail postulant demo', to: '/portal-preview', icon: <MonitorSmartphone className="h-4 w-4" aria-hidden="true" /> },
    ],
  },
  {
    label: 'Administration',
    storageKey: 'administration',
    items: [
      { label: 'Personnel ANAC', to: '/admin/personnel', icon: <Search className="h-4 w-4" aria-hidden="true" />, permissions: ['PERSONNEL_SEARCH', 'AIDN_USER_ACTIVATE'] },
      { label: 'Comptes internes', to: '/admin/internal-accounts', icon: <Users className="h-4 w-4" aria-hidden="true" />, permissions: ['AIDN_USER_ACTIVATE'] },
      { label: "Journal d'audit", to: '/admin/audit-logs', icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />, permissions: ['AUDIT_VIEW'] },
      { label: 'Parametres', to: '/settings', icon: <Settings className="h-4 w-4" aria-hidden="true" /> },
    ],
  },
];
