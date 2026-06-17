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
  Zap, X
} from "lucide-react";

// ─── Nav data ────────────────────────────────────────────────────────────────

const adminNavGroups = [
  { label: "Visão Geral", color: "#a855f7", items: [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Novos Alunos", icon: UserPlus, page: "PendingStudents" },
  ]},
  { label: "Alunos", color: "#06b6d4", items: [
    { name: "Alunos", icon: Users, page: "Students" },
    { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
  ]},
  { label: "Treinos", color: "#ec4899", items: [
    { name: "Planos de Treino", icon: ClipboardList, page: "WorkoutPlans" },
    { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
    { name: "Treinar Aluno", icon: Dumbbell, page: "StudentWorkout" },
  ]},
  { label: "Evolução", color: "#f59e0b", items: [
    { name: "Progresso", icon: BarChart3, page: "Progress" },
    { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
  ]},
  { label: "Nutrição", color: "#10b981", items: [
    { name: "Dietas", icon: Utensils, page: "Diet" },
    { name: "Alimentos", icon: BookOpen, page: "FoodDatabase" },
  ]},
  { label: "Comunicação", color: "#06b6d4", items: [
    { name: "Chat", icon: MessageSquare, page: "Chat" },
  ]},
  { label: "Saúde", color: "#84cc16", items: [
    { name: "Saúde e Exames", icon: Activity, page: "CH" },
  ]},
  { label: "Inteligência Artificial", color: "#a855f7", items: [
    { name: "BZ AI Coach", icon: Sparkles, page: "AICoach" },
    { name: "Config. IA", icon: Settings, page: "AISettings" },
  ]},
  { label: "Administração", color: "#f97316", items: [
    { name: "Gestão de Personais", icon: UserCog, page: "PersonalManagement" },
  ]},
  { label: "Financeiro", color: "#10b981", items: [
    { name: "Financeiro", icon: DollarSign, page: "Finance" },
    { name: "Calendário de Aulas", icon: CalendarDays, page: "ClassCalendar" },
    { name: "Cobrança Consultoria", icon: Briefcase, page: "ConsultancyBilling" },
  ]},
  { label: "Ferramentas", color: "#8b5cf6", items: [
    { name: "Cronômetro", icon: Timer, page: "TimerPage" },
    { name: "Perfil", icon: UserCircle, page: "Profile" },
  ]},
];

const personalNavGroups = [
  { label: "Visão Geral", color: "#a855f7", items: [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Novos Alunos", icon: UserPlus, page: "PendingStudents" },
  ]},
  { label: "Meus Alunos", color: "#06b6d4", items: [
    { name: "Alunos", icon: Users, page: "Students" },
    { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
  ]},
  { label: "Treinos", color: "#ec4899", items: [
    { name: "Planos de Treino", icon: ClipboardList, page: "WorkoutPlans" },
    { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
    { name: "Treinar Aluno", icon: Dumbbell, page: "StudentWorkout" },
  ]},
  { label: "Evolução", color: "#f59e0b", items: [
    { name: "Progresso", icon: BarChart3, page: "Progress" },
    { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
  ]},
  { label: "Nutrição", color: "#10b981", items: [
    { name: "Dietas", icon: Utensils, page: "Diet" },
    { name: "Alimentos", icon: BookOpen, page: "FoodDatabase" },
  ]},
  { label: "Comunicação", color: "#06b6d4", items: [
    { name: "Chat", icon: MessageSquare, page: "Chat" },
  ]},
  { label: "Saúde", color: "#84cc16", items: [
    { name: "Saúde e Exames", icon: Activity, page: "CH" },
  ]},
  { label: "Inteligência Artificial", color: "#a855f7", items: [
    { name: "BZ AI Coach", icon: Sparkles, page: "AICoach" },
  ]},
  { label: "Financeiro", color: "#10b981", items: [
    { name: "Financeiro", icon: DollarSign, page: "Finance" },
    { name: "Calendário de Aulas", icon: CalendarDays, page: "ClassCalendar" },
    { name: "Cobrança Consultoria", icon: Briefcase, page: "ConsultancyBilling" },
  ]},
  { label: "Ferramentas", color: "#8b5cf6", items: [
    { name: "Cronômetro", icon: Timer, page: "TimerPage" },
    { name: "Perfil", icon: UserCircle, page: "Profile" },
  ]},
];

const studentNavGroups = [
  { label: "Hoje", color: "#a855f7", items: [
    { name: "Dashboard", icon: LayoutDashboard, page: "StudentDashboard" },
  ]},
  { label: "Treino", color: "#ec4899", items: [
    { name: "Meu Treino", icon: Dumbbell, page: "MyWorkout" },
    { name: "Aprender Exercícios", icon: BookOpen, page: "LearnExercises" },
    { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
  ]},
  { label: "Nutrição", color: "#10b981", items: [
    { name: "Minha Dieta", icon: Utensils, page: "MyDiet" },
  ]},
  { label: "Evolução", color: "#f59e0b", items: [
    { name: "Progresso", icon: BarChart3, page: "Progress" },
    { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
  ]},
  { label: "Comunicação", color: "#06b6d4", items: [
    { name: "Chat", icon: MessageSquare, page: "Chat" },
  ]},
  { label: "Saúde", color: "#84cc16", items: [
    { name: "Saúde e Exames", icon: Activity, page: "CH" },
  ]},
  { label: "Conta", color: "#8b5cf6", items: [
    { name: "Cronômetro", icon: Timer, page: "TimerPage" },
    { name: "Perfil", icon: UserCircle, page: "Profile" },
  ]},
];

const subscriberNavGroups = [
  { label: "Início", color: "#a855f7", items: [
    { name: "Dashboard", icon: LayoutDashboard, page: "SubscriberDashboard" },
  ]},
  { label: "Treino", color: "#ec4899", items: [
    { name: "Meu Treino", icon: Dumbbell, page: "MyWorkout" },
    { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
  ]},
  { label: "Nutrição", color: "#10b981", items: [
    { name: "Minha Dieta", icon: Utensils, page: "MyDiet" },
  ]},
  { label: "Conta", color: "#8b5cf6", items: [
    { name: "Perfil", icon: UserCircle, page: "Profile" },
  ]},
];

// ─── 3 raios ─────────────────────────────────────────────────────────────────
function ThreeZaps({ active }) {
  return (
    <div className="flex items-center gap-[2px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={active
            ? { opacity: [1, 0.3, 1], y: [0, -2, 0], scaleY: [1, 1.4, 0.9, 1] }
            : { opacity: 0.75, y: 0, scaleY: 1 }
          }
          transition={{
            duration: 0.65, delay: i * 0.1,
            repeat: active ? Infinity : 0, repeatDelay: 1.4
          }}
          style={{ transformOrigin: 'center bottom' }}
        >
          <Zap style={{
            width: 13, height: 13,
            color: active ? '#d8b4fe' : 'rgba(192,132,252,0.65)',
            filter: active ? 'drop-shadow(0 0 6px #c084fc) drop-shadow(0 0 12px rgba(192,132,252,0.6))' : 'none',
            transform: `rotate(${(i - 1) * 12}deg)`,
          }} />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────
function NavOverlay({ open, onClose, navGroups, currentPageName, userName }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="cyber-nav"
          className="fixed inset-0 flex flex-col"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* === Backdrop com blur real === */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              background: 'color-mix(in srgb, var(--bg-void) 92%, transparent)',
            }}
            onClick={onClose}
          />

          {/* === Orbs decorativos animados === */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                position: 'absolute', top: '-15%', left: '-10%',
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, color-mix(in srgb, var(--neon-purple) 14%, transparent) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              style={{
                position: 'absolute', bottom: '-10%', right: '-8%',
                width: 350, height: 350, borderRadius: '50%',
                background: 'radial-gradient(circle, color-mix(in srgb, var(--neon-cyan) 10%, transparent) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              style={{
                position: 'absolute', top: '40%', left: '40%',
                width: 250, height: 250, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
          </div>

          {/* === Conteúdo principal === */}
          <div className="relative flex flex-col h-full" style={{ zIndex: 1 }}>

            {/* Header */}
            <motion.div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              style={{ borderBottom: '1px solid rgba(168,85,247,0.12)' }}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-baseline gap-0.5 px-1.5 py-0.5 rounded-lg"
                  style={{
                    border: '1px solid rgba(168,85,247,0.45)',
                    background: 'rgba(168,85,247,0.1)',
                    boxShadow: '0 0 10px rgba(168,85,247,0.25)',
                  }}>
                  <span className="font-cyber font-black text-2xl leading-none italic"
                    style={{ color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(168,85,247,0.8)', WebkitTextStroke: '0.5px rgba(255,255,255,0.3)' }}>B</span>
                  <span className="font-cyber font-black text-2xl leading-none italic"
                    style={{ color: '#e9d5ff', textShadow: '0 0 10px rgba(192,132,252,1), 0 0 22px rgba(192,132,252,0.8)', WebkitTextStroke: '0.5px rgba(192,132,252,0.4)' }}>Z</span>
                </div>
                <motion.span
                  className="text-[8px] font-mono-cyber tracking-[0.35em] uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{ color: 'color-mix(in srgb, var(--neon-purple) 70%, transparent)' }}
                >
                  NAVIGATOR
                </motion.span>
                {userName && (
                  <motion.span
                    className="ml-2 text-[9px] font-mono-cyber truncate max-w-[130px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    style={{ color: 'color-mix(in srgb, var(--text-secondary) 70%, transparent)' }}
                  >
                    {userName}
                  </motion.span>
                )}
              </div>

              <motion.button
                onClick={onClose}
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  border: '1px solid color-mix(in srgb, var(--neon-purple) 40%, transparent)',
                  background: 'color-mix(in srgb, var(--neon-purple) 12%, transparent)',
                  color: 'var(--neon-purple)',
                  boxShadow: '0 0 12px color-mix(in srgb, var(--neon-purple) 25%, transparent)',
                }}
              >
                <X style={{ width: 15, height: 15 }} />
              </motion.button>
            </motion.div>

            {/* Linha neon top */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                height: 1, flexShrink: 0,
                background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--neon-purple) 80%, transparent), color-mix(in srgb, var(--neon-cyan) 50%, transparent), transparent)',
                transformOrigin: 'left',
              }}
            />

            {/* Grid de navegação */}
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="grid grid-cols-2 gap-3 pb-10">
                {navGroups.map((group, gi) => (
                  <motion.div
                    key={group.label}
                    initial={{ opacity: 0, y: 20, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{
                      duration: 0.38,
                      delay: gi * 0.04,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    className="rounded-2xl p-3 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(145deg, var(--bg-card) 0%, var(--bg-void) 100%)`,
                      border: `1px solid ${group.color}45`,
                      boxShadow: `0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 ${group.color}25, 0 0 12px ${group.color}08`,
                    }}
                  >
                    {/* Reflexo sutil no topo do card */}
                    <div className="absolute top-0 left-0 right-0 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${group.color}40, transparent)` }} />

                    {/* Label do grupo */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className="h-px flex-1"
                        style={{ background: `linear-gradient(90deg, ${group.color}60, transparent)` }} />
                      <p className="text-[7px] font-bold tracking-[0.28em] uppercase font-mono-cyber whitespace-nowrap px-1.5 py-0.5 rounded"
                        style={{
                          color: group.color,
                          textShadow: `0 0 8px ${group.color}, 0 0 16px ${group.color}60`,
                          border: `1px solid ${group.color}35`,
                          background: `${group.color}10`,
                        }}>
                        {group.label}
                      </p>
                    </div>

                    {/* Itens */}
                    <div className="space-y-0.5">
                      {group.items.map((item, ii) => {
                        const isActive = currentPageName === item.page;
                        return (
                          <motion.div
                            key={item.page}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: gi * 0.04 + ii * 0.03 + 0.1, duration: 0.25 }}
                          >
                            <Link
                              to={createPageUrl(item.page)}
                              onClick={onClose}
                              className="flex items-center gap-2 px-2 py-2 rounded-xl transition-all group/link"
                              style={{
                                background: isActive
                                  ? `linear-gradient(135deg, ${group.color}20, ${group.color}0a)`
                                  : 'transparent',
                                border: isActive
                                  ? `1px solid ${group.color}35`
                                  : '1px solid transparent',
                                boxShadow: isActive ? `0 0 16px ${group.color}15` : 'none',
                              }}
                            >
                              <div className="flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center"
                                style={{
                                  background: isActive ? `${group.color}20` : 'transparent',
                                  border: isActive ? `1px solid ${group.color}30` : '1px solid transparent',
                                }}>
                                <item.icon style={{
                                  width: 10, height: 10,
                                  color: isActive ? '#fff' : `${group.color}bb`,
                                  filter: isActive ? `drop-shadow(0 0 4px #fff) drop-shadow(0 0 8px ${group.color})` : `drop-shadow(0 0 3px ${group.color}50)`,
                                }} />
                              </div>
                              <span
                                className="text-[11px] font-medium leading-tight flex-1"
                                style={{
                                  color: isActive ? '#ffffff' : 'var(--text-primary)',
                                  textShadow: isActive ? `0 0 10px ${group.color}, 0 0 20px ${group.color}80` : 'none',
                                }}
                              >
                                {item.name}
                              </span>
                              {isActive && (
                                <motion.div
                                  layoutId={`dot-${item.page}`}
                                  className="w-1 h-1 rounded-full flex-shrink-0"
                                  style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }}
                                />
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom scan line animada */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{
                height: 1, flexShrink: 0,
                background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--neon-cyan) 50%, transparent), color-mix(in srgb, var(--neon-purple) 80%, transparent), transparent)',
                transformOrigin: 'right',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────
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
      <motion.button
        onClick={() => setOpen((v) => !v)}
        data-cybernav-trigger
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
        className="relative p-2 rounded-xl"
        style={{
          background: open ? 'color-mix(in srgb, var(--neon-purple) 18%, transparent)' : 'transparent',
          border: open ? '1px solid color-mix(in srgb, var(--neon-purple) 55%, transparent)' : '1px solid transparent',
          boxShadow: open ? '0 0 18px color-mix(in srgb, var(--neon-purple) 45%, transparent)' : 'none',
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