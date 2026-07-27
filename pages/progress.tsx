import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import NavBar, { NavAvatar } from "@/components/ui/NavBar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StatBox from "@/components/ui/StatBox";
import SwipeRow from "@/components/ui/SwipeRow";
import ConsistencyCalendar from "@/components/history/ConsistencyCalendar";
import WorkoutLog from "@/components/history/WorkoutLog";
import { useAccountUI } from "@/components/account/AccountProvider";
import { useAuth } from "@/pages/_app";
import { todayStr, formatDateShort } from "@/lib/utils";
import { estimateBodyFat, type Sex } from "@/lib/formulas";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Segment = "training" | "body";
type MetricType = "weight" | "height" | "body_fat";

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

interface Metric { id: number; metricType: string; value: number; date: string; }
interface Profile { sex: string; heightCm: number; }

const SEGMENTS: { value: Segment; label: string }[] = [
  { value: "training", label: "Training" },
  { value: "body", label: "Body" },
];

const METRIC_OPTIONS: { value: MetricType; label: string; unit: string; placeholder: string }[] = [
  { value: "weight", label: "Weight", unit: "kg", placeholder: "e.g., 82.4" },
  { value: "height", label: "Height", unit: "cm", placeholder: "e.g., 175" },
  { value: "body_fat", label: "Body fat", unit: "%", placeholder: "" },
];

function formatStreak(days: number): string {
  const weeks = Math.floor(days / 7);
  const remainder = days % 7;
  // Narrow no-break space between value and unit: units are not suffixes
  // glued to digits, and the pair must never wrap apart.
  if (weeks === 0) return `${days} d`;
  if (remainder === 0) return `${weeks} w`;
  return `${weeks} w ${remainder} d`;
}

