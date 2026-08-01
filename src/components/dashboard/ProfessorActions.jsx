import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Apple, Ruler, ArrowRight } from "lucide-react";

const actions = [
  { title: "Treinar alunos", description: "Gerenciar e prescrever treinos", icon: GraduationCap, path: "/WorkoutPlans", tone: "text-purple-300 bg-purple-500/10 border-purple-400/15" },
  { title: "Dietas", description: "Criar e acompanhar dietas", icon: Apple, path: "/Diet", tone: "text-emerald-300 bg-emerald-500/10 border-emerald-400/15" },
  { title: "IMC / BMI", description: "Calcular e avaliar IMC", icon: Ruler, path: "/Progress?tab=bio", tone: "text-cyan-300 bg-cyan-500/10 border-cyan-400/15" },
];

export default function ProfessorActions() {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-medium text-professor-muted">Ações do professor</h2>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[375px]:mx-0 min-[375px]:overflow-visible min-[375px]:px-0">
        <div className="grid grid-flow-col auto-cols-[116px] gap-2.5 snap-x snap-mandatory min-[375px]:grid-flow-row min-[375px]:grid-cols-3 min-[375px]:auto-cols-auto">
          {actions.map(({ title, description, icon: Icon, path, tone }) => <Link key={title} to={path} className="group flex min-h-[184px] snap-start flex-col rounded-[18px] border border-white/10 bg-professor-card/70 p-3 text-center backdrop-blur-xl"><div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border ${tone}`}><Icon className="h-5 w-5" /></div><h3 className="mt-4 text-[12px] font-semibold leading-tight">{title}</h3><p className="mt-2 text-[9px] leading-relaxed text-professor-muted">{description}</p><ArrowRight className="mx-auto mt-auto h-4 w-4 text-purple-300 transition-transform group-hover:translate-x-1" /></Link>)}
        </div>
      </div>
    </section>
  );
}