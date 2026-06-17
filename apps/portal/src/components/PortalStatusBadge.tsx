import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

type PortalStatusBadgeProps = {
  label: string;
  tone?: "neutral" | "info" | "success" | "warning";
  className?: string;
};

const toneClasses = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-sky-200 bg-sky-100 text-sky-800",
  success: "border-emerald-200 bg-emerald-100 text-emerald-800",
  warning: "border-amber-200 bg-amber-100 text-amber-800",
};

export function PortalStatusBadge({
  label,
  tone = "neutral",
  className,
}: PortalStatusBadgeProps): React.JSX.Element {
  return (
    <Badge variant="outline" className={cn(toneClasses[tone], className)}>
      {label}
    </Badge>
  );
}
