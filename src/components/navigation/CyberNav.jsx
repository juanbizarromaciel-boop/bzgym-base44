import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Users, ClipboardList, BarChart3, Timer,
  Library, LayoutDashboard, Utensils, BookOpen, Activity,
  FileImage, Trophy, UserCircle, MessageSquare, UserPlus,
  Sparkles, Settings, UserCog, DollarSign, CalendarDays, Briefcase,
  Zap, X, Syringe
} from "lucide-react";

// ─── Nav groups por role ───────────────────────────────────────────────────

const adminNavGroups = [
  {
    label: "Visão Geral", color: "#a855f7",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
      { name: "Novos Alunos", icon: UserPlus, page: "PendingStudents" },
    ]
  },
  {
    label: "Alunos", color: "#06b6d4",
    items: [
      { name: "Alunos", icon: Users, page: "Students" },
      { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
    ]
  },
  {
    label: "Treinos", color: "#ec4899",
    items: [
      { name: "Planos de Treino", icon: ClipboardList, page: "WorkoutPlans" },
      { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
      { name: "Treinar Aluno", icon: Dumbbell, page: "StudentWorkout" },
    ]
  },
  {
    label: "Evolução", color: "#f59e0b",
    items: [
      { name: "Progresso", icon: BarChart3, page: "Progress" },
      { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
    ]
  },
  {
    label: "Nutrição", color: "#10b981",
    items: [
      { name: "Dietas", icon: Utensils, page: "Diet" },
      { name: "Alimentos", icon: BookOpen, page: "FoodDatabase" },
    ]
  },
  {
    label: "Comunicação", color: "#06b6d4",
    items: [{ name: "Chat", icon: MessageSquare, page: "Chat" }]
  },
  {
    label: "Saúde", color: "#84cc16",
    items: [
      { name: "Saúde e Exames", icon: Activity, page: "CH" },
    ]
  },
  {
    label: "Inteligência Artificial", color: "#a855f7",
    items: [
      { name: "BZ AI Coach", icon: Sparkles, page: "AICoach" },
      { name: "Config. IA", icon: Settings, page: "AISettings" },
    ]
  },
  {
    label: "Administração", color: "#f97316",
    items: [
      { name: "Gestão de Personais", icon: UserCog, page: "PersonalManagement" },
    ]
  },
  {
    label: "Financeiro", color: "#10b981",
    items: [
      { name: "Financeiro", icon: DollarSign, page: "Finance" },
      { name: "Calendário de Aulas", icon: CalendarDays, page: "ClassCalendar" },
      { name: "Cobrança Consultoria", icon: Briefcase, page: "ConsultancyBilling" },
    ]
  },
  {
    label: "Ferramentas", color: "#8b5cf6",
    items: [
      { name: "Cronômetro", icon: Timer, page: "TimerPage" },
      { name: "Perfil", icon: UserCircle, page: "Profile" },
    ]
  },
];

const personalNavGroups = [
  {
    label: "Visão Geral", color: "#a855f7",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
      { name: "Novos Alunos", icon: UserPlus, page: "PendingStudents" },
    ]
  },
  {
    label: "Meus Alunos", color: "#06b6d4",
    items: [
      { name: "Alunos", icon: Users, page: "Students" },
      { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
    ]
  },
  {
    label: "Treinos", color: "#ec4899",
    items: [
      { name: "Planos de Treino", icon: ClipboardList, page: "WorkoutPlans" },
      { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
      { name: "Treinar Aluno", icon: Dumbbell, page: "StudentWorkout" },
    ]
  },
  {
    label: "Evolução", color: "#f59e0b",
    items: [
      { name: "Progresso", icon: BarChart3, page: "Progress" },
      { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
    ]
  },
  {
    label: "Nutrição", color: "#10b981",
    items: [
      { name: "Dietas", icon: Utensils, page: "Diet" },
      { name: "Alimentos", icon: BookOpen, page: "FoodDatabase" },
    ]
  },
  {
    label: "Comunicação", color: "#06b6d4",
    items: [{ name: "Chat", icon: MessageSquare, page: "Chat" }]
  },
  {
    label: "Saúde", color: "#84cc16",
    items: [{ name: "Saúde e Exames", icon: Activity, page: "CH" }]
  },
  {
    label: "Financeiro", color: "#10b981",
    items: [
      { name: "Financeiro", icon: DollarSign, page: "Finance" },
      { name: "Calendário de Aulas", icon: CalendarDays, page: "ClassCalendar" },
      { name: "Cobrança Consultoria", icon: Briefcase, page: "ConsultancyBilling" },
    ]
  },
  {
    label: "Ferramentas", color: "#8b5cf6",
    items: [
      { name: "Cronômetro", icon: Timer, page: "TimerPage" },
      { name: "Perfil", icon: UserCircle, page: "Profile" },
    ]
  },
];

const studentNavGroups = [
  {
    label: "Hoje", color: "#a855f7",
    items: [{ name: "Dashboard", icon: LayoutDashboard, page: "StudentDashboard" }]
  },
  {
    label: "Treino", color: "#ec4899",
    items: [
      { name: "Meu Treino", icon: Dumbbell, page: "MyWorkout" },
      { name: "Aprender Exercícios", icon: BookOpen, page: "LearnExercises" },
      { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
    ]
  },
  {
    label: "Nutrição", color: "#10b981",
    items: [{ name: "Minha Dieta", icon: Utensils, page: "MyDiet" }]
  },
  {
    label: "Evolução", color: "#f59e0b",
    items: [
      { name: "Progresso", icon: BarChart3, page: "Progress" },
      { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
    ]
  },
  {
    label: "Comunicação", color: "#06b6d4",
    items: [{ name: "Chat", icon: MessageSquare, page: "Chat" }]
  },
  {
    label: "Saúde", color: "#84cc16",
    items: [{ name: "Saúde e Exames", icon: Activity, page: "CH" }]
  },
  {
    label: "Conta", color: "#8b5cf6",
    items: [
      { name: "Cronômetro", icon: Timer, page: "TimerPage" },
      { name: "Perfil", icon: UserCircle, page: "Profile" },
    ]
  },
];

const subscriberNavGroups = [
  {
    label: "Início", color: "#a855f7",
    items: [{ name: "Dashboard", icon: LayoutDashboard, page: "SubscriberDashboard" }]
  },
  {
    label: "Treino", color: "#ec4899",
    items: [
      { name: "Meu Treino", icon: Dumbbell, page: "MyWorkout" },
      { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
    ]
  },
  {
    label: "Nutrição", color: "#10b981",
    items: [{ name: "Minha Dieta", icon: Utensils, page: "MyDiet" }]
  },
  {
    label: "Conta", color: "#8b5cf6",
    items: [{ name: "Perfil", icon: UserCircle, page: "Profile" }]
  },
];

// ─── 3 raios animados ───────────────────────────────────────────────────────
function ThreeZaps({ active }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={active
            ? { opacity: [1, 0.4, 1], scaleY: [1, 1.35, 0.85, 1] }
            : { opacity: 1, scaleY: 1 }
          }
          transition={{ duration: 0.7, delay: i * 0.1, repeat: active ? Infinity : 0, repeatDelay: 1.2 }}
          style={{ display: 'flex', transformOrigin: 'center' }}
        >
          <Zap
            style={{
              width: 14, height: 14,
              color: active ? '#c084fc' : 'rgba(192,132,252,0.75)',
              filter: active ? 'drop-shadow(0 0 5px #c084fc)' : 'none',
              transform: `rotate(${(i - 1) * 10}deg)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Overlay portal ─────────────────────────────────────────────────────────
function NavOverlay({ open, onClose, navGroups, currentPageName, userName }) {
  // Fechar com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquear scroll do body quando aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    visible: (i) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.3, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] }
    }),
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="cyber-nav-overlay"
          className="fixed inset-0 flex flex-col"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Blur backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              background: 'rgba(2,2,10,0.88)',
            }}
            onClick={onClose}
          />

          {/* Orbs de fundo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{
              position: 'absolute', top: '-10%', left: '-10%',
              width: 300, height: 300, borderRadius: '50%',
              background: 'rgba(168,85,247,0.07)', filter: 'blur(60px)'
            }} />
            <div style={{
              position: 'absolute', bottom: '-5%', right: '-5%',
              width: 250, height: 250, borderRadius: '50%',
              background: 'rgba(6,182,212,0.06)', filter: 'blur(60px)'
            }} />
          </div>

          {/* Conteúdo */}
          <div className="relative flex flex-col h-full" style={{ zIndex: 1 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(168,85,247,0.12)' }}>
              <div className="flex items-center gap-2">
                <span className="font-cyber font-black text-2xl leading-none italic"
                  style={{ color: '#fff', textShadow: '0 0 10px rgba(168,85,247,0.9)' }}>B</span>
                <span className="font-cyber font-black text-2xl leading-none italic"
                  style={{ color: '#c084fc', textShadow: '0 0 12px rgba(192,132,252,1)' }}>Z</span>
                <span className="text-[9px] font-mono-cyber tracking-[0.3em] uppercase ml-1"
                  style={{ color: 'rgba(168,85,247,0.35)' }}>NAV</span>
                {userName && (
                  <span className="ml-2 text-[10px] font-mono-cyber truncate max-w-[140px]"
                    style={{ color: 'rgba(192,132,252,0.35)' }}>{userName}</span>
                )}
              </div>

              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.85 }}
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  border: '1px solid rgba(168,85,247,0.35)',
                  background: 'rgba(168,85,247,0.1)',
                  color: '#c084fc',
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </motion.button>
            </div>

            {/* Grid de navegação */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-2.5 pb-8">
                {navGroups.map((group, gi) => (
                  <motion.div
                    key={group.label}
                    custom={gi}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="rounded-xl p-3"
                    style={{
                      background: `linear-gradient(135deg, rgba(6,4,18,0.95), rgba(4,2,14,0.98))`,
                      border: `1px solid ${group.color}20`,
                      boxShadow: `0 0 24px ${group.color}08, inset 0 1px 0 ${group.color}15`,
                    }}
                  >
                    {/* Label do grupo */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className="h-px flex-1"
                        style={{ background: `linear-gradient(90deg, ${group.color}70, transparent)` }} />
                      <p className="text-[7px] font-bold tracking-[0.3em] uppercase font-mono-cyber whitespace-nowrap"
                        style={{ color: `${group.color}80` }}>
                        {group.label}
                      </p>
                    </div>

                    {/* Itens */}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = currentPageName === item.page;
                        return (
                          <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            onClick={onClose}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg transition-all"
                            style={{
                              background: isActive ? `${group.color}16` : 'transparent',
                              border: isActive ? `1px solid ${group.color}30` : '1px solid transparent',
                            }}
                          >
                            <item.icon
                              style={{
                                width: 12, height: 12, flexShrink: 0,
                                color: isActive ? group.color : `${group.color}50`,
                                filter: isActive ? `drop-shadow(0 0 5px ${group.color})` : 'none',
                              }}
                            />
                            <span className="text-[11px] font-medium leading-tight"
                              style={{ color: isActive ? '#f0e6ff' : 'rgba(180,150,220,0.5)' }}>
                              {item.name}
                            </span>
                            {isActive && (
                              <div className="ml-auto w-1 h-1 rounded-full flex-shrink-0"
                                style={{ background: group.color, boxShadow: `0 0 6px ${group.color}` }} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom scan line */}
            <div className="h-px flex-shrink-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(6,182,212,0.3), transparent)' }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function CyberNav({ role, currentPageName, userName }) {
  const [open, setOpen] = useState(false);

  const isAdmin = role === "admin";
  const isPersonal = role === "personal";
  const isSubscriber = role === "assinante";

  const navGroups = isAdmin ? adminNavGroups
    : isPersonal ? personalNavGroups
    : isSubscriber ? subscriberNavGroups
    : studentNavGroups;

  return (
    <>
      {/* Botão 3 raios */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.88 }}
        className="relative p-2 rounded-lg"
        style={{
          background: open ? 'rgba(168,85,247,0.15)' : 'transparent',
          border: open ? '1px solid rgba(168,85,247,0.45)' : '1px solid transparent',
          boxShadow: open ? '0 0 14px rgba(168,85,247,0.4)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <ThreeZaps active={open} />
      </motion.button>

      <NavOverlay
        open={open}
        onClose={() => setOpen(false)}
        navGroups={navGroups}
        currentPageName={currentPageName}
        userName={userName}
      />
    </>
  );
}