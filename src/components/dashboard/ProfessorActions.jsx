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
      <h2 className="mb-2.5 text-[13px] font-medium text-professor-muted">Ações do professor</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map(({ title, description, icon: Icon, path, tone }) => <Link key={title} to={path} className="group flex h-[160px] min-w-0 flex-col rounded-[18px] border border-professor-border/20 bg-professor-card/75 p-3 text-center backdrop-blur-md"><div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border ${tone}`}><Icon className="h-5 w-5" /></div><h3 className="mt-3 text-[11px] font-semibold leading-tight">{title}</h3><p className="mt-1.5 text-[9px] leading-snug text-professor-muted">{description}</p><ArrowRight className="mx-auto mt-auto h-4 w-4 text-purple-300 transition-transform group-hover:translate-x-1" /></Link>)}
      </div>
    </section>
  );
}