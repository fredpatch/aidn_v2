import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/utils";

export function Field({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

type FieldLabelProps = HTMLAttributes<HTMLLabelElement> & {
  htmlFor: string;
};

export function FieldLabel({
  className,
  ...props
}: FieldLabelProps): React.JSX.Element {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-2 text-sm font-bold text-slate-700",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & {
  children?: ReactNode;
}): React.JSX.Element | null {
  if (!children) {
    return null;
  }

  return (
    <p
      className={cn("text-sm font-medium text-red-700", className)}
      {...props}
    >
      {children}
    </p>
  );
}
