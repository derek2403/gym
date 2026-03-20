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
        <span className="text-[13px] font-medium text-black/40">{label}</span>
        <span className="font-mono text-[13px] text-black/65">
          {Math.round(current)}<span className="text-black/20">/{target}{unit}</span>
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-black/[0.04]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
