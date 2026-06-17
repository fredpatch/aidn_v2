import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "../../lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  badge?: ReactNode;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ badge, className, invalid, ...props }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        className={cn(
          "min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          "focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10",
          badge ? "pr-24" : undefined,
          invalid ? "border-red-300 bg-red-50/40" : undefined,
          className,
        )}
        {...props}
      />
      {badge ? (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          {badge}
        </span>
      ) : null}
    </div>
  ),
);

Input.displayName = "Input";
