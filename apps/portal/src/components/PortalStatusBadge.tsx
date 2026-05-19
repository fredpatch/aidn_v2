type PortalStatusBadgeProps = {
  label: string;
  tone?: "neutral" | "info" | "success" | "warning";
};

const toneClasses = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-sky-100 text-sky-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
};

export function PortalStatusBadge({
  label,
  tone = "neutral",
}: PortalStatusBadgeProps): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
