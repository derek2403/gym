import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  invalid?: boolean;
}

// Fields are inset regions, not floating panes: recessed fill, no blur, and a
// focus ring that appears in one step so the response reads as instant.
export const fieldClass =
  "w-full rounded-[var(--radius-field)] bg-[rgba(120,120,128,0.09)] px-4 py-3.5 text-[1.0625rem] " +
  "tracking-[-0.005em] text-[color:var(--ink)] placeholder:text-[color:var(--ink-quaternary)] " +
  "outline-none transition-[background-color,box-shadow] duration-[var(--response-fast)] " +
  "focus:bg-[rgba(120,120,128,0.12)] focus:ring-2 focus:ring-emerald-500/35";

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, invalid, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && <label className="text-overline">{label}</label>}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(fieldClass, invalid && "ring-2 ring-red-500/40", className)}
          {...props}
        />
        {hint && (
          <p className={cn("text-[0.8125rem] leading-snug", invalid ? "text-red-500" : "text-[color:var(--ink-tertiary)]")}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
