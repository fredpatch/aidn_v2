import type { ReactNode } from "react";

type AlertVariant = "info" | "secondary" | "warning" | "danger" | "success";
type AlertAppearance = "light" | "outline";

const VARIANT_CLASSES: Record<AlertVariant, Record<AlertAppearance, string>> = {
  info: {
    light: "border-sky-200 bg-sky-50 text-sky-900",
    outline: "border-sky-200 bg-transparent text-sky-800",
  },
  secondary: {
    light: "border-slate-200 bg-slate-50 text-slate-700",
    outline: "border-slate-200 bg-transparent text-slate-600",
  },
  warning: {
    light: "border-amber-200 bg-amber-50 text-amber-900",
    outline: "border-amber-200 bg-transparent text-amber-800",
  },
  danger: {
    light: "border-red-200 bg-red-50 text-red-900",
    outline: "border-red-200 bg-transparent text-red-700",
  },
  success: {
    light: "border-emerald-200 bg-emerald-50 text-emerald-900",
    outline: "border-emerald-200 bg-transparent text-emerald-800",
  },
};

interface AlertProps {
  variant?: AlertVariant;
  appearance?: AlertAppearance;
  className?: string;
  children: ReactNode;
}

export function Alert({
  variant = "secondary",
  appearance = "outline",
  className = "",
  children,
}: AlertProps): React.JSX.Element {
  const classes = VARIANT_CLASSES[variant][appearance];
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${classes} ${className}`}
    >
      {children}
    </div>
  );
}

export function AlertIcon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return <div className={`mt-0.5 shrink-0 ${className}`}>{children}</div>;
}

export function AlertContent({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return <div className="min-w-0 flex-1">{children}</div>;
}

export function AlertTitle({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return <p className="text-sm font-semibold">{children}</p>;
}

export function AlertDescription({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return <p className="mt-0.5 text-sm opacity-80">{children}</p>;
}

export function AlertToolbar({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return <div className="mt-2 flex items-center gap-2">{children}</div>;
}
