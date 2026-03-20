import Link from "next/link";
import { useRouter } from "next/router";
import {
  Home,
  Flame,
  Dumbbell,
  BarChart3,
  LayoutGrid,
  TrendingUp,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Today", icon: Home },
  { href: "/calories", label: "Calories", icon: Flame },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/history", label: "History", icon: BarChart3 },
  { href: "/templates", label: "Templates", icon: LayoutGrid },
  { href: "/track", label: "Track", icon: TrendingUp },
];

export default function BottomNav() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1.5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                active
                  ? "text-emerald-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span>{label}</span>
              {active && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-emerald-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
