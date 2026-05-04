import React from "react";
import { Syringe } from "lucide-react";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const FREQ_DAYS = {
  "1x_semana": [1],           // Monday
  "2x_semana": [1, 4],        // Mon + Thu
  "3x_semana": [1, 3, 5],     // Mon + Wed + Fri
  "dia_sim_dia_nao": [0, 2, 4, 6],
  "diario": [0, 1, 2, 3, 4, 5, 6],
};

const SUBSTANCE_COLORS = [
  "rgba(192,132,252,0.85)",
  "rgba(34,211,238,0.85)",
  "rgba(244,114,182,0.85)",
  "rgba(52,211,153,0.85)",
  "rgba(251,146,60,0.85)",
];

export default function WeeklyApplicationCalendar({ substances }) {
  // Build map: dayIndex → list of substances
  const dayMap = {};
  for (let d = 0; d < 7; d++) dayMap[d] = [];

  substances.forEach((sub, idx) => {
    // Use saved application_days if available, else derive from frequency
    const days = (sub.application_days && sub.application_days.length > 0)
      ? sub.application_days
      : (FREQ_DAYS[sub.application_frequency] || [1]);

    days.forEach((d) => {
      dayMap[d].push({ sub, color: SUBSTANCE_COLORS[idx % SUBSTANCE_COLORS.length] });
    });
  });

  return (
    <div className="bg-black/30 border border-purple-500/15 rounded-xl p-4">
      <p className="text-purple-300 text-xs font-cyber tracking-widest uppercase mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
        Calendário Semanal de Aplicações
      </p>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, idx) => {
          const items = dayMap[idx];
          const hasInjection = items.length > 0;
          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-purple-400/50 uppercase font-bold">{label}</span>
              <div className={`
                w-full min-h-[56px] rounded-lg border flex flex-col items-center justify-center gap-1 py-2 transition-all
                ${hasInjection
                  ? "border-purple-500/40 bg-purple-500/8"
                  : "border-purple-500/8 bg-black/10"
                }
              `}>
                {hasInjection ? (
                  items.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <Syringe
                        className="w-3.5 h-3.5"
                        style={{ color: item.color, filter: `drop-shadow(0 0 4px ${item.color})` }}
                      />
                      <span className="text-[7px] text-center leading-tight px-1"
                        style={{ color: item.color, maxWidth: 36, wordBreak: "break-word" }}>
                        {item.sub.dosage_mg_per_application}mg
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-purple-500/15 text-[10px]">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {substances.map((sub, i) => (
          <div key={sub.id} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: SUBSTANCE_COLORS[i % SUBSTANCE_COLORS.length] }} />
            <span className="text-[9px] text-purple-300/60">{sub.substance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}