export default function ProgressPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { openAccount, profileVersion } = useAccountUI();

  // The query is only readable after hydration; rendering Training first and
  // switching in an effect avoids a server/client markup mismatch. After init
  // the segment is purely local state — toggling never touches the URL.
  const [segment, setSegment] = useState<Segment>("training");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!router.isReady || ready) return;
    if (router.query.section === "body") setSegment("body");
    setReady(true);
  }, [router.isReady, router.query.section, ready]);

  // ===== Training =====
  const [stats, setStats] = useState<Stats | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    if (!ready || segment !== "training") return;
    Promise.all([fetch("/api/stats").then((r) => r.json()), fetch("/api/workouts").then((r) => r.json())])
      .then(([s, w]) => { setStats(s); setWorkouts(w.filter((wk: Workout) => wk.completedAt)); });
  }, [ready, segment]);

  const allExercises = [...new Set(workouts.flatMap((w) => w.sets.map((s) => s.exerciseName)))];
  const progressionData = selectedExercise
    ? workouts.filter((w) => w.sets.some((s) => s.exerciseName === selectedExercise))
        .map((w) => {
          const maxWeight = Math.max(...w.sets.filter((s) => s.exerciseName === selectedExercise).map((s) => s.weightKg));
          return { date: (w.completedAt || w.startedAt).split("T")[0].slice(5), weight: maxWeight };
        })
    : [];

  // ===== Body =====
  const [activeType, setActiveType] = useState<MetricType>("weight");
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayStr());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bfWaist, setBfWaist] = useState("");
  const [bfNeck, setBfNeck] = useState("");
  const [bfHip, setBfHip] = useState("");
  const [bfResult, setBfResult] = useState<number | null>(null);

  const fetchMetrics = useCallback(async () => {
    const res = await fetch(`/api/body-metrics?type=${activeType}`);
    setMetrics(await res.json());
  }, [activeType]);

  useEffect(() => {
    if (ready && segment === "body") fetchMetrics();
  }, [ready, segment, fetchMetrics]);

  // profileVersion: the body-fat estimator depends on profile height/sex, so
  // saving the profile in the account sheet should be reflected here.
  useEffect(() => {
    if (!ready || segment !== "body") return;
    fetch("/api/profile").then((r) => r.json()).then(setProfile);
  }, [ready, segment, profileVersion]);

  useEffect(() => {
    if (activeType !== "body_fat") return;
    const waist = Number(bfWaist), neck = Number(bfNeck);
    const sex = (profile?.sex || "male") as Sex;
    const height = profile?.heightCm || 0;
    if (!waist || !neck || !height) { setBfResult(null); return; }
    setBfResult(estimateBodyFat(sex, waist, neck, height, sex === "female" ? Number(bfHip) || undefined : undefined));
  }, [bfWaist, bfNeck, bfHip, profile, activeType]);

  const handleAdd = async () => {
    if (activeType === "body_fat") {
      if (bfResult === null) return;
      await fetch("/api/body-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metricType: "body_fat", value: bfResult, date }) });
      if (bfWaist) await fetch("/api/body-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metricType: "waist", value: Number(bfWaist), date }) });
      if (bfNeck) await fetch("/api/body-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metricType: "neck", value: Number(bfNeck), date }) });
      setBfWaist(""); setBfNeck(""); setBfHip(""); setBfResult(null);
    } else {
      if (!value.trim()) return;
      await fetch("/api/body-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metricType: activeType, value: Number(value), date }) });
      setValue("");
    }
    fetchMetrics();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/body-metrics?id=${id}`, { method: "DELETE" });
    fetchMetrics();
  };

  const activeOption = METRIC_OPTIONS.find((o) => o.value === activeType)!;
  const chartData = [...metrics].reverse().map((m) => ({ date: formatDateShort(m.date), value: m.value }));
  const sex = (profile?.sex || "male") as Sex;

  return (
    <div>
      <NavBar
        title="Progress"
        subtitle="Training history and body metrics."
        actions={<NavAvatar name={user?.name || "?"} onClick={openAccount} />}
      />

      <div role="tablist" className="glass-subtle mb-6 flex gap-1 rounded-full p-1">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.value}
            role="tab"
            aria-selected={segment === seg.value}
            onClick={() => setSegment(seg.value)}
            className={`pressable-subtle flex-1 rounded-full py-2.5 text-[0.8125rem] font-semibold tracking-[-0.01em] transition-colors duration-[var(--response-base)] ${
              segment === seg.value
                ? "bg-white text-[color:var(--ink)] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                : "text-[color:var(--ink-tertiary)]"
            }`}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {segment === "training" ? (
        <div key="training" className="animate-fade-in">
          {!stats ? (
            <div className="flex h-64 items-center justify-center text-[color:var(--ink-quaternary)]">Loading...</div>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-3 gap-3">
                <StatBox value={stats.totalSessions} label="Sessions" />
                <StatBox value={stats.totalCompletedSets} label="Sets" />
                <StatBox value={stats.totalVolume.toLocaleString()} label="Volume" unit="kg" />
              </div>

              <Card className="mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-title-sm text-[color:var(--ink)]">Top lift</p>
                    <p className="text-caption mt-0.5">{stats.topLiftExercise || "No completed set yet"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-metric text-[1.75rem]">
                      {stats.topLift.toFixed(1)}<span className="ml-1 text-[13px] font-normal tracking-normal text-[color:var(--ink-quaternary)]">kg</span>
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
            </>
          )}
        </div>
      ) : (
        <div key="body" className="animate-fade-in">
          {/* Pill chips, not a second slug track — two stacked segmented
              controls would compete for the same visual role. */}
          <div className="mb-4 flex gap-2">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  // A value typed for one metric must not survive into another —
                  // 82.4 kg logged as height would silently corrupt the TDEE goal.
                  if (opt.value !== activeType) setValue("");
                  setActiveType(opt.value);
                }}
                aria-pressed={activeType === opt.value}
                className={`pressable rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors duration-[var(--response-fast)] ${
                  activeType === opt.value
                    ? "bg-emerald-500 text-white"
                    : "bg-[rgba(120,120,128,0.09)] text-[color:var(--ink-tertiary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {activeType === "body_fat" ? (
            <Card className="mb-5">
              <h3 className="text-title-sm text-[color:var(--ink)]">Body fat estimation</h3>
              <p className="text-caption mt-1 mb-4">U.S. Navy method. Enter measurements below.</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Waist (cm)" type="number" step="0.1" placeholder="84.0" value={bfWaist} onChange={(e) => setBfWaist(e.target.value)} />
                <Input label="Neck (cm)" type="number" step="0.1" placeholder="38.0" value={bfNeck} onChange={(e) => setBfNeck(e.target.value)} />
                {sex === "female" && <Input label="Hip (cm)" type="number" step="0.1" placeholder="96.0" value={bfHip} onChange={(e) => setBfHip(e.target.value)} />}
                <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              {bfResult !== null && (
                <div className="mt-5 glass-tint-green rounded-2xl p-5 text-center">
                  <p className="text-caption">Estimated body fat</p>
                  <p className="text-metric text-[2.25rem] text-emerald-600">{bfResult}%</p>
                </div>
              )}
              {!profile?.heightCm && <p className="mt-3 text-[12px] text-amber-400/70">Set your height in Profile & Goals first.</p>}
              <Button size="sm" className="mt-4" onClick={handleAdd} disabled={bfResult === null}>Save entry</Button>
            </Card>
          ) : (
            <Card className="mb-5">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Value" type="number" step="0.1" placeholder={activeOption.placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
                <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button size="sm" className="mt-4" onClick={handleAdd}>Add entry</Button>
            </Card>
          )}

          <Card className="mb-5">
            <div className="flex items-center justify-between">
              <h3 className="text-title-sm text-[color:var(--ink)]">Progress</h3>
              {metrics.length > 0 && <span className="text-caption">Latest: {metrics[0].value} {activeOption.unit}</span>}
            </div>
            {chartData.length >= 2 ? (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.2)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.2)" }} axisLine={false} tickLine={false} width={35} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", border: "0.5px solid rgba(0,0,0,0.06)", borderRadius: "12px", fontSize: "12px", backdropFilter: "blur(20px)" }} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-caption">Add 2+ entries for chart.</p>
            )}
          </Card>

          <Card>
            <h3 className="text-title-sm text-[color:var(--ink)] mb-4">Recent entries</h3>
            {metrics.length === 0 ? (
              <p className="text-caption">No entries yet.</p>
            ) : (
              <div className="space-y-2">
                {metrics.slice(0, 10).map((m) => (
                  <SwipeRow key={m.id} label={`${m.value} ${activeOption.unit} on ${formatDateShort(m.date)}`} onDelete={() => handleDelete(m.id)}>
                    <div className="flex items-center justify-between rounded-[0.875rem] bg-[rgba(120,120,128,0.08)] px-4 py-3">
                      <span className="tabular-nums text-[0.9375rem] font-medium text-[color:var(--ink)]">
                        {m.value}
                        <span className="ml-0.5 tracking-normal text-[color:var(--ink-quaternary)]">{activeOption.unit}</span>
                      </span>
                      <span className="text-caption">{formatDateShort(m.date)}</span>
                    </div>
                  </SwipeRow>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
