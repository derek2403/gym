import { useState } from "react";
import Card from "@/components/ui/Card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDateDisplay, formatDate } from "@/lib/utils";

function toLocalDate(timestamp: string): string {
  if (!timestamp.includes("T")) return timestamp;
  const d = new Date(timestamp);
  d.setHours(d.getHours() + 8);
  return formatDate(d);
}

interface WorkoutSet { exerciseName: string; setNumber: number; weightKg: number; reps: number; }
interface Workout { id: number; startedAt: string; completedAt: string | null; sets: WorkoutSet[]; }

export default function WorkoutLog({ workouts }: { workouts: Workout[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (workouts.length === 0) return <Card><p className="text-caption">No completed workouts yet.</p></Card>;

  return (
    <div className="space-y-3">
      <h3 className="text-title-sm text-[color:var(--ink)]">Recent workouts</h3>
      {workouts.map((w) => {
        const expanded = expandedId === w.id;
        const exercises = [...new Set(w.sets.map((s) => s.exerciseName))];
        const totalVolume = w.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

        return (
          <Card key={w.id} onClick={() => setExpandedId(expanded ? null : w.id)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm font-medium text-[color:var(--ink)]">
                  {formatDateDisplay(toLocalDate(w.completedAt || w.startedAt))}
                </p>
                <p className="text-caption mt-0.5">{w.sets.length} sets · {Math.round(totalVolume)} kg</p>
              </div>
              {expanded ? <ChevronUp size={16} className="text-[color:var(--ink-quaternary)]" /> : <ChevronDown size={16} className="text-[color:var(--ink-quaternary)]" />}
            </div>
            {expanded && (
              <div className="mt-4 space-y-3 border-t border-black/[0.04] pt-4">
                {exercises.map((name) => {
                  const exSets = w.sets.filter((s) => s.exerciseName === name);
                  return (
                    <div key={name}>
                      <p className="text-[13px] font-medium text-[color:var(--ink-secondary)]">{name}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {exSets.map((s, i) => (
                          <span key={i} className="rounded-full bg-[rgba(120,120,128,0.09)] px-2.5 py-1 tabular-nums text-[11px] text-[color:var(--ink-tertiary)]">
                            {s.weightKg} kg × {s.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
