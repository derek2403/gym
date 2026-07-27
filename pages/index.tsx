import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import NavBar from "@/components/ui/NavBar";
import { List, ListRow } from "@/components/ui/List";
import WeekStrip from "@/components/home/WeekStrip";
import { BarChart3, Ruler, Flame, Play, Dumbbell, TrendingUp } from "lucide-react";
import { useAuth } from "./_app";
import { todayStr } from "@/lib/utils";

interface CalendarDay {
  date: string;
  hasWorkout: boolean;
  dayOfWeek: number;
}

interface Stats {
  weekSessions: number;
  weekCompletedSets: number;
  topLiftWeek: number;
  currentStreak: number;
  calendarDays: CalendarDay[];
}

const EMPTY: Stats = { weekSessions: 0, weekCompletedSets: 0, topLiftWeek: 0, currentStreak: 0, calendarDays: [] };

export default function TodayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "";
  const [stats, setStats] = useState<Stats>(EMPTY);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((s) => setStats({ ...EMPTY, ...s }));
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const today = todayStr();
  const trainedToday = stats.calendarDays.some((d) => d.date === today && d.hasWorkout);

  return (
    <div>
      <NavBar title="Today" subtitle={`${dateStr}${firstName ? ` · ${greeting}, ${firstName}` : ""}`} />

      <div className="mt-6">
        {/* The one thing this app exists to do, given the most weight on the
            screen and the shortest path to it. */}
        <button
          onClick={() => router.push("/workout")}
          className="pressable glass glass-tint-green mb-6 flex w-full items-center gap-4 rounded-[var(--radius-surface)] p-4 text-left"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.875rem] bg-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
            <Play size={22} strokeWidth={2.5} className="ml-0.5 text-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-title-sm on-material block">{trainedToday ? "Train again" : "Start workout"}</span>
            <span className="text-caption mt-0.5 block">
              {trainedToday ? "You already trained today" : "Pick a template and go"}
            </span>
          </span>
        </button>

        <List
          header="This week"
          footer={
            stats.currentStreak > 0
              ? `${stats.currentStreak} day streak. Sessions and sets count Sunday to Saturday.`
              : "Sessions and sets count Sunday to Saturday."
          }
        >
          <div className="px-4 pb-3 pt-4">
            <WeekStrip days={stats.calendarDays} today={today} />
          </div>
          <ListRow icon={<Dumbbell size={16} className="text-emerald-600" />} iconBg="bg-emerald-500/15" title="Sessions" value={stats.weekSessions} chevron={false} />
          <ListRow icon={<BarChart3 size={16} className="text-blue-500" />} iconBg="bg-blue-500/15" title="Sets completed" value={stats.weekCompletedSets} chevron={false} />
          <ListRow icon={<TrendingUp size={16} className="text-amber-600" />} iconBg="bg-amber-500/15" title="Top lift" value={`${stats.topLiftWeek.toFixed(1)} kg`} chevron={false} last />
        </List>

        <List header="Log">
          <ListRow
            icon={<Flame size={16} className="text-orange-600" />}
            iconBg="bg-orange-500/15"
            title="Calories"
            subtitle="Food and macros"
            onClick={() => router.push("/calories")}
          />
          <ListRow
            icon={<Ruler size={16} className="text-purple-600" />}
            iconBg="bg-purple-500/15"
            title="Body"
            subtitle="Weight, height and body fat"
            onClick={() => router.push("/track")}
            last
          />
        </List>

        <List header="Review">
          <ListRow
            icon={<BarChart3 size={16} className="text-amber-600" />}
            iconBg="bg-amber-500/15"
            title="History"
            subtitle="Past workouts and progression"
            onClick={() => router.push("/history")}
            last
          />
        </List>
      </div>
    </div>
  );
}
