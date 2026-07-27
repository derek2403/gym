import { ReactNode, useEffect, useRef } from "react";

interface NavBarProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
}

const HANDOFF = 52;

/**
 * A large title that hands off to a floating glass title capsule as content
 * scrolls under it.
 *
 * The bar is not a strip across the top with a hairline under it — that reads
 * as a wall between chrome and content. Instead the controls are individual
 * glass capsules floating over the content, and the title condenses into its
 * own capsule between them. Nothing is clipped by a bar edge, because there is
 * no bar edge: the content simply passes beneath the glass.
 */
export default function NavBar({ title, subtitle, trailing, leading }: NavBarProps) {
  const inlineRef = useRef<HTMLDivElement>(null);
  const largeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const t = Math.max(0, Math.min(1, window.scrollY / HANDOFF));
      if (inlineRef.current) {
        inlineRef.current.style.opacity = String(t);
        // Scales up into place as it arrives, the way a glass element forms
        // rather than fades.
        inlineRef.current.style.transform = `translate3d(0, ${(1 - t) * 6}px, 0) scale(${0.92 + t * 0.08})`;
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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4" style={{ paddingTop: "calc(0.625rem + env(safe-area-inset-top))" }}>
        <div className="relative mx-auto flex h-11 max-w-lg items-center justify-between gap-2">
          <div className="pointer-events-auto flex min-w-0 shrink-0 items-center">{leading}</div>

          <div
            ref={inlineRef}
            className="chrome absolute left-1/2 max-w-[55%] -translate-x-1/2 rounded-full px-4 py-1.5"
            style={{ opacity: 0 }}
          >
            <span className="relative z-[2] block truncate text-[0.9375rem] font-semibold tracking-[-0.015em] text-[color:var(--ink)]">
              {title}
            </span>
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">{trailing}</div>
        </div>
      </div>

      <div ref={largeRef} className="pt-[calc(4.25rem+env(safe-area-inset-top))]">
        <h1 className="text-display">{title}</h1>
        {subtitle && <p className="text-caption mt-1.5 pr-4">{subtitle}</p>}
      </div>
    </>
  );
}

/**
 * A nav-bar action: a glass capsule, not bare text on the background. Controls
 * live in the floating layer, and the glass is what tells you it is a control.
 */
export function NavAction({
  children,
  onClick,
  label,
  prominent,
}: {
  children: ReactNode;
  onClick: () => void;
  label?: string;
  prominent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`pressable chrome relative flex items-center justify-center gap-1 rounded-full text-[0.9375rem] font-medium text-emerald-700 ${
        prominent ? "h-9 w-9" : "h-9 px-3.5"
      }`}
    >
      <span className="relative z-[2] flex items-center gap-1">{children}</span>
    </button>
  );
}
