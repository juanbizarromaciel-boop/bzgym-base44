import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dumbbell, TrendingUp, Target, Calendar, Award,
  ChevronRight, Flame, MessageSquare, Zap, CheckCircle2,
  Clock, ClipboardList, Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import MuscleMap from "../components/workout/MuscleMap";
import { motion } from "framer-motion";
import { fadeUp, stagger, scaleIn, slideLeft, pageTransition } from "@/lib/animations";

const GOAL_LABELS = {
  hipertrofia: "HIPERTROFIA", emagrecimento: "EMAGRECIMENTO",
  resistencia: "RESISTÊNCIA", forca: "FORÇA", saude: "SAÚDE"
};

const DAY_MAP = { 0: "domingo", 1: "segunda", 2: "terca", 3: "quarta", 4: "quinta", 5: "sexta", 6: "sabado" };

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: workoutLogs = [] } = useQuery({ queryKey: ["workoutLogs"], queryFn: () => base44.entities.WorkoutLog.list() });
  const { data: workoutPlans = [] } = useQuery({ queryKey: ["workoutPlans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: messages = [] } = useQuery({ queryKey: ["messages"], queryFn: () => base44.entities.ChatMessage.list() });

  useEffect(() => {
    if (user && students.length > 0) {
      const found = students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase());
      if (!found || !found.goal) { window.location.href = "/Onboarding"; }
      else if (!found.active) { window.location.href = "/Welcome"; }
      else { setStudent(found); }
    }
  }, [user, students]);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myLogs = workoutLogs.filter(log => log.student_id === student.id);
  const myPlans = workoutPlans.filter(plan => plan.student_id === student.id && plan.active !== false);
  const unreadMessages = messages.filter(m => m.student_id === student.id && m.is_trainer && !m.read);

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentLogs = myLogs.filter(log => new Date(log.date) >= last7Days);
  const uniqueWorkoutDates = [...new Set(recentLogs.map(log => log.date))].length;
  const totalVolume = recentLogs.reduce((sum, log) =>
    sum + (log.sets_completed?.reduce((s, set) => s + (set.reps_done * set.load_kg), 0) || 0), 0);
  const maxLoad = Math.max(...myLogs.map(log => log.max_load_kg || 0), 0);

  const todayDow = DAY_MAP[new Date().getDay()];
  const todayPlan = myPlans.find(p => p.day_of_week === todayDow);
  const todayLogged = myLogs.some(l => l.date === new Date().toISOString().split("T")[0]);

  const sortedLogs = [...myLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastLog = sortedLogs[0];
  const daysSince = lastLog?.date
    ? Math.floor((new Date() - new Date(lastLog.date)) / 86400000)
    : null;

  const allExercises = myPlans.flatMap(p => p.exercises || []);
  const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const stats = [
    { label: "Treinos / Semana", value: uniqueWorkoutDates, icon: Calendar, accent: "#06b6d4", glow: "rgba(6,182,212,0.15)" },
    { label: "Volume (kg×reps)", value: totalVolume > 0 ? `${Math.round(totalVolume / 1000)}k` : "—", icon: Flame, accent: "#ec4899", glow: "rgba(236,72,153,0.15)" },
    { label: "Carga Máxima", value: maxLoad > 0 ? `${maxLoad}kg` : "—", icon: Award, accent: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
    { label: "Planos Ativos", value: myPlans.length, icon: ClipboardList, accent: "#a855f7", glow: "rgba(168,85,247,0.15)" },
  ];

  const quickActions = [
    { label: "Meu Treino", icon: Dumbbell, href: "/MyWorkout", accent: "#a855f7" },
    { label: "Progresso", icon: TrendingUp, href: "/Progress", accent: "#06b6d4" },
    { label: "Minha Dieta", icon: Target, href: "/MyDiet", accent: "#ec4899" },
    { label: "Chat", icon: MessageSquare, href: "/Chat", accent: "#10b981" },
  ];

  return (
    <motion.div className="space-y-8 max-w-4xl"
      variants={pageTransition} initial="hidden" animate="show">

      {/* Header */}
      <motion.div className="relative" variants={fadeUp}>
        <p className="text-[10px] font-mono-cyber text-purple-500/35 tracking-[0.3em] uppercase mb-2">{todayDate}</p>
        <h1 className="font-cyber text-3xl md:text-4xl text-white tracking-widest leading-none"
          style={{ textShadow: '0 0 30px rgba(168,85,247,0.3)' }}>
          OLÁ, {student.name?.split(" ")[0]?.toUpperCase()}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {student.goal && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-xs font-mono-cyber text-purple-400/70">
              <Target className="w-3 h-3" />
              {GOAL_LABELS[student.goal] || student.goal}
            </span>
          )}
          {daysSince !== null && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono-cyber
              ${daysSince === 0 ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400"
                : daysSince <= 2 ? "border-cyan-500/25 bg-cyan-500/5 text-cyan-400"
                : "border-orange-500/25 bg-orange-500/5 text-orange-400"}`}>
              <Clock className="w-3 h-3" />
              {daysSince === 0 ? "Treinou hoje!" : `Último treino há ${daysSince} dia${daysSince > 1 ? "s" : ""}`}
            </span>
          )}
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-purple-500/30 via-purple-500/10 to-transparent" />
      </motion.div>

      {/* Today's Workout Card */}
      <motion.div variants={scaleIn}
        className="relative rounded-2xl p-6 border overflow-hidden"
        style={{
          background: todayPlan
            ? 'radial-gradient(ellipse at top left, rgba(168,85,247,0.08), transparent 60%), rgba(4,4,12,0.95)'
            : 'rgba(4,4,12,0.85)',
          borderColor: todayPlan ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.1)',
          boxShadow: todayPlan ? '0 0 30px rgba(168,85,247,0.06)' : 'none'
        }}>
        {/* Top accent */}
        {todayPlan && (
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' }} />
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: todayPlan ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.03)',
                border: todayPlan ? '1px solid rgba(168,85,247,0.25)' : '1px solid rgba(255,255,255,0.06)'
              }}>
              <Dumbbell className="w-6 h-6" style={{ color: todayPlan ? '#c084fc' : '#ffffff20' }} />
            </div>
            <div>
              <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-0.5">Treino de hoje</p>
              <p className="text-base font-semibold text-white">
                {todayPlan ? todayPlan.name : "Sem treino programado"}
              </p>
              <p className="text-xs text-purple-400/45 mt-0.5">
                {todayPlan
                  ? todayLogged
                    ? "✓ Sessão registrada hoje"
                    : `${todayPlan.exercises?.length || 0} exercícios · pronto para iniciar`
                  : "Descanse ou faça treino livre"}
              </p>
            </div>
          </div>
          {todayPlan && !todayLogged ? (
            <Link to="/MyWorkout"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(168,85,247,0.2)',
                border: '1px solid rgba(168,85,247,0.35)',
                color: '#e9d5ff',
                boxShadow: '0 0 20px rgba(168,85,247,0.15)'
              }}>
              <Zap className="w-4 h-4" />
              Iniciar
            </Link>
          ) : todayLogged ? (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono-cyber">
              <CheckCircle2 className="w-4 h-4" />
              Concluído
            </span>
          ) : null}
        </div>
      </motion.div>

      {/* Message Alert */}
      {unreadMessages.length > 0 && (
        <motion.div variants={slideLeft}>
        <Link to="/Chat"
          className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-cyan-500/25 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/8 transition-all group">
          <div className="w-2 h-2 rounded-full bg-cyan-400 neon-dot flex-shrink-0" />
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm flex-1 font-medium">
            {unreadMessages.length} mensagem{unreadMessages.length > 1 ? "ns" : ""} nova{unreadMessages.length > 1 ? "s" : ""} do professor
          </span>
          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all" />
        </Link>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        variants={stagger(0.08)} initial="hidden" animate="show">
        {stats.map((s, i) => (
          <motion.div key={i} variants={scaleIn} whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
            className="relative rounded-xl p-5 border overflow-hidden"
            style={{
              background: `radial-gradient(ellipse at top left, ${s.glow}, transparent 70%), rgba(4,4,12,0.95)`,
              borderColor: `${s.accent}22`,
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}44, transparent)` }} />
            <s.icon className="w-4 h-4 mb-4 opacity-70" style={{ color: s.accent }} />
            <p className="font-cyber text-2xl font-bold" style={{ color: s.accent }}>
              {s.value}
            </p>
            <p className="text-[10px] text-purple-400/40 font-mono-cyber mt-1 uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <p className="text-[10px] font-mono-cyber text-purple-500/35 uppercase tracking-[0.25em] mb-3">▸ acesso rápido</p>
        <motion.div className="grid grid-cols-4 gap-3"
          variants={stagger(0.07)} initial="hidden" animate="show">
          {quickActions.map((a, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}>
            <a href={a.href}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-purple-900/20 bg-black/50 hover:bg-black/80 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: `${a.accent}15`, border: `1px solid ${a.accent}25` }}>
                <a.icon className="w-5 h-5" style={{ color: a.accent }} />
              </div>
              <span className="text-xs font-medium text-white/55 group-hover:text-white/90 transition-colors text-center">{a.label}</span>
            </a>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Muscle Map */}
      {allExercises.length > 0 && (
        <motion.div variants={scaleIn}
          className="rounded-2xl p-6 border border-purple-900/20 bg-black/40">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-purple-400" />
            <p className="text-[11px] font-mono-cyber text-purple-400/60 uppercase tracking-[0.2em]">Mapa Muscular</p>
          </div>
          <MuscleMap exercises={allExercises} size="lg" showLabels={true} />
        </motion.div>
      )}

      {/* My Plans */}
      {myPlans.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-mono-cyber text-purple-500/35 uppercase tracking-[0.25em]">▸ meus treinos</p>
            <a href="/MyWorkout" className="text-[11px] text-purple-400/50 hover:text-purple-400 transition-colors font-mono-cyber">ver todos →</a>
          </div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3"
            variants={stagger(0.07)} initial="hidden" animate="show">
            {myPlans.slice(0, 4).map((plan, i) => (
              <motion.div key={i} variants={slideLeft} whileHover={{ x: 3, transition: { duration: 0.15 } }}>
              <a href="/MyWorkout"
                className="flex items-center gap-4 p-4 rounded-xl border border-purple-900/20 bg-black/40 hover:border-purple-500/25 transition-all group"
                style={{ background: 'rgba(4,4,12,0.8)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)' }}>
                  <Dumbbell className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{plan.name}</p>
                  <p className="text-[11px] text-purple-400/40 font-mono-cyber mt-0.5">
                    {plan.exercises?.length || 0} exercícios · {plan.day_of_week || "livre"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-500/20 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </a>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  );
}