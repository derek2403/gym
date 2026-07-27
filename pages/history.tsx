import { useState, useEffect } from "react";
import NavBar from "@/components/ui/NavBar";
import Card from "@/components/ui/Card";
import StatBox from "@/components/ui/StatBox";
import ConsistencyCalendar from "@/components/history/ConsistencyCalendar";
import WorkoutLog from "@/components/history/WorkoutLog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalSessions: number; totalCompletedSets: number; totalVolume: number;
  topLift: number; topLiftExercise: string | null;
  currentStreak: number; bestStreak: number;
  calendarDays: { date: string; hasWorkout: boolean; dayOfWeek: number }[];
}

interface Workout {
  id: number; startedAt: string; completedAt: string | null;
  sets: { exerciseName: string; setNumber: number; weightKg: number; reps: number; completedAt: string }[];
}

function formatStreak(days: number): string {
  const weeks = Math.floor(days / 7);
  const remainder = days % 7;
  if (weeks === 0) return `${days}d`;
  if (remainder === 0) return `${weeks}w`;
  return `${weeks}w ${remainder}d`;
}

export default function HistoryPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/stats").then((r) => r.json()), fetch("/api/workouts").then((r) => r.json())])
      .then(([s, w]) => { setStats(s); setWorkouts(w.filter((wk: Workout) => wk.completedAt)); });
  }, []);

  const allExercises = [...new Set(workouts.flatMap((w) => w.sets.map((s) => s.exerciseName)))];
  const progressionData = selectedExercise
    ? workouts.filter((w) => w.sets.some((s) => s.exerciseName === selectedExercise))
        .map((w) => {
          const maxWeight = Math.max(...w.sets.filter((s) => s.exerciseName === selectedExercise).map((s) => s.weightKg));
          return { date: (w.completedAt || w.startedAt).split("T")[0].slice(5), weight: maxWeight };
        })
    : [];

  if (!stats) return <div className="flex h-64 items-center justify-center text-[color:var(--ink-quaternary)]">Loading...</div>;

  return (
    <div className="animate-fade-in">
      <NavBar title="History" subtitle="Progression and PR context." />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatBox value={stats.totalSessions} label="Sessions" />
        <StatBox value={stats.totalCompletedSets} label="Sets" />
        <StatBox value={stats.totalVolume} label="Volume" />
      </div>

      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-title-sm text-[color:var(--ink)]">Top lift</p>
            <p className="text-caption mt-0.5">{stats.topLiftExercise || "No completed set yet"}</p>
          </div>
          <div className="text-right">
            <p className="text-metric text-[1.75rem]">
              {stats.topLift.toFixed(1)}<span className="text-[13px] font-normal text-[color:var(--ink-quaternary)]">kg</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-5">
        <ConsistencyCalendar days={stats.calendarDays} />
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatBox value={formatStreak(stats.currentStreak)} label="Current streak" />
        <StatBox value={formatStreak(stats.bestStreak)} label="Best streak" />
      </div>

      {allExercises.length > 0 && (
        <Card className="mb-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-title-sm text-[color:var(--ink)]">Progression</h3>
            <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}
              className="rounded-xl bg-[rgba(120,120,128,0.09)] px-3 py-1.5 text-[13px] text-[color:var(--ink-secondary)] outline-none">
              <option value="">Select</option>
              {allExercises.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {progressionData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={progressionData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.2)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.2)" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", border: "0.5px solid rgba(0,0,0,0.06)", borderRadius: "12px", fontSize: "12px", backdropFilter: "blur(20px)" }} labelStyle={{ color: "rgba(0,0,0,0.4)" }} />
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-caption">{selectedExercise ? "Need 2+ workouts for chart." : "Select an exercise."}</p>
          )}
        </Card>
      )}

      <WorkoutLog workouts={workouts} />
    </div>
  );
}
