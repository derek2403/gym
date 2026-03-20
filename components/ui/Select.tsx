import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-overline">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            "rounded-2xl bg-white/[0.06] px-4 py-3.5 text-[17px] tracking-tight text-white/90 outline-none transition-all duration-200 focus:bg-white/[0.1] focus:ring-1 focus:ring-white/[0.15]",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
export default Select;
