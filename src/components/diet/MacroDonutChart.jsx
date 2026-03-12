import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: '#04040e', border: `1px solid ${d.payload.color}40`, borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: d.payload.color, fontSize: 12, fontFamily: 'monospace' }}>{d.name}</p>
      <p style={{ color: d.payload.color, fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold' }}>{d.value} kcal</p>
      <p style={{ color: 'rgba(168,85,247,0.5)', fontSize: 11, fontFamily: 'monospace' }}>{d.payload.grams}g · {d.payload.pct}%</p>
    </div>
  );
};

export default function MacroDonutChart({ protein = 0, carbs = 0, fat = 0, targetCalories = 0 }) {
  const proteinKcal = Math.round(protein * 4);
  const carbsKcal = Math.round(carbs * 4);
  const fatKcal = Math.round(fat * 9);
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  const data = [
    { name: "Proteína", value: proteinKcal, color: "#ec4899", grams: protein, pct: totalMacroKcal ? Math.round(proteinKcal / totalMacroKcal * 100) : 0 },
    { name: "Carboidrato", value: carbsKcal, color: "#eab308", grams: carbs, pct: totalMacroKcal ? Math.round(carbsKcal / totalMacroKcal * 100) : 0 },
    { name: "Gordura", value: fatKcal, color: "#06b6d4", grams: fat, pct: totalMacroKcal ? Math.round(fatKcal / totalMacroKcal * 100) : 0 },
  ].filter(d => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="cyber-card rounded-xl border border-purple-900/20 p-5">
      <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-4">Distribuição de Macros</p>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" style={{ filter: `drop-shadow(0 0 5px ${entry.color}80)` }} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {targetCalories > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="font-cyber text-xl text-orange-400 leading-none" style={{ textShadow: '0 0 10px rgba(251,146,60,0.5)' }}>{targetCalories}</p>
              <p className="text-[9px] font-mono-cyber text-orange-400/40">kcal</p>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 w-full">
          {data.map(m => (
            <div key={m.name}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color, boxShadow: `0 0 5px ${m.color}` }} />
                  <span className="text-xs text-white/70">{m.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-cyber font-bold" style={{ color: m.color }}>{m.grams}g</span>
                  <span className="text-[10px] text-purple-500/40 font-mono-cyber">{m.pct}%</span>
                  <span className="text-[10px] text-purple-500/30 font-mono-cyber">{m.value}kcal</span>
                </div>
              </div>
              <div className="h-1.5 bg-purple-900/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.pct}%`, backgroundColor: m.color, boxShadow: `0 0 6px ${m.color}80` }} />
              </div>
            </div>
          ))}
          {totalMacroKcal > 0 && targetCalories > 0 && (
            <div className="pt-2 border-t border-purple-900/20 flex justify-between">
              <span className="text-[10px] font-mono-cyber text-purple-500/40">Total calculado</span>
              <span className={`text-xs font-cyber ${Math.abs(totalMacroKcal - targetCalories) < 100 ? 'text-cyan-400' : 'text-yellow-400'}`}>{totalMacroKcal} kcal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}