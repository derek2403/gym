import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";
import { fieldClass } from "./Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && <label className="text-overline">{label}</label>}
        <select ref={ref} className={cn(fieldClass, "appearance-none pr-9", className)} {...props}>
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
