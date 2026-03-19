import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Dumbbell, ClipboardList, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatsCard from "../components/shared/StatsCard";
import PageHeader from "../components/shared/PageHeader";

export default function Dashboard() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => setRole(u?.role || "user")).catch(() => setRole("user"));
  }, []);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list() });
  const { data: logs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => base44.entities.WorkoutLog.list("-created_date", 100) });

  const isAdmin = role === "admin";

  // Auto-redirect students to their dashboard
  if (role === "user") {
    window.location.href = "/StudentDashboard";
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const adminLinks = [
    { page: "Students", icon: Users, label: "Alunos", desc: "Gerencie seus alunos", color: "text-purple-400" },
    { page: "WorkoutPlans", icon: ClipboardList, label: "Treinos", desc: "Monte treinos personalizados", color: "text-cyan-400" },
    { page: "Progress", icon: TrendingUp, label: "Progresso", desc: "Veja a evolução dos alunos", color: "text-pink-400" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Painel do Personal Trainer" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Alunos" value={students.filter(s => s.active !== false).length} icon={Users} color="purple" />
        <StatsCard title="Exercícios" value={exercises.length} icon={Dumbbell} color="cyan" />
        <StatsCard title="Treinos" value={plans.length} icon={ClipboardList} color="pink" />
        <StatsCard title="Registros" value={logs.length} icon={TrendingUp} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {adminLinks.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className="cyber-card rounded-xl p-5 border border-purple-900/20 hover:border-purple-500/30 transition-all group block"
          >
            <div className="flex items-center justify-between mb-3">
              <item.icon className={`w-7 h-7 ${item.color} group-hover:scale-110 transition-transform`} />
              <ChevronRight className="w-4 h-4 text-purple-500/30 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-cyber text-sm tracking-widest text-white uppercase mb-1">{item.label}</h3>
            <p className="text-xs text-purple-400/40">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="cyber-card rounded-xl p-6 border border-purple-900/20">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-purple-400" />
          <h2 className="font-cyber text-sm tracking-widest text-purple-300 uppercase">Atividade Recente</h2>
        </div>
        {logs.length === 0 ? (
          <p className="text-purple-500/40 text-sm font-mono-cyber">// nenhum treino registrado</p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-black/40 border border-purple-900/20 hover:border-purple-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,1)]" />
                  <div>
                    <p className="text-sm font-medium text-white">{log.exercise_name}</p>
                    <p className="text-xs text-purple-500/40 font-mono-cyber">{log.date}</p>
                  </div>
                </div>
                {log.max_load_kg > 0 && (
                  <span className="font-cyber text-sm text-cyan-400" style={{textShadow: '0 0 8px rgba(6,182,212,0.6)'}}>
                    {log.max_load_kg}kg
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}