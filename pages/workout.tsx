import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatBox from "@/components/ui/StatBox";
import RestTimer from "@/components/workout/RestTimer";
import { Dumbbell, Play, Check, Plus, X, ArrowDownUp } from "lucide-react";

interface TemplateExercise {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  intervalSeconds: number;
}

interface Template {
  id: number;
  name: string;
  exercises: TemplateExercise[];
}

interface SetEntry {
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  savedId?: number;
}

interface WorkoutStats {
  topLift: number;
  volume: number;
  sessions: number;
}

export default function WorkoutPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);
  const [activeTemplateName, setActiveTemplateName] = useState("");
  const [activeExercises, setActiveExercises] = useState<TemplateExercise[]>([]);
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [restDuration, setRestDuration] = useState(90);
  const [restTrigger, setRestTrigger] = useState(0);
  const [intervalTimer, setIntervalTimer] = useState<{ exerciseName: string; seconds: number } | null>(null);
  const [stats, setStats] = useState<WorkoutStats>({ topLift: 0, volume: 0, sessions: 0 });

  const fetchData = useCallback(async () => {
    const [tRes, sRes] = await Promise.all([
      fetch("/api/templates"),
      fetch("/api/stats"),
    ]);
    setTemplates(await tRes.json());
    const statsData = await sRes.json();
    setStats({
      topLift: statsData.topLift || 0,
      volume: statsData.totalVolume || 0,
      sessions: statsData.totalSessions || 0,
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startWorkout = async (template: Template) => {
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id }),
    });
    const workout = await res.json();
    setActiveWorkoutId(workout.id);
    setActiveTemplateName(template.name);
    setActiveExercises(template.exercises);

    const initialSets: SetEntry[] = [];
    template.exercises.forEach((ex) => {
      for (let s = 1; s <= ex.targetSets; s++) {
        initialSets.push({
          exerciseName: ex.exerciseName,
          setNumber: s,
          weightKg: 0,
          reps: ex.targetReps,
          completed: false,
        });
      }
    });
    setSets(initialSets);
  };

  const updateSet = (i: number, field: "weightKg" | "reps", value: number) => {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const completeSet = async (i: number) => {
    const set = sets[i];
    if (!activeWorkoutId) return;

    const res = await fetch(`/api/workouts/${activeWorkoutId}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseName: set.exerciseName,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
      }),
    });
    const saved = await res.json();
    const newSets = sets.map((s, idx) =>
      idx === i ? { ...s, completed: true, savedId: saved.id } : s
    );
    setSets(newSets);

    // Find the exercise config for rest duration
    const exerciseConfig = activeExercises.find((e) => e.exerciseName === set.exerciseName);

    // Check if this was the last set of the exercise
    const exerciseSets = newSets.filter((s) => s.exerciseName === set.exerciseName);
    const allCompleted = exerciseSets.every((s) => s.completed);

    if (allCompleted && exerciseConfig) {
      // All sets for this exercise done — show interval timer to next exercise
      const exerciseNames = [...new Set(newSets.map((s) => s.exerciseName))];
      const currentIdx = exerciseNames.indexOf(set.exerciseName);
      const nextExercise = exerciseNames[currentIdx + 1];

      if (nextExercise) {
        setIntervalTimer({
          exerciseName: nextExercise,
          seconds: exerciseConfig.intervalSeconds,
        });
        setRestDuration(exerciseConfig.intervalSeconds);
        setRestTrigger((t) => t + 1);
      }
    } else if (exerciseConfig) {
      // Still more sets — show rest timer between sets
      setIntervalTimer(null);
      setRestDuration(exerciseConfig.restSeconds);
      setRestTrigger((t) => t + 1);
    }
  };

  const addSet = (exerciseName: string) => {
    const existingSets = sets.filter((s) => s.exerciseName === exerciseName);
    const lastSet = existingSets[existingSets.length - 1];
    const insertIdx = sets.findLastIndex((s) => s.exerciseName === exerciseName) + 1;
    const newSet: SetEntry = {
      exerciseName,
      setNumber: existingSets.length + 1,
      weightKg: lastSet?.weightKg || 0,
      reps: lastSet?.reps || 10,
      completed: false,
    };
    setSets((prev) => [...prev.slice(0, insertIdx), newSet, ...prev.slice(insertIdx)]);
  };

  const finishWorkout = async () => {
    if (!activeWorkoutId) return;
    await fetch(`/api/workouts/${activeWorkoutId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
    setActiveWorkoutId(null);
    setSets([]);
    setActiveTemplateName("");
    setActiveExercises([]);
    setIntervalTimer(null);
    fetchData();
  };

  const cancelWorkout = async () => {
    if (!activeWorkoutId) return;
    await fetch(`/api/workouts/${activeWorkoutId}`, { method: "DELETE" });
    setActiveWorkoutId(null);
    setSets([]);
    setActiveTemplateName("");
    setActiveExercises([]);
    setIntervalTimer(null);
  };

  const exerciseNames = [...new Set(sets.map((s) => s.exerciseName))];
  const completedSets = sets.filter((s) => s.completed).length;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ""}` : `${s}s`;
  };

  if (activeWorkoutId) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{activeTemplateName}</h1>
            <p className="text-xs text-zinc-500">
              {completedSets}/{sets.length} sets completed
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={cancelWorkout}>
              <X size={16} />
            </Button>
            <Button size="sm" onClick={finishWorkout}>
              <Check size={16} />
              Finish
            </Button>
          </div>
        </div>

        {/* Timer area */}
        {restTrigger > 0 && (
          <div className="mb-1">
            {intervalTimer && (
              <div className="mb-1 flex items-center justify-center gap-1.5 text-xs text-amber-500">
                <ArrowDownUp size={12} />
                <span>Transition to {intervalTimer.exerciseName}</span>
              </div>
            )}
            <RestTimer
              key={restTrigger}
              defaultSeconds={restDuration}
              autoStart={true}
            />
          </div>
        )}

        <div className="mt-4 space-y-4">
          {exerciseNames.map((name, exIdx) => {
            const exerciseSets = sets
              .map((s, i) => ({ ...s, originalIndex: i }))
              .filter((s) => s.exerciseName === name);
            const config = activeExercises.find((e) => e.exerciseName === name);
            const allDone = exerciseSets.every((s) => s.completed);

            return (
              <div key={name}>
                <Card className={allDone ? "opacity-60" : ""}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200">{name}</h3>
                    {config && (
                      <span className="text-[10px] text-zinc-500">
                        Rest: {formatTime(config.restSeconds)}
                      </span>
                    )}
                  </div>
                  <div className="mb-2 grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-[10px] font-medium uppercase text-zinc-500">
                    <span>Set</span>
                    <span>kg</span>
                    <span>Reps</span>
                    <span />
                  </div>
                  {exerciseSets.map((set) => (
                    <div
                      key={set.originalIndex}
                      className={`mb-1.5 grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 ${
                        set.completed ? "opacity-50" : ""
                      }`}
                    >
                      <span className="text-center text-xs text-zinc-500">{set.setNumber}</span>
                      <input
                        type="number"
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-emerald-500"
                        value={set.weightKg || ""}
                        onChange={(e) => updateSet(set.originalIndex, "weightKg", Number(e.target.value))}
                        disabled={set.completed}
                        placeholder="0"
                      />
                      <input
                        type="number"
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-emerald-500"
                        value={set.reps || ""}
                        onChange={(e) => updateSet(set.originalIndex, "reps", Number(e.target.value))}
                        disabled={set.completed}
                        placeholder="0"
                      />
                      <button
                        onClick={() => completeSet(set.originalIndex)}
                        disabled={set.completed}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                          set.completed
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-zinc-800 text-zinc-500 hover:bg-emerald-500 hover:text-zinc-950"
                        }`}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSet(name)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <Plus size={12} />
                    Add set
                  </button>
                </Card>

                {/* Interval indicator between exercises */}
                {exIdx < exerciseNames.length - 1 && config && (
                  <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] text-zinc-600">
                    <ArrowDownUp size={10} />
                    <span>{formatTime(config.intervalSeconds)} transition</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Start workout"
        subtitle="Pick a template and train with live set tracking."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatBox value={stats.topLift.toFixed(1)} label="Top lift" unit="kg" />
        <StatBox value={stats.volume} label="Volume" unit=" kg" />
        <StatBox value={stats.sessions} label="Sessions" />
      </div>

      {templates.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500">
            Create a template first in the Templates tab.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} onClick={() => startWorkout(t)} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Play size={20} className="text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-100">{t.name}</h3>
                <p className="text-xs text-zinc-500">
                  {t.exercises.map((e) => e.exerciseName).join(", ")}
                </p>
              </div>
              <Dumbbell size={18} className="text-zinc-600" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
