import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import NavBar, { NavCircle, NavAvatar } from "@/components/ui/NavBar";
import AccountSheet from "@/components/AccountSheet";
import { useAuth } from "./_app";
import { List, ListRow } from "@/components/ui/List";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RestTimer from "@/components/workout/RestTimer";
import { Dumbbell, Play, Check, Plus, X, ArrowDownUp, LayoutList } from "lucide-react";
import { formatRepRange } from "@/lib/utils";

interface TemplateExercise {
  id: number; exerciseName: string; targetSets: number; targetRepsMin: number; targetRepsMax: number;
  restSeconds: number; intervalSeconds: number; sortOrder: number;
}
interface Template { id: number; name: string; exercises: TemplateExercise[]; }
interface SetEntry {
  exerciseName: string; setNumber: number; weightKg: number; reps: number;
  completed: boolean; savedId?: number;
}

const WORKOUT_STORAGE_KEY = "gym_active_workout";

interface WorkoutState {
  activeWorkoutId: number;
  activeTemplateName: string;
  activeExercises: TemplateExercise[];
  sets: SetEntry[];
}

function saveWorkoutState(state: WorkoutState | null) {
  if (state) localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(state));
  else localStorage.removeItem(WORKOUT_STORAGE_KEY);
}

function loadWorkoutState(): WorkoutState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WORKOUT_STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as WorkoutState;
    // Workouts started before rep ranges stored a single targetReps.
    state.activeExercises = (state.activeExercises ?? []).map((ex) => {
      const legacy = (ex as TemplateExercise & { targetReps?: number }).targetReps;
      return {
        ...ex,
        targetRepsMin: ex.targetRepsMin ?? legacy ?? 8,
        targetRepsMax: ex.targetRepsMax ?? legacy ?? 12,
      };
    });
    return state;
  } catch { return null; }
}

