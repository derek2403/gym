import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "glass" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({ variant = "primary", size = "md", children, className, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 active:scale-[0.96] disabled:opacity-35 disabled:pointer-events-none";
  const variants = {
    primary: "bg-emerald-500 text-white rounded-full hover:bg-emerald-600 shadow-sm",
    glass: "glass rounded-full text-black/70",
    ghost: "text-black/40 hover:text-black/70 rounded-full hover:bg-black/5",
    danger: "bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/15",
  };
  const sizes = {
    sm: "px-5 py-2.5 text-[13px]",
    md: "px-6 py-3 text-[15px]",
    lg: "px-7 py-3.5 text-[17px]",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
