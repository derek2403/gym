interface CalendarDay {
  date: string;
  hasWorkout: boolean;
  dayOfWeek: number; // Sun=0, Sat=6
}

interface ConsistencyCalendarProps {
  days: CalendarDay[];
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ConsistencyCalendar({ days }: ConsistencyCalendarProps) {
  // Group into weeks (Sun-Sat), each week is a column
  const weeks: (CalendarDay | null)[][] = [];
  let currentWeek: (CalendarDay | null)[] = [];

  // Pad first week if it doesn't start on Sunday
  if (days.length > 0 && days[0].dayOfWeek > 0) {
    for (let i = 0; i < days[0].dayOfWeek; i++) {
      currentWeek.push(null);
    }
  }

  for (const day of days) {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      // Pad incomplete week
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

  // Month labels at week boundaries
  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = "";
  weeks.forEach((week, colIdx) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) return;
    const m = new Date(firstDay.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" });
    if (m !== lastMonth) {
      monthPositions.push({ label: m, col: colIdx });
      lastMonth = m;
    }
  });

  const totalWeeks = weeks.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Workout consistency</h3>
        <span className="text-xs text-zinc-500">{totalWeeks} weeks</span>
      </div>
      <div className="overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        <div className="inline-flex gap-1">
          {/* Day labels column */}
          <div className="flex flex-col gap-0.5 pt-4">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="flex h-3 w-3 items-center justify-center text-[8px] text-zinc-600">
                {i % 2 === 0 ? label : ""}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          <div className="flex flex-col gap-0.5">
            {/* Month labels */}
            <div className="relative h-3">
              {monthPositions.map(({ label, col }) => (
                <span
                  key={`${label}-${col}`}
                  className="absolute text-[9px] text-zinc-500"
                  style={{ left: `${col * 14}px` }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* 7 rows (Sun=0 to Sat=6) x N week columns */}
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex gap-0.5">
                {weeks.map((week, colIdx) => {
                  const day = week[row];
                  if (!day) return <div key={colIdx} className="h-3 w-3" />;
                  return (
                    <div
                      key={day.date}
                      className={`h-3 w-3 rounded-[3px] ${
                        day.hasWorkout ? "bg-emerald-500" : "bg-zinc-800"
                      }`}
                      title={day.date}
                    />
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
