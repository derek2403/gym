import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && <label className="text-overline">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "rounded-2xl bg-black/[0.04] px-4 py-3.5 text-[17px] tracking-tight text-black/90 placeholder:text-black/25 outline-none transition-all duration-200 focus:bg-black/[0.06] focus:ring-2 focus:ring-emerald-500/20",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
