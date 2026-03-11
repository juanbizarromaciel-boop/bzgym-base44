import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Dumbbell, ClipboardList, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatsCard from "../components/shared/StatsCard";
import PageHeader from "../components/shared/PageHeader";

export default function Dashboard() {
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => base44.entities.WorkoutPlan.list(),
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.WorkoutLog.list("-created_date", 10),
  });

  const activeStudents = students.filter((s) => s.active !== false);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do seu estúdio"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Alunos Ativos" value={activeStudents.length} icon={Users} color="emerald" />
        <StatsCard title="Exercícios" value={exercises.length} icon={Dumbbell} color="blue" />
        <StatsCard title="Treinos" value={plans.length} icon={ClipboardList} color="purple" />
        <StatsCard title="Registros" value={logs.length} icon={TrendingUp} color="orange" />
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Atividade Recente</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum treino registrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between bg-gray-800/40 rounded-xl px-4 py-3 border border-gray-700/30"
              >
                <div>
                  <p className="text-sm font-medium text-white">{log.exercise_name}</p>
                  <p className="text-xs text-gray-500">{log.date}</p>
                </div>
                {log.max_load_kg > 0 && (
                  <span className="text-emerald-400 font-semibold text-sm">{log.max_load_kg}kg</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <Link
          to={createPageUrl("Students")}
          className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group"
        >
          <Users className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Gerenciar Alunos</h3>
          <p className="text-xs text-gray-500 mt-1">Adicione e gerencie seus alunos</p>
        </Link>
        <Link
          to={createPageUrl("WorkoutPlans")}
          className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 hover:border-blue-500/30 transition-all group"
        >
          <ClipboardList className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Montar Treinos</h3>
          <p className="text-xs text-gray-500 mt-1">Crie planos de treino personalizados</p>
        </Link>
        <Link
          to={createPageUrl("StudentWorkout")}
          className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 hover:border-purple-500/30 transition-all group"
        >
          <Dumbbell className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Treinar Agora</h3>
          <p className="text-xs text-gray-500 mt-1">Registre seu treino do dia</p>
        </Link>
      </div>
    </div>
  );
}