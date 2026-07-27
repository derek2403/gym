import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "elevated" | "subtle" | "tint";
}

export default function Card({ children, className, onClick, variant = "default" }: CardProps) {
  const variants = {
    default: "glass",
    elevated: "glass-elevated",
    subtle: "glass-subtle",
    tint: "glass glass-tint-green",
  };

  // A card that does something is a button: it takes focus, answers the
  // keyboard, and depresses on pointer-down like any other control.
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={cn(
        "rounded-[var(--radius-surface)] p-4",
        variants[variant],
        onClick &&
          "pressable-subtle block w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        className
      )}
    >
      {children}
    </Tag>
  );
}
