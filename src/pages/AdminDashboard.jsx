import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, UserCog, Dumbbell, Utensils, ClipboardCheck, MessageSquare,
  DollarSign, Activity, AlertTriangle, CheckCircle2, Shield, BarChart3,
  FileImage, Sparkles, ChevronRight, Bell, TrendingUp, Lock, Newspaper
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const StatCard = ({ label, value, icon: Icon, color, link }) => {
  const inner = (
    <motion.div whileHover={{ scale: 1.03, y: -2 }} transition={{ duration: 0.18 }}
      className="relative rounded-xl p-4 border overflow-hidden cursor-pointer"
      style={{ borderColor: `${color}35`, background: `${color}08`, boxShadow: `0 0 20px ${color}15` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <Icon className="w-5 h-5 mb-2" style={{ color }} />
      <p className="font-cyber text-3xl font-black text-white" style={{ textShadow: `0 0 16px ${color}` }}>{value ?? "—"}</p>
      <p className="text-[10px] font-mono-cyber mt-1 tracking-wider uppercase" style={{ color: `${color}aa` }}>{label}</p>
    </motion.div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== "admin") navigate("/AccessDenied");
    }).catch(() => {});
  }, [navigate]);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: workoutPlans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: dietPlans = [] } = useQuery({ queryKey: ["dietPlans"], queryFn: () => base44.entities.DietPlan.list() });
  const { data: messages = [] } = useQuery({ queryKey: ["messages"], queryFn: () => base44.entities.ChatMessage.list() });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: () => base44.entities.Payment.list() });
  const { data: checkIns = [] } = useQuery({ queryKey: ["checkIns"], queryFn: () => base44.entities.CheckIn.list() });
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list() });
  const { data: hormonalEvents = [] } = useQuery({ queryKey: ["calendarioHormonal"], queryFn: () => base44.entities.CalendarioHormonal.list("-created_date", 100) });
  const { data: sportsNews = [] } = useQuery({ queryKey: ["adminSportsNewsStats"], queryFn: () => base44.entities.SportsNews.list("-created_date", 100) });

  const activeStudents = students.filter(s => s.active !== false);
  const pendingStudents = students.filter(s => s.active === false);
  const personalUsers = students.filter(s => s.personal_id);
  const uniquePersonals = [...new Set(students.map(s => s.personal_id).filter(Boolean))];
  const unreadMessages = messages.filter(m => !m.read);
  const pendingPayments = payments.filter(p => p.status === "pendente" || p.status === "atrasado");
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCheckIns = checkIns.filter(c => c.date === todayStr);
  const activeHormonal = hormonalEvents.filter(e => e.status === "ativo");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";
  const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const userName = user?.full_name?.split(" ")[0] || "";

  if (!user || user.role !== "admin") return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  const statsMain = [
    { label: "Alunos Ativos", value: activeStudents.length, icon: Users, color: "#a855f7", link: "/Students" },
    { label: "Personais", value: uniquePersonals.length, icon: UserCog, color: "#06b6d4", link: "/PersonalManagement" },
    { label: "Pend. Aprovação", value: pendingStudents.length, icon: AlertTriangle, color: "#f59e0b", link: "/PendingStudents" },
    { label: "Msgs não lidas", value: unreadMessages.length, icon: MessageSquare, color: "#ec4899", link: "/Chat" },
  ];

  const statsSecondary = [
    { label: "Planos Treino", value: workoutPlans.length, icon: Dumbbell, color: "#a855f7", link: "/WorkoutPlans" },
    { label: "Planos Dieta", value: dietPlans.length, icon: Utensils, color: "#10b981", link: "/Diet" },
    { label: "Check-ins Hoje", value: todayCheckIns.length, icon: ClipboardCheck, color: "#06b6d4", link: "/Progress" },
    { label: "Pag. Pendentes", value: pendingPayments.length, icon: DollarSign, color: "#f97316", link: "/Finance" },
    { label: "Exercícios", value: exercises.length, icon: Activity, color: "#8b5cf6", link: "/ExerciseLibrary" },
    { label: "Cal. Hormonal", value: activeHormonal.length, icon: Lock, color: "#84cc16", link: "/CalendarioHormonalAdmin" },
    { label: "Notícias", value: sportsNews.length, icon: Newspaper, color: "#06b6d4", link: "/NewsManagement" },
    { label: "Relatórios IA", value: dietPlans.length + workoutPlans.length, icon: Sparkles, color: "#ec4899", link: "/Relatorios" },
    { label: "Evolução", value: checkIns.length, icon: TrendingUp, color: "#f59e0b", link: "/Progress" },
  ];

  const alerts = [
    pendingStudents.length > 0 && { text: `${pendingStudents.length} aluno(s) aguardando aprovação`, link: "/PendingStudents", color: "#f59e0b", icon: AlertTriangle },
    unreadMessages.length > 0 && { text: `${unreadMessages.length} mensagem(ns) sem resposta`, link: "/Chat", color: "#ec4899", icon: MessageSquare },
    pendingPayments.length > 0 && { text: `${pendingPayments.length} pagamento(s) em atraso ou pendente`, link: "/Finance", color: "#f97316", icon: DollarSign },
  ].filter(Boolean);

  const quickActions = [
    { label: "Alunos", icon: Users, path: "/Students", color: "#a855f7" },
    { label: "Personais", icon: UserCog, path: "/PersonalManagement", color: "#06b6d4" },
    { label: "Treinos", icon: Dumbbell, path: "/WorkoutPlans", color: "#ec4899" },
    { label: "Dietas", icon: Utensils, path: "/Diet", color: "#10b981" },
    { label: "Progresso", icon: BarChart3, path: "/Progress", color: "#f59e0b" },
    { label: "Financeiro", icon: DollarSign, path: "/Finance", color: "#f97316" },
    { label: "Relatórios", icon: BarChart3, path: "/Relatorios", color: "#06b6d4" },
    { label: "Notícias", icon: Newspaper, path: "/NewsManagement", color: "#06b6d4" },
    { label: "Cal. Hormonal", icon: Lock, path: "/CalendarioHormonalAdmin", color: "#84cc16" },
    { label: "Chat", icon: MessageSquare, path: "/Chat", color: "#ec4899" },
    { label: "Exercícios", icon: Activity, path: "/ExerciseLibrary", color: "#8b5cf6" },
    { label: "Documentos", icon: FileImage, path: "/StudentDocuments", color: "#a855f7" },
    { label: "AI Coach", icon: Sparkles, path: "/AICoach", color: "#c084fc" },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6 max-w-5xl">

      {/* Hero */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(7,7,26,0.98) 45%, rgba(6,182,212,0.07))', border: '1px solid rgba(168,85,247,0.45)', boxShadow: '0 0 60px rgba(168,85,247,0.18), 0 8px 40px rgba(0,0,0,0.6)' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #a855f7 25%, #ec4899 50%, #06b6d4 75%, transparent)', boxShadow: '0 0 12px rgba(168,85,247,0.9)' }} />
        <div className="absolute top-0 left-0 w-6 h-6" style={{ borderTop: '2px solid #a855f7', borderLeft: '2px solid #a855f7' }} />
        <div className="absolute top-0 right-0 w-6 h-6" style={{ borderTop: '2px solid #06b6d4', borderRight: '2px solid #06b6d4' }} />

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-mono-cyber tracking-[0.4em] uppercase mb-2" style={{ color: '#c084fc' }}>◈ {todayDate}</p>
            <h1 className="font-cyber text-4xl md:text-5xl font-black tracking-widest" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #c084fc 45%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {greeting},
            </h1>
            <h2 className="font-cyber text-3xl font-black tracking-widest mt-1" style={{ color: '#a855f7', textShadow: '0 0 20px #a855f7' }}>{userName.toUpperCase()}</h2>
            <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg w-fit" style={{ border: '1px solid rgba(6,182,212,0.45)', background: 'rgba(6,182,212,0.08)' }}>
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono-cyber tracking-widest uppercase text-cyan-300">super administrador</span>
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ border: '1px solid rgba(52,211,153,0.45)', background: 'rgba(52,211,153,0.08)' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono-cyber text-emerald-300">sistema ok</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl animate-pulse" style={{ border: '1px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.08)' }}>
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono-cyber text-amber-300">{alerts.length} alerta(s)</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts.map((alert, i) => (
        <motion.div key={i} variants={fadeUp}>
          <Link to={alert.link} className="flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all hover:brightness-110 group"
            style={{ borderColor: `${alert.color}30`, background: `${alert.color}06` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: alert.color, boxShadow: `0 0 8px ${alert.color}` }} />
            <alert.icon className="w-4 h-4" style={{ color: alert.color }} />
            <span className="text-sm flex-1 font-semibold" style={{ color: `${alert.color}dd` }}>{alert.text}</span>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: alert.color }} />
          </Link>
        </motion.div>
      ))}

      {/* Main stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsMain.map((s, i) => <StatCard key={i} {...s} />)}
      </motion.div>

      {/* Secondary stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsSecondary.map((s, i) => <StatCard key={i} {...s} />)}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.7), transparent)' }} />
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.35em]" style={{ color: 'rgba(168,85,247,0.80)' }}>acesso rápido</p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5))' }} />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.path}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:brightness-110 group"
              style={{ borderColor: `${a.color}25`, background: `${a.color}06` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${a.color}18`, border: `1px solid ${a.color}35` }}>
                <a.icon className="w-4.5 h-4.5" style={{ color: a.color, filter: `drop-shadow(0 0 5px ${a.color})` }} />
              </div>
              <span className="text-[9px] font-mono-cyber text-center leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Security info */}
      <motion.div variants={fadeUp} className="flex items-start gap-3 p-4 rounded-xl border"
        style={{ borderColor: 'rgba(168,85,247,0.15)', background: 'rgba(168,85,247,0.04)' }}>
        <Shield className="w-4 h-4 text-purple-400/50 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-mono-cyber text-purple-300/60">AUDITORIA DE SEGURANÇA</p>
          <p className="text-[10px] text-purple-400/35 font-mono-cyber mt-1">
            Admin acessa todos os dados · {uniquePersonals.length} personal(is) isolados · Calendário Hormonal com {activeHormonal.length} evento(s) ativo(s) · Permissões RLS ativas em todas as entidades
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}