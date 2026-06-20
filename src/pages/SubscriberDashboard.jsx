import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dumbbell, Utensils, BookOpen, Sparkles, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import MacroAI from "../components/subscriber/MacroAI";

export default function SubscriberDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const actions = [
    { label: "Meu Treino", icon: Dumbbell, href: "/MyWorkout", color: "#a855f7", desc: "Registre e acompanhe seus treinos" },
    { label: "Criar/Editar Treinos", icon: ClipboardList, href: "/WorkoutPlans", color: "#ec4899", desc: "Monte, edite e evolua seus treinos" },
    { label: "Exercícios", icon: BookOpen, href: "/ExerciseLibrary", color: "#06b6d4", desc: "Biblioteca de exercícios" },
    { label: "Minha Dieta", icon: Utensils, href: "/MyDiet", color: "#ec4899", desc: "Cadastre e acompanhe sua dieta" },
    { label: "Evoluir Dieta com IA", icon: Sparkles, href: "/MyDiet", color: "#10b981", desc: "Gerar nova versão e relatório premium" },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-mono-cyber text-purple-500/35 tracking-[0.3em] uppercase mb-2">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
        </p>
        <h1 className="font-cyber text-3xl text-white tracking-widest"
          style={{ textShadow: '0 0 30px rgba(168,85,247,0.3)' }}>
          OLÁ, {user?.full_name?.split(" ")[0]?.toUpperCase() || "ASSINANTE"}
        </h1>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 4px rgba(6,182,212,1)' }} />
          <span className="text-xs font-mono-cyber text-cyan-400/60 tracking-wider">ASSINANTE</span>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-purple-500/30 via-purple-500/10 to-transparent" />
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] font-mono-cyber text-purple-500/35 uppercase tracking-[0.25em] mb-4">▸ acesso rápido</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((a, i) => (
            <Link key={i} to={a.href}
              className="flex flex-col gap-3 p-5 rounded-xl border border-purple-900/20 bg-black/50 hover:border-purple-500/25 transition-all group"
              style={{ background: 'rgba(4,4,12,0.8)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{a.label}</p>
                <p className="text-xs text-purple-400/40 mt-0.5 font-mono-cyber">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Macro AI */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-purple-400" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }} />
          <p className="text-[10px] font-mono-cyber text-purple-400/50 uppercase tracking-[0.25em]">▸ IA de macros</p>
        </div>
        <MacroAI />
      </div>
    </div>
  );
}