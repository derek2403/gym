import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "glass" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 active:scale-[0.96] disabled:opacity-35 disabled:pointer-events-none";
  const variants = {
    primary: "bg-emerald-500 text-black rounded-full hover:bg-emerald-400 shadow-lg shadow-emerald-500/20",
    glass: "glass rounded-full text-white/90",
    ghost: "text-white/50 hover:text-white/80 rounded-full hover:bg-white/5",
    danger: "bg-red-500/12 text-red-400 rounded-full hover:bg-red-500/20",
  };
  const sizes = {
    sm: "px-5 py-2.5 text-[13px]",
    md: "px-6 py-3 text-[15px]",
    lg: "px-7 py-3.5 text-[17px]",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
