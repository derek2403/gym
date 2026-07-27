import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "glass" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({ variant = "primary", size = "md", children, className, ...props }: ButtonProps) {
  // Feedback is on :active — i.e. pointer-down — and lands in 100ms. Colour
  // shifts on the same press so the response reads even at reduced motion.
  const base =
    "pressable inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.01em] " +
    "disabled:opacity-35 disabled:pointer-events-none select-none";

  const variants = {
    primary:
      "bg-emerald-500 text-white rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_14px_-4px_rgba(16,185,129,0.5)] " +
      "hover:bg-emerald-600 active:bg-emerald-600",
    glass:
      "glass rounded-full text-[color:var(--ink)] font-medium active:bg-white/80",
    ghost:
      "text-[color:var(--ink-tertiary)] rounded-full hover:bg-[rgba(120,120,128,0.09)] active:bg-[rgba(120,120,128,0.13)]",
    danger:
      "bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/[0.16] active:bg-red-500/20",
  };

  const sizes = {
    sm: "px-5 py-2.5 text-[0.8125rem]",
    md: "px-6 py-3 text-[0.9375rem]",
    lg: "px-7 py-3.5 text-[1.0625rem]",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
