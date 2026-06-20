import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, ClipboardList, Dumbbell, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AiWorkoutEvolutionDialog from "@/components/workout/AiWorkoutEvolutionDialog";

const COLORS = ["#ec4899", "#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#84cc16"];

function groupFromName(name = "") {
  const n = name.toLowerCase();
  if (/peito|supino|crucifixo|chest/.test(n)) return "Peito";
  if (/costas|remada|puxada|barra|dorsal/.test(n)) return "Costas";
  if (/perna|agach|leg|extensora|flexora|panturrilha/.test(n)) return "Pernas";
  if (/ombro|desenvolvimento|elevação/.test(n)) return "Ombros";
  if (/bíceps|biceps|tríceps|triceps|rosca/.test(n)) return "Braços";
  if (/abd|core|prancha/.test(n)) return "Core";
  return "Outros";
}

function calcVolume(plan) {
  return (plan.exercises || []).reduce((sum, ex) => {
    const sets = Number(ex.sets || 0);
    const reps = Number(String(ex.reps || "10").match(/\d+/)?.[0] || 10);
    return sum + sets * reps;
  }, 0);
}

export default function WorkoutAI() {
  const [aiTarget, setAiTarget] = useState(null);
  const qc = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["me-workout-ai"], queryFn: () => base44.auth.me() });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });

  const student = useMemo(() => {
    const linked = students.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase());
    return linked || { id: user?.email, email: user?.email, name: user?.full_name || "Meu perfil", goal: user?.goal || "hipertrofia" };
  }, [students, user]);

  const myPlans = useMemo(() => {
    const ids = [student?.id, user?.email].filter(Boolean);
    return plans.filter(p => p.active !== false && p.statusVersao !== "substituido" && (ids.includes(p.student_id) || p.usuarioId === user?.email || p.assinanteId === user?.email));
  }, [plans, student?.id, user?.email]);

  const volumeData = myPlans.map(p => ({ name: p.name, volume: calcVolume(p), exercicios: p.exercises?.length || 0 }));
  const groupData = Object.values(myPlans.flatMap(p => p.exercises || []).reduce((acc, ex) => {
    const group = groupFromName(ex.exercise_name);
    acc[group] = acc[group] || { name: group, value: 0 };
    acc[group].value += Number(ex.sets || 0);
    return acc;
  }, {}));

  return <div className="space-y-6">
    <div className="rounded-3xl border border-pink-500/30 bg-pink-500/5 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono-cyber tracking-[0.35em] text-pink-300 uppercase">treino individual</p>
          <h1 className="font-cyber text-3xl text-white tracking-widest mt-2">IA DE TREINO</h1>
          <p className="text-sm text-purple-100/60 mt-2">Crie, revise e evolua seus treinos sem escolher aluno.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/WorkoutPlans"><Button className="btn-neon-cyan"><ClipboardList className="w-4 h-4 mr-2" /> Criar/Editar treinos</Button></Link>
          <Button disabled={myPlans.length === 0} onClick={() => setAiTarget({ plan: myPlans[0], mode: "plano_completo" })} className="btn-neon-purple"><Sparkles className="w-4 h-4 mr-2" /> Evoluir plano completo</Button>
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-3">
      {[["Treinos ativos", myPlans.length, Dumbbell], ["Exercícios", myPlans.reduce((a,p) => a + (p.exercises?.length || 0), 0), Brain], ["Volume estimado", volumeData.reduce((a,p) => a + p.volume, 0), BarChart3]].map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-purple-500/20 bg-black/25 p-4"><Icon className="w-5 h-5 text-pink-300 mb-3" /><p className="text-xs text-purple-200/50">{label}</p><p className="font-cyber text-2xl text-white mt-1">{value}</p></div>)}
    </div>

    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-purple-500/25 bg-black/25 p-4"><h3 className="font-cyber text-sm text-cyan-200 tracking-widest mb-4">VOLUME POR TREINO</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={volumeData}><XAxis dataKey="name" tick={{ fill: "#c4b5fd", fontSize: 10 }} /><YAxis tick={{ fill: "#c4b5fd", fontSize: 10 }} /><Tooltip contentStyle={{ background: "#04040e", border: "1px solid #7e22ce", color: "#fff" }} /><Bar dataKey="volume" fill="#ec4899" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div></div>
      <div className="rounded-2xl border border-purple-500/25 bg-black/25 p-4"><h3 className="font-cyber text-sm text-cyan-200 tracking-widest mb-4">PIZZA POR GRUPO</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={groupData} dataKey="value" nameKey="name" outerRadius={85} label>{groupData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "#04040e", border: "1px solid #7e22ce", color: "#fff" }} /></PieChart></ResponsiveContainer></div></div>
    </div>

    <div className="grid md:grid-cols-2 gap-3">
      {myPlans.map(plan => <div key={plan.id} className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{plan.name}</h3><p className="text-xs text-purple-200/50 mt-1">{plan.exercises?.length || 0} exercícios · volume {calcVolume(plan)}</p></div><Badge className="bg-pink-500/10 text-pink-200 border border-pink-500/25">v{plan.versao || 1}</Badge></div><Button onClick={() => setAiTarget({ plan, mode: "treino_especifico" })} className="w-full mt-4 btn-neon-purple"><Sparkles className="w-4 h-4 mr-2" /> Evoluir este treino</Button></div>)}
    </div>

    <AiWorkoutEvolutionDialog open={!!aiTarget} onOpenChange={(v) => !v && setAiTarget(null)} initialPlan={aiTarget?.plan} initialMode={aiTarget?.mode || "treino_especifico"} student={student} allPlans={plans} currentUser={user} onApplied={() => { qc.invalidateQueries({ queryKey: ["plans"] }); setAiTarget(null); }} />
  </div>;
}