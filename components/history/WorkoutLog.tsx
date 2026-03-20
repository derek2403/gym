import { useState } from "react";
import Card from "@/components/ui/Card";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

interface WorkoutSet {
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
}

interface Workout {
  id: number;
  startedAt: string;
  completedAt: string | null;
  sets: WorkoutSet[];
}

interface WorkoutLogProps {
  workouts: Workout[];
}

export default function WorkoutLog({ workouts }: WorkoutLogProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (workouts.length === 0) {
    return (
      <Card>
        <p className="text-sm text-zinc-500">No completed workouts yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-200">Recent workouts</h3>
      {workouts.map((w) => {
        const expanded = expandedId === w.id;
        const exercises = [...new Set(w.sets.map((s) => s.exerciseName))];
        const totalVolume = w.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

        return (
          <Card
            key={w.id}
            onClick={() => setExpandedId(expanded ? null : w.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {formatDateDisplay(w.completedAt?.split("T")[0] || w.startedAt.split("T")[0])}
                </p>
                <p className="text-xs text-zinc-500">
                  {w.sets.length} sets · {Math.round(totalVolume)} kg volume
                </p>
              </div>
              {expanded ? (
                <ChevronUp size={16} className="text-zinc-500" />
              ) : (
                <ChevronDown size={16} className="text-zinc-500" />
              )}
            </div>

            {expanded && (
              <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                {exercises.map((name) => {
                  const exSets = w.sets.filter((s) => s.exerciseName === name);
                  return (
                    <div key={name}>
                      <p className="text-xs font-medium text-zinc-300">{name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {exSets.map((s, i) => (
                          <span
                            key={i}
                            className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400"
                          >
                            {s.weightKg}kg x {s.reps}
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
