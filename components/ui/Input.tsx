import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-overline">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "rounded-2xl bg-white/[0.06] px-4 py-3.5 text-[17px] tracking-tight text-white/90 placeholder:text-white/25 outline-none transition-all duration-200 focus:bg-white/[0.1] focus:ring-1 focus:ring-white/[0.15]",
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
