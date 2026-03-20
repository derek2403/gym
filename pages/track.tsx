import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Trash2 } from "lucide-react";
import { todayStr, formatDateShort } from "@/lib/utils";
import { estimateBodyFat, type Sex } from "@/lib/formulas";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type MetricType = "weight" | "height" | "body_fat";

interface Metric { id: number; metricType: string; value: number; date: string; }
interface Profile { sex: string; heightCm: number; }

const METRIC_OPTIONS: { value: MetricType; label: string; unit: string; placeholder: string }[] = [
  { value: "weight", label: "Weight (kg)", unit: "kg", placeholder: "e.g., 82.4" },
  { value: "height", label: "Height (cm)", unit: "cm", placeholder: "e.g., 175" },
  { value: "body_fat", label: "Body fat (%)", unit: "%", placeholder: "" },
];

export default function TrackPage() {
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

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    setProfile(await res.json());
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { fetchProfile(); }, [fetchProfile]);

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
    <div className="animate-fade-in">
      <PageHeader title="Tracking" subtitle="Body metrics and progress." />

      <div className="mb-6 flex gap-1.5 rounded-full glass-subtle p-1">
        {METRIC_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveType(opt.value)}
            className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold tracking-tight transition-all duration-300 ${
              activeType === opt.value ? "glass text-white" : "text-white/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {activeType === "body_fat" ? (
        <Card className="mb-5">
          <h3 className="text-title-sm text-white/90">Body fat estimation</h3>
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
              <p className="font-mono text-[36px] font-bold tracking-tighter text-emerald-400">{bfResult}%</p>
            </div>
          )}
          {!profile?.heightCm && <p className="mt-3 text-[12px] text-amber-400/70">Set up your profile in Calories first (height needed).</p>}
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
          <h3 className="text-title-sm text-white/90">Progress</h3>
          {metrics.length > 0 && <span className="text-caption">Latest: {metrics[0].value}{activeOption.unit}</span>}
        </div>
        {chartData.length >= 2 ? (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} width={35} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", backdropFilter: "blur(20px)" }} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-caption">Add 2+ entries for chart.</p>
        )}
      </Card>

      <Card>
        <h3 className="text-title-sm text-white/90 mb-4">Recent entries</h3>
        {metrics.length === 0 ? (
          <p className="text-caption">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {metrics.slice(0, 10).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                <div>
                  <span className="font-mono text-[15px] font-medium text-white/80">{m.value}<span className="text-white/25">{activeOption.unit}</span></span>
                  <span className="ml-3 text-caption">{formatDateShort(m.date)}</span>
                </div>
                <button onClick={() => handleDelete(m.id)} className="p-1.5 text-white/15 transition-colors hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
