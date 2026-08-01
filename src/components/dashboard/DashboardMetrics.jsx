import React from "react";
import { Link } from "react-router-dom";
import { Users, Dumbbell, Apple, MessageCircle } from "lucide-react";

const items = [
  { key: "students", label: "Alunos ativos", icon: Users, path: "/Students", color: "text-primary", bg: "bg-primary/10" },
  { key: "workouts", label: "Treinos", icon: Dumbbell, path: "/WorkoutPlans", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { key: "diets", label: "Dietas", icon: Apple, path: "/Diet", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { key: "messages", label: "Mensagens", icon: MessageCircle, path: "/Chat", color: "text-pink-400", bg: "bg-pink-500/10" },
];

export default function DashboardMetrics({ values }) {
  return (
    <section>
      <h2 className="mb-2.5 text-[13px] font-medium text-professor-muted">Resumo geral</h2>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ key, label, icon: Icon, path, color, bg }) => <Link key={key} to={path} className="h-[128px] min-w-0 rounded-[17px] border border-professor-border/20 bg-professor-card/75 p-3 backdrop-blur-md transition-colors hover:border-professor-border/30"><div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}><Icon className={`h-[17px] w-[17px] ${color}`} /></div><p className="mt-4 text-[26px] font-semibold leading-none">{values[key] || 0}</p><p className="mt-2 text-[9px] leading-tight text-professor-muted">{label}</p></Link>)}
      </div>
    </section>
  );
}