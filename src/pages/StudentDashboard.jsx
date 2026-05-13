import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dumbbell, TrendingUp, Target, MessageSquare,
  ChevronRight, CheckCircle2, Clock, Utensils,
  BookOpen, Trophy, Activity, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const GOAL_LABELS = {
  hipertrofia: "Hipertrofia", emagrecimento: "Emagrecimento",
  resistencia: "Resistência", forca: "Força", saude: "Saúde"
};
const DAY_MAP = { 0: "domingo", 1: "segunda", 2: "terca", 3: "quarta", 4: "quinta", 5: "sexta", 6: "sabado" };

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

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

  const quickActions = [
    { label: "Meu Treino", icon: Dumbbell, path: "/MyWorkout", accent: "#a855f7" },
    { label: "Minha Dieta", icon: Utensils, path: "/MyDiet", accent: "#10b981" },
    { label: "Progresso", icon: TrendingUp, path: "/Progress", accent: "#06b6d4" },
    { label: "Chat", icon: MessageSquare, path: "/Chat", accent: "#ec4899" },
    { label: "Exercícios", icon: BookOpen, path: "/LearnExercises", accent: "#f59e0b" },
    { label: "Mural PRs", icon: Trophy, path: "/PRBoard", accent: "#ec4899" },
    { label: "Documentos", icon: Activity, path: "/StudentDocuments", accent: "#06b6d4" },
    { label: "Saúde", icon: Target, path: "/CH", accent: "#84cc16" },
  ];

  return (
    <motion.div className="space-y-7 max-w-4xl" initial="hidden" animate="show" variants={stagger}>

      {/* Header */}
      <motion.div variants={fadeUp}>
        <p className="text-[10px] font-mono-cyber tracking-[0.35em] uppercase mb-2" style={{ color: 'rgba(192,132,252,0.55)' }}>
          ◈ {todayDate}
        </p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-cyber text-3xl md:text-4xl font-black tracking-widest"
              style={{ color: '#ffffff', textShadow: '0 0 40px rgba(168,85,247,0.5)' }}>
              OLÁ, {student.name?.split(" ")[0]?.toUpperCase()}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
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
          </div>
          {todayLogged && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/8">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-mono-cyber">treino concluído</span>
            </div>
          )}
        </div>
        <div className="mt-4 h-px" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.6), rgba(6,182,212,0.3), transparent)' }} />
      </motion.div>

      {/* Today's Workout Card */}
      <motion.div variants={fadeUp}
        className="relative rounded-2xl p-5 border overflow-hidden"
        style={{
          background: todayPlan
            ? 'radial-gradient(ellipse at top left, rgba(168,85,247,0.08), transparent 60%), rgba(4,4,12,0.95)'
            : 'rgba(4,4,12,0.85)',
          borderColor: todayPlan ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.1)',
        }}>
        {todayPlan && (
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' }} />
        )}
        <div className="flex items-center justify-between gap-4">
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
                  : `${uniqueWorkoutDates} treino${uniqueWorkoutDates !== 1 ? "s" : ""} essa semana`}
              </p>
            </div>
          </div>
          {todayPlan && !todayLogged && (
            <Link to="/MyWorkout"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(168,85,247,0.2)',
                border: '1px solid rgba(168,85,247,0.35)',
                color: '#e9d5ff',
              }}>
              <Zap className="w-4 h-4" />
              Iniciar
            </Link>
          )}
          {todayLogged && (
            <span className="flex-shrink-0 flex items-center gap-1.5 text-emerald-400 text-xs font-mono-cyber">
              <CheckCircle2 className="w-4 h-4" />
              Concluído
            </span>
          )}
        </div>
      </motion.div>

      {/* Message Alert */}
      {unreadMessages.length > 0 && (
        <motion.div variants={fadeUp}>
          <Link to="/Chat"
            className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-cyan-500/25 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 transition-all group">
            <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(6,182,212,0.9)' }} />
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm flex-1 font-medium">
              {unreadMessages.length} mensagem{unreadMessages.length > 1 ? "ns" : ""} nova{unreadMessages.length > 1 ? "s" : ""} do professor
            </span>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: "Treinos / semana", value: uniqueWorkoutDates, accent: "#a855f7" },
          { label: "Planos ativos", value: myPlans.length, accent: "#06b6d4" },
          { label: "Total de treinos", value: myLogs.length, accent: "#10b981" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 border relative overflow-hidden"
            style={{ background: 'rgba(6,4,18,0.95)', borderColor: `${s.accent}28` }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}70, transparent)` }} />
            <p className="font-cyber text-3xl font-black" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(192,132,252,0.6)' }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em] mb-3"
          style={{ color: 'rgba(192,132,252,0.55)' }}>▸ acesso rápido</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.path}
              className="relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all group overflow-hidden hover:scale-[1.03]"
              style={{
                borderColor: `${a.accent}22`,
                background: `linear-gradient(135deg, rgba(6,4,18,0.97), rgba(4,2,14,0.97))`,
              }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(ellipse at center, ${a.accent}12, transparent 70%)` }} />
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${a.accent}70, transparent)` }} />
              <div className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: `${a.accent}18`, border: `1px solid ${a.accent}35` }}>
                <a.icon className="w-5 h-5" style={{ color: a.accent, filter: `drop-shadow(0 0 5px ${a.accent})` }} />
              </div>
              <span className="relative text-xs font-semibold text-center" style={{ color: 'rgba(240,230,255,0.75)' }}>
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}