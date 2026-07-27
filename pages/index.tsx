import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatBox from "@/components/ui/StatBox";
import { Dumbbell, BarChart3, TrendingUp, ChevronRight } from "lucide-react";
import { useAuth } from "./_app";

interface Stats {
  weekSessions: number;
  weekCompletedSets: number;
  topLiftWeek: number;
}

export default function TodayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "";
  const [stats, setStats] = useState<Stats>({ weekSessions: 0, weekCompletedSets: 0, topLiftWeek: 0 });

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-overline">{dateStr}</p>
        <h1 className="text-display mt-2 text-balance">{greeting}{firstName && `, ${firstName}`}</h1>
      </div>

      <Card variant="tint" className="mb-6 p-5" onClick={() => router.push("/workout")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20">
              <Dumbbell size={22} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-title-sm on-material">Start workout</h3>
              <p className="text-caption mt-0.5">Train with your templates</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-[color:var(--ink-quaternary)]" />
        </div>
      </Card>

      {/* Grouped under a label so the numbers state their own scope — three bare
          figures leave you guessing whether they're weekly or all-time. */}
      <section className="mb-6">
        <h2 className="text-overline mb-2.5">This week</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <StatBox value={stats.weekSessions} label="Sessions" />
          <StatBox value={stats.weekCompletedSets} label="Sets" />
          <StatBox value={stats.topLiftWeek.toFixed(1)} label="Top lift" unit="kg" />
        </div>
      </section>

      <div className="space-y-3">
        {[
          { label: "History", desc: "Past workouts & progression", icon: BarChart3, href: "/history", color: "text-amber-600", bg: "bg-amber-500/15" },
          { label: "Body", desc: "Weight, height & body fat", icon: TrendingUp, href: "/track", color: "text-purple-600", bg: "bg-purple-500/15" },
        ].map(({ label, desc, icon: Icon, href, color, bg }) => (
          <Card key={href} onClick={() => router.push(href)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <h3 className="text-title-sm on-material">{label}</h3>
                  <p className="text-caption mt-0.5">{desc}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[color:var(--ink-quaternary)]" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
