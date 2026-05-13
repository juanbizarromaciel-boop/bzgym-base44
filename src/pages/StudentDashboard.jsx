import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dumbbell, TrendingUp, Target, MessageSquare,
  ChevronRight, CheckCircle2, Clock, Utensils,
  BookOpen, Trophy, Activity, Zap, Flame, Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const GOAL_LABELS = {
  hipertrofia: "Hipertrofia", emagrecimento: "Emagrecimento",
  resistencia: "Resistência", forca: "Força", saude: "Saúde"
};
const GOAL_COLORS = {
  hipertrofia: "#a855f7", emagrecimento: "#06b6d4",
  resistencia: "#f59e0b", forca: "#ec4899", saude: "#10b981"
};
const DAY_MAP = { 0: "domingo", 1: "segunda", 2: "terca", 3: "quarta", 4: "quinta", 5: "sexta", 6: "sabado" };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

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
        <div className="relative">
          <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
        </div>
      </div>
    );
  }

  const myLogs = workoutLogs.filter(log => log.student_id === student.id);
  const myPlans = workoutPlans.filter(plan => plan.student_id === student.id && plan.active !== false);
  const unreadMessages = messages.filter(m => m.student_id === student.id && m.is_trainer && !m.read);

  const last7Days = new Date(); last7Days.setDate(last7Days.getDate() - 7);
  const recentLogs = myLogs.filter(log => new Date(log.date) >= last7Days);
  const uniqueWorkoutDates = [...new Set(recentLogs.map(log => log.date))].length;

  const todayDow = DAY_MAP[new Date().getDay()];
  const todayPlan = myPlans.find(p => p.day_of_week === todayDow);
  const todayLogged = myLogs.some(l => l.date === new Date().toISOString().split("T")[0]);

  const sortedLogs = [...myLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastLog = sortedLogs[0];
  const daysSince = lastLog?.date ? Math.floor((new Date() - new Date(lastLog.date)) / 86400000) : null;

  const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";
  const goalColor = GOAL_COLORS[student.goal] || "#a855f7";

  const quickActions = [
    { label: "Meu Treino", icon: Dumbbell, path: "/MyWorkout", accent: "#a855f7" },
    { label: "Minha Dieta", icon: Utensils, path: "/MyDiet", accent: "#10b981" },
    { label: "Progresso", icon: TrendingUp, path: "/Progress", accent: "#06b6d4" },
    { label: "Chat", icon: MessageSquare, path: "/Chat", accent: "#ec4899" },
    { label: "Exercícios", icon: BookOpen, path: "/LearnExercises", accent: "#f59e0b" },
    { label: "Mural PRs", icon: Trophy, path: "/PRBoard", accent: "#f59e0b" },
    { label: "Documentos", icon: Activity, path: "/StudentDocuments", accent: "#06b6d4" },
    { label: "Saúde", icon: Target, path: "/CH", accent: "#84cc16" },
  ];

  const stats = [
    { label: "Treinos semana", value: uniqueWorkoutDates, accent: "#a855f7", icon: Flame },
    { label: "Planos ativos", value: myPlans.length, accent: "#06b6d4", icon: ClipboardIcon },
    { label: "Total treinos", value: myLogs.length, accent: "#10b981", icon: Star },
  ];

  function ClipboardIcon(props) { return <Activity {...props} />; }

  return (
    <motion.div className="space-y-8 max-w-4xl" initial="hidden" animate="show" variants={stagger}>

      {/* ═══ HERO HEADER ═══ */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(8,4,22,0.99) 0%, rgba(12,4,30,0.99) 50%, rgba(4,8,22,0.99) 100%)',
          border: `1px solid ${goalColor}30`,
          boxShadow: `0 0 60px ${goalColor}10, inset 0 1px 0 ${goalColor}20`,
        }}>
        {/* Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${goalColor}15 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', transform: 'translate(-20%, 30%)' }} />
        {/* Top neon line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${goalColor} 40%, rgba(6,182,212,0.6) 70%, transparent 100%)` }} />
        {/* Corner accents */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l rounded-tl" style={{ borderColor: `${goalColor}60` }} />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-cyan-500/50 rounded-tr" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l rounded-bl" style={{ borderColor: `${goalColor}30` }} />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-cyan-500/30 rounded-br" />

        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: goalColor, boxShadow: `0 0 8px ${goalColor}` }} />
              <p className="text-[10px] font-mono-cyber tracking-[0.4em] uppercase" style={{ color: `${goalColor}80` }}>
                ◈ {todayDate}
              </p>
            </div>
            <h1 className="font-cyber text-4xl md:text-5xl font-black tracking-widest leading-none"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 40%, #7dd3fc 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(168,85,247,0.4))',
              }}>
              {greeting},
            </h1>
            <h2 className="font-cyber text-3xl md:text-4xl font-black tracking-widest mt-1"
              style={{ color: goalColor, textShadow: `0 0 30px ${goalColor}80, 0 0 60px ${goalColor}30` }}>
              {student.name?.split(" ")[0]?.toUpperCase()}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {student.goal && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono-cyber"
                  style={{ borderColor: `${goalColor}30`, background: `${goalColor}10`, color: goalColor }}>
                  <Target className="w-3 h-3" />
                  {GOAL_LABELS[student.goal] || student.goal}
                </span>
              )}
              {daysSince !== null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono-cyber"
                  style={{
                    borderColor: daysSince === 0 ? 'rgba(52,211,153,0.3)' : daysSince <= 2 ? 'rgba(6,182,212,0.3)' : 'rgba(249,115,22,0.3)',
                    background: daysSince === 0 ? 'rgba(52,211,153,0.08)' : daysSince <= 2 ? 'rgba(6,182,212,0.08)' : 'rgba(249,115,22,0.08)',
                    color: daysSince === 0 ? '#34d399' : daysSince <= 2 ? '#22d3ee' : '#fb923c',
                  }}>
                  <Clock className="w-3 h-3" />
                  {daysSince === 0 ? "Treinou hoje!" : `Último treino: ${daysSince}d`}
                </span>
              )}
            </div>
          </div>
          {todayLogged && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8"
              style={{ boxShadow: '0 0 20px rgba(52,211,153,0.08)' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" style={{ filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.8))' }} />
              <span className="text-xs text-emerald-300 font-mono-cyber tracking-wider">treino feito!</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ TODAY'S WORKOUT CARD ═══ */}
      <motion.div variants={fadeUp}
        className="relative rounded-2xl overflow-hidden border"
        style={{
          background: todayPlan
            ? 'linear-gradient(135deg, rgba(8,4,24,0.99) 0%, rgba(14,4,36,0.99) 100%)'
            : 'rgba(4,4,12,0.9)',
          borderColor: todayPlan ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)',
          boxShadow: todayPlan ? '0 0 40px rgba(168,85,247,0.08)' : 'none',
        }}>
        {todayPlan && (
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), rgba(6,182,212,0.4), transparent)' }} />
        )}
        {/* Glow orb behind icon */}
        {todayPlan && (
          <div className="absolute left-0 top-0 bottom-0 w-32 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at left, rgba(168,85,247,0.08) 0%, transparent 100%)' }} />
        )}

        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: todayPlan
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.08))'
                  : 'rgba(255,255,255,0.03)',
                border: todayPlan ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: todayPlan ? '0 0 20px rgba(168,85,247,0.15)' : 'none',
              }}>
              <Dumbbell className="w-7 h-7" style={{ color: todayPlan ? '#c084fc' : '#ffffff15', filter: todayPlan ? 'drop-shadow(0 0 6px rgba(192,132,252,0.8))' : 'none' }} />
            </div>
            <div>
              <p className="text-[9px] font-mono-cyber text-purple-500/50 uppercase tracking-[0.3em] mb-1">// treino de hoje</p>
              <p className="text-base font-bold leading-tight" style={{ color: todayPlan ? '#f3e8ff' : 'rgba(255,255,255,0.3)' }}>
                {todayPlan ? todayPlan.name : "Dia de descanso"}
              </p>
              <p className="text-xs mt-1 font-mono-cyber" style={{ color: 'rgba(168,85,247,0.5)' }}>
                {todayPlan
                  ? todayLogged
                    ? "✓ sessão registrada"
                    : `${todayPlan.exercises?.length || 0} exercícios · pronto`
                  : `${uniqueWorkoutDates} treino${uniqueWorkoutDates !== 1 ? "s" : ""} essa semana`}
              </p>
            </div>
          </div>
          {todayPlan && !todayLogged && (
            <Link to="/MyWorkout"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-125"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.15))',
                border: '1px solid rgba(168,85,247,0.45)',
                color: '#e9d5ff',
                boxShadow: '0 0 20px rgba(168,85,247,0.2)',
              }}>
              <Zap className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 4px rgba(192,132,252,0.8))' }} />
              Iniciar
            </Link>
          )}
          {todayLogged && (
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" style={{ filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.8))' }} />
              <span className="text-xs text-emerald-300 font-mono-cyber">Concluído</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ MESSAGE ALERT ═══ */}
      {unreadMessages.length > 0 && (
        <motion.div variants={fadeUp}>
          <Link to="/Chat"
            className="flex items-center gap-3 px-5 py-4 rounded-xl border transition-all hover:brightness-110 group relative overflow-hidden"
            style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.05)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.7), transparent)' }} />
            <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
              style={{ background: '#06b6d4', boxShadow: '0 0 10px rgba(6,182,212,1)' }} />
            <MessageSquare className="w-4 h-4 flex-shrink-0 text-cyan-400" style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.8))' }} />
            <span className="text-sm flex-1 font-semibold text-cyan-200">
              {unreadMessages.length} mensagem{unreadMessages.length > 1 ? "ns" : ""} nova{unreadMessages.length > 1 ? "s" : ""} do professor
            </span>
            <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      )}

      {/* ═══ STATS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: "Treinos / semana", value: uniqueWorkoutDates, accent: "#a855f7", icon: Flame },
          { label: "Planos ativos", value: myPlans.length, accent: "#06b6d4", icon: Activity },
          { label: "Total treinos", value: myLogs.length, accent: "#10b981", icon: Star },
        ].map((s, i) => (
          <motion.div key={i} whileHover={{ scale: 1.04, y: -2 }} transition={{ duration: 0.18 }}
            className="relative rounded-xl p-4 border overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(6,4,18,0.98), rgba(3,2,12,0.99))',
              borderColor: `${s.accent}28`,
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />
            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
              style={{ background: s.accent, boxShadow: `0 0 6px ${s.accent}` }} />
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.accent, filter: `drop-shadow(0 0 4px ${s.accent})` }} />
            <p className="font-cyber text-3xl font-black leading-none"
              style={{ color: s.accent, textShadow: `0 0 20px ${s.accent}60` }}>
              {s.value}
            </p>
            <p className="text-[10px] mt-1.5 font-mono-cyber uppercase tracking-wider"
              style={{ color: 'rgba(192,132,252,0.5)' }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.5), transparent)' }} />
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.35em]"
            style={{ color: 'rgba(192,132,252,0.6)' }}>▸ acesso rápido</p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3))' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <motion.div key={i} whileHover={{ scale: 1.04, y: -3 }} transition={{ duration: 0.18 }}>
              <Link to={a.path}
                className="relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all group overflow-hidden block"
                style={{
                  borderColor: `${a.accent}25`,
                  background: 'linear-gradient(145deg, rgba(7,5,20,0.98), rgba(4,2,14,0.99))',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 80%, ${a.accent}18, transparent 65%)` }} />
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${a.accent}90, transparent)` }} />
                <div className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${a.accent}30, transparent)` }} />
                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${a.accent}20, ${a.accent}10)`,
                    border: `1px solid ${a.accent}40`,
                  }}>
                  <a.icon className="w-5 h-5"
                    style={{ color: a.accent, filter: `drop-shadow(0 0 6px ${a.accent}) drop-shadow(0 0 12px ${a.accent}50)` }} />
                </div>
                <span className="relative text-xs font-semibold text-center leading-tight group-hover:text-white transition-colors duration-200"
                  style={{ color: 'rgba(224,210,255,0.65)' }}>
                  {a.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}