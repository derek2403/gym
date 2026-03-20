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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, seconds]);

  useEffect(() => {
    if (autoStart) {
      setSeconds(defaultSeconds);
      setRunning(true);
    }
  }, [autoStart, defaultSeconds]);

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const pct = (seconds / defaultSeconds) * 100;

  const reset = () => {
    setSeconds(defaultSeconds);
    setRunning(true);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-3 py-2">
      <Timer size={16} className={seconds === 0 ? "text-emerald-500" : "text-zinc-500"} />
      <div className="flex-1">
        <div className="h-1 overflow-hidden rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="font-mono text-sm text-zinc-300">
        {min}:{sec.toString().padStart(2, "0")}
      </span>
      <button onClick={reset} className="text-zinc-500 hover:text-zinc-300">
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
