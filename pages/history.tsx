import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import StatBox from "@/components/ui/StatBox";
import ConsistencyCalendar from "@/components/history/ConsistencyCalendar";
import WorkoutLog from "@/components/history/WorkoutLog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalSessions: number;
  totalCompletedSets: number;
  totalVolume: number;
  topLift: number;
  topLiftExercise: string | null;
  currentStreak: number;
  bestStreak: number;
  calendarDays: { date: string; hasWorkout: boolean }[];
}

interface WorkoutSet {
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completedAt: string;
}

interface Workout {
  id: number;
  startedAt: string;
  completedAt: string | null;
  sets: WorkoutSet[];
}

export default function HistoryPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/workouts").then((r) => r.json()),
    ]).then(([s, w]) => {
      setStats(s);
      setWorkouts(w.filter((wk: Workout) => wk.completedAt));
    });
  }, []);

  // All unique exercise names
  const allExercises = [
    ...new Set(workouts.flatMap((w) => w.sets.map((s) => s.exerciseName))),
  ];

  // Progression data for selected exercise
  const progressionData = selectedExercise
    ? workouts
        .filter((w) => w.sets.some((s) => s.exerciseName === selectedExercise))
        .map((w) => {
          const exSets = w.sets.filter((s) => s.exerciseName === selectedExercise);
          const maxWeight = Math.max(...exSets.map((s) => s.weightKg));
          const date = (w.completedAt || w.startedAt).split("T")[0];
          return { date: date.slice(5), weight: maxWeight };
        })
    : [];

  if (!stats) return <div className="flex h-64 items-center justify-center text-zinc-500">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="History"
        subtitle="Your workouts, set-by-set progression, and PR context."
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatBox value={stats.totalSessions} label="Sessions" />
        <StatBox value={stats.totalCompletedSets} label="Completed sets" />
        <StatBox value={stats.totalVolume} label="Volume" />
      </div>

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Top lift</p>
            <p className="text-xs text-zinc-500">
              {stats.topLiftExercise || "No completed set yet"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-zinc-50">
              {stats.topLift.toFixed(1)}
              <span className="text-sm font-normal text-zinc-500">kg</span>
            </p>
            <p className="text-[10px] text-zinc-500">best recorded</p>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <ConsistencyCalendar days={stats.calendarDays} />
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatBox value={stats.currentStreak} label="Current streak" />
        <StatBox value={stats.bestStreak} label="Best streak" />
      </div>

      {allExercises.length > 0 && (
        <Card className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Exercise progression</h3>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none"
            >
              <option value="">Select exercise</option>
              {allExercises.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          {progressionData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={progressionData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-6 text-center text-xs text-zinc-500">
              {selectedExercise
                ? "Need at least 2 workouts to show progression."
                : "Select an exercise to see progression."}
            </p>
          )}
        </Card>
      )}

      <WorkoutLog workouts={workouts} />
    </div>
  );
}
