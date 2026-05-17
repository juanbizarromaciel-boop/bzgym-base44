import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Zap, Dumbbell, Calendar, BarChart2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { motion } from "framer-motion";
import ExerciseSeriesAnalysis from "../components/workout/ExerciseSeriesAnalysis";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
import MuscleMap from "../components/workout/MuscleMap";
import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const MUSCLE_GROUPS = {
  peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
  triceps: "Tríceps", pernas: "Pernas", gluteos: "Glúteos", abdomen: "Abdômen",
  panturrilha: "Panturrilha", cardio: "Cardio", outro: "Outro",
};

const PERIOD_OPTIONS = [
  { value: "daily", label: "Diário", days: 14 },
  { value: "weekly", label: "Semanal", weeks: 12 },
  { value: "monthly", label: "Mensal", months: 12 },
];

const muscleColors = {
  peito: "#a855f7", costas: "#06b6d4", ombros: "#ec4899", biceps: "#f59e0b",
  triceps: "#10b981", pernas: "#f97316", gluteos: "#8b5cf6", abdomen: "#06b6d4",
  panturrilha: "#84cc16", cardio: "#ef4444", outro: "#6b7280",
};

function calcVolume(log) {
  if (log.sets_completed && log.sets_completed.length > 0) {
    return log.sets_completed.reduce((acc, s) => acc + ((s.reps_done || 0) * (s.load_kg || 0)), 0);
  }
  return log.max_load_kg || 0;
}

