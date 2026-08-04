import React from "react";
import { GraduationCap, Apple, Ruler, Sparkles, CalendarDays, MessageSquare } from "lucide-react";
import DashboardActionCards from "@/components/dashboard/DashboardActionCards";

const actions = [
  { title: "Treinar aluno", description: "Selecionar aluno e gerenciar treino", icon: GraduationCap, path: "/StudentWorkout", tone: "text-purple-300 bg-purple-500/10 border-purple-400/15" },
  { title: "Dietas", description: "Criar e acompanhar dietas", icon: Apple, path: "/Diet", tone: "text-emerald-300 bg-emerald-500/10 border-emerald-400/15" },
  { title: "IMC / BMI", description: "Calcular e avaliar IMC", icon: Ruler, path: "/Progress?tab=bio", tone: "text-cyan-300 bg-cyan-500/10 border-cyan-400/15" },
  { title: "BZI", description: "Assistente inteligente", icon: Sparkles, path: "/AICoach", tone: "text-pink-300 bg-pink-500/10 border-pink-400/15" },
  { title: "Agenda de aulas", description: "Marcar aulas e atendimentos", icon: CalendarDays, path: "/ClassCalendar", tone: "text-amber-300 bg-amber-500/10 border-amber-400/15" },
  { title: "Mensagens", description: "Conversar com seus alunos", icon: MessageSquare, path: "/Chat", tone: "text-cyan-300 bg-cyan-500/10 border-cyan-400/15" },
];

export default function ProfessorActions() {
  return <DashboardActionCards title="Ações do professor" items={actions} />;
}