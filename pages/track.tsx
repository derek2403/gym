import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Trash2 } from "lucide-react";
import { todayStr, formatDateShort } from "@/lib/utils";
import { estimateBodyFat, type Sex } from "@/lib/formulas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type MetricType = "weight" | "height" | "body_fat";

interface Metric {
  id: number;
  metricType: string;
  value: number;
  date: string;
}

interface Profile {
  sex: string;
  heightCm: number;
}

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

  // Body fat measurement inputs
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
    const data = await res.json();
    setProfile(data);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-calculate body fat when inputs change
  useEffect(() => {
    if (activeType !== "body_fat") return;
    const waist = Number(bfWaist);
    const neck = Number(bfNeck);
    const sex = (profile?.sex || "male") as Sex;
    const height = profile?.heightCm || 0;

    if (!waist || !neck || !height) {
      setBfResult(null);
      return;
    }

    const result = estimateBodyFat(sex, waist, neck, height, sex === "female" ? Number(bfHip) || undefined : undefined);
    setBfResult(result);
  }, [bfWaist, bfNeck, bfHip, profile, activeType]);

  const handleAdd = async () => {
    if (activeType === "body_fat") {
      if (bfResult === null) return;
      // Save the BF result and also the waist/neck as separate metrics for tracking
      await fetch("/api/body-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metricType: "body_fat", value: bfResult, date }),
      });
      if (bfWaist) {
        await fetch("/api/body-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metricType: "waist", value: Number(bfWaist), date }),
        });
      }
      if (bfNeck) {
        await fetch("/api/body-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metricType: "neck", value: Number(bfNeck), date }),
        });
      }
      setBfWaist("");
      setBfNeck("");
      setBfHip("");
      setBfResult(null);
    } else {
      if (!value.trim()) return;
      await fetch("/api/body-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metricType: activeType, value: Number(value), date }),
      });
      setValue("");
    }
    fetchMetrics();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/body-metrics?id=${id}`, { method: "DELETE" });
    fetchMetrics();
  };

  const activeOption = METRIC_OPTIONS.find((o) => o.value === activeType)!;
  const chartData = [...metrics]
    .reverse()
    .map((m) => ({ date: formatDateShort(m.date), value: m.value }));

  const sex = (profile?.sex || "male") as Sex;

  return (
    <div>
      <PageHeader
        title="Tracking"
        subtitle="Track body metrics and visualize your progress."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {METRIC_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveType(opt.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              activeType === opt.value
                ? "bg-emerald-500 text-zinc-950"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {activeType === "body_fat" ? (
        <Card className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-200">Body fat estimation</h3>
          <p className="mb-3 text-xs text-zinc-500">
            Enter your measurements below. Body fat is calculated using the U.S. Navy method.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Waist (cm)"
              type="number"
              step="0.1"
              placeholder="e.g., 84.0"
              value={bfWaist}
              onChange={(e) => setBfWaist(e.target.value)}
            />
            <Input
              label="Neck (cm)"
              type="number"
              step="0.1"
              placeholder="e.g., 38.0"
              value={bfNeck}
              onChange={(e) => setBfNeck(e.target.value)}
            />
            {sex === "female" && (
              <Input
                label="Hip (cm)"
                type="number"
                step="0.1"
                placeholder="e.g., 96.0"
                value={bfHip}
                onChange={(e) => setBfHip(e.target.value)}
              />
            )}
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {bfResult !== null && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <p className="text-xs text-zinc-400">Estimated body fat</p>
              <p className="font-mono text-3xl font-bold text-emerald-500">
                {bfResult}%
              </p>
            </div>
          )}

          {!profile?.heightCm && (
            <p className="mt-3 text-xs text-amber-500">
              Set up your profile in the Calories tab first (height is needed for calculation).
            </p>
          )}

          <Button
            size="sm"
            className="mt-3"
            onClick={handleAdd}
            disabled={bfResult === null}
          >
            Save entry
          </Button>
        </Card>
      ) : (
        <Card className="mb-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Value"
              type="number"
              step="0.1"
              placeholder={activeOption.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button size="sm" className="mt-3" onClick={handleAdd}>
            Add entry
          </Button>
        </Card>
      )}

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Progress chart</h3>
          {metrics.length > 0 && (
            <span className="text-xs text-zinc-500">
              Latest: {metrics[0].value}{activeOption.unit}
            </span>
          )}
        </div>
        {chartData.length >= 2 ? (
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
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
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-zinc-500">
            Add at least 2 entries to see chart progression.
          </p>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">Recent entries</h3>
        {metrics.length === 0 ? (
          <p className="text-xs text-zinc-500">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {metrics.slice(0, 10).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
              >
                <div>
                  <span className="font-mono text-sm text-zinc-200">
                    {m.value}
                    <span className="text-xs text-zinc-500">{activeOption.unit}</span>
                  </span>
                  <span className="ml-3 text-xs text-zinc-500">
                    {formatDateShort(m.date)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1 text-zinc-600 transition-colors hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Track small changes. They add up.
      </p>
    </div>
  );
}
