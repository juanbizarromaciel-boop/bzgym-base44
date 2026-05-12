import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Users, ClipboardList, BarChart3, Timer, 
  Library, LayoutDashboard, Utensils, BookOpen, Activity, 
  FileImage, Trophy, UserCircle, MessageSquare, UserPlus,
  Sparkles, Settings, UserCog, DollarSign, CalendarDays, Briefcase, Zap
} from "lucide-react";

const adminNavGroups = [
  {
    label: "Visão Geral",
    color: "#a855f7",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
      { name: "Novos Alunos", icon: UserPlus, page: "PendingStudents" },
    ]
  },
  {
    label: "Alunos",
    color: "#06b6d4",
    items: [
      { name: "Alunos", icon: Users, page: "Students" },
      { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
    ]
  },
  {
    label: "Treinos",
    color: "#ec4899",
    items: [
      { name: "Planos de Treino", icon: ClipboardList, page: "WorkoutPlans" },
      { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
      { name: "Treinar Aluno", icon: Dumbbell, page: "StudentWorkout" },
    ]
  },
  {
    label: "Evolução",
    color: "#f59e0b",
    items: [
      { name: "Progresso", icon: BarChart3, page: "Progress" },
      { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
    ]
  },
  {
    label: "Nutrição",
    color: "#10b981",
    items: [
      { name: "Dietas", icon: Utensils, page: "Diet" },
      { name: "Alimentos", icon: BookOpen, page: "FoodDatabase" },
    ]
  },
  {
    label: "Comunicação",
    color: "#06b6d4",
    items: [
      { name: "Chat", icon: MessageSquare, page: "Chat" },
    ]
  },
  {
    label: "Saúde",
    color: "#84cc16",
    items: [
      { name: "Saúde e Exames", icon: Activity, page: "CH" },
    ]
  },
  {
    label: "Inteligência Artificial",
    color: "#a855f7",
    items: [
      { name: "BZ AI Coach", icon: Sparkles, page: "AICoach" },
      { name: "Config. IA", icon: Settings, page: "AISettings" },
    ]
  },
  {
    label: "Administração",
    color: "#f97316",
    items: [
      { name: "Gestão de Personais", icon: UserCog, page: "PersonalManagement" },
    ]
  },
  {
    label: "Financeiro",
    color: "#10b981",
    items: [
      { name: "Financeiro", icon: DollarSign, page: "Finance" },
      { name: "Calendário de Aulas", icon: CalendarDays, page: "ClassCalendar" },
      { name: "Cobrança Consultoria", icon: Briefcase, page: "ConsultancyBilling" },
    ]
  },
  {
    label: "Ferramentas",
    color: "#8b5cf6",
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

// Lightning bolt icon (3 raios)
function LightningIcon({ active }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={active ? {
            scaleY: [1, 1.3, 0.8, 1.2, 1],
            opacity: [1, 0.6, 1, 0.8, 1],
          } : { scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: i * 0.07, repeat: active ? Infinity : 0, repeatDelay: 1.5 }}
        >
          <Zap
            className="w-3.5 h-3.5"
            style={{
              color: active ? '#c084fc' : 'rgba(192,132,252,0.7)',
              filter: active ? 'drop-shadow(0 0 6px rgba(192,132,252,1))' : 'none',
              transform: `rotate(${(i - 1) * 8}deg)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function CyberNav({ role, currentPageName, userName }) {
  const [open, setOpen] = useState(false);

  const isAdmin = role === "admin";
  const isPersonal = role === "personal";
  const isSubscriber = role === "assinante";
  const navGroups = isAdmin ? adminNavGroups
    : isPersonal ? personalNavGroups
    : isSubscriber ? subscriberNavGroups
    : studentNavGroups;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.1 }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const groupVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
  };

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-all"
        whileTap={{ scale: 0.9 }}
        style={{
          background: open ? 'rgba(168,85,247,0.15)' : 'transparent',
          border: open ? '1px solid rgba(168,85,247,0.4)' : '1px solid transparent',
        }}
      >
        <LightningIcon active={open} />
        {open && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ boxShadow: '0 0 16px rgba(168,85,247,0.5)' }}
          />
        )}
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop blur */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.35 }}
              style={{ background: 'rgba(2,2,10,0.82)' }}
              onClick={() => setOpen(false)}
            />

            {/* Nav panel */}
            <motion.div
              className="fixed inset-0 z-50 flex flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(168,85,247,0.15)' }}>
                <div className="flex items-baseline gap-1">
                  <span className="font-cyber font-black text-2xl leading-none italic"
                    style={{ color: '#ffffff', textShadow: '0 0 10px rgba(168,85,247,0.8)' }}>B</span>
                  <span className="font-cyber font-black text-2xl leading-none italic"
                    style={{ color: '#c084fc', textShadow: '0 0 12px rgba(192,132,252,0.9)' }}>Z</span>
                  {userName && (
                    <span className="ml-3 text-[10px] font-mono-cyber text-purple-400/40 tracking-wider self-center truncate max-w-[160px]">
                      {userName}
                    </span>
                  )}
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  whileTap={{ scale: 0.85 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-purple-400/70 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.08)' }}
                >
                  <LightningIcon active={true} />
                </motion.button>
              </div>

              {/* Scrollable nav content */}
              <motion.div
                className="flex-1 overflow-y-auto px-4 py-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="grid grid-cols-2 gap-3 pb-8">
                  {navGroups.map((group) => (
                    <motion.div
                      key={group.label}
                      variants={groupVariants}
                      className="rounded-xl p-3"
                      style={{
                        background: 'rgba(6,4,18,0.9)',
                        border: `1px solid ${group.color}22`,
                        boxShadow: `0 0 20px ${group.color}0a, inset 0 1px 0 ${group.color}18`,
                      }}
                    >
                      {/* Group label */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${group.color}60, transparent)` }} />
                        <span className="text-[8px] font-bold tracking-[0.25em] uppercase font-mono-cyber"
                          style={{ color: `${group.color}99` }}>
                          {group.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const isActive = currentPageName === item.page;
                          return (
                            <Link
                              key={item.page}
                              to={createPageUrl(item.page)}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group/item"
                              style={{
                                background: isActive ? `${group.color}18` : 'transparent',
                                border: isActive ? `1px solid ${group.color}35` : '1px solid transparent',
                              }}
                            >
                              <item.icon
                                className="w-3 h-3 flex-shrink-0 transition-all"
                                style={{
                                  color: isActive ? group.color : `${group.color}55`,
                                  filter: isActive ? `drop-shadow(0 0 4px ${group.color})` : 'none',
                                }}
                              />
                              <span className="text-[11px] font-medium leading-tight transition-colors"
                                style={{ color: isActive ? '#f0e6ff' : 'rgba(192,155,230,0.55)' }}>
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
              </motion.div>

              {/* Bottom glow line */}
              <div className="h-px flex-shrink-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), rgba(6,182,212,0.2), transparent)' }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}