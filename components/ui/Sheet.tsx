import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { spring, project, rubberband, VelocityTracker, prefersReducedMotion, type SpringHandle } from "@/lib/motion";

interface SheetProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

// Drawer feel from the skill's table: a little bounce, because the motion is
// momentum-driven — you threw it.
const DAMPING = 0.82;
const RESPONSE = 0.3;
// Past this projected point the sheet is going away, however far it actually is.
const DISMISS_RATIO = 0.4;

export default function Sheet({ open, title, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const springRef = useRef<SpringHandle | null>(null);
  const tracker = useRef(new VelocityTracker());
  const drag = useRef({ active: false, startY: 0, grabOffset: 0, height: 0 });
  const [mounted, setMounted] = useState(open);

  // y is the panel's offset from its resting position: 0 = fully open.
  const applyY = useCallback((y: number) => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel) return;
    panel.style.transform = `translate3d(0, ${y}px, 0)`;
    if (scrim) {
      const h = drag.current.height || panel.offsetHeight || 1;
      // The scrim tracks the drag continuously — feedback during the gesture,
      // not only at the end of it.
      scrim.style.opacity = String(Math.max(0, 1 - y / h));
    }
  }, []);

  const settleTo = useCallback(
    (to: number, velocity: number, after?: () => void) => {
      springRef.current?.stop();
      const panel = panelRef.current;
      const from = panel ? currentY(panel) : to;
      if (prefersReducedMotion()) {
        applyY(to);
        after?.();
        return;
      }
      springRef.current = spring({
        from,
        to,
        velocity,
        damping: DAMPING,
        response: RESPONSE,
        onUpdate: applyY,
        onRest: after,
      });
    },
    [applyY]
  );

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const h = panelRef.current?.offsetHeight ?? 400;
    settleTo(h, 0, () => setMounted(false));
  }, [open, mounted, settleTo]);

  // Enter: spring up from below, starting the scrim at zero.
  useEffect(() => {
    if (!mounted || !open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const h = panel.offsetHeight;
    drag.current.height = h;
    applyY(h);
    const id = requestAnimationFrame(() => settleTo(0, 0));
    return () => cancelAnimationFrame(id);
    // Only on mount of an opening sheet.
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  const onPointerDown = (e: React.PointerEvent) => {
    const panel = panelRef.current;
    if (!panel) return;
    // Grabbing mid-flight takes over from the animation: read where the panel
    // actually is on screen and keep going from there, no jump.
    springRef.current?.stop();
    const y = currentY(panel);
    drag.current = {
      active: true,
      startY: e.clientY,
      grabOffset: y,
      height: panel.offsetHeight,
    };
    tracker.current.reset();
    tracker.current.add(e.clientY, e.timeStamp);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    tracker.current.add(e.clientY, e.timeStamp);
    const delta = e.clientY - drag.current.startY;
    let y = drag.current.grabOffset + delta;
    // Above the resting position there is nothing more to reveal, so resist
    // instead of stopping dead.
    if (y < 0) y = -rubberband(-y, drag.current.height);
    applyY(y);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const velocity = tracker.current.get(e.timeStamp);
    const panel = panelRef.current;
    if (!panel) return;
    const y = currentY(panel);
    const h = drag.current.height || panel.offsetHeight;
    // Decide against where the flick is *going*, not where the finger stopped.
    const projected = y + project(velocity);
    if (projected > h * DISMISS_RATIO) {
      settleTo(h, velocity, onClose);
    } else {
      settleTo(0, velocity);
    }
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      {/* Dimming scrim: this is a modal task, so the background gets pushed
          back rather than staying live. */}
      <div
        ref={scrimRef}
        onClick={onClose}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        style={{ opacity: 0 }}
      />

      <div
        ref={panelRef}
        className="glass-elevated relative mx-auto w-full max-w-lg rounded-t-[1.75rem] pb-8 will-change-transform"
        style={{ transform: "translate3d(0, 100%, 0)", maxHeight: "90vh" }}
      >
        {/* The whole header is the drag handle — a 44px-tall grab area, not a
            decorative 4px bar. */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="cursor-grab touch-none select-none px-5 pb-2 pt-3 active:cursor-grabbing"
        >
          <div className="mx-auto h-1 w-9 rounded-full bg-[rgba(60,60,67,0.22)]" />
          {title && <h2 className="text-title-md mt-3">{title}</h2>}
        </div>

        <div className="max-h-[calc(90vh-5rem)] overflow-y-auto overscroll-contain px-5 pt-1">{children}</div>
      </div>
    </div>
  );
}

function currentY(el: HTMLElement): number {
  const t = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return t.m42 || 0;
}
