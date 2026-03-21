import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatBox from "@/components/ui/StatBox";
import RestTimer from "@/components/workout/RestTimer";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateForm from "@/components/templates/TemplateForm";
import { Dumbbell, Play, Check, Plus, X, ArrowDownUp } from "lucide-react";

interface TemplateExercise {
  id: number; exerciseName: string; targetSets: number; targetReps: number;
  restSeconds: number; intervalSeconds: number; sortOrder: number;
}
interface Template { id: number; name: string; exercises: TemplateExercise[]; }
interface SetEntry {
  exerciseName: string; setNumber: number; weightKg: number; reps: number;
  completed: boolean; savedId?: number;
}

type ViewMode = "start" | "templates";

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
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function WorkoutPage() {
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
  const [viewMode, setViewMode] = useState<ViewMode>("start");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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
    template.exercises.forEach((ex) => { for (let s = 1; s <= ex.targetSets; s++) initialSets.push({ exerciseName: ex.exerciseName, setNumber: s, weightKg: 0, reps: ex.targetReps, completed: false }); });
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
    setSets((prev) => [...prev.slice(0, idx), { exerciseName, setNumber: ex.length + 1, weightKg: last?.weightKg || 0, reps: last?.reps || 10, completed: false }, ...prev.slice(idx)]);
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

  const handleCreate = async (name: string, exercises: any[]) => { await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, exercises }) }); setShowForm(false); fetchData(); };
  const handleUpdate = async (name: string, exercises: any[]) => { await fetch(`/api/templates/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, exercises }) }); setEditingId(null); fetchData(); };
  const handleDelete = async (id: number) => { await fetch(`/api/templates/${id}`, { method: "DELETE" }); fetchData(); };

  const exerciseNames = [...new Set(sets.map((s) => s.exerciseName))];
  const completedSets = sets.filter((s) => s.completed).length;
  const editingTemplate = templates.find((t) => t.id === editingId);
  const fmt = (s: number) => { const m = Math.floor(s / 60); const r = s % 60; return m > 0 ? `${m}m${r > 0 ? ` ${r}s` : ""}` : `${r}s`; };

  // ===== ACTIVE WORKOUT =====
  if (activeWorkoutId) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-title-md text-black">{activeTemplateName}</h1>
            <p className="text-caption mt-1">{completedSets}/{sets.length} sets</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={cancelWorkout}><X size={16} /></Button>
            <Button size="sm" onClick={finishWorkout}><Check size={16} />Finish</Button>
          </div>
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
                <Card className={allDone ? "opacity-40 transition-opacity duration-500" : ""}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-title-sm text-black/85">{name}</h3>
                    {config && <span className="text-caption">Rest {fmt(config.restSeconds)}</span>}
                  </div>
                  <div className="mb-3 grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] gap-3 text-overline">
                    <span>Set</span><span>kg</span><span>Reps</span><span />
                  </div>
                  {exSets.map((set) => (
                    <div key={set.oi} className={`mb-2 grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-3 ${set.completed ? "opacity-30" : ""}`}>
                      <span className="text-center text-[14px] font-medium text-black/20">{set.setNumber}</span>
                      <input type="number" className="rounded-xl bg-black/[0.04] px-2 py-2.5 text-center text-[15px] tracking-tight text-black/85 outline-none focus:bg-black/[0.06]" value={set.weightKg || ""} onChange={(e) => updateSet(set.oi, "weightKg", Number(e.target.value))} disabled={set.completed} placeholder="0" />
                      <input type="number" className="rounded-xl bg-black/[0.04] px-2 py-2.5 text-center text-[15px] tracking-tight text-black/85 outline-none focus:bg-black/[0.06]" value={set.reps || ""} onChange={(e) => updateSet(set.oi, "reps", Number(e.target.value))} disabled={set.completed} placeholder="0" />
                      <button onClick={() => completeSet(set.oi)} disabled={set.completed} className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${set.completed ? "bg-emerald-500/15 text-emerald-400" : "bg-black/[0.04] text-black/20 hover:bg-emerald-500 hover:text-black/70"}`}>
                        <Check size={13} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addSet(name)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] text-black/15 transition-colors hover:bg-black/[0.03] hover:text-black/70/35">
                    <Plus size={13} />Add set
                  </button>
                </Card>
                {exIdx < exerciseNames.length - 1 && config && (
                  <div className="flex items-center justify-center gap-1.5 py-3 text-caption">
                    <ArrowDownUp size={10} /><span>{fmt(config.intervalSeconds)} transition</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== START / TEMPLATES VIEW =====
  return (
    <div>
      <PageHeader title="Workout" subtitle="Train or manage templates." />

      <div className="mb-6 flex gap-1 rounded-full glass-subtle p-1">
        {(["start", "templates"] as ViewMode[]).map((mode) => (
          <button key={mode} onClick={() => { setViewMode(mode); setShowForm(false); setEditingId(null); }}
            className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold tracking-tight transition-all duration-300 ${viewMode === mode ? "glass text-black" : "text-black/25"}`}>
            {mode === "start" ? "Start" : "Templates"}
          </button>
        ))}
      </div>

      {viewMode === "start" && (
        <div className="animate-fade-in space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatBox value={stats.topLift.toFixed(1)} label="Top lift" unit="kg" />
            <StatBox value={stats.volume} label="Volume" unit="kg" />
            <StatBox value={stats.sessions} label="Sessions" />
          </div>
          {templates.length === 0 ? (
            <Card className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.03]">
                <Dumbbell size={24} className="text-black/15" />
              </div>
              <p className="text-caption">No templates yet</p>
              <Button size="sm" className="mt-5" onClick={() => { setViewMode("templates"); setShowForm(true); }}>Create template</Button>
            </Card>
          ) : (
            templates.map((t) => (
              <Card key={t.id} onClick={() => startWorkout(t)}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <Play size={20} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-title-sm text-black/85">{t.name}</h3>
                    <p className="text-caption mt-0.5 truncate">{t.exercises.map((e) => e.exerciseName).join(" · ")}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {viewMode === "templates" && (
        <div className="animate-fade-in">
          {!showForm && !editingId && (
            <Button size="sm" className="mb-5 w-full" onClick={() => setShowForm(true)}><Plus size={16} />New template</Button>
          )}
          {showForm && <TemplateForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
          {editingId && editingTemplate && (
            <TemplateForm initialName={editingTemplate.name}
              initialExercises={editingTemplate.exercises.map((e) => ({ exerciseName: e.exerciseName, targetSets: e.targetSets, targetReps: e.targetReps, restSeconds: e.restSeconds, intervalSeconds: e.intervalSeconds }))}
              onSubmit={handleUpdate} onCancel={() => setEditingId(null)} submitLabel="Save changes" />
          )}
          {!showForm && !editingId && (
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.02]">
                    <Dumbbell size={28} className="text-black/10" />
                  </div>
                  <p className="text-caption">No templates yet</p>
                </div>
              ) : templates.map((t) => (
                <TemplateCard key={t.id} name={t.name} exerciseCount={t.exercises.length} exercises={t.exercises.map((e) => e.exerciseName)} onEdit={() => setEditingId(t.id)} onDelete={() => handleDelete(t.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
