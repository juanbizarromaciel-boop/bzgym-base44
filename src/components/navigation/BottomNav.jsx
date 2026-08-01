import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Dumbbell, Utensils, TrendingUp, MoreHorizontal,
  ClipboardCheck, Calendar, MessageSquare, Users2, Brain, X,
  BookOpen, FileImage, Timer, UserCircle, Bell, CreditCard, LogOut
} from "lucide-react";

const studentTabs = [
  { label: "Início", icon: LayoutDashboard, path: "/StudentDashboard" },
  { label: "Treino", icon: Dumbbell, path: "/MyWorkout" },
  { label: "Check-in", icon: ClipboardCheck, path: "/CheckIn" },
  { label: "Dieta", icon: Utensils, path: "/MyDiet" },
];

const subscriberTabs = [
  { label: "Início", icon: LayoutDashboard, path: "/SubscriberDashboard" },
  { label: "Treino", icon: Dumbbell, path: "/MyWorkout" },
  { label: "Dieta", icon: Utensils, path: "/MyDiet" },
  { label: "Progresso", icon: TrendingUp, path: "/Progress" },
];

const personalTabs = [
  { label: "Início", icon: LayoutDashboard, path: "/PersonalDashboard" },
  { label: "Alunos", icon: Users2, path: "/Students" },
  { label: "Agenda", icon: Calendar, path: "/CalendarioGeral" },
  { label: "Financeiro", icon: CreditCard, path: "/Finance" },
];

const moreMenuItems = [
  { label: "Progresso", icon: TrendingUp, path: "/Progress", color: "#f59e0b" },
  { label: "Calendário", icon: Calendar, path: "/CalendarioGeral", color: "#a855f7" },
  { label: "Chat", icon: MessageSquare, path: "/Chat", color: "#06b6d4" },
  { label: "Comunidade", icon: Users2, path: "/Comunidade", color: "#ec4899" },
  { label: "Exercícios", icon: BookOpen, path: "/LearnExercises", color: "#10b981" },
  { label: "Documentos", icon: FileImage, path: "/StudentDocuments", color: "#f97316" },
  { label: "Foco", icon: Brain, path: "/FocusRoutine", color: "#8b5cf6" },
  { label: "Cronômetro", icon: Timer, path: "/TimerPage", color: "#06b6d4" },
  { label: "Notificações", icon: Bell, path: "/Notificacoes", color: "#ec4899" },
  { label: "Assinatura", icon: CreditCard, path: "/SubscriberBilling", color: "#10b981" },
  { label: "Perfil", icon: UserCircle, path: "/Profile", color: "#a855f7" },
];

const personalMoreItems = [
  { label: "Perfil", icon: UserCircle, path: "/Profile", color: "#a855f7" },
  { label: "Mensagens", icon: MessageSquare, path: "/Chat", color: "#ec4899" },
  { label: "Relatórios", icon: TrendingUp, path: "/Relatorios", color: "#06b6d4" },
  { label: "Avaliações", icon: ClipboardCheck, path: "/Progress", color: "#f59e0b" },
  { label: "Treinos", icon: Dumbbell, path: "/WorkoutPlans", color: "#8b5cf6" },
  { label: "Dietas", icon: Utensils, path: "/Diet", color: "#10b981" },
  { label: "Sair", icon: LogOut, action: "logout", color: "#ef4444" },
];

export default function BottomNav({ role, onMoreClick }) {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const tabs = role === "personal" ? personalTabs : role === "assinante" ? subscriberTabs : studentTabs;
  const menuItems = role === "personal" ? personalMoreItems : moreMenuItems;

  return (
    <>
      {/* More overlay menu */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl overflow-hidden lg:hidden"
              style={{ background: 'linear-gradient(145deg, rgba(8,5,22,0.98), rgba(4,3,14,0.99))', border: '1px solid rgba(168,85,247,0.35)', boxShadow: '0 -8px 40px rgba(168,85,247,0.2), 0 0 60px rgba(0,0,0,0.8)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), rgba(6,182,212,0.6), transparent)' }} />
              <div className="flex items-center justify-between px-5 py-3 border-b border-purple-900/20">
                <p className="text-[10px] font-mono-cyber tracking-[0.3em] text-purple-400/50 uppercase">// mais opções</p>
                <button onClick={() => setShowMore(false)} className="p-1 rounded-lg text-purple-400/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-3 gap-0 p-3">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const content = <><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}18`, border: `1px solid ${item.color}35` }}><item.icon className="w-5 h-5" style={{ color: item.color }} /></div><span className="text-[9px] font-mono-cyber tracking-wide text-center leading-tight" style={{ color: isActive ? item.color : 'rgba(255,255,255,0.6)' }}>{item.label}</span></>;
                  return item.action === "logout"
                    ? <button key={item.label} onClick={() => base44.auth.logout()} className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all border border-transparent">{content}</button>
                    : <Link key={item.path} to={item.path} onClick={() => setShowMore(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all" style={isActive ? { background: `${item.color}15`, border: `1px solid ${item.color}30` } : { border: '1px solid transparent' }}>{content}</Link>;
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{
          background: "linear-gradient(to top, rgba(6,4,18,0.98) 0%, rgba(8,5,22,0.96) 100%)",
          borderTop: "1px solid rgba(168,85,247,0.25)",
          boxShadow: "0 -4px 30px rgba(168,85,247,0.12), 0 -1px 0 rgba(168,85,247,0.15)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(6,182,212,0.4), rgba(168,85,247,0.6), transparent)" }} />

        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const isActive =
              location.pathname === tab.path ||
              (tab.path === "/StudentDashboard" && location.pathname === "/") ||
              (tab.path === "/SubscriberDashboard" && location.pathname === "/") ||
              (tab.path === "/PersonalDashboard" && location.pathname === "/");
            return (
              <Link key={tab.path} to={tab.path}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative min-w-0"
                style={{ background: isActive ? "rgba(168,85,247,0.12)" : "transparent", border: isActive ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent" }}>
                {isActive && (
                  <motion.div layoutId="bottom-nav-indicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-px rounded-full"
                    style={{ background: "linear-gradient(90deg, transparent, #a855f7, transparent)", boxShadow: "0 0 8px #a855f7" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                )}
                <tab.icon className="w-5 h-5 flex-shrink-0"
                  style={{ color: isActive ? "#d8b4fe" : "rgba(168,85,247,0.45)", filter: isActive ? "drop-shadow(0 0 6px rgba(168,85,247,0.9))" : "none", transition: "all 0.2s ease" }} />
                <span className="text-[9px] font-mono-cyber tracking-wider leading-none"
                  style={{ color: isActive ? "#d8b4fe" : "rgba(168,85,247,0.35)", textShadow: isActive ? "0 0 8px rgba(168,85,247,0.8)" : "none" }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Mais button — always shown */}
          <button
            data-cybernav-trigger
            onClick={() => setShowMore(s => !s)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
            style={{ background: showMore ? "rgba(168,85,247,0.12)" : "transparent", border: showMore ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent" }}>
            <MoreHorizontal className="w-5 h-5" style={{ color: showMore ? "#d8b4fe" : "rgba(168,85,247,0.45)" }} />
            <span className="text-[9px] font-mono-cyber tracking-wider leading-none" style={{ color: showMore ? "#d8b4fe" : "rgba(168,85,247,0.35)" }}>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}