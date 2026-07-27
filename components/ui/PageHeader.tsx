import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-display">{title}</h1>
        {subtitle && <p className="text-caption mt-1.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 pt-1.5">{action}</div>}
    </header>
  );
}
