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

  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
      <Timer size={16} className={seconds === 0 ? "text-emerald-400" : "text-white/30"} />
      <div className="flex-1">
        <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="font-mono text-[17px] font-medium tracking-tight text-white/80">
        {min}:{sec.toString().padStart(2, "0")}
      </span>
      <button onClick={() => { setSeconds(defaultSeconds); setRunning(true); }} className="rounded-xl p-1.5 text-white/20 transition-colors hover:text-white/50">
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
