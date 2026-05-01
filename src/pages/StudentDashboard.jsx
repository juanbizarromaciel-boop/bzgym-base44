import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, TrendingUp, Target, Calendar, Award, ChevronRight, Flame, MessageSquare, Zap, CheckCircle2, Clock, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import MuscleMap from "../components/workout/MuscleMap";

const GOAL_LABELS = {
  hipertrofia: "HIPERTROFIA", emagrecimento: "EMAGRECIMENTO",
  resistencia: "RESISTÊNCIA", forca: "FORÇA", saude: "SAÚDE"
};

const DAY_MAP = {
  0: "domingo", 1: "segunda", 2: "terca", 3: "quarta",
  4: "quinta", 5: "sexta", 6: "sabado"
};

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
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const myLogs = workoutLogs.filter(log => log.student_id === student.id);
  const myPlans = workoutPlans.filter(plan => plan.student_id === student.id && plan.active !== false);
  const unreadMessages = messages.filter(m => m.student_id === student.id && m.is_trainer && !m.read);

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentLogs = myLogs.filter(log => new Date(log.date) >= last7Days);

  const uniqueWorkoutDates = [...new Set(recentLogs.map(log => log.date))].length;
  const totalVolume = recentLogs.reduce((sum, log) =>
    sum + (log.sets_completed?.reduce((s, set) => s + (set.reps_done * set.load_kg), 0) || 0), 0);
  const maxLoad = Math.max(...myLogs.map(log => log.max_load_kg || 0), 0);

  // Today's workout
  const todayDow = DAY_MAP[new Date().getDay()];
  const todayPlan = myPlans.find(p => p.day_of_week === todayDow);
  const todayLogged = myLogs.some(l => l.date === new Date().toISOString().split("T")[0]);

  // Last workout
  const lastLog = myLogs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const lastDate = lastLog?.date;
  const daysSince = lastDate ? Math.floor((new Date() - new Date(lastDate)) / 86400000) : null;

  // Muscle map
  const allExercises = myPlans.flatMap(p => p.exercises || []);

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest">▸ painel do aluno</p>
        <h1 className="font-cyber text-2xl md:text-3xl text-white tracking-widest mt-1">
          OLÁ, {student.name?.split(" ")[0]?.toUpperCase()}
        </h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {student.goal && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-xs font-mono-cyber text-purple-400/70">
              <Target className="w-3 h-3" />
              {GOAL_LABELS[student.goal] || student.goal}
            </span>
          )}
          {daysSince !== null && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono-cyber
              ${daysSince === 0 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" :
                daysSince <= 2 ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-400" :
                "border-orange-500/30 bg-orange-500/5 text-orange-400"}`}>
              <Clock className="w-3 h-3" />
              {daysSince === 0 ? "Treinou hoje!" : `Último treino há ${daysSince} dia${daysSince > 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      </div>

      {/* Today's Task */}
      <div className={`rounded-xl p-5 border transition-all ${todayPlan
        ? "border-purple-500/30 bg-purple-500/5"
        : "border-purple-900/20 bg-black/40"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${todayPlan ? "bg-purple-500/20 border border-purple-500/30" : "bg-black/60 border border-purple-900/30"}`}>
              <Dumbbell className={`w-5 h-5 ${todayPlan ? "text-purple-400" : "text-purple-500/30"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {todayPlan ? todayPlan.name : "Nenhum treino hoje"}
              </p>
              <p className="text-xs text-purple-400/50">
                {todayPlan
                  ? todayLogged ? "✓ Treino registrado hoje" : `${todayPlan.exercises?.length || 0} exercícios planejados`
                  : "Descanse ou faça um treino livre"}
              </p>
            </div>
          </div>
          {todayPlan && !todayLogged && (
            <Link to="/MyWorkout"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition-all">
              <Zap className="w-4 h-4" />
              Iniciar
            </Link>
          )}
          {todayLogged && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono-cyber">
              <CheckCircle2 className="w-4 h-4" />
              Concluído
            </span>
          )}
        </div>
      </div>

      {/* Unread message alert */}
      {unreadMessages.length > 0 && (
        <Link to="/Chat" className="flex items-center gap-3 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 transition-all">
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{unreadMessages.length} mensagem{unreadMessages.length > 1 ? "ns" : ""} nova{unreadMessages.length > 1 ? "s" : ""} do seu professor</span>
          <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Treinos / Semana", value: uniqueWorkoutDates, icon: Calendar, color: "cyan" },
          { label: "Volume (kg×reps)", value: Math.round(totalVolume).toLocaleString(), icon: Flame, color: "pink" },
          { label: "Carga Máx (kg)", value: maxLoad || "—", icon: Award, color: "yellow" },
          { label: "Planos Ativos", value: myPlans.length, icon: ClipboardList, color: "purple" },
        ].map((s, i) => {
          const colorMap = {
            cyan: { border: "border-cyan-500/20", icon: "text-cyan-400", val: "text-cyan-300" },
            pink: { border: "border-pink-500/20", icon: "text-pink-400", val: "text-pink-300" },
            yellow: { border: "border-yellow-500/20", icon: "text-yellow-400", val: "text-yellow-300" },
            purple: { border: "border-purple-500/20", icon: "text-purple-400", val: "text-purple-300" },
          };
          const c = colorMap[s.color];
          return (
            <div key={i} className={`rounded-xl p-4 border ${c.border} bg-black/60`}>
              <s.icon className={`w-4 h-4 ${c.icon} mb-3`} />
              <p className={`text-2xl font-cyber font-bold ${c.val}`}>{s.value}</p>
              <p className="text-[10px] text-purple-400/40 font-mono-cyber mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-3">▸ acesso rápido</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Meu Treino", icon: Dumbbell, href: "/MyWorkout", color: "text-purple-400", border: "hover:border-purple-500/40" },
            { label: "Progresso", icon: TrendingUp, href: "/Progress", color: "text-cyan-400", border: "hover:border-cyan-500/40" },
            { label: "Minha Dieta", icon: Target, href: "/MyDiet", color: "text-pink-400", border: "hover:border-pink-500/40" },
            { label: "Chat", icon: MessageSquare, href: "/Chat", color: "text-emerald-400", border: "hover:border-emerald-500/40" },
          ].map((a, i) => (
            <a key={i} href={a.href}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border border-purple-900/20 bg-black/40 ${a.border} transition-all group`}>
              <a.icon className={`w-6 h-6 ${a.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-white/70 text-center">{a.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Muscle Map */}
      {allExercises.length > 0 && (
        <div className="rounded-xl p-6 border border-purple-900/20 bg-black/40">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="font-cyber text-sm text-white tracking-widest">MAPA MUSCULAR DO TREINO</h3>
          </div>
          <MuscleMap exercises={allExercises} size="lg" showLabels={true} />
        </div>
      )}

      {/* My Plans Summary */}
      {myPlans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest">▸ meus treinos</p>
            <a href="/MyWorkout" className="text-xs text-purple-400/60 hover:text-purple-400 transition-colors">Ver todos →</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myPlans.slice(0, 4).map((plan, i) => (
              <a key={i} href="/MyWorkout"
                className="flex items-center gap-4 p-4 rounded-xl border border-purple-900/20 bg-black/40 hover:border-purple-500/30 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{plan.name}</p>
                  <p className="text-xs text-purple-400/50">{plan.exercises?.length || 0} exercícios · {plan.day_of_week || "qualquer dia"}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-500/30 group-hover:text-purple-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}