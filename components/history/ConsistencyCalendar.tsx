interface CalendarDay {
  date: string;
  hasWorkout: boolean;
}

interface ConsistencyCalendarProps {
  days: CalendarDay[];
}

export default function ConsistencyCalendar({ days }: ConsistencyCalendarProps) {
  // Arrange into 7 rows (Mon-Sun) x N weeks
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const months: string[] = [];
  const monthPositions: { label: string; col: number }[] = [];
  weeks.forEach((week, colIdx) => {
    const d = new Date(week[0]?.date + "T00:00:00");
    const m = d.toLocaleDateString("en-US", { month: "short" });
    if (!months.includes(m) || months[months.length - 1] !== m) {
      months.push(m);
      monthPositions.push({ label: m, col: colIdx });
    }
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Workout consistency</h3>
        <span className="text-xs text-zinc-500">{weeks.length} weeks</span>
      </div>
      <div className="overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div className="inline-flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            {monthPositions.map(({ label, col }) => (
              <span
                key={`${label}-${col}`}
                className="text-[9px] text-zinc-500"
                style={{ marginLeft: col > 0 ? `${(col - (monthPositions[monthPositions.indexOf({ label, col }) - 1]?.col || 0)) * 14 - 14}px` : 0 }}
              >
                {label}
              </span>
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="flex gap-0.5">
              {weeks.map((week, colIdx) => {
                const day = week[row];
                if (!day) return <div key={colIdx} className="h-3 w-3" />;
                return (
                  <div
                    key={day.date}
                    className={`h-3 w-3 rounded-[3px] ${
                      day.hasWorkout
                        ? "bg-emerald-500"
                        : "bg-zinc-800"
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
  );
}
