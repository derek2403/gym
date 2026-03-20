import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatBox from "@/components/ui/StatBox";
import {
  Dumbbell,
  LayoutGrid,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Settings,
} from "lucide-react";

interface Stats {
  weekSessions: number;
  weekCompletedSets: number;
  topLiftWeek: number;
}

export default function TodayPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    weekSessions: 0,
    weekCompletedSets: 0,
    topLiftWeek: 0,
  });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const navCards = [
    { label: "Start workout", icon: Dumbbell, href: "/workout", color: "text-emerald-500" },
    { label: "Templates", icon: LayoutGrid, href: "/templates", color: "text-blue-400" },
    { label: "History", icon: BarChart3, href: "/history", color: "text-amber-500" },
    { label: "Track body", icon: TrendingUp, href: "/track", color: "text-purple-400" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Today</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {dateStr} · {timeStr}
          </p>
        </div>
        <button className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
          <Settings size={20} />
        </button>
      </div>

      <Card className="mb-4 flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <ArrowRight size={18} className="text-emerald-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-zinc-300">
            Start a workout from your template and log real sets.
          </p>
          <Button size="sm" className="mt-2" onClick={() => router.push("/workout")}>
            Start workout
          </Button>
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {navCards.map(({ label, icon: Icon, href, color }) => (
          <Card key={href} onClick={() => router.push(href)} className="flex flex-col items-center gap-2 py-5">
            <Icon size={22} className={color} />
            <span className="text-sm font-medium text-zinc-300">{label}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatBox value={stats.weekSessions} label="Week sessions" />
        <StatBox value={stats.weekCompletedSets} label="Completed sets" />
        <StatBox value={stats.topLiftWeek.toFixed(1)} label="Top kg (week)" />
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Template → workout → track progress.
      </p>
    </div>
  );
}
