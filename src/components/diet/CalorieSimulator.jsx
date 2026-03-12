import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Calculator, Info } from "lucide-react";
import { Input } from "@/components/ui/input";

const KG_PER_KCAL = 7700;

export default function CalorieSimulator({ defaultCalories = 0 }) {
  const [targetCal, setTargetCal] = useState(defaultCalories || "");
  const [tdee, setTdee] = useState("");

  const targetNum = parseFloat(targetCal) || 0;
  const tdeeNum = parseFloat(tdee) || 0;
  const canCalc = targetNum > 0 && tdeeNum > 0;

  const diff = targetNum - tdeeNum;
  const isSurplus = diff > 0;
  const isBalance = Math.abs(diff) < 50;
  const absDiff = Math.abs(diff);

  const dailyKg = diff / KG_PER_KCAL;
  const weeklyKg = dailyKg * 7;
  const monthlyKg = dailyKg * 30;

  const color = isBalance ? "#a855f7" : isSurplus ? "#06b6d4" : "#ec4899";
  const label = isBalance ? "EQUILÍBRIO" : isSurplus ? "SUPERÁVIT" : "DÉFICIT";
  const Icon = isBalance ? Minus : isSurplus ? TrendingUp : TrendingDown;

  // 12-week projection
  const chartData = canCalc && !isBalance
    ? Array.from({ length: 12 }, (_, i) => ({
        week: `S${i + 1}`,
        kg: parseFloat((weeklyKg * (i + 1)).toFixed(2)),
      }))
    : [];

  const weeksFor1kg = absDiff > 0 ? Math.abs(KG_PER_KCAL / (diff * 7)).toFixed(1) : null;

  const fmt = (n) => (n > 0 ? "+" : "") + n.toFixed(2);

  return (
    <div className="space-y-4">
      {/* TDEE Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-purple-900/20 bg-purple-500/5">
        <Info className="w-3.5 h-3.5 text-purple-400/50 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-purple-400/50 font-mono-cyber leading-relaxed">
          TDEE = Total Daily Energy Expenditure — calorias que você gasta por dia (inclui exercícios).
          Use calculadoras online com base em peso, altura, idade e atividade física.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-purple-400/60 text-[10px] tracking-wider font-mono-cyber uppercase block mb-1">Meta Calórica (kcal/dia)</label>
          <Input type="number" value={targetCal} onChange={e => setTargetCal(e.target.value)} placeholder="ex: 2500" className="cyber-input" />
        </div>
        <div>
          <label className="text-purple-400/60 text-[10px] tracking-wider font-mono-cyber uppercase block mb-1">Seu Gasto / TDEE (kcal/dia)</label>
          <Input type="number" value={tdee} onChange={e => setTdee(e.target.value)} placeholder="ex: 2000" className="cyber-input" />
        </div>
      </div>

      {/* Result */}
      {canCalc && (
        <>
          <div className="rounded-xl p-5 border" style={{ borderColor: `${color}40`, background: `${color}07` }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="font-mono-cyber text-xs tracking-[0.25em]" style={{ color }}>{label} CALÓRICO</span>
                </div>
                <p className="font-cyber text-4xl leading-none" style={{ color, textShadow: `0 0 20px ${color}60` }}>
                  {diff > 0 ? "+" : ""}{diff}
                </p>
                <p className="text-xs font-mono-cyber mt-1" style={{ color: `${color}80` }}>kcal por dia</p>
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="font-cyber text-xl" style={{ color }}>{fmt(weeklyKg)} kg</p>
                  <p className="text-[10px] font-mono-cyber text-purple-500/40">por semana</p>
                </div>
                <div>
                  <p className="font-cyber text-xl" style={{ color }}>{fmt(monthlyKg)} kg</p>
                  <p className="text-[10px] font-mono-cyber text-purple-500/40">por mês</p>
                </div>
              </div>
            </div>

            {!isBalance && weeksFor1kg && (
              <div className="mt-4 pt-3 border-t flex flex-wrap gap-4" style={{ borderColor: `${color}25` }}>
                {[
                  { kg: 1, weeks: weeksFor1kg },
                  { kg: 5, weeks: (parseFloat(weeksFor1kg) * 5).toFixed(1) },
                  { kg: 10, weeks: (parseFloat(weeksFor1kg) * 10).toFixed(1) },
                ].map(p => (
                  <div key={p.kg} className="text-center">
                    <p className="font-cyber text-sm" style={{ color }}>{isSurplus ? "+" : "-"}{p.kg}kg</p>
                    <p className="text-[10px] font-mono-cyber text-purple-500/40">em ~{p.weeks} sem.</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projection chart */}
          {chartData.length > 0 && !isBalance && (
            <div className="cyber-card rounded-xl border border-purple-900/20 p-4">
              <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-4">
                Projeção de Peso — 12 Semanas ({isSurplus ? "GANHO" : "PERDA"})
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.08)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: 'rgba(168,85,247,0.35)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(168,85,247,0.35)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={0} stroke="rgba(168,85,247,0.2)" />
                  <Tooltip content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div style={{ background: '#04040e', border: `1px solid ${color}40`, borderRadius: 8, padding: '6px 10px' }}>
                        <p style={{ color, fontSize: 12, fontFamily: 'monospace' }}>{payload[0].value > 0 ? "+" : ""}{payload[0].value} kg</p>
                      </div>
                    ) : null
                  } />
                  <Bar dataKey="kg" radius={[3, 3, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={color} opacity={0.4 + (i / chartData.length) * 0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {isBalance && (
            <div className="text-center py-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
              <p className="font-cyber text-sm text-purple-300 tracking-widest">PESO ESTÁVEL</p>
              <p className="text-xs text-purple-400/40 font-mono-cyber mt-1">// meta = gasto, sem ganho ou perda</p>
            </div>
          )}
        </>
      )}

      {!canCalc && (
        <div className="text-center py-8 text-purple-500/25">
          <Calculator className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-mono-cyber text-sm">// preencha os dois campos para simular</p>
        </div>
      )}
    </div>
  );
}