import Link from "next/link";
import { useRouter } from "next/router";
import { CalendarDays, Flame, History, Ruler, Dumbbell } from "lucide-react";

/**
 * Standard tab bar: five peers, each a destination.
 *
 * The raised centre button this replaces was not a tab — it was an action
 * wearing a tab's clothing, which made one destination look more important than
 * the row it sat in and left the bar with an odd hole in the middle. Workout is
 * now simply the tab it always was, and starting a session is the primary
 * action *inside* that tab, where it belongs.
 */
const tabs = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/calories", label: "Calories", icon: Flame },
  { href: "/history", label: "History", icon: History },
  { href: "/track", label: "Body", icon: Ruler },
];

export default function BottomNav() {
  const router = useRouter();

  return (
    <nav
      className="chrome fixed inset-x-0 bottom-0 z-50 rounded-none border-x-0 border-b-0 border-t-[0.5px] border-t-[rgba(60,60,67,0.14)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="group flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2 outline-none"
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.2 : 1.7}
                className={`transition-colors duration-[var(--response-fast)] group-active:opacity-60 ${
                  active ? "text-emerald-600" : "text-[color:var(--ink-tertiary)]"
                }`}
              />
              <span
                className={`text-[0.625rem] leading-none tracking-[0.01em] transition-colors duration-[var(--response-fast)] ${
                  active ? "font-semibold text-emerald-600" : "font-medium text-[color:var(--ink-tertiary)]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
