import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, ClipboardList, TrendingUp, MessageSquare,
  UserPlus, Activity, Clock, CheckCircle2, ChevronRight,
  Zap, AlertTriangle, Bell
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    base44.auth.me().then((u) => {
      setRole(u?.role || "user");
      setUserName(u?.full_name?.split(" ")[0] || "");
    }).catch(() => setRole("user"));
  }, []);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: logs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => base44.entities.WorkoutLog.list("-created_date", 200) });
  const { data: messages = [] } = useQuery({ queryKey: ["messages"], queryFn: () => base44.entities.ChatMessage.list() });
  const { data: pendingStudents = [] } = useQuery({ queryKey: ["pending"], queryFn: () => base44.entities.Student.filter({ active: false }) });

  if (role === "user") {
    window.location.href = "/StudentDashboard";
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const activeStudents = students.filter(s => s.active !== false);
  const studentsWithPlans = new Set(plans.map(p => p.student_id));
  const studentsWithoutPlan = activeStudents.filter(s => !studentsWithPlans.has(s.id));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentActiveIds = new Set(logs.filter(l => new Date(l.date) >= sevenDaysAgo).map(l => l.student_id));
  const inactiveStudents = activeStudents.filter(s => !recentActiveIds.has(s.id) && logs.some(l => l.student_id === s.id));
  const unreadMessages = messages.filter(m => !m.is_trainer && !m.read);

  // Unique sessions last 7 days
  const weekSessions = [];
  const seen = new Set();
  logs.forEach(l => {
    const key = `${l.student_id}__${l.date}`;
    if (new Date(l.date) >= sevenDaysAgo && !seen.has(key)) { seen.add(key); weekSessions.push(l); }
  });

  // Recent sessions feed
  const sessionMap = {};
  logs.forEach(log => {
    const key = `${log.student_id}__${log.date}`;
    if (!sessionMap[key]) sessionMap[key] = { student_id: log.student_id, date: log.date, count: 0, plan_id: log.workout_plan_id };
    sessionMap[key].count++;
  });
  const recentSessions = Object.values(sessionMap).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const getStudent = id => students.find(s => s.id === id);
  const getPlan = id => plans.find(p => p.id === id);
  const formatDate = d => { if (!d) return ""; const [y, m, day] = d.split("-"); return `${day}/${m}`; };

  const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const alerts = [
    pendingStudents.length > 0 && { icon: UserPlus, color: "yellow", text: `${pendingStudents.length} aluno${pendingStudents.length > 1 ? "s" : ""} aguardando aprovação`, link: "/PendingStudents" },
    studentsWithoutPlan.length > 0 && { icon: ClipboardList, color: "red", text: `${studentsWithoutPlan.length} aluno${studentsWithoutPlan.length > 1 ? "s" : ""} sem plano`, link: "/WorkoutPlans" },
    inactiveStudents.length > 0 && { icon: Clock, color: "orange", text: `${inactiveStudents.length} aluno${inactiveStudents.length > 1 ? "s" : ""} sem treinar há 7+ dias`, link: "/Students" },
    unreadMessages.length > 0 && { icon: MessageSquare, color: "cyan", text: `${unreadMessages.length} mensagem${unreadMessages.length > 1 ? "ns" : ""} sem resposta`, link: "/Chat" },
  ].filter(Boolean);

  const alertStyle = {
    yellow: "border-yellow-500/25 bg-yellow-500/5 text-yellow-300",
    red:    "border-red-500/25 bg-red-500/5 text-red-300",
    orange: "border-orange-500/25 bg-orange-500/5 text-orange-300",
    cyan:   "border-cyan-500/25 bg-cyan-500/5 text-cyan-300",
  };

  const stats = [
    { label: "Alunos Ativos", value: activeStudents.length, sub: `${pendingStudents.length} pendentes`, icon: Users, accent: "#a855f7", glow: "rgba(168,85,247,0.15)" },
    { label: "Planos Criados", value: plans.length, sub: `${plans.filter(p=>p.active!==false).length} ativos`, icon: ClipboardList, accent: "#06b6d4", glow: "rgba(6,182,212,0.15)" },
    { label: "Treinos / 7 dias", value: weekSessions.length, sub: "sessões únicas", icon: Activity, accent: "#10b981", glow: "rgba(16,185,129,0.15)" },
    { label: "Mensagens", value: unreadMessages.length, sub: "sem resposta", icon: MessageSquare, accent: "#ec4899", glow: "rgba(236,72,153,0.15)" },
  ];

  const quickActions = [
    { label: "Alunos", icon: Users, page: "Students", accent: "#a855f7" },
    { label: "Treinos", icon: ClipboardList, page: "WorkoutPlans", accent: "#06b6d4" },
    { label: "Progresso", icon: TrendingUp, page: "Progress", accent: "#10b981" },
    { label: "Chat", icon: MessageSquare, page: "Chat", accent: "#ec4899" },
  ];

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="relative">
        <p className="text-[10px] font-mono-cyber text-purple-500/35 tracking-[0.3em] uppercase mb-2">
          {todayDate}
        </p>
        <div className="flex items-end gap-4">
          <div>
            <h1 className="font-cyber text-3xl md:text-4xl text-white tracking-widest leading-none"
              style={{ textShadow: '0 0 30px rgba(168,85,247,0.3)' }}>
              {userName ? `OLÁ, ${userName.toUpperCase()}` : "DASHBOARD"}
            </h1>
            <p className="text-purple-400/40 text-sm mt-2 font-mono-cyber">// central de controle · professor</p>
          </div>
          {alerts.length === 0 && activeStudents.length > 0 && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-mono-cyber">tudo em dia</span>
            </div>
          )}
        </div>
        {/* Accent line */}
        <div className="mt-5 h-px bg-gradient-to-r from-purple-500/30 via-purple-500/10 to-transparent" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-3 h-3 text-purple-500/40" />
            <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-[0.25em]">Alertas</p>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 text-[10px] font-mono-cyber">{alerts.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.map((alert, i) => (
              <Link key={i} to={alert.link}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:brightness-125 group ${alertStyle[alert.color]}`}>
                <alert.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1 font-medium">{alert.text}</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="relative rounded-xl p-5 border overflow-hidden transition-all group cursor-default"
            style={{
              background: `radial-gradient(ellipse at top left, ${s.glow}, transparent 70%), rgba(4,4,12,0.95)`,
              borderColor: `${s.accent}22`,
              boxShadow: `inset 0 1px 0 ${s.glow}`
            }}>
            {/* top line accent */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}55, transparent)` }} />
            <s.icon className="w-4 h-4 mb-4 opacity-70" style={{ color: s.accent }} />
            <p className="font-cyber text-3xl font-bold" style={{ color: s.accent, textShadow: `0 0 20px ${s.glow}` }}>
              {s.value}
            </p>
            <p className="text-xs text-white/65 mt-1 font-medium">{s.label}</p>
            <p className="text-[10px] text-purple-500/35 font-mono-cyber mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-mono-cyber text-purple-500/35 uppercase tracking-[0.25em] mb-3">▸ ações rápidas</p>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <Link key={i} to={createPageUrl(a.page)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-purple-900/20 bg-black/50 hover:bg-black/80 transition-all group"
              style={{ '--accent': a.accent }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: `${a.accent}15`, border: `1px solid ${a.accent}25` }}>
                <a.icon className="w-5 h-5" style={{ color: a.accent }} />
              </div>
              <span className="text-xs font-medium text-white/60 group-hover:text-white/90 transition-colors text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono-cyber text-purple-500/35 uppercase tracking-[0.25em]">▸ treinos recentes</p>
          <Link to={createPageUrl("Progress")} className="text-[11px] text-purple-400/50 hover:text-purple-400 transition-colors font-mono-cyber">
            ver tudo →
          </Link>
        </div>
        <div className="rounded-xl border border-purple-900/20 overflow-hidden"
          style={{ background: 'rgba(4,4,12,0.9)' }}>
          {recentSessions.length === 0 ? (
            <div className="p-10 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-3 text-purple-500/20" />
              <p className="text-sm text-purple-500/30 font-mono-cyber">// nenhum treino registrado ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-purple-900/15">
              {recentSessions.map((session, i) => {
                const student = getStudent(session.student_id);
                const plan = getPlan(session.plan_id);
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-purple-500/4 transition-colors group">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-cyber flex-shrink-0"
                      style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}>
                      {student?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{student?.name || "Aluno"}</p>
                      <p className="text-[11px] text-purple-400/40 font-mono-cyber truncate">
                        {plan?.name || "Treino livre"} · {session.count} exerc.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
                      <span className="text-[11px] text-purple-400/40 font-mono-cyber">{formatDate(session.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}