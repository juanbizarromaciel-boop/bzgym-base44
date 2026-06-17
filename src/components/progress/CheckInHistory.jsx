import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Scale, Moon, Zap, SmilePlus, Dumbbell, Apple, ClipboardCheck } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const SCORE_LABELS = { 1: "Ruim", 2: "Regular", 3: "Ok", 4: "Bom", 5: "Ótimo" };
const SCORE_COLORS = { 1: "#ef4444", 2: "#f59e0b", 3: "#06b6d4", 4: "#a855f7", 5: "#10b981" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border rounded-xl px-3 py-2 shadow-xl" style={{ background: '#04040e', borderColor: 'rgba(6,182,212,0.4)' }}>
      <p className="text-[10px] font-mono-cyber text-cyan-400/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <p className="text-xs font-mono-cyber" style={{ color: p.color }}>{p.name}: {p.value}</p>
        </div>
      ))}
    </div>
  );
};

export default function CheckInHistory({ studentId }) {
  const { data: allCheckIns = [], isLoading } = useQuery({
    queryKey: ["checkIns"],
    queryFn: () => base44.entities.CheckIn.list(),
    staleTime: 30000,
  });

  const checkIns = allCheckIns
    .filter(c => c.student_id === studentId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const weightData = checkIns
    .filter(c => c.weight_kg)
    .map(c => ({ label: new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), peso: c.weight_kg }));

  const moodData = checkIns.slice(-14).map(c => ({
    label: new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    humor: c.mood_score || null,
    energia: c.energy_score || null,
    sono: c.sleep_score || null,
    treino: c.workout_adherence || null,
    dieta: c.diet_adherence || null,
  }));

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  if (checkIns.length === 0) return (
    <div className="text-center py-16 rounded-xl border border-purple-900/20">
      <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-purple-500/20" />
      <p className="font-mono-cyber text-sm text-purple-500/30">// nenhum check-in registrado</p>
    </div>
  );

  const latest = checkIns[checkIns.length - 1];
  const scorePairs = [
    { icon: Moon, label: "Sono", value: latest.sleep_score, color: "#a855f7" },
    { icon: Zap, label: "Energia", value: latest.energy_score, color: "#06b6d4" },
    { icon: SmilePlus, label: "Humor", value: latest.mood_score, color: "#ec4899" },
    { icon: Apple, label: "Fome", value: latest.hunger_score, color: "#10b981" },
    { icon: Dumbbell, label: "Treino", value: latest.workout_adherence, color: "#f59e0b" },
    { icon: Apple, label: "Dieta", value: latest.diet_adherence, color: "#84cc16" },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-5">

      {/* Latest check-in summary */}
      <motion.div variants={fadeUp} className="p-5 rounded-xl border" style={{ borderColor: 'rgba(6,182,212,0.25)', background: 'rgba(6,182,212,0.04)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em]" style={{ color: 'rgba(6,182,212,0.70)' }}>// último check-in</p>
          <span className="text-[10px] font-mono-cyber text-purple-400/50">
            {new Date(latest.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>

        {latest.weight_kg && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.20)' }}>
            <Scale className="w-5 h-5" style={{ color: '#a855f7' }} />
            <div>
              <p className="font-cyber text-2xl font-black text-white">{latest.weight_kg} <span className="text-sm text-purple-400/60">kg</span></p>
              <p className="text-[10px] font-mono-cyber text-purple-400/50 uppercase tracking-wider">Peso registrado</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {scorePairs.map(({ icon: Icon, label, value, color }) => value ? (
            <div key={label} className="p-2.5 rounded-lg text-center" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
              <p className="font-cyber text-lg font-black" style={{ color }}>{value}</p>
              <p className="text-[8px] font-mono-cyber uppercase tracking-wider" style={{ color: `${color}70` }}>{label}</p>
              <p className="text-[8px] font-mono-cyber" style={{ color: `${color}60` }}>{SCORE_LABELS[value]}</p>
            </div>
          ) : null)}
        </div>

        {latest.notes && (
          <p className="text-xs text-purple-300/50 font-mono-cyber mt-3 italic border-t border-purple-900/20 pt-3">
            // {latest.notes}
          </p>
        )}
      </motion.div>

      {/* Weight chart */}
      {weightData.length >= 2 && (
        <motion.div variants={fadeUp} className="p-5 rounded-xl border border-purple-900/20" style={{ background: 'rgba(4,4,14,0.8)' }}>
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em] mb-4 flex items-center gap-2" style={{ color: 'rgba(168,85,247,0.70)' }}>
            <Scale className="w-3.5 h-3.5" /> Evolução de Peso (kg)
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.15)" />
                <XAxis dataKey="label" stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                <YAxis stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="peso" name="Peso" stroke="#a855f7" strokeWidth={2} fill="url(#pesoGrad)"
                  dot={{ fill: "#a855f7", r: 4 }} activeDot={{ r: 6, fill: "#c084fc" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Mood/wellness chart */}
      {moodData.length >= 2 && (
        <motion.div variants={fadeUp} className="p-5 rounded-xl border border-purple-900/20" style={{ background: 'rgba(4,4,14,0.8)' }}>
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em] mb-4" style={{ color: 'rgba(6,182,212,0.70)' }}>
            // Bem-estar — últimas 2 semanas (1-5)
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.15)" />
                <XAxis dataKey="label" stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                <YAxis domain={[0, 5]} stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="humor" name="Humor" stroke="#ec4899" strokeWidth={2} dot={{ r: 3, fill: "#ec4899" }} connectNulls />
                <Line type="monotone" dataKey="energia" name="Energia" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: "#06b6d4" }} connectNulls />
                <Line type="monotone" dataKey="treino" name="Adesão Treino" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} connectNulls />
                <Line type="monotone" dataKey="dieta" name="Adesão Dieta" stroke="#84cc16" strokeWidth={2} dot={{ r: 3, fill: "#84cc16" }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {[["Humor","#ec4899"],["Energia","#06b6d4"],["Adesão Treino","#f59e0b"],["Adesão Dieta","#84cc16"]].map(([l,c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ background: c }} />
                <span className="text-[9px] font-mono-cyber" style={{ color: `${c}80` }}>{l}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* History list */}
      <motion.div variants={fadeUp}>
        <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(168,85,247,0.50)' }}>// histórico de check-ins</p>
        <div className="space-y-2">
          {[...checkIns].reverse().slice(0, 20).map(c => (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border" style={{ borderColor: 'rgba(168,85,247,0.15)', background: 'rgba(4,4,14,0.6)' }}>
              <div className="text-center min-w-[48px]">
                <p className="text-xs font-cyber text-white">{new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p>
              </div>
              {c.weight_kg && (
                <span className="text-sm font-cyber text-purple-300">{c.weight_kg}kg</span>
              )}
              <div className="flex gap-1.5 flex-1 flex-wrap">
                {[["😴",c.sleep_score],["⚡",c.energy_score],["😊",c.mood_score],["💪",c.workout_adherence],["🥗",c.diet_adherence]].map(([emoji,val],i) => val ? (
                  <span key={i} className="text-[10px] font-mono-cyber px-1.5 py-0.5 rounded"
                    style={{ background: `${SCORE_COLORS[val]}15`, color: SCORE_COLORS[val], border: `1px solid ${SCORE_COLORS[val]}30` }}>
                    {emoji}{val}
                  </span>
                ) : null)}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}