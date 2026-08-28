import React, { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

const elapsedSeconds = (startedAt) => startedAt ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)) : 0;

export default function WorkoutElapsedTimer({ startedAt }) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(startedAt));

  useEffect(() => {
    setSeconds(elapsedSeconds(startedAt));
    if (!startedAt) return;
    const interval = setInterval(() => setSeconds(elapsedSeconds(startedAt)), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const value = [hours, minutes, secs].map(number => String(number).padStart(2, "0")).join(":");

  return <div className="app-glass-icon flex items-center gap-2 rounded-xl px-3 py-2 text-cyan-200">
    <Clock3 className="h-4 w-4" />
    <div><p className="font-mono text-sm font-semibold tabular-nums">{value}</p><p className="text-[9px] uppercase tracking-wider text-app-muted">Tempo de treino</p></div>
  </div>;
}