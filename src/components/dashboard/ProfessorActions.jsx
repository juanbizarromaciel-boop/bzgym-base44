import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Apple, Ruler, ArrowRight } from "lucide-react";

const actions = [
  { title: "Treinar alunos", description: "Gerenciar e prescrever treinos", icon: GraduationCap, path: "/WorkoutPlans", tone: "text-primary bg-primary/10" },
  { title: "Dietas", description: "Criar e acompanhar dietas", icon: Apple, path: "/Diet", tone: "text-emerald-400 bg-emerald-500/10" },
  { title: "IMC / BMI", description: "Calcular e avaliar índice de massa corporal", icon: Ruler, path: "/Progress?tab=bio", tone: "text-cyan-400 bg-cyan-500/10" },
];

export default function ProfessorActions() {
  return <section><h2 className="mb-3 text-base font-semibold">Ações do professor</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{actions.map(({ title, description, icon: Icon, path, tone }, index) => <Link key={title} to={path} className={`group min-h-44 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-md ${index === 2 ? "col-span-2 sm:col-span-1" : ""}`}><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p><ArrowRight className="mt-3 h-4 w-4 text-primary transition-transform group-hover:translate-x-1" /></Link>)}</div></section>;
}