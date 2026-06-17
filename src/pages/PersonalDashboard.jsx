import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Users, Dumbbell, ClipboardList, MessageSquare, UserPlus,
  Utensils, DollarSign, ChevronRight, CheckCircle2, Bell,
  Zap, ClipboardCheck, TrendingUp, Calendar
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const ACCENT = { purple: "#a855f7", cyan: "#06b6d4", pink: "#ec4899", amber: "#f59e0b", green: "#10b981" };

export default function PersonalDashboard() {
  const { user, loading } = useCurrentUser();

  const { data: allStudents = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: messages = [] } = useQuery({ queryKey: ["messages"], queryFn: () => base44.entities.ChatMessage.list() });
  const { data: checkIns = [] } = useQuery({ queryKey: ["checkIns"], queryFn: () => base44.entities.CheckIn.list() });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: () => base44.entities.Payment.list() });

  const myStudents = user?.email ? allStudents.filter(s => s.personal_id === user.email) : allStudents;
  const activeStudents = myStudents.filter(s => s.active !== false);
  const pendingStudents = myStudents.filter(s => s.active === false);
  const unreadMessages = messages.filter(m => !m.is_trainer && !m.read);

  const todayStr = new Date().toISOString().split("T")[0];
  const recentCheckIns = checkIns.filter(c => c.date === todayStr);
  const pendingCheckIns = activeStudents.filter(s => !checkIns.find(c => c.student_id === s.id && c.date === todayStr));

  const overduePayments = payments.filter(p => p.status === "atrasado" || p.status === "pendente");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";
  const userName = user?.full_name?.split(" ")[0] || "";
  const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { label: "Alunos Ativos", value: activeStudents.length, icon: Users, accent: ACCENT.purple },
    { label: "Check-ins Hoje", value: recentCheckIns.length, icon: ClipboardCheck, accent: ACCENT.cyan },
    { label: "Msgs não lidas", value: unreadMessages.length, icon: MessageSquare, accent: ACCENT.pink },
    { label: "Pend. Aprovação", value: pendingStudents.length, icon: UserPlus, accent: ACCENT.amber },
  ];

  const quickActions = [
    { label: "Alunos", icon: Users, path: "/Students", accent: ACCENT.purple },
    { label: "Planos de Treino", icon: ClipboardList, path: "/WorkoutPlans", accent: ACCENT.cyan },
    { label: "Dietas", icon: Utensils, path: "/Diet", accent: ACCENT.green },
    { label: "Progresso", icon: TrendingUp, path: "/Progress", accent: ACCENT.amber },
    { label: "Chat", icon: MessageSquare, path: "/Chat", accent: ACCENT.pink },
    { label: "Financeiro", icon: DollarSign, path: "/Finance", accent: ACCENT.amber },
    { label: "Calendário", icon: Calendar, path: "/ClassCalendar", accent: ACCENT.purple },
    { label: "Novos Alunos", icon: UserPlus, path: "/PendingStudents", accent: ACCENT.cyan },
  ];

  return (
    <motion.div className="space-y-6 max-w-4xl" initial="hidden" animate="show" variants={stagger}>

      {/* Hero */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.10) 0%, rgba(7,7,26,0.98) 45%, rgba(6,182,212,0.07) 100%)',
          border: '1px solid rgba(168,85,247,0.45)',
          boxShadow: '0 0 60px rgba(168,85,247,0.18), 0 8px 40px rgba(0,0,0,0.6)',
        }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #a855f7 25%, #ec4899 50%, #06b6d4 75%, transparent 100%)', boxShadow: '0 0 12px rgba(168,85,247,0.9)' }} />
        <div className="absolute top-0 left-0 w-7 h-7" style={{ borderTop: '2px solid #a855f7', borderLeft: '2px solid #a855f7', borderRadius: '4px 0 0 0', boxShadow: '-2px -2px 10px rgba(168,85,247,0.7)' }} />
        <div className="absolute top-0 right-0 w-7 h-7" style={{ borderTop: '2px solid #06b6d4', borderRight: '2px solid #06b6d4', borderRadius: '0 4px 0 0', boxShadow: '2px -2px 10px rgba(6,182,212,0.7)' }} />

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-mono-cyber tracking-[0.4em] uppercase mb-2" style={{ color: '#c084fc' }}>◈ {todayDate}</p>
            <h1 className="font-cyber text-4xl md:text-5xl font-black tracking-widest leading-none"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #c084fc 45%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(168,85,247,0.8))' }}>
              {greeting},
            </h1>
            <h2 className="font-cyber text-3xl md:text-4xl font-black tracking-widest mt-1"
              style={{ color: '#a855f7', textShadow: '0 0 20px #a855f7, 0 0 50px rgba(168,85,247,0.6)' }}>
              {userName.toUpperCase()}
            </h2>
            <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg w-fit"
              style={{ border: '1px solid rgba(168,85,247,0.45)', background: 'rgba(168,85,247,0.08)' }}>
              <Dumbbell className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
              <span className="text-xs font-mono-cyber tracking-widest uppercase" style={{ color: '#d8b4fe' }}>personal trainer</span>
            </div>
          </div>

          {pendingCheckIns.length > 0 ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl animate-pulse"
              style={{ border: '1px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.08)' }}>
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono-cyber text-amber-300">{pendingCheckIns.length} check-in{pendingCheckIns.length > 1 ? "s" : ""} pendente{pendingCheckIns.length > 1 ? "s" : ""}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ border: '1px solid rgba(52,211,153,0.45)', background: 'rgba(52,211,153,0.08)' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono-cyber text-emerald-300">tudo em dia</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Alerts */}
      {[
        pendingStudents.length > 0 && { icon: UserPlus, color: "amber", text: `${pendingStudents.length} aluno${pendingStudents.length > 1 ? "s" : ""} aguardando aprovação`, link: "/PendingStudents" },
        unreadMessages.length > 0 && { icon: MessageSquare, color: "cyan", text: `${unreadMessages.length} mensagem${unreadMessages.length > 1 ? "ns" : ""} sem resposta`, link: "/Chat" },
        overduePayments.length > 0 && { icon: DollarSign, color: "pink", text: `${overduePayments.length} pagamento${overduePayments.length > 1 ? "s" : ""} pendente${overduePayments.length > 1 ? "s" : ""}`, link: "/Finance" },
      ].filter(Boolean).map((alert, i) => {
        const colors = { amber: ["rgba(245,158,11,0.3)","rgba(245,158,11,0.05)","#fbbf24","#fcd34d"], cyan: ["rgba(6,182,212,0.3)","rgba(6,182,212,0.05)","#22d3ee","#67e8f9"], pink: ["rgba(236,72,153,0.3)","rgba(236,72,153,0.05)","#f472b6","#fbcfe8"] }[alert.color];
        return (
          <motion.div key={i} variants={fadeUp}>
            <Link to={alert.link}
              className="flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all hover:brightness-110 group relative overflow-hidden"
              style={{ borderColor: colors[0], background: colors[1] }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${colors[2]}60, transparent)` }} />
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[2], boxShadow: `0 0 8px ${colors[2]}` }} />
              <alert.icon className="w-4 h-4 flex-shrink-0" style={{ color: colors[2] }} />
              <span className="text-sm flex-1 font-semibold" style={{ color: colors[3] }}>{alert.text}</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: colors[2] }} />
            </Link>
          </motion.div>
        );
      })}

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={i} whileHover={{ scale: 1.03, y: -2 }} transition={{ duration: 0.18 }}
            className="relative rounded-xl p-5 border overflow-hidden"
            style={{ borderColor: `${s.accent}50`, background: `linear-gradient(145deg, ${s.accent}10, var(--bg-void))`, boxShadow: `0 0 24px ${s.accent}30, inset 0 1px 0 ${s.accent}30` }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)`, boxShadow: `0 0 10px ${s.accent}` }} />
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background: s.accent, boxShadow: `0 0 8px ${s.accent}` }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${s.accent}20`, border: `1px solid ${s.accent}60`, boxShadow: `0 0 12px ${s.accent}30` }}>
              <s.icon className="w-4 h-4" style={{ color: '#ffffff', filter: `drop-shadow(0 0 5px ${s.accent})` }} />
            </div>
            <p className="font-cyber text-4xl font-black" style={{ color: '#ffffff', textShadow: `0 0 20px ${s.accent}` }}>{s.value}</p>
            <p className="text-[11px] mt-1 font-mono-cyber tracking-wider uppercase" style={{ color: s.accent }}>{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Pending Check-ins from students */}
      {pendingCheckIns.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.6), transparent)' }} />
            <p className="text-[10px] font-mono-cyber uppercase tracking-[0.35em]" style={{ color: 'rgba(245,158,11,0.80)' }}>⚠ check-ins pendentes hoje</p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4))' }} />
          </div>
          <div className="space-y-2">
            {pendingCheckIns.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{ borderColor: 'rgba(245,158,11,0.20)', background: 'rgba(245,158,11,0.04)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)' }}>
                  <span className="text-xs font-cyber text-amber-300">{s.name?.substring(0, 2).toUpperCase()}</span>
                </div>
                <span className="text-sm text-white font-medium flex-1">{s.name}</span>
                <span className="text-[10px] font-mono-cyber text-amber-400/60">sem check-in</span>
              </div>
            ))}
            {pendingCheckIns.length > 5 && (
              <p className="text-[10px] font-mono-cyber text-center text-purple-400/40">+ {pendingCheckIns.length - 5} mais</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.7), transparent)' }} />
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.35em]" style={{ color: 'rgba(168,85,247,0.80)' }}>acesso rápido</p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.50))' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <motion.div key={i} whileHover={{ scale: 1.04, y: -4 }} transition={{ duration: 0.18 }}>
              <Link to={a.path}
                className="relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all group overflow-hidden block"
                style={{ borderColor: `${a.accent}60`, background: `linear-gradient(145deg, ${a.accent}08, var(--bg-void))`, boxShadow: `0 4px 28px rgba(0,0,0,0.55), 0 0 16px ${a.accent}15` }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${a.accent}, ${a.accent}aa, transparent)` }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 50%, ${a.accent}20, transparent 70%)` }} />
                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${a.accent}22`, border: `1px solid ${a.accent}70`, boxShadow: `0 0 16px ${a.accent}40` }}>
                  <a.icon className="w-5 h-5" style={{ color: '#ffffff', filter: `drop-shadow(0 0 6px ${a.accent})` }} />
                </div>
                <span className="relative text-xs font-semibold text-center font-mono-cyber tracking-wide" style={{ color: '#ffffff' }}>{a.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}