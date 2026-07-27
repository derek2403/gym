import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListProps {
  header?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Inset grouped list — one rounded surface holding rows, with the section's
 * name above it and an optional explanatory footer below.
 *
 * The footer is where an explanation belongs: attached to the thing it explains
 * and out of the way, rather than crowding the row it describes.
 */
export function List({ header, footer, children, className }: ListProps) {
  return (
    <section className={cn("mb-6", className)}>
      {header && <h2 className="text-overline mb-2 px-4">{header}</h2>}
      <div className="glass overflow-hidden rounded-[var(--radius-surface)]">{children}</div>
      {footer && <p className="text-caption mt-2 px-4 leading-relaxed">{footer}</p>}
    </section>
  );
}

interface ListRowProps {
  icon?: ReactNode;
  /** Tinted container behind the icon, e.g. "bg-emerald-500/15". */
  iconBg?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned secondary value, before any chevron. */
  value?: ReactNode;
  onClick?: () => void;
  /** Show the disclosure chevron. Defaults to true when the row navigates. */
  chevron?: boolean;
  destructive?: boolean;
  /** Last row in a group draws no separator. */
  last?: boolean;
}

export function ListRow({
  icon,
  iconBg = "bg-[rgba(120,120,128,0.12)]",
  title,
  subtitle,
  value,
  onClick,
  chevron,
  destructive,
  last,
}: ListRowProps) {
  const showChevron = chevron ?? !!onClick;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3.5 px-4 text-left outline-none",
        // Row height comes from padding so it grows with the user's text size
        // instead of clipping.
        "py-3",
        onClick && "transition-colors duration-[var(--response-fast)] active:bg-[rgba(120,120,128,0.12)] focus-visible:bg-[rgba(120,120,128,0.1)]"
      )}
    >
      {icon && (
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem]", iconBg)}>
          {icon}
        </span>
      )}

      {/* The separator starts at the text, not the card edge, so the icon column
          reads as one continuous rail down the group. */}
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 py-0.5",
          !last && "border-b-[0.5px] border-b-[rgba(60,60,67,0.13)] pb-3.5 -mb-0.5"
        )}
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[1.0625rem] tracking-[-0.01em]",
              destructive ? "text-red-500" : "text-[color:var(--ink)]"
            )}
          >
            {title}
          </span>
          {subtitle && <span className="text-caption mt-0.5 block truncate">{subtitle}</span>}
        </span>

        {value && (
          <span className="shrink-0 text-[0.9375rem] tabular-nums text-[color:var(--ink-tertiary)]">{value}</span>
        )}
        {showChevron && (
          <ChevronRight size={17} className="shrink-0 text-[color:var(--ink-quaternary)]" strokeWidth={2.5} />
        )}
      </span>
    </Tag>
  );
}
