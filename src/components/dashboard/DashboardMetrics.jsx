import React from "react";
import { Users, Dumbbell, Apple, MessageCircle } from "lucide-react";
import DashboardLinkGrid from "@/components/dashboard/DashboardLinkGrid";

const definitions = [
  { key: "students", label: "Alunos ativos", icon: Users, path: "/Students", tone: "bg-primary/10 text-primary" },
  { key: "workouts", label: "Treinos", icon: Dumbbell, path: "/WorkoutPlans", tone: "bg-cyan-500/10 text-cyan-400" },
  { key: "diets", label: "Dietas", icon: Apple, path: "/Diet", tone: "bg-emerald-500/10 text-emerald-400" },
  { key: "messages", label: "Mensagens", icon: MessageCircle, path: "/Chat", tone: "bg-pink-500/10 text-pink-400" },
];

export default function DashboardMetrics({ values }) {
  const items = definitions.map(item => ({ ...item, value: values[item.key] || 0 }));
  return <DashboardLinkGrid title="Resumo geral" items={items} />;
}