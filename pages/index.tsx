import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Card from "@/components/ui/Card";
import StatBox from "@/components/ui/StatBox";
import WeekStrip from "@/components/home/WeekStrip";
import { Dumbbell, BarChart3, Ruler, Flame, ChevronRight, Play } from "lucide-react";
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
    <div className="animate-fade-in">
      <div className="mb-7">
        <p className="text-overline">{dateStr}</p>
        <h1 className="text-display mt-2">{greeting}{firstName && `, ${firstName}`}</h1>
      </div>

      {/* The primary action is the page's largest, highest-contrast element —
          on a training app, everything else is secondary to starting. */}
      <Card variant="tint" className="mb-4 p-5" onClick={() => router.push("/workout")}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.125rem] bg-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
            <Play size={24} strokeWidth={2.5} className="ml-0.5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-title-md on-material">{trainedToday ? "Train again" : "Start workout"}</h2>
            <p className="text-caption mt-0.5">
              {trainedToday ? "You already trained today" : "Pick a template and go"}
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-emerald-700/40" />
        </div>
      </Card>

      <Card className="mb-4 p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-title-sm on-material">This week</h2>
          {stats.currentStreak > 0 && (
            <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[0.6875rem] font-semibold text-emerald-700">
              {stats.currentStreak} day streak
            </span>
          )}
        </div>

        <WeekStrip days={stats.calendarDays} today={today} />

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <StatBox value={stats.weekSessions} label="Sessions" />
          <StatBox value={stats.weekCompletedSets} label="Sets" />
          <StatBox value={stats.topLiftWeek.toFixed(1)} label="Top lift" unit="kg" />
        </div>
      </Card>

      <div className="space-y-2.5">
        {[
          { label: "Calories", desc: "Log food and macros", icon: Flame, href: "/calories", color: "text-orange-600", bg: "bg-orange-500/15" },
          { label: "History", desc: "Past workouts & progression", icon: BarChart3, href: "/history", color: "text-amber-600", bg: "bg-amber-500/15" },
          { label: "Body", desc: "Weight, height & body fat", icon: Ruler, href: "/track", color: "text-purple-600", bg: "bg-purple-500/15" },
        ].map(({ label, desc, icon: Icon, href, color, bg }) => (
          <Card key={href} onClick={() => router.push(href)}>
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-title-sm on-material">{label}</h3>
                  <p className="text-caption mt-0.5 truncate">{desc}</p>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[color:var(--ink-quaternary)]" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
