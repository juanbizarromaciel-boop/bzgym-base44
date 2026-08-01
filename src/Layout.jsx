import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Users, ClipboardList, BarChart3, Timer,
  Library, LayoutDashboard, Utensils, BookOpen, Activity,
  FileImage, Trophy, UserCircle, MessageSquare, UserPlus,
  Sparkles, Settings, UserCog, DollarSign, CalendarDays, Briefcase, Brain,
  Users2, Lock, Bell, Newspaper, CreditCard
} from "lucide-react";
import NotificationBell from "./components/notifications/NotificationBell";
import CyberNav from "./components/navigation/CyberNav";
import BottomNav from "./components/navigation/BottomNav";

const adminNavGroups = [
  { label: "Visão Geral", color: "#a855f7", items: [
    { name: "Dashboard Admin", icon: LayoutDashboard, page: "AdminDashboard" },
    { name: "Novos Alunos", icon: UserPlus, page: "PendingStudents" },
    { name: "Notificações", icon: Bell, page: "Notificacoes" },
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
    { name: "Relatórios", icon: BarChart3, page: "Relatorios" },
    { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
  ]},
  { label: "Nutrição", color: "#10b981", items: [
    { name: "Dietas", icon: Utensils, page: "Diet" },
    { name: "Histórico de Dietas", icon: ClipboardList, page: "DietLogs" },
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
    { name: "Gestão de Assinaturas", icon: DollarSign, page: "SubscriptionManagement" },
    { name: "Gestão de Notícias", icon: Newspaper, page: "NewsManagement" },
  ]},
  { label: "Agenda & Financeiro", color: "#10b981", items: [
    { name: "Calendário", icon: CalendarDays, page: "CalendarioGeral" },
    { name: "Financeiro", icon: DollarSign, page: "Finance" },
    { name: "Cal. de Aulas", icon: CalendarDays, page: "ClassCalendar" },
    { name: "Cobrança", icon: Briefcase, page: "ConsultancyBilling" },
  ]},
  { label: "Comunidade", color: "#ec4899", items: [
    { name: "Comunidade", icon: Users2, page: "Comunidade" },
  ]},
  { label: "Ferramentas", color: "#8b5cf6", items: [
    { name: "Foco & Rotina", icon: Brain, page: "FocusRoutine" },
    { name: "Cronômetro", icon: Timer, page: "TimerPage" },
    { name: "Perfil", icon: UserCircle, page: "Profile" },
  ]},
  { label: "Restrito", color: "#84cc16", items: [
    { name: "Calendário Hormonal", icon: Lock, page: "CalendarioHormonalAdmin" },
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
    { name: "Relatórios", icon: BarChart3, page: "Relatorios" },
    { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
  ]},
  { label: "Nutrição", color: "#10b981", items: [
    { name: "Dietas", icon: Utensils, page: "Diet" },
    { name: "Histórico de Dietas", icon: ClipboardList, page: "DietLogs" },
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
  { label: "Agenda & Financeiro", color: "#10b981", items: [
    { name: "Calendário", icon: CalendarDays, page: "CalendarioGeral" },
    { name: "Financeiro", icon: DollarSign, page: "Finance" },
    { name: "Gestão de Assinaturas", icon: DollarSign, page: "SubscriptionManagement" },
    { name: "Cal. de Aulas", icon: CalendarDays, page: "ClassCalendar" },
    { name: "Cobrança", icon: Briefcase, page: "ConsultancyBilling" },
  ]},
  { label: "Comunidade", color: "#ec4899", items: [
    { name: "Comunidade", icon: Users2, page: "Comunidade" },
  ]},
  { label: "Ferramentas", color: "#8b5cf6", items: [
    { name: "Foco & Rotina", icon: Brain, page: "FocusRoutine" },
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
    { name: "Criar/Editar Treinos", icon: ClipboardList, page: "WorkoutPlans" },
    { name: "IA de Treino", icon: Sparkles, page: "WorkoutAI" },
    { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
  ]},
  { label: "Nutrição", color: "#10b981", items: [
    { name: "Minha Dieta", icon: Utensils, page: "MyDiet" },
    { name: "Criar/Editar Dieta", icon: ClipboardList, page: "Diet" },
    { name: "IA de Dieta", icon: Sparkles, page: "DietAI" },
  ]},
  { label: "Comunidade", color: "#ec4899", items: [
    { name: "Comunidade", icon: Users2, page: "Comunidade" },
  ]},
  { label: "Conta", color: "#8b5cf6", items: [
    { name: "Assinatura", icon: CreditCard, page: "SubscriberBilling" },
    { name: "Foco & Rotina", icon: Brain, page: "FocusRoutine" },
    { name: "Perfil", icon: UserCircle, page: "Profile" },
  ]},
];

const studentNavGroups = [
  { label: "Hoje", color: "#a855f7", items: [
    { name: "Dashboard", icon: LayoutDashboard, page: "StudentDashboard" },
    { name: "Check-in Diário", icon: ClipboardList, page: "CheckIn" },
  ]},
  { label: "Treino", color: "#ec4899", items: [
    { name: "Meu Treino", icon: Dumbbell, page: "MyWorkout" },
    { name: "Criar/Editar Treinos", icon: ClipboardList, page: "WorkoutPlans" },
    { name: "IA de Treino", icon: Sparkles, page: "WorkoutAI" },
    { name: "Aprender Exercícios", icon: BookOpen, page: "LearnExercises" },
    { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
  ]},
  { label: "Nutrição", color: "#10b981", items: [
    { name: "Minha Dieta", icon: Utensils, page: "MyDiet" },
    { name: "Criar/Editar Dieta", icon: ClipboardList, page: "Diet" },
    { name: "IA de Dieta", icon: Sparkles, page: "DietAI" },
  ]},
  { label: "Evolução", color: "#f59e0b", items: [
    { name: "Progresso", icon: BarChart3, page: "Progress" },
    { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
  ]},
  { label: "Comunicação", color: "#06b6d4", items: [
    { name: "Chat", icon: MessageSquare, page: "Chat" },
    { name: "Comunidade", icon: Users2, page: "Comunidade" },
  ]},
  { label: "Agenda", color: "#a855f7", items: [
    { name: "Calendário", icon: CalendarDays, page: "CalendarioGeral" },
  ]},
  { label: "Saúde", color: "#84cc16", items: [
    { name: "Saúde e Exames", icon: Activity, page: "CH" },
  ]},
  { label: "Conta", color: "#8b5cf6", items: [
    { name: "Foco & Rotina", icon: Brain, page: "FocusRoutine" },
    { name: "Cronômetro", icon: Timer, page: "TimerPage" },
    { name: "Perfil", icon: UserCircle, page: "Profile" },
  ]},
];

export default function Layout({ children, currentPageName }) {
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      let mergedUser = authUser;
      try {
        const profileResponse = await base44.functions.invoke('getCurrentUserProfile', {});
        mergedUser = profileResponse.data.user || authUser;
      } catch (error) {
        mergedUser = authUser;
      }
      const baseRole = mergedUser.role || "user";
      const hasSubscriberProfile = mergedUser.account_type === "assinante" || mergedUser.assinatura_status || mergedUser.assinatura_vencimento || mergedUser.assinatura_origem || mergedUser.stripe_subscription_id;
      const effectiveRole = hasSubscriberProfile && !["admin", "personal", "recente", "bloqueado"].includes(baseRole)
        ? "assinante"
        : baseRole;
      setRole(effectiveRole);
      const rawName = [mergedUser.display_name, mergedUser.full_name, mergedUser.name, mergedUser.nome].find(value => typeof value === "string" && !["", "lost", "undefined", "null"].includes(value.trim().toLowerCase()));
      const emailName = mergedUser.email?.split("@")[0]?.replace(/[._-]+/g, " ") || "";
      const personalName = rawName || (!["", "lost", "undefined", "null"].includes(emailName.toLowerCase()) ? emailName : "Professor");
      setUserName(effectiveRole === "personal" ? personalName : (mergedUser.full_name || mergedUser.email || ""));
      let avatar = mergedUser.photo_url || mergedUser.avatar_url || mergedUser.profile_image || "";
      if (!avatar && effectiveRole === "personal") {
        const profiles = await base44.entities.Student.filter({ email: mergedUser.email }, "-created_date", 1);
        avatar = profiles[0]?.photo_url || "";
      }
      setUserAvatar(avatar);
    }).catch(() => setRole("user"));
  }, []);

  const isAdmin = role === "admin";
  const isPersonal = role === "personal";
  const isSubscriber = role === "assinante";
  const navGroups = isAdmin ? adminNavGroups
    : isPersonal ? personalNavGroups
    : isSubscriber ? subscriberNavGroups
    : studentNavGroups;
  const isPersonalDashboard = isPersonal && currentPageName === "PersonalDashboard";

  const NavLink = ({ item }) => {
    const isActive = currentPageName === item.page;
    return (
      <motion.div whileHover={{ x: isActive ? 0 : 2 }} transition={{ duration: 0.13 }}>
        <Link
          to={createPageUrl(item.page)}
          className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 mx-2"
          style={isActive ? {
            background: `color-mix(in srgb, var(--neon-purple) 18%, transparent)`,
            border: `1px solid color-mix(in srgb, var(--neon-purple) 60%, transparent)`,
            boxShadow: `0 0 18px color-mix(in srgb, var(--neon-purple) 35%, transparent), inset 0 0 10px color-mix(in srgb, var(--neon-purple) 10%, transparent)`,
          } : {
            border: '1px solid transparent',
          }}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
              style={{ background: 'var(--neon-purple)', boxShadow: `0 0 10px var(--neon-purple), 0 0 20px color-mix(in srgb, var(--neon-purple) 50%, transparent)` }} />
          )}
          <item.icon
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{
              color: isActive ? '#fff' : 'color-mix(in srgb, var(--neon-purple) 85%, white)',
              filter: isActive
                ? `drop-shadow(0 0 5px #fff) drop-shadow(0 0 10px var(--neon-purple)) drop-shadow(0 0 18px color-mix(in srgb, var(--neon-purple) 60%, transparent))`
                : `drop-shadow(0 0 4px color-mix(in srgb, var(--neon-purple) 65%, transparent))`,
            }}
          />
          <span className="text-xs font-medium leading-tight"
            style={{
              color: isActive ? '#ffffff' : 'var(--text-primary)',
              textShadow: isActive ? `0 0 10px var(--neon-purple), 0 0 22px color-mix(in srgb, var(--neon-purple) 70%, transparent)` : 'none',
            }}>
            {item.name}
          </span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--neon-purple)', boxShadow: `0 0 8px var(--neon-purple), 0 0 16px color-mix(in srgb, var(--neon-purple) 50%, transparent)` }} />
          )}
        </Link>
      </motion.div>
    );
  };

  return (
    <div className={`min-h-screen text-white ${isPersonalDashboard ? "bg-professor-bg" : "bg-grid"}`} style={isPersonalDashboard ? undefined : { backgroundColor: 'var(--bg-void)', color: 'var(--text-primary)' }}>

      {/* Mobile Header */}
      {isPersonal ? (
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-professor-bg/95 backdrop-blur-xl lg:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="mx-auto flex h-[72px] w-full max-w-[430px] items-center justify-between px-4">
            <Link to="/" aria-label="Ir para o início" className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-professor-border/35 bg-professor-border/10 text-[22px] font-black italic tracking-[-0.08em] text-professor shadow-[0_0_18px_rgba(168,85,247,0.16)]">BZ</div>
              <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-professor">BZ Gym System</p></div>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link to="/Profile" aria-label="Abrir perfil" className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-professor-border/35 bg-professor-border/10 text-xs font-semibold text-purple-200">
                {userAvatar ? <img src={userAvatar} alt="Perfil" className="h-full w-full object-cover" /> : userName.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-md px-4 py-3 flex items-center justify-between"
          style={{
            background: 'color-mix(in srgb, var(--bg-void) 95%, transparent)',
            borderBottom: '1px solid color-mix(in srgb, var(--neon-purple) 40%, transparent)',
            boxShadow: '0 2px 20px color-mix(in srgb, var(--neon-purple) 15%, transparent)',
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))'
          }}>
          <Link to="/" aria-label="Ir para o início" className="flex items-baseline gap-0.5 px-2 py-1 rounded-lg"
            style={{
              border: '1px solid color-mix(in srgb, var(--neon-purple) 65%, transparent)',
              background: 'color-mix(in srgb, var(--neon-purple) 12%, transparent)',
              boxShadow: '0 0 20px color-mix(in srgb, var(--neon-purple) 40%, transparent), inset 0 0 8px color-mix(in srgb, var(--neon-purple) 10%, transparent)',
            }}>
            <span className="font-cyber font-black text-2xl leading-none select-none italic" style={{ color: '#ffffff', textShadow: '0 0 14px var(--neon-purple), 0 0 30px color-mix(in srgb, var(--neon-purple) 50%, transparent), 0 0 2px #fff' }}>B</span>
            <span className="font-cyber font-black text-2xl leading-none select-none italic" style={{ color: 'var(--neon-purple)', textShadow: '0 0 18px var(--neon-purple), 0 0 40px color-mix(in srgb, var(--neon-purple) 55%, transparent)' }}>Z</span>
          </Link>
          <div className="flex items-center gap-2"><NotificationBell /><CyberNav role={role} currentPageName={currentPageName} userName={userName} /></div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-60 z-40 flex-col border-r"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 97%, transparent) 0%, color-mix(in srgb, var(--bg-void) 99%, transparent) 100%)`,
          borderColor: 'color-mix(in srgb, var(--neon-purple) 55%, transparent)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.8), inset -1px 0 0 color-mix(in srgb, var(--neon-purple) 40%, transparent), 3px 0 30px color-mix(in srgb, var(--neon-purple) 18%, transparent), 0 0 60px color-mix(in srgb, var(--neon-purple) 8%, transparent)'
        }}>

        {/* Logo */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--neon-purple) 35%, transparent)' }}>
          <div className="flex items-baseline gap-1 px-2.5 py-1.5 rounded-xl"
            style={{
              border: '1px solid color-mix(in srgb, var(--neon-purple) 72%, transparent)',
              background: 'color-mix(in srgb, var(--neon-purple) 15%, transparent)',
              boxShadow: '0 0 28px color-mix(in srgb, var(--neon-purple) 55%, transparent), inset 0 0 14px color-mix(in srgb, var(--neon-purple) 12%, transparent)',
            }}>
            <span className="font-cyber font-black text-3xl leading-none select-none italic"
              style={{ color: '#ffffff', textShadow: '0 0 16px var(--neon-purple), 0 0 36px color-mix(in srgb, var(--neon-purple) 60%, transparent), 0 0 3px #fff' }}>B</span>
            <span className="font-cyber font-black text-3xl leading-none select-none italic"
              style={{ color: 'var(--neon-purple)', textShadow: '0 0 20px var(--neon-purple), 0 0 48px color-mix(in srgb, var(--neon-purple) 65%, transparent), 0 0 72px color-mix(in srgb, var(--neon-purple) 30%, transparent)' }}>Z</span>
            <span className="ml-1.5 text-[9px] font-mono-cyber tracking-widest uppercase self-end pb-0.5"
              style={{ color: 'color-mix(in srgb, var(--neon-purple) 90%, white)', textShadow: '0 0 10px var(--neon-purple)' }}>GYM</span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid color-mix(in srgb, var(--neon-purple) 30%, transparent)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{
              borderColor: 'color-mix(in srgb, var(--neon-purple) 55%, transparent)',
              background: 'color-mix(in srgb, var(--neon-purple) 16%, transparent)',
              boxShadow: '0 0 18px color-mix(in srgb, var(--neon-purple) 25%, transparent), inset 0 0 10px color-mix(in srgb, var(--neon-purple) 8%, transparent)'
            }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--neon-purple)', boxShadow: '0 0 8px var(--neon-purple), 0 0 16px color-mix(in srgb, var(--neon-purple) 50%, transparent)' }} />
            <span className="text-[10px] font-medium tracking-widest uppercase"
              style={{ color: '#ffffff', textShadow: '0 0 8px var(--neon-purple)' }}>
              {isAdmin ? "Administrador" : isPersonal ? "Personal Trainer" : isSubscriber ? "Assinante" : "Aluno"}
            </span>
          </div>
          {userName && (
            <p className="text-[10px] mt-2 px-1 truncate font-mono-cyber"
              style={{ color: 'color-mix(in srgb, var(--neon-purple) 75%, white)' }}>{userName}</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="flex items-center gap-1.5 px-5 mb-1.5">
                <div className="h-px flex-1"
                  style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${group.color} 70%, transparent), transparent)` }} />
                <p className="text-[8px] uppercase tracking-[0.28em] font-bold font-mono-cyber whitespace-nowrap"
                  style={{
                    color: group.color,
                    textShadow: `0 0 8px ${group.color}, 0 0 18px ${group.color}88`,
                  }}>
                  {group.label}
                </p>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.page} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="h-px mx-4" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--neon-purple) 50%, transparent), transparent)' }} />
        <div className="p-3 flex items-center justify-center">
          <p className="text-[9px] font-mono-cyber tracking-widest"
            style={{ color: 'color-mix(in srgb, var(--neon-purple) 70%, white)', textShadow: '0 0 8px var(--neon-purple)' }}>BZ · GYM SYSTEM</p>
        </div>
      </aside>

      {/* Bottom navigation for mobile app profiles */}
      {(role === "user" || role === "assinante" || role === "personal") && (
        <BottomNav role={role} onMoreClick={() => {
          // Open the CyberNav overlay — dispatch a synthetic click on the CyberNav button
          const btn = document.querySelector('[data-cybernav-trigger]');
          if (btn) btn.click();
        }} />
      )}

      {/* Main Content */}
      <main className={`lg:ml-60 min-h-screen ${isPersonal ? "pt-[calc(76px+env(safe-area-inset-top))] lg:pt-0" : "pt-16 lg:pt-0"} ${((role === "user" || role === "assinante" || role === "personal") && !isPersonalDashboard) ? "pb-24 lg:pb-0" : ""}`}>
        <div className="hidden lg:block fixed top-5 right-6 z-30">
          <NotificationBell />
        </div>
        <motion.div className={isPersonalDashboard ? "p-0" : "p-4 md:p-8"}
          key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}