import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, ClipboardList, TrendingUp, MessageSquare,
  AlertTriangle, Trophy, Zap, ChevronRight, UserPlus,
  Activity, Clock, CheckCircle2, XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => setRole(u?.role || "user")).catch(() => setRole("user"));
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

  // Students without plans
  const studentsWithPlans = new Set(plans.map(p => p.student_id));
  const studentsWithoutPlan = activeStudents.filter(s => !studentsWithPlans.has(s.id));

  // Students inactive for 7+ days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const activeStudentIds = new Set(
    logs.filter(l => new Date(l.date) >= sevenDaysAgo).map(l => l.student_id)
  );
  const inactiveStudents = activeStudents.filter(s => !activeStudentIds.has(s.id) && logs.some(l => l.student_id === s.id));

  // Unread messages (from students)
  const unreadMessages = messages.filter(m => !m.is_trainer && !m.read);

  // PRs this week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const recentLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);

  // Recent workouts (last 5 unique sessions)
  const sessionMap = {};
  logs.forEach(log => {
    const key = `${log.student_id}__${log.date}`;
    if (!sessionMap[key]) sessionMap[key] = { student_id: log.student_id, date: log.date, count: 0, plan_id: log.workout_plan_id };
    sessionMap[key].count++;
  });
  const recentSessions = Object.values(sessionMap)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const getStudent = (id) => students.find(s => s.id === id);
  const getPlan = (id) => plans.find(p => p.id === id);
  const formatDate = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}`;
  };

  const alerts = [
    pendingStudents.length > 0 && {
      type: "warning",
      icon: UserPlus,
      color: "yellow",
      text: `${pendingStudents.length} aluno${pendingStudents.length > 1 ? "s" : ""} aguardando aprovação`,
      link: "/PendingStudents"
    },
    studentsWithoutPlan.length > 0 && {
      type: "danger",
      icon: ClipboardList,
      color: "red",
      text: `${studentsWithoutPlan.length} aluno${studentsWithoutPlan.length > 1 ? "s" : ""} sem plano de treino`,
      link: "/WorkoutPlans"
    },
    inactiveStudents.length > 0 && {
      type: "warning",
      icon: Clock,
      color: "orange",
      text: `${inactiveStudents.length} aluno${inactiveStudents.length > 1 ? "s" : ""} sem treinar há 7+ dias`,
      link: "/Students"
    },
    unreadMessages.length > 0 && {
      type: "info",
      icon: MessageSquare,
      color: "cyan",
      text: `${unreadMessages.length} mensagem${unreadMessages.length > 1 ? "ns" : ""} sem resposta`,
      link: "/Chat"
    },
  ].filter(Boolean);

  const alertColorMap = {
    yellow: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
    red: "border-red-500/30 bg-red-500/5 text-red-400",
    orange: "border-orange-500/30 bg-orange-500/5 text-orange-400",
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.25em] uppercase">Central de Controle</span>
        </div>
        <h1 className="font-cyber text-2xl md:text-3xl text-white tracking-widest">DASHBOARD</h1>
        <p className="text-purple-400/40 text-sm mt-1">Visão geral dos seus alunos e atividades</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-3">▸ alertas inteligentes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert, i) => (
              <Link
                key={i}
                to={alert.link}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:brightness-110 ${alertColorMap[alert.color]}`}
              >
                <alert.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium flex-1">{alert.text}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Alunos Ativos", value: activeStudents.length, icon: Users, color: "purple", sub: `${pendingStudents.length} pendentes` },
          { label: "Planos de Treino", value: plans.length, icon: ClipboardList, color: "cyan", sub: `${plans.filter(p => p.active !== false).length} ativos` },
          { label: "Treinos esta Semana", value: recentLogs.filter((l, i, arr) => arr.findIndex(x => x.student_id === l.student_id && x.date === l.date) === i).length, icon: Activity, color: "emerald", sub: "sessões únicas" },
          { label: "Mensagens", value: unreadMessages.length, icon: MessageSquare, color: "pink", sub: "sem resposta" },
        ].map((s, i) => {
          const colorMap = {
            purple: { border: "border-purple-500/20", icon: "text-purple-400", val: "text-purple-300", glow: "rgba(168,85,247,0.2)" },
            cyan: { border: "border-cyan-500/20", icon: "text-cyan-400", val: "text-cyan-300", glow: "rgba(6,182,212,0.2)" },
            emerald: { border: "border-emerald-500/20", icon: "text-emerald-400", val: "text-emerald-300", glow: "rgba(16,185,129,0.2)" },
            pink: { border: "border-pink-500/20", icon: "text-pink-400", val: "text-pink-300", glow: "rgba(236,72,153,0.2)" },
          };
          const c = colorMap[s.color];
          return (
            <div key={i} className={`rounded-xl p-5 border ${c.border} bg-black/60 transition-all hover:bg-black/80`}
              style={{ boxShadow: `inset 0 1px 0 ${c.glow}` }}>
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${c.icon}`} />
              </div>
              <p className={`text-3xl font-cyber font-bold ${c.val}`}>{s.value}</p>
              <p className="text-xs text-white/70 mt-1 font-medium">{s.label}</p>
              <p className="text-[10px] text-purple-500/40 font-mono-cyber mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-3">▸ ações rápidas</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Ver Alunos", icon: Users, page: "Students", color: "text-purple-400", border: "hover:border-purple-500/40" },
            { label: "Criar Treino", icon: ClipboardList, page: "WorkoutPlans", color: "text-cyan-400", border: "hover:border-cyan-500/40" },
            { label: "Ver Progresso", icon: TrendingUp, page: "Progress", color: "text-emerald-400", border: "hover:border-emerald-500/40" },
            { label: "Abrir Chat", icon: MessageSquare, page: "Chat", color: "text-pink-400", border: "hover:border-pink-500/40" },
          ].map((a, i) => (
            <Link key={i} to={createPageUrl(a.page)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border border-purple-900/20 bg-black/40 ${a.border} transition-all group`}>
              <a.icon className={`w-6 h-6 ${a.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-white/80 text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest">▸ treinos recentes dos alunos</p>
          <Link to={createPageUrl("Progress")} className="text-xs text-purple-400/60 hover:text-purple-400 transition-colors">Ver tudo →</Link>
        </div>
        <div className="rounded-xl border border-purple-900/20 bg-black/40 overflow-hidden">
          {recentSessions.length === 0 ? (
            <div className="p-8 text-center text-purple-500/30 text-sm font-mono-cyber">// nenhum treino registrado ainda</div>
          ) : (
            <div className="divide-y divide-purple-900/20">
              {recentSessions.map((session, i) => {
                const student = getStudent(session.student_id);
                const plan = getPlan(session.plan_id);
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-purple-500/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-cyber text-purple-400">
                        {student?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{student?.name || "Aluno"}</p>
                        <p className="text-xs text-purple-400/50">{plan?.name || "Treino livre"} · {session.count} exerc.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-purple-400/50 font-mono-cyber">{formatDate(session.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* No alerts success state */}
      {alerts.length === 0 && activeStudents.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Tudo em dia! Nenhum alerta no momento.</span>
        </div>
      )}
    </div>
  );
}