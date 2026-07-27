import { useState, useEffect, useRef } from "react";
import { Timer, RotateCcw } from "lucide-react";

interface RestTimerProps {
  defaultSeconds?: number;
  autoStart?: boolean;
}

export default function RestTimer({ defaultSeconds = 90, autoStart = false }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds]);

  useEffect(() => {
    if (autoStart) { setSeconds(defaultSeconds); setRunning(true); }
  }, [autoStart, defaultSeconds]);

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const pct = (seconds / defaultSeconds) * 100;
  const done = seconds === 0;

  return (
    <div className="glass flex items-center gap-3 rounded-[var(--radius-field)] px-4 py-3">
      <Timer
        size={16}
        className={`shrink-0 transition-colors duration-[var(--response-base)] ${
          done ? "text-emerald-500" : "text-[color:var(--ink-quaternary)]"
        }`}
      />
      <div className="flex-1">
        <div className="h-[5px] overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]">
          {/* Linear, matching the clock. An eased tick would drift ahead of and
              behind the number beside it every second. */}
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
              done ? "bg-emerald-500" : "bg-emerald-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-metric w-[3.25rem] text-right text-[1.0625rem] font-medium tabular-nums">
        {min}:{sec.toString().padStart(2, "0")}
      </span>
      <button
        onClick={() => { setSeconds(defaultSeconds); setRunning(true); }}
        aria-label="Restart rest timer"
        className="pressable hit-pad shrink-0 rounded-full p-1.5 text-[color:var(--ink-quaternary)] transition-colors hover:text-[color:var(--ink-secondary)]"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
