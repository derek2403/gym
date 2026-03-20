interface CalorieRingProps {
  consumed: number;
  target: number;
}

export default function CalorieRing({ consumed, target }: CalorieRingProps) {
  const pct = target > 0 ? Math.min(consumed / target, 1.5) : 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct * circumference;
  const over = consumed > target;
  const remaining = target - consumed;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={over ? "#ef4444" : "#10b981"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={Math.max(offset, 0)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute mt-8 flex flex-col items-center">
        <span className="font-mono text-2xl font-bold text-zinc-50">{consumed}</span>
        <span className="text-[10px] text-zinc-500">of {target} kcal</span>
      </div>
      <p className={`mt-2 text-xs font-medium ${over ? "text-red-400" : "text-emerald-500"}`}>
        {over ? `${consumed - target} over` : `${remaining} remaining`}
      </p>
    </div>
  );
}
