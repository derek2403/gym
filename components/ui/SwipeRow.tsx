import { ReactNode, useCallback, useRef } from "react";
import { Trash2 } from "lucide-react";
import { spring, project, rubberband, VelocityTracker, prefersReducedMotion, type SpringHandle } from "@/lib/motion";

interface SwipeRowProps {
  children: ReactNode;
  onDelete: () => void;
  /** Accessible name for the fallback delete button. */
  label?: string;
}

const ACTION_WIDTH = 84;
// Committing to an axis only after ~10px means a vertical scroll that starts
// with a few pixels of horizontal wobble still scrolls.
const AXIS_THRESHOLD = 10;
const DAMPING = 0.85;
const RESPONSE = 0.3;

export default function SwipeRow({ children, onDelete, label = "item" }: SwipeRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const springRef = useRef<SpringHandle | null>(null);
  const tracker = useRef(new VelocityTracker());
  const drag = useRef({
    active: false,
    axis: null as null | "x" | "y",
    startX: 0,
    startY: 0,
    grabOffset: 0,
    width: 0,
  });

  const applyX = useCallback((x: number) => {
    const row = rowRef.current;
    if (row) row.style.transform = `translate3d(${x}px, 0, 0)`;
  }, []);

  const settleTo = useCallback(
    (to: number, velocity: number, after?: () => void) => {
      springRef.current?.stop();
      const row = rowRef.current;
      const from = row ? currentX(row) : to;
      if (prefersReducedMotion()) {
        applyX(to);
        after?.();
        return;
      }
      springRef.current = spring({
        from,
        to,
        velocity,
        damping: DAMPING,
        response: RESPONSE,
        onUpdate: applyX,
        onRest: after,
      });
    },
    [applyX]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    const row = rowRef.current;
    if (!row) return;
    // Take over from any animation in flight, from its live position.
    springRef.current?.stop();
    drag.current = {
      active: true,
      axis: null,
      startX: e.clientX,
      startY: e.clientY,
      grabOffset: currentX(row),
      width: row.offsetWidth,
    };
    tracker.current.reset();
    tracker.current.add(e.clientX, e.timeStamp);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    // Both gestures are live until intent is clear, then the loser is dropped.
    if (d.axis === null) {
      if (Math.abs(dx) < AXIS_THRESHOLD && Math.abs(dy) < AXIS_THRESHOLD) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.axis === "y") {
        d.active = false; // hand the gesture back to the scroller
        return;
      }
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }

    tracker.current.add(e.clientX, e.timeStamp);
    let x = d.grabOffset + dx;
    // Right of home and left of the action there is nothing to show: resist.
    if (x > 0) x = rubberband(x, d.width);
    if (x < -ACTION_WIDTH) x = -ACTION_WIDTH - rubberband(-(x + ACTION_WIDTH), d.width);
    applyX(x);
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || d.axis !== "x") {
      d.active = false;
      return;
    }
    d.active = false;
    const row = rowRef.current;
    if (!row) return;
    const velocity = tracker.current.get(e.timeStamp);
    const x = currentX(row);
    const projected = x + project(velocity);

    // A hard fling past the action deletes outright; otherwise snap to whichever
    // resting point the projection lands nearest.
    if (projected < -d.width * 0.5) {
      settleTo(-d.width, velocity, onDelete);
    } else if (projected < -ACTION_WIDTH / 2) {
      settleTo(-ACTION_WIDTH, velocity);
    } else {
      settleTo(0, velocity);
    }
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-surface)]">
      {/* The action sits underneath and is revealed by the row moving off it,
          so the row and the finger stay glued together. */}
      <button
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        className="absolute inset-y-0 right-0 flex w-[84px] items-center justify-center bg-red-500 text-white"
      >
        <Trash2 size={18} />
      </button>

      {/* Opaque backing. The row is translucent glass, and glass sliding over a
          saturated red action would let the red through and wreck the text. */}
      <div
        ref={rowRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative touch-pan-y rounded-[var(--radius-surface)] bg-[#f7f7fa] will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}

function currentX(el: HTMLElement): number {
  const t = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return t.m41 || 0;
}