export default function Progress() {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("all");
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [period, setPeriod] = useState("weekly");
  const [activeTab, setActiveTab] = useState("evolucao"); // "evolucao" | "series"
  const { user: currentUser, isAdmin } = useCurrentUser();
  const userRole = currentUser?.role || null;

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list(), staleTime: 60000 });
  const { data: logs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => base44.entities.WorkoutLog.list(), staleTime: 30000, placeholderData: (prev) => prev });
  const { data: allPlans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list(), staleTime: 60000, placeholderData: (prev) => prev });
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list(), staleTime: 60000 });

  // isAdmin already comes from useCurrentUser

  // For students: auto-select their own student record
  useEffect(() => {
    if (!isAdmin && currentUser && students.length > 0) {
      const found = students.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
      if (found) setSelectedStudentId(found.id);
    }
  }, [isAdmin, currentUser, students]);

  const studentLogs = useMemo(() => {
    return logs.filter((l) => l.student_id === selectedStudentId).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [logs, selectedStudentId]);

  const allStudentExercises = useMemo(() => {
    const plans = allPlans.filter(p => p.student_id === selectedStudentId);
    const exs = [];
    plans.forEach(plan => { if (plan.exercises) exs.push(...plan.exercises); });
    return exs;
  }, [allPlans, selectedStudentId]);

  const exerciseNames = useMemo(() => {
    return [...new Set(studentLogs.map((l) => l.exercise_name))].filter(Boolean).sort();
  }, [studentLogs]);

  const exerciseMuscleMap = useMemo(() => {
    const map = {};
    exercises.forEach(ex => { map[ex.name] = ex.muscle_group; });
    allStudentExercises.forEach(ex => { if (ex.exercise_name && !map[ex.exercise_name]) map[ex.exercise_name] = ex.muscle_group; });
    return map;
  }, [exercises, allStudentExercises]);

  const filteredLogs = useMemo(() => {
    let f = studentLogs;
    if (selectedExercise !== "all") f = f.filter(l => l.exercise_name === selectedExercise);
    if (selectedMuscle !== "all") f = f.filter(l => (exerciseMuscleMap[l.exercise_name] || "outro") === selectedMuscle);
    return f;
  }, [studentLogs, selectedExercise, selectedMuscle, exerciseMuscleMap]);

  const chartData = useMemo(() => {
    if (!filteredLogs.length) return [];
    const now = new Date();
    const cfg = PERIOD_OPTIONS.find(p => p.value === period);

    if (period === "daily") {
      const buckets = {};
      for (let i = cfg.days - 1; i >= 0; i--) {
        const key = format(subDays(now, i), "dd/MM");
        buckets[key] = { label: key, volume: 0, carga: 0, count: 0 };
      }
      filteredLogs.forEach(log => {
        const key = format(parseISO(log.date), "dd/MM");
        if (buckets[key]) { buckets[key].volume += calcVolume(log); buckets[key].carga = Math.max(buckets[key].carga, log.max_load_kg || 0); buckets[key].count++; }
      });
      return Object.values(buckets);
    }

    if (period === "weekly") {
      const buckets = {};
      for (let i = cfg.weeks - 1; i >= 0; i--) {
        const d = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const key = format(d, "dd/MM");
        buckets[key] = { label: `Sem ${key}`, volume: 0, carga: 0, count: 0 };
      }
      filteredLogs.forEach(log => {
        const d = startOfWeek(parseISO(log.date), { weekStartsOn: 1 });
        const key = format(d, "dd/MM");
        if (buckets[key]) { buckets[key].volume += calcVolume(log); buckets[key].carga = Math.max(buckets[key].carga, log.max_load_kg || 0); buckets[key].count++; }
      });
      return Object.values(buckets);
    }

    if (period === "monthly") {
      const buckets = {};
      for (let i = cfg.months - 1; i >= 0; i--) {
        const d = startOfMonth(subMonths(now, i));
        const key = format(d, "MM/yyyy");
        buckets[key] = { label: format(d, "MMM/yy", { locale: ptBR }), volume: 0, carga: 0, count: 0 };
      }
      filteredLogs.forEach(log => {
        const d = startOfMonth(parseISO(log.date));
        const key = format(d, "MM/yyyy");
        if (buckets[key]) { buckets[key].volume += calcVolume(log); buckets[key].carga = Math.max(buckets[key].carga, log.max_load_kg || 0); buckets[key].count++; }
      });
      return Object.values(buckets);
    }
    return [];
  }, [filteredLogs, period]);

  const exerciseVolume = useMemo(() => {
    const map = {};
    studentLogs.forEach(log => {
      const name = log.exercise_name;
      if (!name) return;
      if (!map[name]) map[name] = { name, volume: 0, maxLoad: 0, sessions: 0, muscle: exerciseMuscleMap[name] || "outro" };
      map[name].volume += calcVolume(log);
      map[name].maxLoad = Math.max(map[name].maxLoad, log.max_load_kg || 0);
      map[name].sessions++;
    });
    return Object.values(map).sort((a, b) => b.volume - a.volume);
  }, [studentLogs, exerciseMuscleMap]);

  const muscleVolume = useMemo(() => {
    const map = {};
    studentLogs.forEach(log => {
      const muscle = exerciseMuscleMap[log.exercise_name] || "outro";
      if (!map[muscle]) map[muscle] = { muscle, label: MUSCLE_GROUPS[muscle] || muscle, volume: 0, sessions: 0 };
      map[muscle].volume += calcVolume(log);
      map[muscle].sessions++;
    });
    return Object.values(map).sort((a, b) => b.volume - a.volume);
  }, [studentLogs, exerciseMuscleMap]);

  const trend = useMemo(() => {
    const nonZero = chartData.filter(d => d.volume > 0);
    if (nonZero.length < 2) return null;
    const first = nonZero[0].volume;
    const last = nonZero[nonZero.length - 1].volume;
    if (last > first) return { type: "up", value: ((last - first) / (first || 1) * 100).toFixed(1) };
    if (last < first) return { type: "down", value: ((first - last) / (first || 1) * 100).toFixed(1) };
    return { type: "same", value: "0" };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="border rounded-xl px-4 py-3 shadow-xl" style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.4)'}}>
        <p className="text-xs text-purple-400/50 font-mono-cyber mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{background: p.color}} />
            <p className="font-cyber text-sm" style={{color: p.color}}>
              {p.name === "volume" ? `${Math.round(p.value).toLocaleString()} kg·rep` : `${p.value} kg`}
            </p>
          </div>
        ))}
        {payload[0]?.payload?.count > 0 && <p className="text-xs text-purple-400/30 font-mono-cyber mt-1">{payload[0].payload.count} registros</p>}
      </div>
    );
  };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      <PageHeader title="Evolução" accentColor="#f59e0b" subtitle="Volume de treino · kg × reps" />

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1.5 mb-6 w-fit">
        {[
          { id: "evolucao", label: "EVOLUÇÃO", icon: TrendingUp },
          { id: "series", label: "ANÁLISE DE SÉRIES", icon: BarChart2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono-cyber tracking-wider transition-all"
            style={activeTab === tab.id ? {
              background: 'linear-gradient(135deg, rgba(245,158,11,0.20), rgba(168,85,247,0.10))',
              border: '1px solid rgba(245,158,11,0.65)',
              color: '#ffffff',
              boxShadow: '0 0 18px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
              textShadow: '0 0 8px rgba(245,158,11,0.8)',
            } : {
              background: 'rgba(168,85,247,0.05)',
              border: '1px solid rgba(168,85,247,0.20)',
              color: 'rgba(168,85,247,0.55)',
            }}>
            <tab.icon className="w-3.5 h-3.5" style={activeTab === tab.id ? { filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.9))' } : {}} />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Student selector — always visible */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-6">
        {isAdmin && (
          <Select value={selectedStudentId} onValueChange={(v) => { setSelectedStudentId(v); setSelectedExercise("all"); setSelectedMuscle("all"); }}>
            <SelectTrigger className="w-full sm:w-56 cyber-input">
              <SelectValue placeholder="Selecione o aluno" />
            </SelectTrigger>
            <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
              {students.map((s) => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {selectedStudentId && activeTab === "evolucao" && (
          <>
            <Select value={selectedMuscle} onValueChange={(v) => { setSelectedMuscle(v); setSelectedExercise("all"); }}>
              <SelectTrigger className="w-full sm:w-48 cyber-input">
                <SelectValue placeholder="Grupo muscular" />
              </SelectTrigger>
              <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                <SelectItem value="all" className="text-white">Todos os grupos</SelectItem>
                {Object.entries(MUSCLE_GROUPS).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-full sm:w-56 cyber-input">
                <SelectValue placeholder="Exercício" />
              </SelectTrigger>
              <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                <SelectItem value="all" className="text-white">Todos os exercícios</SelectItem>
                {exerciseNames.map((name) => <SelectItem key={name} value={name} className="text-white">{name}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-purple-900/30 overflow-hidden">
              {PERIOD_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setPeriod(opt.value)}
                  className={`px-4 py-2 text-xs font-mono-cyber tracking-wider transition-all border-r border-purple-900/30 last:border-r-0 ${
                    period === opt.value ? "bg-purple-500/20 text-purple-300" : "text-purple-500/40 hover:text-purple-400 hover:bg-purple-500/10"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* SERIES TAB */}
      {activeTab === "series" && (
        <motion.div variants={fadeUp}>
          <ExerciseSeriesAnalysis studentId={selectedStudentId} allLogs={logs} />
        </motion.div>
      )}

      {activeTab === "evolucao" && selectedStudentId && filteredLogs.length > 0 && (
        <motion.div variants={stagger}>
          {filteredLogs.length > 0 && (
            <motion.div variants={fadeUp} className="cyber-card rounded-xl p-5 border border-purple-900/20 mb-6">
              <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-4">Músculos Trabalhados no Período</p>
              <MuscleMap loggedExercises={filteredLogs} exerciseLibrary={exercises} size="md" showLabels={true} />
            </motion.div>
          )}

          {trend && (
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6 cyber-card rounded-xl p-4 border border-purple-900/20">
              <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${
                trend.type === "up" ? "bg-cyan-500/10 border-cyan-500/30" : trend.type === "down" ? "bg-pink-500/10 border-pink-500/30" : "bg-purple-500/10 border-purple-500/20"
              }`}>
                {trend.type === "up" && <TrendingUp className="w-5 h-5 text-cyan-400" />}
                {trend.type === "down" && <TrendingDown className="w-5 h-5 text-pink-400" />}
                {trend.type === "same" && <Minus className="w-5 h-5 text-purple-400" />}
              </div>
              <div>
                <p className="text-xs text-purple-400/40 tracking-wider font-mono-cyber uppercase">Variação de Volume</p>
                <p className={`text-2xl font-bold font-cyber ${trend.type === "up" ? "text-cyan-400" : trend.type === "down" ? "text-pink-400" : "text-purple-400"}`}>
                  {trend.type === "up" ? "+" : trend.type === "down" ? "-" : ""}{trend.value}%
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-purple-400/40 font-mono-cyber uppercase">Volume Total</p>
                <p className="text-xl font-cyber text-purple-300">
                  {Math.round(filteredLogs.reduce((acc, l) => acc + calcVolume(l), 0)).toLocaleString()}
                  <span className="text-xs ml-1 text-purple-500/40">kg·rep</span>
                </p>
              </div>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="cyber-card rounded-xl p-6 border border-purple-900/20 mb-4">
            <p className="font-cyber text-xs tracking-[0.2em] text-purple-400/60 uppercase mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              Volume de Força (kg × reps) — {PERIOD_OPTIONS.find(p => p.value === period)?.label}
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.15)" />
                  <XAxis dataKey="label" stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                  <YAxis stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="volume" name="volume" fill="url(#volGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="cyber-card rounded-xl p-6 border border-purple-900/20 mb-6">
            <p className="font-cyber text-xs tracking-[0.2em] text-purple-400/60 uppercase mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Carga Máxima (kg) — {PERIOD_OPTIONS.find(p => p.value === period)?.label}
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cargaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.15)" />
                  <XAxis dataKey="label" stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                  <YAxis stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="carga" name="carga" stroke="#06b6d4" strokeWidth={2} fill="url(#cargaGrad)"
                    dot={{ fill: "#06b6d4", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "#67e8f9", stroke: "#000", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="cyber-card rounded-xl p-6 border border-purple-900/20 mb-4">
            <p className="font-cyber text-xs tracking-[0.2em] text-purple-400/60 uppercase mb-4 flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-pink-400" />
              Volume por Grupo Muscular
            </p>
            <div className="space-y-3">
              {muscleVolume.map(({ muscle, label, volume, sessions }) => {
                const maxVol = muscleVolume[0]?.volume || 1;
                const pct = (volume / maxVol) * 100;
                const color = muscleColors[muscle] || "#6b7280";
                return (
                  <div key={muscle} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                        <span className="text-sm text-white font-medium">{label}</span>
                        <span className="text-xs text-purple-500/40 font-mono-cyber">{sessions} sessões</span>
                      </div>
                      <span className="font-cyber text-sm" style={{ color }}>
                        {Math.round(volume).toLocaleString()} <span className="text-xs opacity-60">kg·rep</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}80)`, boxShadow: `0 0 6px ${color}` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="cyber-card rounded-xl p-6 border border-purple-900/20 mb-4">
            <p className="font-cyber text-xs tracking-[0.2em] text-purple-400/60 uppercase mb-4 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Volume por Exercício
            </p>
            <div className="space-y-2">
              {exerciseVolume.map((ex) => {
                const color = muscleColors[ex.muscle] || "#6b7280";
                return (
                  <div key={ex.name} className="flex items-center justify-between px-4 py-3 rounded-lg bg-black/40 border border-purple-900/20 hover:border-purple-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                      <div>
                        <p className="text-sm font-medium text-white">{ex.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="text-[10px] border" style={{ background: `${color}15`, borderColor: `${color}30`, color }}>
                            {MUSCLE_GROUPS[ex.muscle] || ex.muscle}
                          </Badge>
                          <span className="text-xs text-purple-500/30 font-mono-cyber">{ex.sessions} sessões</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-cyber text-lg text-purple-300">
                        {Math.round(ex.volume).toLocaleString()}
                        <span className="text-xs ml-1 text-purple-500/40">kg·rep</span>
                      </p>
                      <p className="text-xs text-cyan-400/60 font-mono-cyber">max {ex.maxLoad}kg</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === "evolucao" && selectedStudentId && filteredLogs.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-16 text-purple-500/30">
          <p className="font-mono-cyber text-sm">// nenhum registro encontrado</p>
        </motion.div>
      )}

      {activeTab === "evolucao" && !selectedStudentId && isAdmin && (
        <motion.div variants={fadeUp} className="text-center py-16 text-purple-500/20">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-mono-cyber text-sm">// selecione um aluno para ver a evolução</p>
        </motion.div>
      )}

      {activeTab === "evolucao" && !selectedStudentId && !isAdmin && (
        <div className="text-center py-16 text-purple-500/20">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </motion.div>
  );
}