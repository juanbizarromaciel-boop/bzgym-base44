import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Dumbbell, TrendingUp, Flame, Target, Calendar, Award } from "lucide-react";
import MuscleMap from "../components/workout/MuscleMap";

const MUSCLE_COLORS = {
  peito: "#ef4444", costas: "#3b82f6", ombros: "#f97316", 
  biceps: "#a855f7", triceps: "#ec4899", pernas: "#eab308",
  gluteos: "#f43f5e", abdomen: "#06b6d4", panturrilha: "#84cc16",
  antebraco: "#f59e0b", cardio: "#10b981", outro: "#6b7280"
};

const GOAL_LABELS = {
  hipertrofia: "HIPERTROFIA", emagrecimento: "EMAGRECIMENTO",
  resistencia: "RESISTÊNCIA", forca: "FORÇA", saude: "SAÚDE"
};

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list()
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ["workoutLogs"],
    queryFn: () => base44.entities.WorkoutLog.list()
  });

  const { data: workoutPlans = [] } = useQuery({
    queryKey: ["workoutPlans"],
    queryFn: () => base44.entities.WorkoutPlan.list()
  });

  useEffect(() => {
    if (user && students.length > 0) {
      const found = students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase());
      if (!found || !found.goal) {
        window.location.href = "/Onboarding";
      } else if (!found.active) {
        window.location.href = "/Welcome";
      } else {
        setStudent(found);
      }
    }
  }, [user, students]);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter data for this student
  const myLogs = workoutLogs.filter(log => log.student_id === student.id);
  const myPlans = workoutPlans.filter(plan => plan.student_id === student.id && plan.active !== false);

  // Last 7 days logs
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentLogs = myLogs.filter(log => new Date(log.date) >= last7Days);

  // Total workouts this week
  const uniqueWorkoutDates = [...new Set(recentLogs.map(log => log.date))].length;

  // Total sets this week
  const totalSets = recentLogs.reduce((sum, log) => sum + (log.sets_completed?.length || 0), 0);

  // Total volume (reps × kg)
  const totalVolume = recentLogs.reduce((sum, log) => {
    return sum + (log.sets_completed?.reduce((s, set) => s + (set.reps_done * set.load_kg), 0) || 0);
  }, 0);

  // Max load this week
  const maxLoad = Math.max(...recentLogs.map(log => log.max_load_kg || 0), 0);

  // Volume by muscle group (from plans)
  const volumeByMuscle = {};
  myPlans.forEach(plan => {
    plan.exercises?.forEach(ex => {
      const muscle = ex.exercise_name?.toLowerCase().includes("supino") ? "peito" :
                     ex.exercise_name?.toLowerCase().includes("remada") ? "costas" :
                     ex.exercise_name?.toLowerCase().includes("bulgaro") ? "gluteo" :
                     ex.exercise_name?.toLowerCase().includes("agachamento") ? "pernas" :
                     ex.exercise_name?.toLowerCase().includes("rosca") ? "biceps" :
                     ex.exercise_name?.toLowerCase().includes("tríceps") ? "triceps" : "outro";
      volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + (ex.sets || 0);
    });
  });

  const muscleVolumeData = Object.entries(volumeByMuscle).map(([muscle, sets]) => ({
    name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
    sets,
    fill: MUSCLE_COLORS[muscle] || MUSCLE_COLORS.outro
  }));

  // Weight by muscle group (from recent logs)
  const weightByMuscle = {};
  recentLogs.forEach(log => {
    const muscle = log.e.muscle_group?.toLowerCase().includes("supino") ? "peito" :
                   log.exercise_name?.toLowerCase().includes("remada") ? "costas" :
                   log.exercise_name?.toLowerCase().includes("agachamento") ? "pernas" :
                   log.exercise_name?.toLowerCase().includes("rosca") ? "biceps" :
                   log.exercise_name?.toLowerCase().includes("tríceps") ? "triceps" : "outro";
    const totalWeight = log.sets_completed?.reduce((sum, set) => sum + (set.load_kg * set.reps_done), 0) || 0;
    weightByMuscle[muscle] = (weightByMuscle[muscle] || 0) + totalWeight;
  });

  const muscleWeightData = Object.entries(weightByMuscle).map(([muscle, weight]) => ({
    name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
    weight: Math.round(weight),
    fill: MUSCLE_COLORS[muscle] || MUSCLE_COLORS.outro
  }));

  // All exercises for muscle map
  const allExercises = myPlans.flatMap(p => p.exercises || []);

  return (
    <div>
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-900/40" />
          <span className="text-[10px] font-mono-cyber text-purple-500/30 tracking-[0.25em]">
            DASHBOARD
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-900/40" />
        </div>
        <h1 className="font-cyber text-3xl md:text-4xl text-white tracking-widest" style={{ textShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
          OLÁ, {student.name?.split(" ")[0]?.toUpperCase()}
        </h1>
        <p className="text-purple-400/50 font-mono-cyber text-sm mt-1">// sua jornada fitness em tempo real</p>
        {student.goal && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-mono-cyber text-purple-400/60 tracking-wider">{GOAL_LABELS[student.goal] || student.goal}</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="cyber-card rounded-xl p-4 border border-purple-900/20 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity pulse-neon" />
          </div>
          <p className="font-cyber text-2xl text-white mb-1">{uniqueWorkoutDates}</p>
          <p className="text-[10px] text-purple-400/40 font-mono-cyber tracking-wider uppercase">Treinos / Semana</p>
        </div>

        <div className="cyber-card rounded-xl p-4 border border-purple-900/20 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Dumbbell className="w-4 h-4 text-purple-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity pulse-neon" />
          </div>
          <p className="font-cyber text-2xl text-white mb-1">{totalSets}</p>
          <p className="text-[10px] text-purple-400/40 font-mono-cyber tracking-wider uppercase">Séries / Semana</p>
        </div>

        <div className="cyber-card rounded-xl p-4 border border-purple-900/20 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-4 h-4 text-pink-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400 opacity-0 group-hover:opacity-100 transition-opacity pulse-neon" />
          </div>
          <p className="font-cyber text-2xl text-white mb-1">{Math.round(totalVolume).toLocaleString()}</p>
          <p className="text-[10px] text-purple-400/40 font-mono-cyber tracking-wider uppercase">Volume Total (kg×reps)</p>
        </div>

        <div className="cyber-card rounded-xl p-4 border border-purple-900/20 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity pulse-neon" />
          </div>
          <p className="font-cyber text-2xl text-white mb-1">{maxLoad}</p>
          <p className="text-[10px] text-purple-400/40 font-mono-cyber tracking-wider uppercase">Carga Máxima (kg)</p>
        </div>
      </div>

      {/* Muscle Map */}
      <div className="cyber-card rounded-xl p-6 border border-purple-900/20 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h2 className="font-cyber text-sm text-white tracking-widest">MAPA MUSCULAR</h2>
        </div>
        <MuscleMap exercises={allExercises} size="lg" showLabels={true} />
        <p className="text-[10px] text-purple-500/30 font-mono-cyber text-center mt-4">
          // visualização dos grupos musculares trabalhados
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume by Muscle - Pie Chart */}
        <div className="cyber-card rounded-xl p-6 border border-purple-900/20">
          <h3 className="font-cyber text-sm text-white tracking-widest mb-4">VOLUME POR GRUPO MUSCULAR</h3>
          {muscleVolumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={muscleVolumeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="sets"
                >
                  {muscleVolumeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#0a0a16', 
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-purple-500/30 text-sm font-mono-cyber">
              // sem dados de treino ainda
            </div>
          )}
        </div>

        {/* Weight by Muscle - Bar Chart */}
        <div className="cyber-card rounded-xl p-6 border border-purple-900/20">
          <h3 className="font-cyber text-sm text-white tracking-widest mb-4">PESO TOTAL (últimos 7 dias)</h3>
          {muscleWeightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={muscleWeightData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'rgba(168,85,247,0.5)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(168,85,247,0.2)' }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(168,85,247,0.5)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(168,85,247,0.2)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#0a0a16', 
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value) => [`${value} kg`, 'Peso Total']}
                />
                <Bar dataKey="weight" radius={[8, 8, 0, 0]}>
                  {muscleWeightData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-purple-500/30 text-sm font-mono-cyber">
              // sem registros de treino nos últimos 7 dias
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/MyWorkout"
          className="cyber-card rounded-xl p-5 border border-purple-900/20 hover:border-purple-500/30 transition-all group text-center"
        >
          <Dumbbell className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-cyber text-sm text-white tracking-wider">INICIAR TREINO</p>
          <p className="text-[10px] text-purple-500/40 font-mono-cyber mt-1">// começar agora</p>
        </a>

        <a
          href="/Progress"
          className="cyber-card rounded-xl p-5 border border-purple-900/20 hover:border-cyan-500/30 transition-all group text-center"
        >
          <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-cyber text-sm text-white tracking-wider">VER PROGRESSO</p>
          <p className="text-[10px] text-purple-500/40 font-mono-cyber mt-1">// histórico completo</p>
        </a>

        <a
          href="/MyDiet"
          className="cyber-card rounded-xl p-5 border border-purple-900/20 hover:border-pink-500/30 transition-all group text-center"
        >
          <Target className="w-8 h-8 text-pink-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-cyber text-sm text-white tracking-wider">MINHA DIETA</p>
          <p className="text-[10px] text-purple-500/40 font-mono-cyber mt-1">// plano alimentar</p>
        </a>
      </div>
    </div>
  );
}