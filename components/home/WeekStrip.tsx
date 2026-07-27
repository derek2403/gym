interface Day {
  date: string;
  hasWorkout: boolean;
  dayOfWeek: number;
}

const LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * The current week at a glance. Proximity does the work here — each marker sits
 * directly under the letter it belongs to, so no legend is needed.
 */
export default function WeekStrip({ days, today }: { days: Day[]; today: string }) {
  // Walk back to the most recent Sunday so the row always reads S→S.
  const week: (Day | null)[] = Array(7).fill(null);
  const todayIdx = days.findIndex((d) => d.date === today);
  const end = todayIdx >= 0 ? todayIdx : days.length - 1;
  for (let i = end; i >= 0 && i > end - 7; i--) {
    const d = days[i];
    if (!d) continue;
    if (week[d.dayOfWeek] === null) week[d.dayOfWeek] = d;
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {LABELS.map((label, i) => {
        const day = week[i];
        const isToday = day?.date === today;
        const trained = day?.hasWorkout;
        return (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink-quaternary)]">
              {label}
            </span>
            <div
              className={`flex h-8 w-full items-center justify-center rounded-[0.625rem] text-[0.6875rem] font-semibold tabular-nums transition-colors duration-[var(--response-base)] ${
                trained
                  ? "bg-emerald-500 text-white"
                  : day
                    ? "bg-[rgba(120,120,128,0.1)] text-[color:var(--ink-quaternary)]"
                    : "bg-[rgba(120,120,128,0.05)] text-transparent"
              } ${isToday && !trained ? "ring-2 ring-emerald-500/40" : ""}`}
            >
              {day ? Number(day.date.slice(-2)) : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
