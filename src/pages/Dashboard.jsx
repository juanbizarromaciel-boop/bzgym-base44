import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Users, Dumbbell, ClipboardList, TrendingUp, MessageSquare,
  UserPlus, Utensils, Sparkles, CalendarDays,
  ChevronRight, CheckCircle2, Bell, DollarSign, Zap, Shield
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const role = user?.role || null;
  const userName = user?.full_name?.split(" ")[0] || "";

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: messages = [] } = useQuery({ queryKey: ["messages"], queryFn: () => base44.entities.ChatMessage.list() });
  const { data: pendingStudents = [] } = useQuery({ queryKey: ["pending"], queryFn: () => base44.entities.Student.filter({ active: false }) });

  if (userLoading) {
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

  if (role === "user") {
    navigate("/StudentDashboard", { replace: true });
    return null;
  }

  const isPersonal = role === "personal";
  const activeStudents = students.filter(s => s.active !== false);
  const unreadMessages = messages.filter(m => !m.is_trainer && !m.read);
  const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";

  const alerts = [
    pendingStudents.length > 0 && { icon: UserPlus, color: "yellow", text: `${pendingStudents.length} aluno${pendingStudents.length > 1 ? "s" : ""} aguardando aprovação`, link: "/PendingStudents" },
    unreadMessages.length > 0 && { icon: MessageSquare, color: "cyan", text: `${unreadMessages.length} mensagem${unreadMessages.length > 1 ? "ns" : ""} sem resposta`, link: "/Chat" },
  ].filter(Boolean);

  const stats = [
    { label: "Alunos Ativos", value: activeStudents.length, icon: Users, accent: "var(--neon-purple)" },
    { label: "Planos de Treino", value: plans.length, icon: ClipboardList, accent: "var(--neon-cyan)" },
    { label: "Pendentes", value: pendingStudents.length, icon: UserPlus, accent: "var(--neon-amber)" },
    { label: "Msgs não lidas", value: unreadMessages.length, icon: MessageSquare, accent: "var(--neon-pink)" },
  ];

  const quickActions = [
    { label: "Alunos", icon: Users, path: "/Students", accent: "var(--neon-purple)" },
    { label: "Planos de Treino", icon: ClipboardList, path: "/WorkoutPlans", accent: "var(--neon-cyan)" },
    { label: "Dietas", icon: Utensils, path: "/Diet", accent: "var(--neon-green)" },
    { label: "Progresso", icon: TrendingUp, path: "/Progress", accent: "var(--neon-amber)" },
    { label: "Chat", icon: MessageSquare, path: "/Chat", accent: "var(--neon-pink)" },
    { label: "Calendário", icon: CalendarDays, path: "/ClassCalendar", accent: "var(--neon-cyan)" },
    { label: "Financeiro", icon: DollarSign, path: "/Finance", accent: "var(--neon-green)" },
    { label: "BZ AI Coach", icon: Sparkles, path: "/AICoach", accent: "var(--neon-purple)" },
  ];

  return (
    <motion.div className="space-y-8 max-w-4xl" initial="hidden" animate="show" variants={stagger}>

      {/* ═══ HERO HEADER ═══ */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 96%, transparent) 0%, color-mix(in srgb, var(--bg-card2) 95%, transparent) 50%, color-mix(in srgb, var(--bg-void) 98%, transparent) 100%)`,
          border: '1px solid color-mix(in srgb, var(--neon-purple) 35%, transparent)',
          boxShadow: '0 0 80px color-mix(in srgb, var(--neon-purple) 15%, transparent), 0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 color-mix(in srgb, var(--neon-purple) 25%, transparent)',
        }}>
        {/* Background glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--neon-purple) 12%, transparent) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--neon-cyan) 8%, transparent) 0%, transparent 70%)', transform: 'translate(-20%, 30%)' }} />
        {/* Top neon line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--neon-purple) 80%, transparent) 30%, color-mix(in srgb, var(--neon-cyan) 60%, transparent) 70%, transparent 100%)' }} />
        {/* Corner accents */}
        <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2" style={{ borderColor: 'color-mix(in srgb, var(--neon-purple) 75%, transparent)', borderRadius: '2px 0 0 0' }} />
        <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2" style={{ borderColor: 'color-mix(in srgb, var(--neon-cyan) 75%, transparent)', borderRadius: '0 2px 0 0' }} />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2" style={{ borderColor: 'color-mix(in srgb, var(--neon-purple) 50%, transparent)', borderRadius: '0 0 0 2px' }} />
        <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2" style={{ borderColor: 'color-mix(in srgb, var(--neon-cyan) 50%, transparent)', borderRadius: '0 0 2px 0' }} />

        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.9)' }} />
              <p className="text-[10px] font-mono-cyber tracking-[0.4em] uppercase" style={{ color: 'color-mix(in srgb, var(--neon-purple) 80%, white)' }}>
                ◈ {todayDate}
              </p>
            </div>
            <h1 className="font-cyber text-4xl md:text-5xl font-black tracking-widest leading-none"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, var(--neon-purple) 60%, var(--neon-cyan) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 24px color-mix(in srgb, var(--neon-purple) 60%, transparent))',
              }}>
              {greeting},
            </h1>
            <h2 className="font-cyber text-3xl md:text-4xl font-black tracking-widest mt-1"
              style={{ color: 'var(--neon-purple)', textShadow: '0 0 30px color-mix(in srgb, var(--neon-purple) 70%, transparent), 0 0 60px color-mix(in srgb, var(--neon-purple) 30%, transparent)' }}>
              {userName.toUpperCase()}
            </h2>
            <div className="flex items-center gap-2 mt-3">
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--neon-cyan)' }} />
              <span className="text-xs font-mono-cyber tracking-widest uppercase"
                style={{ color: 'color-mix(in srgb, var(--neon-cyan) 90%, white)' }}>
                {isPersonal ? "personal trainer" : "administrador"}
              </span>
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8"
              style={{ boxShadow: '0 0 20px rgba(52,211,153,0.08)' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" style={{ filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.8))' }} />
              <span className="text-xs font-semibold font-mono-cyber tracking-wider" style={{ color: '#6ee7b7' }}>sistema ok</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-500/25 bg-orange-500/8 animate-pulse">
              <Bell className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold font-mono-cyber" style={{ color: '#fcd34d' }}>{alerts.length} alerta{alerts.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ ALERTS ═══ */}
      {alerts.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          {alerts.map((alert, i) => (
            <Link key={i} to={alert.link}
              className="flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all hover:brightness-110 group relative overflow-hidden"
              style={{
                borderColor: alert.color === "yellow" ? "rgba(245,158,11,0.3)" : "rgba(6,182,212,0.3)",
                background: alert.color === "yellow" ? "rgba(245,158,11,0.05)" : "rgba(6,182,212,0.05)",
              }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: alert.color === "yellow"
                  ? "linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)" }} />
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: alert.color === "yellow" ? "#f59e0b" : "#06b6d4",
                  boxShadow: `0 0 8px ${alert.color === "yellow" ? "rgba(245,158,11,0.9)" : "rgba(6,182,212,0.9)"}`,
                }} />
              <alert.icon className="w-4 h-4 flex-shrink-0" style={{ color: alert.color === "yellow" ? "#fbbf24" : "#22d3ee" }} />
              <span className="text-sm flex-1 font-semibold" style={{ color: alert.color === "yellow" ? "#fcd34d" : "#67e8f9" }}>
                {alert.text}
              </span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                style={{ color: alert.color === "yellow" ? "#fbbf24" : "#22d3ee" }} />
            </Link>
          ))}
        </motion.div>
      )}

      {/* ═══ STATS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={i}
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ duration: 0.18 }}
            className="relative rounded-xl p-5 border overflow-hidden cursor-default"
            style={{
              background: `linear-gradient(145deg, var(--bg-card) 0%, var(--bg-void) 100%)`,
              borderColor: `${s.accent}45`,
              boxShadow: `0 4px 28px rgba(0,0,0,0.5), 0 0 20px ${s.accent}10, inset 0 1px 0 ${s.accent}15`,
            }}>
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />
            {/* Corner dot */}
            <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
              style={{ background: s.accent, boxShadow: `0 0 8px ${s.accent}` }} />
            {/* BG icon watermark */}
            <s.icon className="absolute bottom-2 right-2 w-10 h-10 opacity-5" style={{ color: s.accent }} />

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${s.accent}18`, border: `1px solid ${s.accent}35` }}>
                <s.icon className="w-4 h-4" style={{ color: s.accent, filter: `drop-shadow(0 0 4px ${s.accent})` }} />
              </div>
            </div>
            <p className="font-cyber text-4xl font-black leading-none"
              style={{ color: s.accent, textShadow: `0 0 24px ${s.accent}, 0 0 48px ${s.accent}50` }}>
              {s.value}
            </p>
            <p className="text-[11px] mt-2 font-mono-cyber tracking-wider uppercase font-semibold"
              style={{ color: 'var(--text-primary)', opacity: 0.85 }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--neon-purple) 50%, transparent), transparent)' }} />
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.35em]"
            style={{ color: 'color-mix(in srgb, var(--neon-purple) 90%, white)' }}>▸ acesso rápido</p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--neon-cyan) 30%, transparent))' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <motion.div key={i} whileHover={{ scale: 1.04, y: -3 }} transition={{ duration: 0.18 }}>
              <Link to={a.path}
                className="relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all group overflow-hidden block"
                style={{
                  borderColor: `${a.accent}40`,
                  background: `linear-gradient(145deg, var(--bg-card) 0%, var(--bg-void) 100%)`,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 ${a.accent}12`,
                }}>
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 80%, ${a.accent}18, transparent 65%)` }} />
                {/* Top line */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${a.accent}90, transparent)` }} />
                {/* Bottom line always visible */}
                <div className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${a.accent}30, transparent)` }} />

                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${a.accent}20, ${a.accent}10)`,
                    border: `1px solid ${a.accent}40`,
                    boxShadow: `0 0 0 0 ${a.accent}40`,
                  }}>
                  <a.icon className="w-5 h-5 transition-all duration-200"
                    style={{
                      color: a.accent,
                      filter: `drop-shadow(0 0 6px ${a.accent}) drop-shadow(0 0 12px ${a.accent}50)`,
                    }} />
                </div>
                <span className="relative text-xs font-semibold text-center leading-tight transition-colors duration-200 group-hover:text-white"
                  style={{ color: 'var(--text-primary)', textShadow: 'none' }}>
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