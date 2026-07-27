import Link from "next/link";
import { useRouter } from "next/router";
import { CalendarDays, Flame, History, Ruler, Dumbbell } from "lucide-react";

// Tabs are named for what they contain, not for vague umbrellas — "Today"
// rather than "Home", "Body" rather than "Track". Specificity is what makes a
// destination predictable before you tap it.
const tabs = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/calories", label: "Calories", icon: Flame },
  { href: "/history", label: "History", icon: History },
  { href: "/track", label: "Body", icon: Ruler },
];

function Tab({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Flame; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="pressable relative flex flex-1 flex-col items-center gap-[3px] rounded-full py-2.5"
    >
      {/* The active pill sits behind the label and cross-fades, so switching
          tabs reads as the selection moving rather than colours blinking. */}
      <span
        className={`absolute inset-x-1 inset-y-0.5 rounded-full bg-emerald-500/[0.1] transition-opacity duration-[var(--response-base)] ease-[var(--ease-settle)] ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      <Icon
        size={20}
        strokeWidth={active ? 2.2 : 1.6}
        className={`relative transition-colors duration-[var(--response-base)] ${
          active ? "text-emerald-600" : "text-[color:var(--ink-quaternary)]"
        }`}
      />
      <span
        className={`relative text-[0.625rem] tracking-[0.01em] transition-colors duration-[var(--response-base)] ${
          active ? "font-semibold text-emerald-600" : "font-medium text-[color:var(--ink-quaternary)]"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export default function BottomNav() {
  const router = useRouter();
  const isWorkoutActive = router.pathname === "/workout";

  return (
    <>
      {/* Scroll edge: content dissolves into the background as it slides under
          the bar, rather than being cut by a line. */}
      <div className="scroll-scrim pointer-events-none fixed inset-x-0 bottom-0 z-40 h-28" aria-hidden="true" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pb-8">
        <div className="chrome relative flex w-full max-w-[360px] items-center rounded-[var(--radius-chrome)] px-1.5 py-1">
          {tabs.slice(0, 2).map((t) => (
            <Tab key={t.href} {...t} active={router.pathname === t.href} />
          ))}

          <div className="flex flex-1 justify-center">
            <Link
              href="/workout"
              aria-label="Workout"
              aria-current={isWorkoutActive ? "page" : undefined}
              className={`pressable -mt-6 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-emerald-500 ${
                isWorkoutActive
                  ? "shadow-[0_2px_8px_rgba(16,185,129,0.3),0_8px_24px_-4px_rgba(16,185,129,0.5)] ring-[3px] ring-emerald-500/20"
                  : "shadow-[0_2px_8px_rgba(16,185,129,0.25),0_6px_20px_-4px_rgba(16,185,129,0.4)]"
              }`}
            >
              <Dumbbell size={22} strokeWidth={2.5} className="text-white" />
            </Link>
          </div>

          {tabs.slice(2).map((t) => (
            <Tab key={t.href} {...t} active={router.pathname === t.href} />
          ))}
        </div>
      </nav>
    </>
  );
}
