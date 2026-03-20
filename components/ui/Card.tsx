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

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[20px] p-4",
        variants[variant],
        onClick && "cursor-pointer transition-transform duration-200 active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
}
