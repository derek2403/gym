interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export default function MacroBar({ label, current, target, color, unit = "g" }: MacroBarProps) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[color:var(--ink-tertiary)]">{label}</span>
        <span className="tabular-nums text-[13px] text-[color:var(--ink-secondary)]">
          {Math.round(current)}<span className="text-[color:var(--ink-quaternary)]">/{target}{unit}</span>
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-[rgba(120,120,128,0.09)]">
        <div className="h-full rounded-full transition-[width] duration-[var(--response-slow)] ease-[var(--ease-settle)]" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
