interface CalorieRingProps {
  consumed: number;
  target: number;
}

export default function CalorieRing({ consumed, target }: CalorieRingProps) {
  const pct = target > 0 ? Math.min(consumed / target, 1.5) : 0;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct * circumference;
  const over = consumed > target;
  const remaining = target - consumed;

  return (
    <div className="flex flex-col items-center">
      <svg width="156" height="156" className="-rotate-90">
        <circle cx="78" cy="78" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
        <circle cx="78" cy="78" r={radius} fill="none" stroke={over ? "#f87171" : "#10b981"} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={Math.max(offset, 0)} className="transition-all duration-700" />
      </svg>
      <div className="absolute mt-11 flex flex-col items-center">
        <span className="font-mono text-[32px] font-bold tracking-tighter text-white">{consumed}</span>
        <span className="text-caption">of {target} kcal</span>
      </div>
      <p className={`mt-2 text-[13px] font-semibold tracking-tight ${over ? "text-red-400" : "text-emerald-400"}`}>
        {over ? `${consumed - target} over` : `${remaining} remaining`}
      </p>
    </div>
  );
}
