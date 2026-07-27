import { ReactNode, useEffect, useRef } from "react";

interface NavBarProps {
  title: string;
  subtitle?: string;
  /** Circular actions, trailing edge. Keep to two — this is not a toolbar. */
  actions?: ReactNode;
  leading?: ReactNode;
}

const HANDOFF = 52;

/**
 * Large title with a floating title capsule that takes over on scroll.
 *
 * Trailing actions are circles, not labelled pills. A word set in a wide
 * capsule competes with the title for the eye and pins the layout to the
 * length of that word; a 44pt circle reads as a control at a glance, stays the
 * same size in every language, and leaves the title the widest thing on screen.
 */
export default function NavBar({ title, subtitle, actions, leading }: NavBarProps) {
  const inlineRef = useRef<HTMLDivElement>(null);
  const largeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const t = Math.max(0, Math.min(1, window.scrollY / HANDOFF));
      if (inlineRef.current) {
        inlineRef.current.style.opacity = String(t);
        inlineRef.current.style.transform = `translate3d(-50%, ${(1 - t) * 6}px, 0) scale(${0.94 + t * 0.06})`;
        inlineRef.current.style.pointerEvents = t > 0.5 ? "auto" : "none";
      }
      if (largeRef.current) {
        largeRef.current.style.opacity = String(Math.max(0, 1 - t * 1.4));
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-50 pl-4 pr-6"
        style={{ paddingTop: "calc(1.125rem + env(safe-area-inset-top))" }}
      >
        <div className="relative mx-auto flex h-11 max-w-lg items-center justify-between gap-2">
          <div className="pointer-events-auto flex min-w-0 shrink-0 items-center">{leading}</div>

          <div
            ref={inlineRef}
            className="chrome absolute left-1/2 max-w-[60%] rounded-full px-4 py-1.5"
            style={{ opacity: 0, transform: "translate3d(-50%, 6px, 0) scale(0.94)" }}
          >
            <span className="relative z-[2] block truncate text-[0.9375rem] font-semibold tracking-[-0.015em] text-[color:var(--ink)]">
              {title}
            </span>
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">{actions}</div>
        </div>
      </div>

      <div ref={largeRef} className="pt-[calc(4.75rem+env(safe-area-inset-top))]">
        <h1 className="text-display">{title}</h1>
        {subtitle && <p className="text-caption mt-1.5 pr-6">{subtitle}</p>}
      </div>
    </>
  );
}

/** A circular glass control, 44pt. The standard trailing nav action. */
export function NavCircle({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="pressable chrome relative flex h-11 w-11 items-center justify-center rounded-full text-emerald-700"
    >
      <span className="relative z-[2] flex items-center justify-center">{children}</span>
    </button>
  );
}

/**
 * The account circle. Initials rather than a generic silhouette: it is the
 * user's own corner of the app, and it is the only route to signing out.
 */
export function NavAvatar({ name, onClick }: { name: string; onClick: () => void }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <button
      onClick={onClick}
      aria-label="Account"
      className="pressable relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[1rem] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),0_5px_14px_-4px_rgba(16,185,129,0.5)] ring-[0.5px] ring-black/5"
    >
      {initials}
    </button>
  );
}
