import React from "react";
import { GraduationCap, Apple, Ruler } from "lucide-react";
import DashboardActionCards from "@/components/dashboard/DashboardActionCards";

const actions = [
  { title: "Treinar alunos", description: "Gerenciar e prescrever treinos", icon: GraduationCap, path: "/WorkoutPlans", tone: "text-purple-300 bg-purple-500/10 border-purple-400/15" },
  { title: "Dietas", description: "Criar e acompanhar dietas", icon: Apple, path: "/Diet", tone: "text-emerald-300 bg-emerald-500/10 border-emerald-400/15" },
  { title: "IMC / BMI", description: "Calcular e avaliar IMC", icon: Ruler, path: "/Progress?tab=bio", tone: "text-cyan-300 bg-cyan-500/10 border-cyan-400/15" },
];

export default function ProfessorActions() {
  return <DashboardActionCards title="Ações do professor" items={actions} />;
}