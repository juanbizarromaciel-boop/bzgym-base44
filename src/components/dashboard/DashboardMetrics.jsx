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
      <h2 className="mb-3 text-[13px] font-medium text-professor-muted">Resumo geral</h2>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[375px]:mx-0 min-[375px]:overflow-visible min-[375px]:px-0">
        <div className="grid grid-flow-col auto-cols-[88px] gap-2 snap-x snap-mandatory min-[375px]:grid-flow-row min-[375px]:grid-cols-4 min-[375px]:auto-cols-auto">
          {items.map(({ key, label, icon: Icon, path, color, bg }) => <Link key={key} to={path} className="min-h-[150px] snap-start rounded-[18px] border border-white/10 bg-professor-card/70 p-3 backdrop-blur-xl transition-colors hover:border-professor-border/30"><div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}><Icon className={`h-[18px] w-[18px] ${color}`} /></div><p className="mt-5 text-[28px] font-semibold leading-none">{values[key] || 0}</p><p className="mt-2 text-[10px] leading-tight text-professor-muted">{label}</p></Link>)}
        </div>
      </div>
    </section>
  );
}