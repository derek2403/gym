import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { CalendarDays, Flame, TrendingUp, Dumbbell } from "lucide-react";

/**
 * A floating glass tab bar.
 *
 * It does not span the screen edge to edge, and it is not a background: it is a
 * capsule of glass sitting above the content, which runs continuously beneath
 * it. Scrolling down concentrates it — labels fade, the capsule contracts —
 * so the content gets the room while you are reading; scrolling back up
 * restores it. The bar is chrome, and chrome should recede when it isn't the
 * thing you're using.
 */
const tabs = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/calories", label: "Calories", icon: Flame },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

export default function BottomNav() {
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    let condensed = false;

    const setCondensed = (next: boolean) => {
      if (next === condensed) return;
      condensed = next;
      const bar = barRef.current;
      if (!bar) return;
      bar.style.transform = next ? "translate3d(0, 0, 0) scale(0.92)" : "translate3d(0, 0, 0) scale(1)";
      bar.dataset.condensed = String(next);
    };

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const dy = y - lastY;
      // Ignore rubber-band overscroll at either end, which otherwise flickers
      // the bar as the page settles.
      if (y > 12 && y < max - 12 && Math.abs(dy) > 4) {
        setCondensed(dy > 0);
      }
      if (y <= 12) setCondensed(false);
      lastY = y;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div
        ref={barRef}
        data-condensed="false"
        className="chrome group/bar pointer-events-auto flex w-full max-w-[26rem] origin-bottom items-center rounded-[var(--radius-chrome)] px-1.5 py-1.5 transition-transform duration-[var(--response-base)] ease-[var(--ease-settle)]"
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className="pressable relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded-[1.375rem] py-2 outline-none"
            >
              {/* The selection is itself a small pane of tinted glass, lit from
                  the same direction as the bar it sits in. */}
              {active && (
                <span
                  className="glass glass-accent absolute inset-0 rounded-[1.375rem]"
                  aria-hidden="true"
                  style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.3 : 1.8}
                className={`relative z-[2] transition-colors duration-[var(--response-fast)] ${
                  active ? "text-emerald-700" : "text-[color:var(--ink-tertiary)]"
                }`}
              />
              <span
                ref={labelsRef}
                className={`relative z-[2] overflow-hidden text-[0.5625rem] leading-none tracking-[0.01em] transition-all duration-[var(--response-base)] ease-[var(--ease-settle)] group-data-[condensed=true]/bar:h-0 group-data-[condensed=true]/bar:opacity-0 ${
                  active ? "font-semibold text-emerald-700" : "font-medium text-[color:var(--ink-tertiary)]"
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
