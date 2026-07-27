interface CalendarDay {
  date: string;
  hasWorkout: boolean;
  dayOfWeek: number;
}

interface ConsistencyCalendarProps {
  days: CalendarDay[];
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ConsistencyCalendar({ days }: ConsistencyCalendarProps) {
  const weeks: (CalendarDay | null)[][] = [];
  let currentWeek: (CalendarDay | null)[] = [];

  if (days.length > 0 && days[0].dayOfWeek > 0) {
    for (let i = 0; i < days[0].dayOfWeek; i++) currentWeek.push(null);
  }

  for (const day of days) {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = "";
  weeks.forEach((week, colIdx) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) return;
    const m = new Date(firstDay.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" });
    if (m !== lastMonth) { monthPositions.push({ label: m, col: colIdx }); lastMonth = m; }
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-title-sm text-[color:var(--ink)]">Consistency</h3>
        <span className="text-caption">
          {(() => {
            const workoutDays = days.filter((d) => d.hasWorkout).length;
            const w = Math.floor(workoutDays / 7);
            const d = workoutDays % 7;
            if (w === 0) return `${workoutDays} d`;
            if (d === 0) return `${w} w`;
            return `${w} w ${d} d`;
          })()}
        </span>
      </div>
      <div className="overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        <div className="inline-flex gap-1.5">
          <div className="flex flex-col gap-[3px] pt-5">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="flex h-[11px] w-3 items-center justify-center text-[9px] text-[color:var(--ink-quaternary)]">
                {i % 2 === 0 ? label : ""}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-[3px]">
            <div className="relative h-4">
              {monthPositions.map(({ label, col }) => (
                <span key={`${label}-${col}`} className="absolute text-[9px] text-[color:var(--ink-quaternary)]" style={{ left: `${col * 14.5}px` }}>{label}</span>
              ))}
            </div>
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex gap-[3px]">
                {weeks.map((week, colIdx) => {
                  const day = week[row];
                  if (!day) return <div key={colIdx} className="h-[11px] w-[11px]" />;
                  return (
                    <div key={day.date} className={`h-[11px] w-[11px] rounded-[3px] transition-colors ${day.hasWorkout ? "bg-emerald-500" : "bg-[rgba(120,120,128,0.09)]"}`} title={day.date} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
