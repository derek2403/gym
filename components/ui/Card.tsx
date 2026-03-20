import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-900 p-4",
        onClick && "cursor-pointer transition-colors hover:border-zinc-700",
        className
      )}
    >
      {children}
    </div>
  );
}
