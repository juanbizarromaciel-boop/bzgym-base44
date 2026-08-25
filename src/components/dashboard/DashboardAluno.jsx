import React from "react";
import { CalendarDays, ClipboardList, Dumbbell, FileText, Trophy, TrendingUp, Users2, Utensils } from "lucide-react";
import DashboardBase from "@/components/dashboard/DashboardBase";
import DashboardPrimaryCard from "@/components/dashboard/DashboardPrimaryCard";
import DashboardLinkGrid from "@/components/dashboard/DashboardLinkGrid";

export default function DashboardAluno({ user, student, todayPlan, dietPlan, appointments, weeklyWorkouts }) {
  const items = [
    { label: "Meus treinos", value: todayPlan?.exercises?.length || 0, icon: Dumbbell, path: "/MyWorkout", tone: "bg-purple-400/10 text-purple-200" },
    { label: "Minha dieta", value: dietPlan?.meals?.length || 0, icon: Utensils, path: "/MyDiet", tone: "bg-emerald-400/10 text-emerald-200" },
    { label: "Histórico da dieta", icon: ClipboardList, path: "/MyDiet?tab=historico", tone: "bg-amber-400/10 text-amber-200" },
    { label: "Comunidade e conteúdos", icon: Users2, path: "/Comunidade", tone: "bg-pink-400/10 text-pink-200" },
    { label: "Agenda", value: appointments, icon: CalendarDays, path: "/CalendarioGeral", tone: "bg-cyan-400/10 text-cyan-200" },
    { label: "Saúde e exames", icon: FileText, path: "/StudentDocuments", tone: "bg-blue-400/10 text-blue-200" },
    { label: "Mural de PRs", icon: Trophy, path: "/PRBoard", tone: "bg-yellow-400/10 text-yellow-200" },
    { label: "Avaliações e evolução", icon: TrendingUp, path: "/Progress", tone: "bg-orange-400/10 text-orange-200" },
  ];
  const title = todayPlan?.name || "Dia de recuperação";
  const subtitle = todayPlan ? `${todayPlan.exercises?.length || 0} exercícios disponíveis no treino de hoje` : `${weeklyWorkouts} treino(s) registrado(s) nesta semana`;
  return <DashboardBase user={user} profileName={student?.name} roleLabel="Aluno"><DashboardPrimaryCard icon={Dumbbell} eyebrow="Atividade de hoje" title={title} subtitle={subtitle} path={todayPlan ? "/MyWorkout" : "/Progress"} actionLabel={todayPlan ? "Ver treino" : "Progresso"} /><DashboardLinkGrid title="Meu espaço" items={items} /></DashboardBase>;
}