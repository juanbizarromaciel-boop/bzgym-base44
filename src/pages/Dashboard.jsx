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

  const { data: allStudents = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: messages = [] } = useQuery({ queryKey: ["messages"], queryFn: () => base44.entities.ChatMessage.list() });
  const { data: allPendingStudents = [] } = useQuery({ queryKey: ["pending"], queryFn: () => base44.entities.Student.filter({ active: false }) });

  // Personal só vê seus próprios alunos
  const students = (role === "personal" && user?.email)
    ? allStudents.filter(s => s.personal_id === user.email)
    : allStudents;
  const pendingStudents = (role === "personal" && user?.email)
    ? allPendingStudents.filter(s => s.personal_id === user.email)
    : allPendingStudents;

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

  if (!user) return null;

  if (role === "assinante") {
    navigate("/SubscriberDashboard", { replace: true });
    return null;
  }

  if (role === "user") {
    navigate("/StudentDashboard", { replace: true });
    return null;
  }

  if (role === "personal") {
    navigate("/PersonalDashboard", { replace: true });
    return null;
  }

  if (role === "admin") {
    navigate("/AdminDashboard", { replace: true });
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
    { label: "Alunos Ativos", value: activeStudents.length, icon: Users, accent: "#a855f7" },
    { label: "Planos de Treino", value: plans.length, icon: ClipboardList, accent: "#06b6d4" },
    { label: "Pendentes", value: pendingStudents.length, icon: UserPlus, accent: "#f59e0b" },
    { label: "Msgs não lidas", value: unreadMessages.length, icon: MessageSquare, accent: "#ec4899" },
  ];

  const quickActions = [
    { label: "Alunos", icon: Users, path: "/Students", accent: "#a855f7" },
    { label: "Planos de Treino", icon: ClipboardList, path: "/WorkoutPlans", accent: "#06b6d4" },
    { label: "Dietas", icon: Utensils, path: "/Diet", accent: "#ec4899" },
    { label: "Progresso", icon: TrendingUp, path: "/Progress", accent: "#f59e0b" },
    { label: "Chat", icon: MessageSquare, path: "/Chat", accent: "#06b6d4" },
    { label: "Calendário", icon: CalendarDays, path: "/ClassCalendar", accent: "#a855f7" },
    { label: "Financeiro", icon: DollarSign, path: "/Finance", accent: "#f59e0b" },
    { label: "BZ AI Coach", icon: Sparkles, path: "/AICoach", accent: "#ec4899" },
  ];

  return (
    <motion.div className="space-y-8 max-w-4xl" initial="hidden" animate="show" variants={stagger}>

      {/* ═══ HERO HEADER ═══ */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{
          background: `linear-gradient(135deg, rgba(168,85,247,0.10) 0%, rgba(7,7,26,0.98) 45%, rgba(6,182,212,0.07) 100%)`,
          border: '1px solid rgba(168,85,247,0.55)',
          boxShadow: '0 0 60px rgba(168,85,247,0.22), 0 0 120px rgba(168,85,247,0.08), 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(168,85,247,0.35)',
        }}>
        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)', transform: 'translate(35%, -35%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 65%)', transform: 'translate(-25%, 35%)' }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />

        {/* Top neon line — thick + glowing */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #a855f7 25%, #ec4899 50%, #06b6d4 75%, transparent 100%)', boxShadow: '0 0 12px rgba(168,85,247,0.9), 0 0 24px rgba(168,85,247,0.5)' }} />
        {/* Bottom faint line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), rgba(168,85,247,0.4), transparent)' }} />

        {/* Corner accents — bigger & brighter */}
        <div className="absolute top-0 left-0 w-7 h-7" style={{ borderTop: '2px solid #a855f7', borderLeft: '2px solid #a855f7', borderRadius: '4px 0 0 0', boxShadow: '-2px -2px 10px rgba(168,85,247,0.7)' }} />
        <div className="absolute top-0 right-0 w-7 h-7" style={{ borderTop: '2px solid #06b6d4', borderRight: '2px solid #06b6d4', borderRadius: '0 4px 0 0', boxShadow: '2px -2px 10px rgba(6,182,212,0.7)' }} />
        <div className="absolute bottom-0 left-0 w-7 h-7" style={{ borderBottom: '2px solid rgba(168,85,247,0.6)', borderLeft: '2px solid rgba(168,85,247,0.6)', borderRadius: '0 0 0 4px' }} />
        <div className="absolute bottom-0 right-0 w-7 h-7" style={{ borderBottom: '2px solid rgba(6,182,212,0.6)', borderRight: '2px solid rgba(6,182,212,0.6)', borderRadius: '0 0 4px 0' }} />

        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7, 0 0 16px rgba(168,85,247,0.6)' }} />
              <p className="text-[10px] font-mono-cyber tracking-[0.4em] uppercase"
                style={{ color: '#c084fc', textShadow: '0 0 10px rgba(168,85,247,0.8)' }}>
                ◈ {todayDate}
              </p>
            </div>
            <h1 className="font-cyber text-4xl md:text-5xl font-black tracking-widest leading-none"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #c084fc 45%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(168,85,247,0.8))',
              }}>
              {greeting},
            </h1>
            <h2 className="font-cyber text-3xl md:text-4xl font-black tracking-widest mt-1"
              style={{ color: '#a855f7', textShadow: '0 0 20px #a855f7, 0 0 50px rgba(168,85,247,0.6), 0 0 80px rgba(168,85,247,0.3)' }}>
              {userName.toUpperCase()}
            </h2>
            <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg w-fit"
              style={{ border: '1px solid rgba(6,182,212,0.45)', background: 'rgba(6,182,212,0.08)', boxShadow: '0 0 14px rgba(6,182,212,0.2)' }}>
              <Shield className="w-3.5 h-3.5" style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.9))' }} />
              <span className="text-xs font-mono-cyber tracking-widest uppercase"
                style={{ color: '#67e8f9', textShadow: '0 0 8px rgba(6,182,212,0.8)' }}>
                {isPersonal ? "personal trainer" : "administrador"}
              </span>
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
              style={{ border: '1px solid rgba(52,211,153,0.45)', background: 'rgba(52,211,153,0.08)', boxShadow: '0 0 16px rgba(52,211,153,0.2)' }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: '#34d399', filter: 'drop-shadow(0 0 6px rgba(52,211,153,1))' }} />
              <span className="text-xs font-semibold font-mono-cyber tracking-wider" style={{ color: '#6ee7b7', textShadow: '0 0 8px rgba(52,211,153,0.7)' }}>sistema ok</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl animate-pulse"
              style={{ border: '1px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.08)', boxShadow: '0 0 16px rgba(245,158,11,0.2)' }}>
              <Bell className="w-4 h-4" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.9))' }} />
              <span className="text-xs font-semibold font-mono-cyber" style={{ color: '#fcd34d', textShadow: '0 0 8px rgba(245,158,11,0.8)' }}>{alerts.length} alerta{alerts.length > 1 ? "s" : ""}</span>
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
              background: `linear-gradient(145deg, rgba(${s.accent === '#a855f7' ? '168,85,247' : s.accent === '#06b6d4' ? '6,182,212' : s.accent === '#f59e0b' ? '245,158,11' : '236,72,153'},0.10) 0%, var(--bg-void) 100%)`,
              borderColor: s.accent,
              boxShadow: `0 0 24px ${s.accent}40, 0 0 48px ${s.accent}18, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 ${s.accent}40`,
            }}>
            {/* Top glow line — full neon */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)`, boxShadow: `0 0 10px ${s.accent}, 0 0 20px ${s.accent}80` }} />
            {/* Tech corner TL */}
            <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none"
              style={{ borderTop: `2px solid ${s.accent}`, borderLeft: `2px solid ${s.accent}`, boxShadow: `-2px -2px 8px ${s.accent}60` }} />
            {/* Tech corner BR */}
            <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none"
              style={{ borderBottom: `1.5px solid ${s.accent}80`, borderRight: `1.5px solid ${s.accent}80` }} />
            {/* Corner pulse dot */}
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full neon-dot"
              style={{ background: s.accent, boxShadow: `0 0 8px ${s.accent}, 0 0 18px ${s.accent}` }} />
            {/* BG icon watermark */}
            <s.icon className="absolute bottom-1 right-1 w-14 h-14 opacity-[0.04]" style={{ color: s.accent }} />

            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${s.accent}22`, border: `1px solid ${s.accent}70`, boxShadow: `0 0 14px ${s.accent}40, inset 0 0 8px ${s.accent}18` }}>
                <s.icon className="w-4.5 h-4.5" style={{ color: '#ffffff', filter: `drop-shadow(0 0 6px ${s.accent}) drop-shadow(0 0 12px ${s.accent})` }} />
              </div>
            </div>
            <p className="font-cyber text-4xl font-black leading-none"
              style={{ color: '#ffffff', textShadow: `0 0 20px ${s.accent}, 0 0 50px ${s.accent}80, 0 0 80px ${s.accent}40` }}>
              {s.value}
            </p>
            <p className="text-[11px] mt-2 font-mono-cyber tracking-wider uppercase font-semibold"
              style={{ color: s.accent, textShadow: `0 0 8px ${s.accent}80`, opacity: 0.9 }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--neon-purple) 70%, transparent), transparent)' }} />
          <div className="flex items-center gap-2 px-3 py-1 rounded"
            style={{ border: '1px solid color-mix(in srgb, var(--neon-purple) 45%, transparent)', background: 'color-mix(in srgb, var(--neon-purple) 10%, transparent)', boxShadow: '0 0 12px color-mix(in srgb, var(--neon-purple) 25%, transparent)' }}>
            <div className="w-1 h-1 rounded-full" style={{ background: 'var(--neon-purple)', boxShadow: '0 0 5px var(--neon-purple)' }} />
            <p className="text-[10px] font-mono-cyber uppercase tracking-[0.35em]"
              style={{ color: '#ffffff', textShadow: '0 0 8px var(--neon-purple)' }}>acesso rápido</p>
          </div>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--neon-cyan) 50%, transparent))' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <motion.div key={i} whileHover={{ scale: 1.04, y: -4 }} transition={{ duration: 0.18 }}>
              <Link to={a.path}
                className="relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all group overflow-hidden block"
                style={{
                  borderColor: `${a.accent}70`,
                  background: `linear-gradient(145deg, color-mix(in srgb, ${a.accent} 8%, var(--bg-card)) 0%, var(--bg-void) 100%)`,
                  boxShadow: `0 4px 28px rgba(0,0,0,0.55), 0 0 20px ${a.accent}20, inset 0 1px 0 ${a.accent}30`,
                }}>
                {/* Tech corner TL */}
                <div className="absolute top-0 left-0 w-3.5 h-3.5 pointer-events-none"
                  style={{ borderTop: `2px solid ${a.accent}`, borderLeft: `2px solid ${a.accent}`, borderTopLeftRadius: '2px', boxShadow: `-1px -1px 6px ${a.accent}60` }} />
                {/* Tech corner BR */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 pointer-events-none"
                  style={{ borderBottom: `1.5px solid ${a.accent}80`, borderRight: `1.5px solid ${a.accent}80` }} />
                {/* Top scanline */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${a.accent}, ${a.accent}aa, transparent)` }} />
                {/* Ambient glow always on */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% -10%, ${a.accent}18, transparent 60%)` }} />
                {/* Hover glow boost */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 50%, ${a.accent}28, transparent 70%)` }} />

                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${a.accent}30, ${a.accent}12)`,
                    border: `1px solid ${a.accent}80`,
                    boxShadow: `0 0 18px ${a.accent}50, 0 0 36px ${a.accent}20, inset 0 0 10px ${a.accent}18`,
                  }}>
                  <a.icon className="w-5 h-5 transition-all duration-200"
                    style={{
                      color: '#ffffff',
                      filter: `drop-shadow(0 0 6px ${a.accent}) drop-shadow(0 0 14px ${a.accent}) drop-shadow(0 0 24px ${a.accent}80)`,
                    }} />
                </div>
                <span className="relative text-xs font-semibold text-center leading-tight font-mono-cyber tracking-wide"
                  style={{ color: '#ffffff', textShadow: `0 0 10px ${a.accent}aa` }}>
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