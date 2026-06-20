import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Utensils, Sparkles, Flame, Beef, Wheat, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AiDietEvolutionDialog from "@/components/diet/AiDietEvolutionDialog";

const COLORS = ["#10b981", "#f59e0b", "#06b6d4", "#ec4899"];

export default function DietAI() {
  const [target, setTarget] = useState(null);
  const qc = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["me-diet-ai"], queryFn: () => base44.auth.me() });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["diet_plans"], queryFn: () => base44.entities.DietPlan.list() });

  const owner = useMemo(() => students.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase()) || user, [students, user]);
  const myPlans = useMemo(() => plans.filter(p => p.active !== false && (p.usuarioId === user?.email || p.assinanteId === user?.email || p.student_id === owner?.id)), [plans, user?.email, owner?.id]);
  const plan = target || myPlans[0];
  const mealData = (plan?.meals || []).map(m => ({ name: m.name, kcal: Math.round((m.items || []).reduce((s, i) => s + Number(i.calories || 0), 0) || m.calories || 0) }));
  const macroData = [
    { name: "Proteína", value: Number(plan?.protein_g || 0) },
    { name: "Carbo", value: Number(plan?.carbs_g || 0) },
    { name: "Gordura", value: Number(plan?.fat_g || 0) },
  ].filter(i => i.value > 0);

  return <div className="space-y-6">
    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono-cyber tracking-[0.35em] text-emerald-300 uppercase">dieta individual</p>
          <h1 className="font-cyber text-3xl text-white tracking-widest mt-2">IA DE DIETA</h1>
          <p className="text-sm text-purple-100/60 mt-2">Crie mudanças, troque alimentos e evolua sua dieta sem selecionar aluno.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/MyDiet"><Button className="btn-neon-cyan"><Utensils className="w-4 h-4 mr-2" /> Ver minha dieta</Button></Link>
          <Button disabled={!plan} onClick={() => setTarget(plan)} className="btn-neon-purple"><Sparkles className="w-4 h-4 mr-2" /> Evoluir dieta com IA</Button>
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-4 gap-3">
      {[["Kcal", plan?.total_calories || 0, Flame, "text-amber-300"], ["Proteína", `${plan?.protein_g || 0}g`, Beef, "text-pink-300"], ["Carbo", `${plan?.carbs_g || 0}g`, Wheat, "text-cyan-300"], ["Gordura", `${plan?.fat_g || 0}g`, Droplets, "text-emerald-300"]].map(([label, value, Icon, color]) => <div key={label} className="rounded-2xl border border-emerald-500/20 bg-black/25 p-4"><Icon className={`w-5 h-5 ${color} mb-3`} /><p className="text-xs text-purple-200/50">{label}</p><p className="font-cyber text-2xl text-white mt-1">{value}</p></div>)}
    </div>

    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-emerald-500/25 bg-black/25 p-4"><h3 className="font-cyber text-sm text-emerald-200 tracking-widest mb-4">CALORIAS POR REFEIÇÃO</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={mealData}><XAxis dataKey="name" tick={{ fill: "#a7f3d0", fontSize: 10 }} /><YAxis tick={{ fill: "#a7f3d0", fontSize: 10 }} /><Tooltip contentStyle={{ background: "#04040e", border: "1px solid #059669", color: "#fff" }} /><Bar dataKey="kcal" fill="#10b981" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div></div>
      <div className="rounded-2xl border border-emerald-500/25 bg-black/25 p-4"><h3 className="font-cyber text-sm text-emerald-200 tracking-widest mb-4">PIZZA DE MACROS</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={macroData} dataKey="value" nameKey="name" outerRadius={85} label>{macroData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "#04040e", border: "1px solid #059669", color: "#fff" }} /></PieChart></ResponsiveContainer></div></div>
    </div>

    <div className="grid md:grid-cols-2 gap-3">
      {myPlans.map(p => <div key={p.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><h3 className="font-bold text-white">{p.name}</h3><p className="text-xs text-purple-200/50 mt-1">{p.meals?.length || 0} refeições · {p.total_calories || 0} kcal</p><Button onClick={() => setTarget(p)} className="w-full mt-4 btn-neon-purple"><Sparkles className="w-4 h-4 mr-2" /> Criar mudança de dieta</Button></div>)}
    </div>

    <AiDietEvolutionDialog open={!!target} onOpenChange={(v) => !v && setTarget(null)} plan={target} owner={owner} currentUser={user} allPlans={plans} selfMode={true} onApplied={() => { qc.invalidateQueries({ queryKey: ["diet_plans"] }); setTarget(null); }} />
  </div>;
}