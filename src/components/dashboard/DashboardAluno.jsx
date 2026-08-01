import React from "react";
import { Dumbbell, Utensils, MessageSquare, CalendarDays } from "lucide-react";
import DashboardBase from "@/components/dashboard/DashboardBase";
import DashboardPrimaryCard from "@/components/dashboard/DashboardPrimaryCard";
import DashboardLinkGrid from "@/components/dashboard/DashboardLinkGrid";

export default function DashboardAluno({ user, student, todayPlan, dietPlan, unreadMessages, appointments, weeklyWorkouts }) {
  const items = [
    { label: "Treino atual", value: todayPlan?.exercises?.length || 0, icon: Dumbbell, path: "/MyWorkout", tone: "bg-purple-400/10 text-purple-200" },
    { label: "Dieta atual", value: dietPlan?.meals?.length || 0, icon: Utensils, path: "/MyDiet", tone: "bg-emerald-400/10 text-emerald-200" },
    { label: "Mensagens", value: unreadMessages, icon: MessageSquare, path: "/Chat", tone: "bg-pink-400/10 text-pink-200" },
    { label: "Agenda", value: appointments, icon: CalendarDays, path: "/CalendarioGeral", tone: "bg-cyan-400/10 text-cyan-200" },
  ];
  const title = todayPlan?.name || "Dia de recuperação";
  const subtitle = todayPlan ? `${todayPlan.exercises?.length || 0} exercícios disponíveis no treino de hoje` : `${weeklyWorkouts} treino(s) registrado(s) nesta semana`;
  return <DashboardBase user={user} profileName={student?.name} roleLabel="Aluno"><DashboardPrimaryCard icon={Dumbbell} eyebrow="Atividade de hoje" title={title} subtitle={subtitle} path={todayPlan ? "/MyWorkout" : "/Progress"} actionLabel={todayPlan ? "Ver treino" : "Progresso"} /><DashboardLinkGrid title="Minha rotina" items={items} /></DashboardBase>;
}