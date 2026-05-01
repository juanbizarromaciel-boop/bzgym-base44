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
        <p className="text-[10px] font-mono-cyber tracking-[0.35em] uppercase mb-3"
          style={{ color: 'rgba(192,132,252,0.6)' }}>
          ◈ {todayDate}
        </p>
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <h1 className="font-cyber text-3xl md:text-5xl font-black tracking-widest leading-none"
              style={{
                color: '#ffffff',
                textShadow: '0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.2)'
              }}>
              {userName ? `OLÁ, ${userName.toUpperCase()}` : "DASHBOARD"}
            </h1>
            <p className="text-sm mt-2 font-mono-cyber" style={{ color: 'rgba(192,132,252,0.55)' }}>
              // central de controle · personal trainer
            </p>
          </div>
          {alerts.length === 0 && activeStudents.length > 0 && (
            <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/8"
              style={{ boxShadow: '0 0 15px rgba(16,185,129,0.1)' }}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-mono-cyber">sistema operacional</span>
            </div>
          )}
        </div>
        {/* Accent lines */}
        <div className="mt-6 flex gap-1">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.6), rgba(6,182,212,0.3), transparent)' }} />
          <div className="w-2 h-px bg-purple-500/60" />
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-3.5 h-3.5" style={{ color: 'rgba(192,132,252,0.7)' }} />
            <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em]" style={{ color: 'rgba(192,132,252,0.6)' }}>Alertas do Sistema</p>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono-cyber font-bold"
              style={{ background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.35)' }}>
              {alerts.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.map((alert, i) => (
              <Link key={i} to={alert.link}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:brightness-125 hover:scale-[1.01] group ${alertStyle[alert.color]}`}
                style={{ backdropFilter: 'blur(8px)' }}>
                <alert.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1 font-semibold">{alert.text}</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-70 -translate-x-1 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="relative rounded-xl p-5 border overflow-hidden transition-all hover:scale-[1.02] cursor-default"
            style={{
              background: `radial-gradient(ellipse at top left, ${s.glow}, transparent 65%), rgba(6,4,18,0.95)`,
              borderColor: `${s.accent}30`,
              boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 ${s.glow}`
            }}>
            {/* top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}80, transparent)` }} />
            {/* corner decoration */}
            <div className="absolute bottom-0 right-0 w-6 h-6 overflow-hidden">
              <div className="absolute bottom-0 right-0 w-px h-4" style={{ background: `${s.accent}40` }} />
              <div className="absolute bottom-0 right-0 h-px w-4" style={{ background: `${s.accent}40` }} />
            </div>
            <s.icon className="w-4 h-4 mb-4" style={{ color: s.accent, filter: `drop-shadow(0 0 6px ${s.accent})` }} />
            <p className="font-cyber text-4xl font-black" style={{ color: s.accent, textShadow: `0 0 25px ${s.accent}80` }}>
              {s.value}
            </p>
            <p className="text-sm mt-1.5 font-semibold" style={{ color: 'rgba(240,230,255,0.85)' }}>{s.label}</p>
            <p className="text-[11px] font-mono-cyber mt-0.5" style={{ color: 'rgba(192,132,252,0.55)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em] mb-3"
          style={{ color: 'rgba(192,132,252,0.55)' }}>▸ ações rápidas</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <Link key={i} to={createPageUrl(a.page)}
              className="relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all group overflow-hidden hover:scale-[1.03]"
              style={{
                borderColor: `${a.accent}22`,
                background: `linear-gradient(135deg, rgba(6,4,18,0.95), rgba(4,2,14,0.95))`,
                boxShadow: `0 2px 20px rgba(0,0,0,0.4)`
              }}>
              {/* hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                style={{ background: `radial-gradient(ellipse at center, ${a.accent}10, transparent 70%)` }} />
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${a.accent}70, transparent)` }} />
              <div className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{
                  background: `${a.accent}18`,
                  border: `1px solid ${a.accent}35`,
                  boxShadow: `0 0 15px ${a.accent}20`
                }}>
                <a.icon className="w-5 h-5" style={{ color: a.accent, filter: `drop-shadow(0 0 5px ${a.accent})` }} />
              </div>
              <span className="relative text-xs font-semibold text-center transition-colors"
                style={{ color: 'rgba(240,230,255,0.7)' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em]"
            style={{ color: 'rgba(192,132,252,0.55)' }}>▸ feed de treinos</p>
          <Link to={createPageUrl("Progress")}
            className="text-[11px] font-mono-cyber transition-colors hover:text-purple-300"
            style={{ color: 'rgba(192,132,252,0.5)' }}>
            ver histórico →
          </Link>
        </div>
        <div className="rounded-xl border overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(8,5,20,0.95), rgba(4,2,14,0.95))',
            borderColor: 'rgba(168,85,247,0.15)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(168,85,247,0.06)'
          }}>
          {/* header bar */}
          <div className="px-5 py-2.5 border-b flex items-center gap-2"
            style={{ borderColor: 'rgba(168,85,247,0.12)', background: 'rgba(168,85,247,0.04)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.9)' }} />
            <span className="text-[10px] font-mono-cyber" style={{ color: 'rgba(192,132,252,0.5)' }}>LIVE · atividade recente</span>
          </div>
          {recentSessions.length === 0 ? (
            <div className="p-10 text-center">
              <Dumbbell className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(168,85,247,0.2)' }} />
              <p className="text-sm font-mono-cyber" style={{ color: 'rgba(168,85,247,0.3)' }}>// nenhum treino registrado ainda</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(168,85,247,0.08)' }}>
              {recentSessions.map((session, i) => {
                const student = getStudent(session.student_id);
                const plan = getPlan(session.plan_id);
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5 transition-colors group"
                    style={{ ':hover': { background: 'rgba(168,85,247,0.04)' } }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(168,85,247,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-cyber font-bold flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.08))',
                        border: '1px solid rgba(168,85,247,0.3)',
                        color: '#d8b4fe',
                        textShadow: '0 0 8px rgba(168,85,247,0.6)'
                      }}>
                      {student?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#f0e6ff' }}>{student?.name || "Aluno"}</p>
                      <p className="text-[11px] font-mono-cyber truncate mt-0.5" style={{ color: 'rgba(192,132,252,0.5)' }}>
                        {plan?.name || "Treino livre"} · {session.count} exerc.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.9)' }} />
                      <span className="text-[11px] font-mono-cyber" style={{ color: 'rgba(192,132,252,0.45)' }}>{formatDate(session.date)}</span>
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