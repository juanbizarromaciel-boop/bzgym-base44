import React from "react";
import { Sparkles, Dumbbell, Utensils, Users2, BookOpen } from "lucide-react";
import DashboardBase from "@/components/dashboard/DashboardBase";
import DashboardPrimaryCard from "@/components/dashboard/DashboardPrimaryCard";
import DashboardLinkGrid from "@/components/dashboard/DashboardLinkGrid";
import DashboardPlanCard from "@/components/dashboard/DashboardPlanCard";
import MacroAI from "@/components/subscriber/MacroAI";

export default function DashboardAssinante({ user }) {
  const items = [
    { label: "Treino IA", icon: Dumbbell, path: "/WorkoutAI", tone: "bg-purple-400/10 text-purple-200" },
    { label: "Dieta IA", icon: Utensils, path: "/DietAI", tone: "bg-emerald-400/10 text-emerald-200" },
    { label: "Conteúdos", icon: Users2, path: "/Comunidade", tone: "bg-pink-400/10 text-pink-200" },
    { label: "Exercícios", icon: BookOpen, path: "/ExerciseLibrary", tone: "bg-cyan-400/10 text-cyan-200" },
  ];
  return <DashboardBase user={user} roleLabel="Assinante"><DashboardPrimaryCard icon={Sparkles} eyebrow="Beijinho" title="Seus recursos premium" subtitle="Treino, nutrição e conteúdos liberados no seu plano" path="/WorkoutAI" actionLabel="Explorar" /><DashboardLinkGrid title="Recursos disponíveis" items={items} /><DashboardPlanCard status={user?.assinatura_status} dueDate={user?.assinatura_vencimento} /><section><h2 className="app-section-title mb-2.5 text-[13px]">IA de macros</h2><div className="app-glass-card rounded-[18px] p-3"><MacroAI /></div></section></DashboardBase>;
}