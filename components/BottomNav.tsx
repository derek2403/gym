import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Flame, BarChart3, TrendingUp, Dumbbell } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calories", label: "Calories", icon: Flame },
  { href: "/history", label: "History", icon: BarChart3 },
  { href: "/track", label: "Track", icon: TrendingUp },
];

export default function BottomNav() {
  const router = useRouter();
  const isWorkoutActive = router.pathname === "/workout";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pb-8">
      <div className="relative flex w-full max-w-[360px] items-center rounded-full bg-[rgba(20,20,20,0.85)] px-1.5 py-1 shadow-[0_4px_24px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.08] backdrop-blur-[60px] [-webkit-backdrop-filter:blur(60px)_saturate(180%)]">
        {tabs.slice(0, 2).map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-[3px] rounded-full py-2.5 transition-all duration-300 ${
                active ? "text-white" : "text-white/30"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-tight">{label}</span>
            </Link>
          );
        })}

        <div className="flex flex-1 justify-center">
          <Link
            href="/workout"
            className={`-mt-6 flex h-[54px] w-[54px] items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
              isWorkoutActive
                ? "bg-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.4)]"
                : "bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.4)]"
            }`}
          >
            <Dumbbell size={22} strokeWidth={2.5} className="text-black" />
          </Link>
        </div>

        {tabs.slice(2).map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-[3px] rounded-full py-2.5 transition-all duration-300 ${
                active ? "text-white" : "text-white/30"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
