import React, { useState } from "react";
import { History, ChevronsUp, Pencil, Check } from "lucide-react";

export default function LastWeightBadge({ exerciseName, logs = [], onApply, disabled }) {
  const [editing, setEditing] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const lastLog = [...logs]
    .filter(l => l.exercise_name === exerciseName && l.max_load_kg > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (!lastLog && !onApply) return null;
  if (!lastLog) return null;

  const handleApply = (val) => {
    if (onApply) onApply(parseFloat(val) || lastLog.max_load_kg);
    setEditing(false);
    setCustomValue("");
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Badge showing last weight */}
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-cyber"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}
      >
        <History className="w-3 h-3 flex-shrink-0" />
        último: {lastLog.max_load_kg}kg
      </span>

      {/* Apply button */}
      {onApply && !disabled && !editing && (
        <button
          onClick={() => handleApply(lastLog.max_load_kg)}
          title="Preencher todas as séries com este peso"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-cyber transition-all hover:opacity-90"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24' }}
        >
          <ChevronsUp className="w-3 h-3" />
          Usar
        </button>
      )}

      {/* Edit / correct button */}
      {onApply && !disabled && !editing && (
        <button
          onClick={() => { setEditing(true); setCustomValue(String(lastLog.max_load_kg)); }}
          title="Corrigir peso"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-cyber transition-all hover:opacity-90"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: '#c084fc' }}
        >
          <Pencil className="w-3 h-3" />
          Corrigir
        </button>
      )}

      {/* Inline edit input */}
      {editing && (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleApply(customValue); if (e.key === "Escape") setEditing(false); }}
            className="w-16 px-2 py-0.5 rounded-md text-[11px] font-mono-cyber text-center"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(168,85,247,0.5)', color: '#f3e8ff', outline: 'none' }}
            placeholder="kg"
          />
          <button
            onClick={() => handleApply(customValue)}
            className="inline-flex items-center justify-center w-6 h-6 rounded-md"
            style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc' }}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-[10px] font-mono-cyber text-purple-500/40 hover:text-purple-400 px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}