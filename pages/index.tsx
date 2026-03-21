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
      <div className="mb-10">
        <p className="text-caption">{dateStr}</p>
        <h1 className="text-title-lg mt-1 text-black">{greeting}, {firstName}</h1>
      </div>

      <Card variant="tint" className="mb-6" onClick={() => router.push("/workout")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Dumbbell size={22} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-title-sm text-black">Start workout</h3>
              <p className="text-caption mt-0.5">Train with your templates</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-black/15" />
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatBox value={stats.weekSessions} label="Sessions" />
        <StatBox value={stats.weekCompletedSets} label="Sets" />
        <StatBox value={stats.topLiftWeek.toFixed(1)} label="Top kg" />
      </div>

      <div className="space-y-3">
        {[
          { label: "History", desc: "Workouts & progression", icon: BarChart3, href: "/history", color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Track", desc: "Body metrics & body fat", icon: TrendingUp, href: "/track", color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map(({ label, desc, icon: Icon, href, color, bg }) => (
          <Card key={href} onClick={() => router.push(href)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <h3 className="text-title-sm text-black/85">{label}</h3>
                  <p className="text-caption mt-0.5">{desc}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-black/10" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
