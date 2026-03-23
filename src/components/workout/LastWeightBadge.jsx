import React from "react";
import { History } from "lucide-react";

export default function LastWeightBadge({ exerciseName, logs = [] }) {
  const lastLog = [...logs]
    .filter(l => l.exercise_name === exerciseName && l.max_load_kg > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (!lastLog) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-cyber"
      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
      <History className="w-3 h-3" />
      último: {lastLog.max_load_kg}kg
    </span>
  );
}