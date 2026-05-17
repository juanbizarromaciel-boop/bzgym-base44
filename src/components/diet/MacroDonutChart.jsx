import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'linear-gradient(135deg, rgba(4,4,14,0.95), rgba(4,4,14,0.85))',
        border: `1.5px solid ${d.payload.color}60`,
        borderRadius: 10,
        padding: '12px 16px',
        boxShadow: `0 0 20px ${d.payload.color}40, inset 0 0 12px ${d.payload.color}15`
      }}>
      <p style={{ color: d.payload.color, fontSize: 11, fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', letterSpacing: '0.05em' }}>
        {d.name}
      </p>
      <p style={{ color: d.payload.color, fontSize: 16, fontFamily: "'Orbitron', sans-serif", fontWeight: 'bold', marginTop: 4, textShadow: `0 0 10px ${d.payload.color}` }}>
        {d.value} kcal
      </p>
      <p style={{ color: 'rgba(168,85,247,0.7)', fontSize: 10, fontFamily: "'Share Tech Mono', monospace", marginTop: 3 }}>
        {d.payload.grams}g · {d.payload.pct}%
      </p>
    </motion.div>
  );
};

export default function MacroDonutChart({ protein = 0, carbs = 0, fat = 0, targetCalories = 0 }) {
  const proteinKcal = Math.round(protein * 4);
  const carbsKcal = Math.round(carbs * 4);
  const fatKcal = Math.round(fat * 9);
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  const data = [
    { name: "Proteína", value: proteinKcal, color: "#ec4899", grams: protein, pct: totalMacroKcal ? Math.round(proteinKcal / totalMacroKcal * 100) : 0 },
    { name: "Carboidrato", value: carbsKcal, color: "#fbbf24", grams: carbs, pct: totalMacroKcal ? Math.round(carbsKcal / totalMacroKcal * 100) : 0 },
    { name: "Gordura", value: fatKcal, color: "#06b6d4", grams: fat, pct: totalMacroKcal ? Math.round(fatKcal / totalMacroKcal * 100) : 0 },
  ].filter(d => d.value > 0);

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border overflow-hidden p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(6,182,212,0.04))',
        borderColor: 'rgba(168,85,247,0.35)',
        boxShadow: '0 0 50px rgba(168,85,247,0.15), inset 0 0 30px rgba(168,85,247,0.08), inset 0 1px 0 rgba(168,85,247,0.2)'
      }}>
      {/* Top scanline */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }} />
      
      {/* Section label */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.6), transparent)' }} />
        <p className="text-[10px] font-mono-cyber text-purple-400 tracking-[0.35em] uppercase" style={{ textShadow: '0 0 8px rgba(168,85,247,0.6)' }}>
          ▸ Macronutrientes
        </p>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4))' }} />
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Pizza Chart */}
        <motion.div
          className="relative flex-shrink-0"
          style={{ width: 200, height: 200 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    stroke="rgba(4,4,14,0.95)"
                    strokeWidth={2}
                    style={{
                      filter: `drop-shadow(0 0 8px ${entry.color}90) drop-shadow(0 0 16px ${entry.color}60)`,
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center circle with calories */}
          {targetCalories > 0 && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}>
              <p className="font-cyber text-4xl font-black leading-none" style={{
                color: '#fbbf24',
                textShadow: '0 0 20px rgba(251,191,36,0.8), 0 0 40px rgba(251,191,36,0.4)'
              }}>
                {targetCalories}
              </p>
              <p className="text-[9px] font-mono-cyber text-yellow-400/60 mt-1 tracking-wider">KCAL/DIA</p>
            </motion.div>
          )}
        </motion.div>

        {/* Macro Details */}
        <div className="flex-1 space-y-4 w-full">
          {data.map((m, idx) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="space-y-2 p-4 rounded-xl border relative overflow-hidden group"
              style={{
                borderColor: `${m.color}35`,
                background: `linear-gradient(135deg, ${m.color}12, ${m.color}05)`,
                boxShadow: `0 0 25px ${m.color}15, inset 0 0 15px ${m.color}08`
              }}>
              {/* Hover glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(ellipse at 50% 50%, ${m.color}15, transparent 70%)` }} />

              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: m.color,
                      boxShadow: `0 0 10px ${m.color}, 0 0 20px ${m.color}60`
                    }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm font-cyber font-bold" style={{ color: m.color }}>
                    {m.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono-cyber">
                  <span className="text-sm font-bold" style={{ color: m.color, textShadow: `0 0 8px ${m.color}` }}>
                    {m.grams}g
                  </span>
                  <span className="text-xs" style={{ color: `${m.color}70` }}>
                    {m.pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-purple-500/10 relative z-10">
                <motion.div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${m.pct}%`,
                    backgroundColor: m.color,
                    boxShadow: `0 0 12px ${m.color}, inset 0 0 6px ${m.color}80`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.pct}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                />
              </div>

              {/* Kcal info */}
              <div className="text-right text-[10px] font-mono-cyber relative z-10" style={{ color: `${m.color}70` }}>
                {m.value} kcal
              </div>
            </motion.div>
          ))}

          {totalMacroKcal > 0 && targetCalories > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 pt-4 border-t border-purple-500/20 flex justify-between items-center"
            >
              <span className="text-[10px] font-mono-cyber text-purple-400/60 tracking-wider">TOTAL CALCULADO</span>
              <span className={`text-sm font-cyber ${Math.abs(totalMacroKcal - targetCalories) < 100 ? 'text-emerald-400' : 'text-amber-400'}`}
                style={{ textShadow: `0 0 10px ${Math.abs(totalMacroKcal - targetCalories) < 100 ? 'rgba(52,211,153,0.6)' : 'rgba(251,191,36,0.6)'}` }}>
                {totalMacroKcal} kcal
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}