export default function WorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showAccount, setShowAccount] = useState(false);
  const saved = loadWorkoutState();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(saved?.activeWorkoutId ?? null);
  const [activeTemplateName, setActiveTemplateName] = useState(saved?.activeTemplateName ?? "");
  const [activeExercises, setActiveExercises] = useState<TemplateExercise[]>(saved?.activeExercises ?? []);
  const [sets, setSets] = useState<SetEntry[]>(saved?.sets ?? []);
  const [restDuration, setRestDuration] = useState(90);
  const [restTrigger, setRestTrigger] = useState(0);
  const [intervalTimer, setIntervalTimer] = useState<{ exerciseName: string; seconds: number } | null>(null);
  const [stats, setStats] = useState({ topLift: 0, volume: 0, sessions: 0 });

  // Persist workout state on every change
  useEffect(() => {
    if (activeWorkoutId) {
      saveWorkoutState({ activeWorkoutId, activeTemplateName, activeExercises, sets });
    }
  }, [activeWorkoutId, activeTemplateName, activeExercises, sets]);

  const fetchData = useCallback(async () => {
    const [tRes, sRes] = await Promise.all([fetch("/api/templates"), fetch("/api/stats")]);
    setTemplates(await tRes.json());
    const s = await sRes.json();
    setStats({ topLift: s.topLift || 0, volume: s.totalVolume || 0, sessions: s.totalSessions || 0 });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startWorkout = async (template: Template) => {
    const res = await fetch("/api/workouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: template.id }) });
    const workout = await res.json();
    setActiveWorkoutId(workout.id);
    setActiveTemplateName(template.name);
    setActiveExercises(template.exercises);
    const initialSets: SetEntry[] = [];
    template.exercises.forEach((ex) => { for (let s = 1; s <= ex.targetSets; s++) initialSets.push({ exerciseName: ex.exerciseName, setNumber: s, weightKg: 0, reps: ex.targetRepsMin, completed: false }); });
    setSets(initialSets);
  };

  const updateSet = (i: number, field: "weightKg" | "reps", value: number) => {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const completeSet = async (i: number) => {
    const set = sets[i];
    if (!activeWorkoutId) return;
    const res = await fetch(`/api/workouts/${activeWorkoutId}/sets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exerciseName: set.exerciseName, setNumber: set.setNumber, weightKg: set.weightKg, reps: set.reps }) });
    const saved = await res.json();
    const newSets = sets.map((s, idx) => idx === i ? { ...s, completed: true, savedId: saved.id } : s);
    setSets(newSets);
    const config = activeExercises.find((e) => e.exerciseName === set.exerciseName);
    const allDone = newSets.filter((s) => s.exerciseName === set.exerciseName).every((s) => s.completed);
    if (allDone && config) {
      const names = [...new Set(newSets.map((s) => s.exerciseName))];
      const next = names[names.indexOf(set.exerciseName) + 1];
      if (next) { setIntervalTimer({ exerciseName: next, seconds: config.intervalSeconds }); setRestDuration(config.intervalSeconds); }
    } else if (config) { setIntervalTimer(null); setRestDuration(config.restSeconds); }
    setRestTrigger((t) => t + 1);
  };

  const addSet = (exerciseName: string) => {
    const ex = sets.filter((s) => s.exerciseName === exerciseName);
    const last = ex[ex.length - 1];
    const idx = sets.findLastIndex((s) => s.exerciseName === exerciseName) + 1;
    const fallbackReps = activeExercises.find((e) => e.exerciseName === exerciseName)?.targetRepsMin ?? 10;
    setSets((prev) => [...prev.slice(0, idx), { exerciseName, setNumber: ex.length + 1, weightKg: last?.weightKg || 0, reps: last?.reps || fallbackReps, completed: false }, ...prev.slice(idx)]);
  };

  const finishWorkout = async () => {
    if (!activeWorkoutId) return;
    await fetch(`/api/workouts/${activeWorkoutId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setActiveWorkoutId(null); setSets([]); setActiveTemplateName(""); setActiveExercises([]); setIntervalTimer(null); saveWorkoutState(null); fetchData();
  };

  const cancelWorkout = async () => {
    if (!activeWorkoutId) return;
    await fetch(`/api/workouts/${activeWorkoutId}`, { method: "DELETE" });
    setActiveWorkoutId(null); setSets([]); setActiveTemplateName(""); setActiveExercises([]); setIntervalTimer(null); saveWorkoutState(null);
  };


  const exerciseNames = [...new Set(sets.map((s) => s.exerciseName))];
  const completedSets = sets.filter((s) => s.completed).length;
  const fmt = (s: number) => { const m = Math.floor(s / 60); const r = s % 60; return m > 0 ? `${m}m${r > 0 ? ` ${r}s` : ""}` : `${r}s`; };
  // Amber = short of the range, emerald = topped it out (time to add weight).
  const repTone = (reps: number, cfg?: TemplateExercise) => {
    if (!cfg || !reps) return "text-[color:var(--ink)]";
    if (reps < cfg.targetRepsMin) return "text-amber-500";
    if (reps >= cfg.targetRepsMax) return "text-emerald-500";
    return "text-[color:var(--ink)]";
  };

  // ===== ACTIVE WORKOUT =====
  if (activeWorkoutId) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-title-lg truncate">{activeTemplateName}</h1>
            <p className="text-caption mt-1 tabular-nums">{completedSets} of {sets.length} sets done</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" aria-label="Cancel workout" onClick={cancelWorkout}><X size={16} /></Button>
            <Button size="sm" onClick={finishWorkout}><Check size={16} />Finish</Button>
          </div>
        </div>

        {/* Session progress, so the header answers "how far in am I?" without
            counting rows. */}
        <div className="mb-5 h-1 overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-[var(--response-slow)] ease-[var(--ease-settle)]"
            style={{ width: `${sets.length ? (completedSets / sets.length) * 100 : 0}%` }}
          />
        </div>

        {restTrigger > 0 && (
          <div className="mb-5">
            {intervalTimer && (
              <div className="mb-2 flex items-center justify-center gap-1.5 text-[12px] text-amber-400/70">
                <ArrowDownUp size={11} />
                <span>Transition to {intervalTimer.exerciseName}</span>
              </div>
            )}
            <RestTimer key={restTrigger} defaultSeconds={restDuration} autoStart={true} />
          </div>
        )}

        <div className="space-y-4">
          {exerciseNames.map((name, exIdx) => {
            const exSets = sets.map((s, i) => ({ ...s, oi: i })).filter((s) => s.exerciseName === name);
            const config = activeExercises.find((e) => e.exerciseName === name);
            const allDone = exSets.every((s) => s.completed);
            return (
              <div key={name}>
                <Card className={`p-5 transition-opacity duration-[var(--response-slow)] ease-[var(--ease-settle)] ${allDone ? "opacity-45" : ""}`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-title-sm on-material min-w-0 truncate">{name}</h3>
                    {config && <span className="text-caption shrink-0">Rest {fmt(config.restSeconds)}</span>}
                  </div>
                  {/* Labels sit centred over the fields they name — a label
                      that doesn't line up with its column has to be re-read. */}
                  <div className="mb-2 grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-baseline gap-3 text-overline">
                    <span className="text-center">Set</span>
                    <span className="text-center">kg</span>
                    <span className="text-center">
                      Reps
                      {config && (
                        <span className="ml-1 normal-case tracking-normal text-[color:var(--ink-quaternary)]">
                          {formatRepRange(config.targetRepsMin, config.targetRepsMax)}
                        </span>
                      )}
                    </span>
                    <span />
                  </div>
                  {exSets.map((set) => (
                    <div
                      key={set.oi}
                      className={`mb-2 grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-3 transition-opacity duration-[var(--response-base)] ${
                        set.completed ? "opacity-40" : ""
                      }`}
                    >
                      <span className="text-center text-[0.875rem] font-semibold tabular-nums text-[color:var(--ink-quaternary)]">{set.setNumber}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        aria-label={`${name} set ${set.setNumber} weight in kg`}
                        className="rounded-[0.75rem] bg-[rgba(120,120,128,0.09)] px-2 py-2.5 text-center text-[0.9375rem] font-medium tabular-nums tracking-[-0.01em] text-[color:var(--ink)] outline-none transition-[background-color,box-shadow] duration-[var(--response-fast)] focus:bg-[rgba(120,120,128,0.13)] focus:ring-2 focus:ring-emerald-500/35 disabled:opacity-100"
                        value={set.weightKg || ""}
                        onChange={(e) => updateSet(set.oi, "weightKg", Number(e.target.value))}
                        disabled={set.completed}
                        placeholder="0"
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label={`${name} set ${set.setNumber} reps`}
                        className={`rounded-[0.75rem] bg-[rgba(120,120,128,0.09)] px-2 py-2.5 text-center text-[0.9375rem] font-medium tabular-nums tracking-[-0.01em] outline-none transition-[background-color,box-shadow,color] duration-[var(--response-fast)] focus:bg-[rgba(120,120,128,0.13)] focus:ring-2 focus:ring-emerald-500/35 disabled:opacity-100 ${repTone(set.reps, config)}`}
                        value={set.reps || ""}
                        onChange={(e) => updateSet(set.oi, "reps", Number(e.target.value))}
                        disabled={set.completed}
                        placeholder={String(config?.targetRepsMin ?? 0)}
                      />
                      <button
                        onClick={() => completeSet(set.oi)}
                        disabled={set.completed}
                        aria-label={set.completed ? `Set ${set.setNumber} logged` : `Log set ${set.setNumber}`}
                        className={`pressable flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-[var(--response-fast)] ${
                          set.completed
                            ? "bg-emerald-500 text-white"
                            : "bg-[rgba(120,120,128,0.12)] text-[color:var(--ink-tertiary)] hover:bg-emerald-500 hover:text-white"
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSet(name)}
                    className="pressable mt-3 flex w-full items-center justify-center gap-1.5 rounded-[0.75rem] py-3 text-[0.8125rem] font-medium text-[color:var(--ink-tertiary)] transition-colors hover:bg-[rgba(120,120,128,0.07)] hover:text-[color:var(--ink)]"
                  >
                    <Plus size={14} />Add set
                  </button>
                </Card>
                {exIdx < exerciseNames.length - 1 && config && (
                  <div className="flex items-center justify-center gap-1.5 py-3 text-caption">
                    <ArrowDownUp size={10} className="text-[color:var(--ink-quaternary)]" />
                    <span>{fmt(config.intervalSeconds)} to next exercise</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }


  // ===== START A SESSION =====
  return (
    <div>
      <NavBar
        title="Workout"
        actions={
          <>
            <NavCircle onClick={() => router.push("/templates")} label="Templates">
              <LayoutList size={18} strokeWidth={2.1} />
            </NavCircle>
            <NavAvatar name={user?.name || "?"} onClick={() => setShowAccount(true)} />
          </>
        }
      />

      <div className="mt-6">
        <List header="All time">
          <ListRow title="Heaviest lift" value={`${stats.topLift.toFixed(1)} kg`} chevron={false} />
          <ListRow title="Total volume" value={`${stats.volume.toLocaleString()} kg`} chevron={false} />
          <ListRow title="Sessions" value={stats.sessions} chevron={false} last />
        </List>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
            <div className="glass-subtle mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Dumbbell size={28} className="text-[color:var(--ink-quaternary)]" />
            </div>
            <h2 className="text-title-sm">Nothing to train yet</h2>
            <p className="text-caption mt-1.5 max-w-[16rem]">
              Build a template first — its exercises, sets and rep ranges become your session.
            </p>
            <Button size="sm" className="mt-5" onClick={() => router.push("/templates")}>
              <Plus size={16} />
              New template
            </Button>
          </div>
        ) : (
          <List header="Start a session" footer="Tap a template to begin. Sets are created from its targets.">
            {templates.map((t, i) => (
              <ListRow
                key={t.id}
                icon={<Play size={15} className="ml-0.5 text-emerald-600" />}
                iconBg="bg-emerald-500/15"
                title={t.name}
                subtitle={`${t.exercises.reduce((n, e) => n + e.targetSets, 0)} sets · ${t.exercises.map((e) => e.exerciseName).join(", ")}`}
                onClick={() => startWorkout(t)}
                last={i === templates.length - 1}
              />
            ))}
          </List>
        )}
      </div>

      <AccountSheet open={showAccount} onClose={() => setShowAccount(false)} />
    </div>
  );
}
