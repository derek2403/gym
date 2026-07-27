/**
 * Fluid-interface physics.
 *
 * Springs instead of fixed-duration curves, because a spring can be re-targeted
 * mid-flight without a jump: it always continues from its current position and
 * velocity. That property is what makes a gesture interruptible.
 *
 * Parameters follow Apple's two designer-facing values rather than the physics
 * triplet:
 *   damping  — 1.0 is critically damped (no overshoot). Below 1.0 bounces.
 *   response — roughly how long the value takes to reach the target, seconds.
 *              Not a duration; a spring has no fixed end time.
 */

export interface SpringOptions {
  from: number;
  to: number;
  /** Release velocity of the gesture, px/s. Handed straight to the spring so
   *  there is no visible seam between dragging and animating. */
  velocity?: number;
  damping?: number;
  response?: number;
  onUpdate: (value: number) => void;
  onRest?: () => void;
}

export interface SpringHandle {
  stop: () => void;
  /** Re-aim at a new target without losing the current position or velocity. */
  retarget: (to: number, velocity?: number) => void;
  value: () => number;
  velocity: () => number;
  isRunning: () => boolean;
}

const REST_DISPLACEMENT = 0.1;
const REST_VELOCITY = 0.5;
const MAX_FRAME = 1 / 30;

export function spring({
  from,
  to,
  velocity = 0,
  damping = 1,
  response = 0.35,
  onUpdate,
  onRest,
}: SpringOptions): SpringHandle {
  let x = from;
  let v = velocity;
  let target = to;
  let raf = 0;
  let last = 0;
  let running = true;

  const omega = (2 * Math.PI) / response;

  const step = (now: number) => {
    if (!running) return;
    if (!last) last = now;
    // Clamp dt so a backgrounded tab doesn't integrate one enormous step.
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;

    // Semi-implicit Euler: stable at the frame rates we care about.
    const accel = -omega * omega * (x - target) - 2 * damping * omega * v;
    v += accel * dt;
    x += v * dt;

    if (Math.abs(x - target) < REST_DISPLACEMENT && Math.abs(v) < REST_VELOCITY) {
      x = target;
      v = 0;
      running = false;
      onUpdate(x);
      onRest?.();
      return;
    }

    onUpdate(x);
    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    retarget(next, nextVelocity) {
      target = next;
      if (nextVelocity !== undefined) v = nextVelocity;
      if (!running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(step);
      }
    },
    value: () => x,
    velocity: () => v,
    isRunning: () => running,
  };
}

/**
 * Where a flick would come to rest, using the same exponential decay as scroll
 * deceleration. Snap decisions are made against this projected point, not the
 * position at the moment the finger lifted — that is what makes a flick feel
 * like it throws the element rather than nudging it.
 */
export function project(initialVelocity: number, decelerationRate = 0.998): number {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary. A hard stop reads as frozen; this
 * reads as "still responding, but there's nothing more here".
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (dimension === 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Tracks recent pointer samples so release velocity reflects the last few
 *  milliseconds of the gesture, not the whole drag. */
export class VelocityTracker {
  private samples: { value: number; time: number }[] = [];
  private window = 100; // ms
  /** Browsers coalesce pointer events, so two samples can land sub-millisecond
   *  apart. Dividing by that dt yields a nonsense velocity that would throw the
   *  spring off screen, so measure across at least one frame. */
  private minDt = 12; // ms
  private maxVelocity = 6000; // px/s — faster than any real flick

  add(value: number, time: number) {
    this.samples.push({ value, time });
    while (this.samples.length > 2 && time - this.samples[0].time > this.window) {
      this.samples.shift();
    }
  }

  /**
   * px/s measured over the retained window, clamped to a plausible range.
   *
   * Pass the release timestamp: if the finger was resting before it lifted, the
   * gesture carried no momentum and the last recorded movement is stale. Using
   * it would fling something the user had deliberately stopped.
   */
  get(now?: number): number {
    if (this.samples.length < 2) return 0;
    const last = this.samples[this.samples.length - 1];
    if (now !== undefined && now - last.time > this.window) return 0;
    // Walk back to the newest sample that is at least minDt older.
    let reference = this.samples[0];
    for (let i = this.samples.length - 2; i >= 0; i--) {
      reference = this.samples[i];
      if (last.time - reference.time >= this.minDt) break;
    }
    const dt = last.time - reference.time;
    if (dt < this.minDt) return 0;
    const v = ((last.value - reference.value) / dt) * 1000;
    if (!Number.isFinite(v)) return 0;
    return Math.max(-this.maxVelocity, Math.min(this.maxVelocity, v));
  }

  reset() {
    this.samples = [];
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
