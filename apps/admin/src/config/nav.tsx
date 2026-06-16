import {
  BarChart3,
  ClipboardCheck,
  FileArchive,
  FolderOpen,
  LayoutDashboard,
  MailCheck,
  Receipt,
  Send,
  MessagesSquare,
  Search,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";

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
    label: "Pilotage",
    storageKey: "pilotage",
    items: [
      {
        label: "Tableau de bord",
        to: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
      },
      {
        label: "Rapports",
        to: "/reports",
        icon: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
        permissions: ["REPORT_VIEW"],
      },
    ],
  },
  {
    label: "Traitement",
    storageKey: "traitement",
    items: [
      {
        label: "Demandes",
        to: "/demandes",
        icon: <ScrollText className="h-4 w-4" aria-hidden="true" />,
        permissions: ["REQUEST_INTAKE_REVIEW"],
      },
      {
        label: "Courriers officiels",
        to: "/circuit-dg",
        icon: <Send className="h-4 w-4" aria-hidden="true" />,
        permissions: [
          "DG_CIRCUIT_HANDLE",
          "COURRIER_REGISTER_PHYSICAL",
          "PRE_EVAL_DG_CIRCUIT_HANDLE",
        ],
      },
      {
        label: "Facturation S5",
        to: "/facturation-s5",
        icon: <Receipt className="h-4 w-4" aria-hidden="true" />,
        permissions: ["PAYMENT_VIEW"],
      },
      {
        label: "Historique Courriers",
        to: "/courriers",
        icon: <MailCheck className="h-4 w-4" aria-hidden="true" />,
        permissions: ["REQUEST_INTAKE_REVIEW"],
      },
      {
        label: "Dossiers DN",
        to: "/dossiers",
        icon: <FolderOpen className="h-4 w-4" aria-hidden="true" />,
        permissions: ["DOSSIER_VIEW_ALL"],
      },
      {
        label: "Workflow OMA",
        to: "/workflow-oma",
        icon: <Workflow className="h-4 w-4" aria-hidden="true" />,
        permissions: ["DOSSIER_VIEW_ALL"],
      },
    ],
  },
  {
    label: "Suivi",
    storageKey: "suivi",
    items: [
      {
        label: "Documents",
        to: "/documents",
        icon: <FileArchive className="h-4 w-4" aria-hidden="true" />,
        permissions: ["DOSSIER_VIEW_ALL"],
      },
      {
        label: "Reunions",
        to: "/reunions",
        icon: <MessagesSquare className="h-4 w-4" aria-hidden="true" />,
        permissions: ["MEETING_MANAGE"],
      },
      {
        label: "Certificats",
        to: "/certificats",
        icon: <ClipboardCheck className="h-4 w-4" aria-hidden="true" />,
        permissions: ["DOSSIER_VIEW_ALL"],
      },
    ],
  },
  {
    label: "Administration",
    storageKey: "administration",
    items: [
      {
        label: "Personnel ANAC",
        to: "/admin/personnel",
        icon: <Search className="h-4 w-4" aria-hidden="true" />,
        permissions: ["PERSONNEL_SEARCH", "AIDN_USER_ACTIVATE"],
      },
      {
        label: "Comptes internes",
        to: "/admin/internal-accounts",
        icon: <Users className="h-4 w-4" aria-hidden="true" />,
        permissions: ["AIDN_USER_ACTIVATE"],
      },
      {
        label: "Comptes postulants",
        to: "/admin/demandes-comptes",
        icon: <UserCheck className="h-4 w-4" aria-hidden="true" />,
        permissions: ["POSTULANT_ACCOUNT_REVIEW"],
      },
      {
        label: "Journal d'audit",
        to: "/admin/audit-logs",
        icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
        permissions: ["AUDIT_VIEW"],
      },
      {
        label: "Parametres",
        to: "/settings",
        icon: <Settings className="h-4 w-4" aria-hidden="true" />,
        permissions: ["DOSSIER_VIEW_ALL", "AIDN_USER_ACTIVATE"],
      },
    ],
  },
];
