import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Users, Dumbbell, ClipboardList, TrendingUp, MessageSquare,
  UserPlus, Activity, Utensils, Sparkles, CalendarDays,
  ChevronRight, CheckCircle2, Bell, DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

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
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (role === "user") {
    navigate("/StudentDashboard", { replace: true });
    return null;
  }

  const isPersonal = role === "personal";
  const activeStudents = students.filter(s => s.active !== false);
  const unreadMessages = messages.filter(m => !m.is_trainer && !m.read);
  const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const alerts = [
    pendingStudents.length > 0 && { icon: UserPlus, color: "yellow", text: `${pendingStudents.length} aluno${pendingStudents.length > 1 ? "s" : ""} aguardando aprovação`, link: "/PendingStudents" },
    unreadMessages.length > 0 && { icon: MessageSquare, color: "cyan", text: `${unreadMessages.length} mensagem${unreadMessages.length > 1 ? "ns" : ""} sem resposta`, link: "/Chat" },
  ].filter(Boolean);

  const alertStyle = {
    yellow: "border-yellow-500/25 bg-yellow-500/5 text-yellow-300",
    cyan:   "border-cyan-500/25 bg-cyan-500/5 text-cyan-300",
  };

  const stats = [
    { label: "Alunos Ativos", value: activeStudents.length, icon: Users, accent: "#a855f7" },
    { label: "Planos de Treino", value: plans.length, icon: ClipboardList, accent: "#06b6d4" },
    { label: "Pendentes", value: pendingStudents.length, icon: UserPlus, accent: "#f59e0b" },
    { label: "Msgs não lidas", value: unreadMessages.length, icon: MessageSquare, accent: "#ec4899" },
  ];

  const quickActions = [
    { label: "Alunos", icon: Users, path: "/Students", accent: "#a855f7" },
    { label: "Planos de Treino", icon: ClipboardList, path: "/WorkoutPlans", accent: "#06b6d4" },
    { label: "Dietas", icon: Utensils, path: "/Diet", accent: "#10b981" },
    { label: "Progresso", icon: TrendingUp, path: "/Progress", accent: "#f59e0b" },
    { label: "Chat", icon: MessageSquare, path: "/Chat", accent: "#ec4899" },
    { label: "Calendário", icon: CalendarDays, path: "/ClassCalendar", accent: "#06b6d4" },
    { label: "Financeiro", icon: DollarSign, path: "/Finance", accent: "#10b981" },
    { label: "BZ AI Coach", icon: Sparkles, path: "/AICoach", accent: "#a855f7" },
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
              {userName ? `OLÁ, ${userName.toUpperCase()}` : "DASHBOARD"}
            </h1>
            <p className="text-sm mt-1 font-mono-cyber" style={{ color: 'rgba(192,132,252,0.5)' }}>
              {isPersonal ? "// personal trainer" : "// administrador"}
            </p>
          </div>
          {alerts.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/8">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-mono-cyber">tudo em dia</span>
            </div>
          )}
        </div>
        <div className="mt-4 h-px" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.6), rgba(6,182,212,0.3), transparent)' }} />
      </motion.div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-3.5 h-3.5 text-purple-400" />
            <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em]" style={{ color: 'rgba(192,132,252,0.6)' }}>Alertas</p>
          </div>
          {alerts.map((alert, i) => (
            <Link key={i} to={alert.link}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:brightness-125 group ${alertStyle[alert.color]}`}>
              <alert.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm flex-1 font-semibold">{alert.text}</span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </Link>
          ))}
        </motion.div>
      )}

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl p-4 border relative overflow-hidden"
            style={{
              background: `rgba(6,4,18,0.95)`,
              borderColor: `${s.accent}28`,
              boxShadow: `0 2px 20px rgba(0,0,0,0.3)`
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}70, transparent)` }} />
            <s.icon className="w-4 h-4 mb-3" style={{ color: s.accent }} />
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
              {/* hover glow */}
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