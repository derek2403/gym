import { ReactNode, useEffect, useRef } from "react";

interface NavBarProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
}

// The large title has fully handed over to the inline title by this scroll
// offset. Matching iOS: the transition happens across the title's own height.
const HANDOFF = 44;

/**
 * A large title that collapses into a translucent bar as content scrolls under
 * it. Two titles exist at once — the big one lives in the content flow and
 * scrolls away; the inline one lives in the fixed bar and fades in as the big
 * one leaves. The bar's material and hairline appear on the same scroll, so
 * chrome only asserts itself once there is content beneath it.
 */
export default function NavBar({ title, subtitle, trailing, leading }: NavBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<HTMLDivElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);
  const largeRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const t = Math.max(0, Math.min(1, y / HANDOFF));

      if (materialRef.current) materialRef.current.style.opacity = String(t);
      if (inlineRef.current) {
        inlineRef.current.style.opacity = String(t);
        // Rises into place rather than appearing — it comes from where the
        // large title went.
        inlineRef.current.style.transform = `translate3d(0, ${(1 - t) * 8}px, 0)`;
      }
      if (largeRef.current) {
        largeRef.current.style.opacity = String(1 - t);
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
      <div ref={barRef} className="fixed inset-x-0 top-0 z-50">
        <div className="relative mx-auto max-w-lg">
          {/* Material and hairline are a separate layer so they can fade in
              without touching the buttons' own opacity. */}
          <div
            ref={materialRef}
            className="chrome absolute inset-0 rounded-none border-x-0 border-t-0 border-b-[0.5px] border-b-[rgba(60,60,67,0.12)]"
            style={{ opacity: 0 }}
            aria-hidden="true"
          />
          <div className="relative flex h-[2.75rem] items-center justify-between gap-2 px-5 pt-[env(safe-area-inset-top)]">
            <div className="flex min-w-0 flex-1 items-center">{leading}</div>
            <div
              ref={inlineRef}
              className="pointer-events-none absolute inset-x-0 flex justify-center px-16"
              style={{ opacity: 0 }}
            >
              <span className="truncate text-[1.0625rem] font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
                {title}
              </span>
            </div>
            <div className="flex shrink-0 items-center justify-end">{trailing}</div>
          </div>
        </div>
      </div>

      {/* The large title itself, in the content flow. */}
      <div className="pt-[calc(2.75rem+env(safe-area-inset-top))]">
        <h1 ref={largeRef} className="text-display pt-4">
          {title}
        </h1>
        {subtitle && <p className="text-caption mt-1.5">{subtitle}</p>}
      </div>
    </>
  );
}
