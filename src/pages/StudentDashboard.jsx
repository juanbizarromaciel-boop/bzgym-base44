import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dumbbell, TrendingUp, Target, MessageSquare,
  ChevronRight, CheckCircle2, Clock, Utensils,
  BookOpen, Trophy, Activity, Zap, Flame, Star, Apple, ClipboardCheck
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
  const { data: dietPlans = [] } = useQuery({ queryKey: ["dietPlans"], queryFn: () => base44.entities.DietPlan.list() });
  const { data: checkIns = [] } = useQuery({ queryKey: ["checkIns"], queryFn: () => base44.entities.CheckIn.list() });

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

  const todayStr = new Date().toISOString().split("T")[0];
  const myDietPlan = dietPlans.find(d => d.student_id === student?.id && d.active !== false);
  const todayCheckIn = checkIns.find(c => c.student_id === student?.id && c.date === todayStr);
  const todayCalories = myDietPlan?.total_calories || null;
  const todayMeals = myDietPlan?.meals?.length || 0;

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
          boxShadow: `0 0 80px ${goalColor}15, inset 0 1px 0 ${goalColor}25, inset 0 0 40px ${goalColor}08`,
        }}>
        {/* Top decorative scanline */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${goalColor}, rgba(6,182,212,0.8), ${goalColor}, transparent)`, boxShadow: `0 0 20px ${goalColor}` }} />
        {/* Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${goalColor}20 0%, transparent 70%)`, transform: 'translate(30%, -30%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', transform: 'translate(-20%, 30%)', filter: 'blur(40px)' }} />
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none">
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 rounded-tl" style={{ borderColor: goalColor, boxShadow: `0 0 10px ${goalColor}, 0 0 20px ${goalColor}` }} />
          <div className="absolute top-0 left-0 w-1 h-8" style={{ background: `linear-gradient(to bottom, ${goalColor}, transparent)` }} />
          <div className="absolute top-0 left-0 w-8 h-1" style={{ background: `linear-gradient(to right, ${goalColor}, transparent)` }} />
        </div>
        <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none">
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 rounded-tr" style={{ borderColor: '#06b6d4', boxShadow: '0 0 10px #06b6d4, 0 0 20px #06b6d4' }} />
        </div>
        <div className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none">
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 rounded-bl" style={{ borderColor: `${goalColor}60`, boxShadow: `0 0 10px ${goalColor}60` }} />
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none">
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 rounded-br" style={{ borderColor: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }} />
        </div>

        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: goalColor, boxShadow: `0 0 12px ${goalColor}, 0 0 24px ${goalColor}` }} />
              <p className="text-[10px] font-mono-cyber tracking-[0.45em] uppercase" style={{ color: `${goalColor}90`, textShadow: `0 0 8px ${goalColor}` }}>
                ◈ {todayDate}
              </p>
            </div>
            <h1 className="font-cyber text-4xl md:text-5xl font-black tracking-widest leading-none"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 40%, #7dd3fc 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(168,85,247,0.5)) drop-shadow(0 0 60px rgba(168,85,247,0.3))',
              }}>
              {greeting},
            </h1>
            <h2 className="font-cyber text-3xl md:text-4xl font-black tracking-widest mt-1"
              style={{ color: goalColor, textShadow: `0 0 30px ${goalColor}, 0 0 60px ${goalColor}80, 0 0 90px ${goalColor}40` }}>
              {student.name?.split(" ")[0]?.toUpperCase()}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {student.goal && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono-cyber tracking-wider"
                  style={{
                    borderColor: `${goalColor}40`,
                    background: `linear-gradient(135deg, ${goalColor}15, ${goalColor}08)`,
                    color: goalColor,
                    boxShadow: `0 0 20px ${goalColor}20, inset 0 0 10px ${goalColor}10`,
                  }}>
                  <Target className="w-3.5 h-3.5" style={{ filter: `drop-shadow(0 0 4px ${goalColor})` }} />
                  {GOAL_LABELS[student.goal] || student.goal}
                </span>
              )}
              {daysSince !== null && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono-cyber tracking-wider"
                  style={{
                    borderColor: daysSince === 0 ? 'rgba(52,211,153,0.4)' : daysSince <= 2 ? 'rgba(6,182,212,0.4)' : 'rgba(249,115,22,0.4)',
                    background: daysSince === 0 ? 'rgba(52,211,153,0.12)' : daysSince <= 2 ? 'rgba(6,182,212,0.12)' : 'rgba(249,115,22,0.12)',
                    color: daysSince === 0 ? '#34d399' : daysSince <= 2 ? '#22d3ee' : '#fb923c',
                    boxShadow: `0 0 16px ${daysSince === 0 ? 'rgba(52,211,153,0.3)' : daysSince <= 2 ? 'rgba(6,182,212,0.3)' : 'rgba(249,115,22,0.3)'}`,
                  }}>
                  <Clock className="w-3.5 h-3.5" />
                  {daysSince === 0 ? "Treinou hoje!" : `Último treino: ${daysSince}d`}
                </span>
              )}
            </div>
          </div>
          {todayLogged && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border relative overflow-hidden"
              style={{
                borderColor: 'rgba(52,211,153,0.35)',
                background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.06))',
                boxShadow: '0 0 30px rgba(52,211,153,0.15), inset 0 0 20px rgba(52,211,153,0.08)',
              }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.8), transparent)' }} />
              <CheckCircle2 className="w-5 h-5 text-emerald-400 relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,1)) drop-shadow(0 0 12px rgba(52,211,153,0.6))' }} />
              <span className="text-xs text-emerald-300 font-mono-cyber tracking-wider relative z-10">treino feito!</span>
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
          borderColor: todayPlan ? `${goalColor}40` : 'rgba(255,255,255,0.08)',
          boxShadow: todayPlan ? `0 0 50px ${goalColor}15, inset 0 0 30px ${goalColor}08` : '0 0 30px rgba(0,0,0,0.3)',
        }}>
        {todayPlan && (
          <>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${goalColor}, rgba(6,182,212,0.6), ${goalColor}, transparent)`, boxShadow: `0 0 15px ${goalColor}` }} />
            <div className="absolute left-0 top-0 bottom-0 w-40 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at left, ${goalColor}15 0%, transparent 70%)`, filter: 'blur(30px)' }} />
          </>
        )}
        {/* Corner accents */}
        {todayPlan && (
          <>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl pointer-events-none" style={{ borderColor: goalColor, boxShadow: `0 0 8px ${goalColor}` }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br pointer-events-none" style={{ borderColor: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }} />
          </>
        )}

        <div className="p-5 flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: todayPlan
                  ? `linear-gradient(135deg, ${goalColor}25, ${goalColor}10)`
                  : 'rgba(255,255,255,0.03)',
                border: todayPlan ? `1px solid ${goalColor}45` : '1px solid rgba(255,255,255,0.08)',
                boxShadow: todayPlan ? `0 0 30px ${goalColor}25, inset 0 0 15px ${goalColor}10` : 'none',
              }}>
              <Dumbbell className="w-8 h-8" style={{ color: todayPlan ? goalColor : '#ffffff15', filter: todayPlan ? `drop-shadow(0 0 8px ${goalColor}) drop-shadow(0 0 16px ${goalColor}60)` : 'none' }} />
            </div>
            <div>
              <p className="text-[9px] font-mono-cyber uppercase tracking-[0.35em] mb-1.5" style={{ color: `${goalColor}70`, textShadow: `0 0 8px ${goalColor}` }}>
                // treino de hoje
              </p>
              <p className="text-base font-bold leading-tight" style={{ color: todayPlan ? '#ffffff' : 'rgba(255,255,255,0.3)', textShadow: todayPlan ? `0 0 20px ${goalColor}40` : 'none' }}>
                {todayPlan ? todayPlan.name : "Dia de descanso"}
              </p>
              <p className="text-xs mt-1.5 font-mono-cyber" style={{ color: `${goalColor}70` }}>
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
              className="flex-shrink-0 flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all hover:scale-105 relative overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, ${goalColor}30, ${goalColor}20)`,
                border: `1px solid ${goalColor}55`,
                color: '#ffffff',
                boxShadow: `0 0 30px ${goalColor}30, inset 0 0 20px ${goalColor}15`,
                textShadow: '0 0 8px rgba(0,0,0,0.5)',
              }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(ellipse at center, ${goalColor}40, transparent 70%)` }} />
              <Zap className="w-5 h-5 relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8)) drop-shadow(0 0 12px rgba(168,85,247,0.6))' }} />
              <span className="relative z-10">INICIAR</span>
            </Link>
          )}
          {todayLogged && (
            <div className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-xl border relative overflow-hidden"
              style={{
                borderColor: 'rgba(52,211,153,0.45)',
                background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.08))',
                boxShadow: '0 0 25px rgba(52,211,153,0.2), inset 0 0 15px rgba(52,211,153,0.1)',
              }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.8), transparent)' }} />
              <CheckCircle2 className="w-5 h-5 text-emerald-400 relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,1)) drop-shadow(0 0 12px rgba(52,211,153,0.6))' }} />
              <span className="text-xs text-emerald-300 font-mono-cyber tracking-wider relative z-10">Concluído</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ DIET CARD ═══ */}
      <motion.div variants={fadeUp}
        className="relative rounded-2xl overflow-hidden border"
        style={{
          background: myDietPlan
            ? 'linear-gradient(135deg, rgba(4,16,10,0.99) 0%, rgba(4,22,12,0.99) 100%)'
            : 'rgba(4,4,12,0.9)',
          borderColor: myDietPlan ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)',
          boxShadow: myDietPlan ? '0 0 40px rgba(16,185,129,0.10), inset 0 0 20px rgba(16,185,129,0.05)' : 'none',
        }}>
        {myDietPlan && (
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.8), rgba(6,182,212,0.4), transparent)', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
        )}
        {myDietPlan && (
          <>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl pointer-events-none" style={{ borderColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br pointer-events-none" style={{ borderColor: 'rgba(6,182,212,0.6)', boxShadow: '0 0 6px rgba(6,182,212,0.5)' }} />
          </>
        )}
        <div className="p-5 flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: myDietPlan ? 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0.08))' : 'rgba(255,255,255,0.03)',
                border: myDietPlan ? '1px solid rgba(16,185,129,0.40)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: myDietPlan ? '0 0 20px rgba(16,185,129,0.20), inset 0 0 10px rgba(16,185,129,0.08)' : 'none',
              }}>
              <Apple className="w-8 h-8" style={{ color: myDietPlan ? '#10b981' : '#ffffff15', filter: myDietPlan ? 'drop-shadow(0 0 6px #10b981) drop-shadow(0 0 12px rgba(16,185,129,0.5))' : 'none' }} />
            </div>
            <div>
              <p className="text-[9px] font-mono-cyber uppercase tracking-[0.35em] mb-1.5" style={{ color: 'rgba(16,185,129,0.65)', textShadow: '0 0 8px rgba(16,185,129,0.5)' }}>
                // dieta de hoje
              </p>
              <p className="text-base font-bold leading-tight" style={{ color: myDietPlan ? '#ffffff' : 'rgba(255,255,255,0.3)' }}>
                {myDietPlan ? myDietPlan.name : "Sem plano alimentar"}
              </p>
              <p className="text-xs mt-1.5 font-mono-cyber" style={{ color: 'rgba(16,185,129,0.65)' }}>
                {myDietPlan
                  ? `${todayMeals} refeição${todayMeals !== 1 ? "ões" : ""}${todayCalories ? ` · ${todayCalories} kcal` : ""}`
                  : "// fale com seu personal sobre dieta"}
              </p>
            </div>
          </div>
          {myDietPlan && (
            <Link to="/MyDiet"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-wider transition-all hover:scale-105 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.12))',
                border: '1px solid rgba(16,185,129,0.45)',
                color: '#ffffff',
                boxShadow: '0 0 20px rgba(16,185,129,0.20), inset 0 0 12px rgba(16,185,129,0.10)',
              }}>
              <Apple className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981', filter: 'drop-shadow(0 0 4px #10b981)' }} />
              <span>VER</span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* ═══ CHECK-IN CARD ═══ */}
      <motion.div variants={fadeUp}
        className="relative rounded-2xl overflow-hidden border"
        style={{
          background: todayCheckIn ? 'linear-gradient(135deg, rgba(4,12,20,0.99) 0%, rgba(4,16,24,0.99) 100%)' : 'rgba(4,4,12,0.9)',
          borderColor: todayCheckIn ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.08)',
          boxShadow: todayCheckIn ? '0 0 40px rgba(6,182,212,0.10)' : 'none',
        }}>
        {todayCheckIn && (
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), rgba(168,85,247,0.4), transparent)' }} />
        )}
        <div className="p-5 flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: todayCheckIn ? 'linear-gradient(135deg, rgba(6,182,212,0.20), rgba(6,182,212,0.08))' : 'rgba(255,255,255,0.03)',
                border: todayCheckIn ? '1px solid rgba(6,182,212,0.40)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: todayCheckIn ? '0 0 20px rgba(6,182,212,0.20)' : 'none',
              }}>
              <ClipboardCheck className="w-8 h-8" style={{ color: todayCheckIn ? '#06b6d4' : '#ffffff15', filter: todayCheckIn ? 'drop-shadow(0 0 6px #06b6d4)' : 'none' }} />
            </div>
            <div>
              <p className="text-[9px] font-mono-cyber uppercase tracking-[0.35em] mb-1.5" style={{ color: 'rgba(6,182,212,0.65)', textShadow: '0 0 8px rgba(6,182,212,0.5)' }}>
                // check-in de hoje
              </p>
              <p className="text-base font-bold leading-tight" style={{ color: todayCheckIn ? '#ffffff' : 'rgba(255,255,255,0.3)' }}>
                {todayCheckIn ? "Check-in enviado ✓" : "Check-in pendente"}
              </p>
              <p className="text-xs mt-1.5 font-mono-cyber" style={{ color: 'rgba(6,182,212,0.55)' }}>
                {todayCheckIn
                  ? `Humor: ${todayCheckIn.mood_score}/5 · Energia: ${todayCheckIn.energy_score}/5`
                  : "// registre peso, humor e adesão hoje"}
              </p>
            </div>
          </div>
          {!todayCheckIn && (
            <Link to="/Progress"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-wider transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(6,182,212,0.10))',
                border: '1px solid rgba(6,182,212,0.40)',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(6,182,212,0.15)',
              }}>
              <ClipboardCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#06b6d4' }} />
              <span>FAZER</span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* ═══ MESSAGE ALERT ═══ */}
      {unreadMessages.length > 0 && (
        <motion.div variants={fadeUp}>
          <Link to="/Chat"
            className="flex items-center gap-4 px-6 py-4 rounded-xl border transition-all hover:scale-[1.02] group relative overflow-hidden"
            style={{
              borderColor: 'rgba(6,182,212,0.45)',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.06))',
              boxShadow: '0 0 30px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.08)',
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), rgba(168,85,247,0.6), transparent)', boxShadow: '0 0 10px rgba(6,182,212,0.5)' }} />
            <div className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse relative z-10"
              style={{ background: '#06b6d4', boxShadow: '0 0 12px rgba(6,182,212,1), 0 0 24px rgba(6,182,212,0.6)' }} />
            <MessageSquare className="w-5 h-5 flex-shrink-0 text-cyan-400 relative z-10"
              style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,1)) drop-shadow(0 0 12px rgba(6,182,212,0.6))' }} />
            <span className="text-sm flex-1 font-semibold text-cyan-100 relative z-10">
              {unreadMessages.length} mensagem{unreadMessages.length > 1 ? "ns" : ""} nova{unreadMessages.length > 1 ? "s" : ""} do professor
            </span>
            <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1.5 group-hover:text-cyan-300 transition-all relative z-10"
              style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.8))' }} />
            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.15), transparent 70%)` }} />
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
          <motion.div key={i} whileHover={{ scale: 1.06, y: -3 }} transition={{ duration: 0.2 }}
            className="relative rounded-xl p-5 border overflow-hidden group"
            style={{
              background: 'linear-gradient(145deg, rgba(6,4,18,0.98), rgba(3,2,12,0.99))',
              borderColor: `${s.accent}35`,
              boxShadow: `0 0 30px ${s.accent}10, inset 0 0 20px ${s.accent}05`,
            }}>
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)`, boxShadow: `0 0 12px ${s.accent}` }} />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l rounded-tl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ borderColor: s.accent, boxShadow: `0 0 8px ${s.accent}` }} />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r rounded-br opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ borderColor: s.accent }} />
            {/* Glow orb */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${s.accent}, transparent 70%)`, filter: 'blur(20px)' }} />
            {/* Dot indicator */}
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full"
              style={{ background: s.accent, boxShadow: `0 0 10px ${s.accent}, 0 0 20px ${s.accent}` }} />
            <s.icon className="w-5 h-5 mb-3" style={{ color: s.accent, filter: `drop-shadow(0 0 6px ${s.accent}) drop-shadow(0 0 12px ${s.accent}60)` }} />
            <p className="font-cyber text-4xl font-black leading-none"
              style={{ color: s.accent, textShadow: `0 0 25px ${s.accent}80, 0 0 50px ${s.accent}40` }}>
              {s.value}
            </p>
            <p className="text-[9px] mt-2 font-mono-cyber uppercase tracking-widest"
              style={{ color: `${s.accent}90`, textShadow: `0 0 8px ${s.accent}` }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${goalColor}60, ${goalColor})`, boxShadow: `0 0 10px ${goalColor}30` }} />
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.4em]"
            style={{ color: `${goalColor}90`, textShadow: `0 0 10px ${goalColor}` }}>▸ acesso rápido</p>
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${goalColor}, ${goalColor}60, transparent)`, boxShadow: `0 0 10px ${goalColor}30` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <motion.div key={i} whileHover={{ scale: 1.06, y: -4 }} transition={{ duration: 0.2 }}>
              <Link to={a.path}
                className="relative flex flex-col items-center gap-4 p-6 rounded-xl border transition-all group overflow-hidden block"
                style={{
                  borderColor: `${a.accent}40`,
                  background: 'linear-gradient(145deg, rgba(7,5,20,0.98), rgba(4,2,14,0.99))',
                  boxShadow: `0 0 35px ${a.accent}10, inset 0 0 25px ${a.accent}05`,
                }}>
                {/* Animated glow orb on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-400"
                  style={{ background: `radial-gradient(ellipse at 50% 60%, ${a.accent}20 0%, transparent 65%)`, filter: 'blur(20px)' }} />
                {/* Top scanline */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, boxShadow: `0 0 15px ${a.accent}` }} />
                {/* Bottom glow line */}
                <div className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${a.accent}40, transparent)` }} />
                {/* Corner accents on hover */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l rounded-tl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ borderColor: a.accent, boxShadow: `0 0 8px ${a.accent}` }} />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r rounded-br opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ borderColor: a.accent }} />
                {/* Icon container */}
                <div className="relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-115 group-hover:rotate-3"
                  style={{
                    background: `linear-gradient(135deg, ${a.accent}25, ${a.accent}12)`,
                    border: `1px solid ${a.accent}50`,
                    boxShadow: `0 0 25px ${a.accent}20, inset 0 0 15px ${a.accent}10`,
                  }}>
                  <a.icon className="w-6 h-6"
                    style={{ color: a.accent, filter: `drop-shadow(0 0 8px ${a.accent}) drop-shadow(0 0 16px ${a.accent}60) drop-shadow(0 0 24px ${a.accent}40)` }} />
                </div>
                <span className="relative text-xs font-bold text-center leading-tight group-hover:text-white transition-all duration-200 tracking-wider"
                  style={{ color: `${a.accent}90`, textShadow: `0 0 10px ${a.accent}` }}>
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