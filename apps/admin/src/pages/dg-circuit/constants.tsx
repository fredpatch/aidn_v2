import type React from "react";
import { CheckCircle2, Clock, FileCheck2, Printer } from "lucide-react";

import type { DgCircuitBucket } from "@/lib/api/dg-circuit";

import type { DgCircuitTaskCounts } from "./types";

export const bucketTabs: Array<{
  key: DgCircuitBucket | "all";
  label: string;
  countKey?: keyof DgCircuitTaskCounts;
}> = [
  { key: "all", label: "Tous" },
  { key: "to_transmit", label: "A imprimer", countKey: "toTransmit" },
  { key: "awaiting_return", label: "En circuit", countKey: "awaitingReturn" },
  { key: "processed", label: "Signe DG", countKey: "processed" },
];

export const sourceLabels: Record<string, string> = {
  initial_request: "Demande initiale",
  pre_evaluation: "Formulaire de pre-evaluation",
  formal_request: "Demande formelle",
};

export const bucketStyle: Record<
  DgCircuitBucket,
  { icon: React.ReactNode; accentBorder: string; iconBg: string }
> = {
  to_transmit: {
    icon: <Printer className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    accentBorder: "border-l-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
  },
  awaiting_return: {
    icon: <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    accentBorder: "border-l-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
  },
  returns_to_register: {
    icon: <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    accentBorder: "border-l-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
  },
  returned_scanned: {
    icon: <FileCheck2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
    accentBorder: "border-l-teal-400",
    iconBg: "bg-teal-50 dark:bg-teal-950/40",
  },
  decision_recorded: {
    icon: (
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    ),
    accentBorder: "border-l-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  processed: {
    icon: (
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    ),
    accentBorder: "border-l-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
};
