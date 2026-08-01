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
  return <section><h2 className="mb-3 text-sm font-semibold text-muted-foreground">Resumo geral</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.map(({ key, label, icon: Icon, path, color, bg }) => <Link key={key} to={path} className="min-h-32 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-md transition-colors hover:border-primary/30"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div><p className="mt-4 text-3xl font-semibold">{values[key] || 0}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></Link>)}</div></section>;
}