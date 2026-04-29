import {
  BarChart3,
  ClipboardCheck,
  FileArchive,
  FolderOpen,
  LayoutDashboard,
  MailCheck,
  MessagesSquare,
  MonitorSmartphone,
  ScrollText,
  Settings,
  Workflow,
} from 'lucide-react';

export interface NavItemConfig {
  label: string;
  to: string;
  icon: React.ReactNode;
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
      { label: 'Réunions', to: '/reunions', icon: <MessagesSquare className="h-4 w-4" aria-hidden="true" /> },
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
    items: [{ label: 'Paramètres', to: '/settings', icon: <Settings className="h-4 w-4" aria-hidden="true" /> }],
  },
];
