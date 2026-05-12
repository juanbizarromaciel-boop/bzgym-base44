import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Users, ClipboardList, BarChart3, Timer,
  Library, LayoutDashboard, Utensils, BookOpen, Activity,
  FileImage, Trophy, UserCircle, MessageSquare, UserPlus,
  Sparkles, Settings, UserCog, DollarSign, CalendarDays, Briefcase
} from "lucide-react";
import NotificationBell from "./components/notifications/NotificationBell";
import CyberNav from "./components/navigation/CyberNav";

const adminNavGroups = [
  {
    label: "Visão Geral",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
      { name: "Novos Alunos", icon: UserPlus, page: "PendingStudents" },
    ]
  },
  {
    label: "Alunos",
    items: [
      { name: "Alunos", icon: Users, page: "Students" },
      { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
    ]
  },
  {
    label: "Treinos",
    items: [
      { name: "Planos de Treino", icon: ClipboardList, page: "WorkoutPlans" },
      { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
      { name: "Treinar Aluno", icon: Dumbbell, page: "StudentWorkout" },
    ]
  },
  {
    label: "Evolução",
    items: [
      { name: "Progresso", icon: BarChart3, page: "Progress" },
      { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
    ]
  },
  {
    label: "Nutrição",
    items: [
      { name: "Dietas", icon: Utensils, page: "Diet" },
      { name: "Alimentos", icon: BookOpen, page: "FoodDatabase" },
    ]
  },
  {
    label: "Comunicação",
    items: [{ name: "Chat", icon: MessageSquare, page: "Chat" }]
  },
  {
    label: "Saúde",
    items: [{ name: "Saúde e Exames", icon: Activity, page: "CH" }]
  },
  {
    label: "Inteligência Artificial",
    items: [
      { name: "BZ AI Coach", icon: Sparkles, page: "AICoach" },
      { name: "Config. IA", icon: Settings, page: "AISettings" },
    ]
  },
  {
    label: "Administração",
    items: [{ name: "Gestão de Personais", icon: UserCog, page: "PersonalManagement" }]
  },
  {
    label: "Financeiro",
    items: [
      { name: "Financeiro", icon: DollarSign, page: "Finance" },
      { name: "Calendário de Aulas", icon: CalendarDays, page: "ClassCalendar" },
      { name: "Cobrança Consultoria", icon: Briefcase, page: "ConsultancyBilling" },
    ]
  },
  {
    label: "Ferramentas",
    items: [
      { name: "Cronômetro", icon: Timer, page: "TimerPage" },
      { name: "Perfil", icon: UserCircle, page: "Profile" },
    ]
  },
];

const personalNavGroups = [
  {
    label: "Visão Geral",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
      { name: "Novos Alunos", icon: UserPlus, page: "PendingStudents" },
    ]
  },
  {
    label: "Meus Alunos",
    items: [
      { name: "Alunos", icon: Users, page: "Students" },
      { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
    ]
  },
  {
    label: "Treinos",
    items: [
      { name: "Planos de Treino", icon: ClipboardList, page: "WorkoutPlans" },
      { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
      { name: "Treinar Aluno", icon: Dumbbell, page: "StudentWorkout" },
    ]
  },
  {
    label: "Evolução",
    items: [
      { name: "Progresso", icon: BarChart3, page: "Progress" },
      { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
    ]
  },
  {
    label: "Nutrição",
    items: [
      { name: "Dietas", icon: Utensils, page: "Diet" },
      { name: "Alimentos", icon: BookOpen, page: "FoodDatabase" },
    ]
  },
  {
    label: "Comunicação",
    items: [{ name: "Chat", icon: MessageSquare, page: "Chat" }]
  },
  {
    label: "Saúde",
    items: [{ name: "Saúde e Exames", icon: Activity, page: "CH" }]
  },
  {
    label: "Financeiro",
    items: [
      { name: "Financeiro", icon: DollarSign, page: "Finance" },
      { name: "Calendário de Aulas", icon: CalendarDays, page: "ClassCalendar" },
      { name: "Cobrança Consultoria", icon: Briefcase, page: "ConsultancyBilling" },
    ]
  },
  {
    label: "Ferramentas",
    items: [
      { name: "Cronômetro", icon: Timer, page: "TimerPage" },
      { name: "Perfil", icon: UserCircle, page: "Profile" },
    ]
  },
];

const subscriberNavGroups = [
  {
    label: "Início",
    items: [{ name: "Dashboard", icon: LayoutDashboard, page: "SubscriberDashboard" }]
  },
  {
    label: "Treino",
    items: [
      { name: "Meu Treino", icon: Dumbbell, page: "MyWorkout" },
      { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
    ]
  },
  {
    label: "Nutrição",
    items: [{ name: "Minha Dieta", icon: Utensils, page: "MyDiet" }]
  },
  {
    label: "Conta",
    items: [{ name: "Perfil", icon: UserCircle, page: "Profile" }]
  },
];

const studentNavGroups = [
  {
    label: "Hoje",
    items: [{ name: "Dashboard", icon: LayoutDashboard, page: "StudentDashboard" }]
  },
  {
    label: "Treino",
    items: [
      { name: "Meu Treino", icon: Dumbbell, page: "MyWorkout" },
      { name: "Aprender Exercícios", icon: BookOpen, page: "LearnExercises" },
      { name: "Mural PRs", icon: Trophy, page: "PRBoard" },
    ]
  },
  {
    label: "Nutrição",
    items: [{ name: "Minha Dieta", icon: Utensils, page: "MyDiet" }]
  },
  {
    label: "Evolução",
    items: [
      { name: "Progresso", icon: BarChart3, page: "Progress" },
      { name: "Documentos", icon: FileImage, page: "StudentDocuments" },
    ]
  },
  {
    label: "Comunicação",
    items: [{ name: "Chat", icon: MessageSquare, page: "Chat" }]
  },
  {
    label: "Saúde",
    items: [{ name: "Saúde e Exames", icon: Activity, page: "CH" }]
  },
  {
    label: "Conta",
    items: [
      { name: "Cronômetro", icon: Timer, page: "TimerPage" },
      { name: "Perfil", icon: UserCircle, page: "Profile" },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    base44.auth.me().then((user) => {
      setRole(user?.role || "user");
      setUserName(user?.full_name || user?.email || "");
    }).catch(() => setRole("user"));
  }, []);

  const isAdmin = role === "admin";
  const isPersonal = role === "personal";
  const isSubscriber = role === "assinante";
  const navGroups = isAdmin ? adminNavGroups
    : isPersonal ? personalNavGroups
    : isSubscriber ? subscriberNavGroups
    : studentNavGroups;

  const NavLink = ({ item }) => {
    const isActive = currentPageName === item.page;
    return (
      <motion.div whileHover={{ x: isActive ? 0 : 3 }} transition={{ duration: 0.15 }}>
        <Link
          to={createPageUrl(item.page)}
          className={`
            relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 mx-2
            ${isActive
              ? "border border-purple-500/30"
              : "border border-transparent hover:border-purple-900/40"
            }
          `}
          style={isActive ? {
            background: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.08))',
            boxShadow: '0 0 12px rgba(168,85,247,0.12), inset 0 1px 0 rgba(168,85,247,0.1)'
          } : {}}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
              style={{ background: '#c084fc', boxShadow: '0 0 8px rgba(192,132,252,1)' }} />
          )}
          <item.icon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isActive ? "text-purple-400" : "text-purple-500/50"}`}
            style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' } : {}} />
          <span className={`text-xs tracking-wide font-medium transition-colors ${
            isActive ? "text-purple-100" : "text-purple-300/55 hover:text-purple-200"
          }`}>{item.name}</span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: '#c084fc', boxShadow: '0 0 6px rgba(192,132,252,0.9)' }} />
          )}
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#02020a] bg-grid text-white" style={{ color: '#f0e6ff' }}>

      {/* Mobile Header — apenas no mobile, usando CyberNav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/97 backdrop-blur-md border-b border-purple-900/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-0.5">
          <span className="font-cyber font-black text-2xl leading-none select-none italic"
            style={{ color: '#ffffff', textShadow: '0 0 8px rgba(168,85,247,0.8)' }}>B</span>
          <span className="font-cyber font-black text-2xl leading-none select-none italic"
            style={{ color: '#c084fc', textShadow: '0 0 10px rgba(192,132,252,0.9)' }}>Z</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {/* ⚡ CyberNav — substitui o menu de 3 traços */}
          <CyberNav role={role} currentPageName={currentPageName} userName={userName} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-60 z-40 flex-col border-r"
        style={{
          background: 'linear-gradient(180deg, rgba(8,4,22,0.99) 0%, rgba(4,2,14,0.99) 100%)',
          borderColor: 'rgba(168,85,247,0.18)',
          boxShadow: '4px 0 30px rgba(0,0,0,0.6), inset -1px 0 0 rgba(168,85,247,0.08)'
        }}>

        {/* Logo */}
        <div className="px-5 py-4 border-b border-purple-900/15">
          <div className="flex items-baseline gap-1">
            <span className="font-cyber font-black text-3xl leading-none select-none italic"
              style={{ color: '#ffffff', textShadow: '0 0 10px rgba(168,85,247,0.8)' }}>B</span>
            <span className="font-cyber font-black text-3xl leading-none select-none italic"
              style={{ color: '#c084fc', textShadow: '0 0 12px rgba(192,132,252,0.9)' }}>Z</span>
            <span className="ml-1.5 text-[9px] font-mono-cyber text-purple-500/25 tracking-widest uppercase self-end pb-0.5">GYM</span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3 border-b border-purple-900/15">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border
            ${isAdmin ? "border-purple-500/15 bg-purple-500/6" : "border-cyan-500/15 bg-cyan-500/6"}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAdmin ? "bg-purple-400" : "bg-cyan-400"}`} />
            <span className={`text-[10px] font-medium tracking-widest uppercase ${isAdmin ? "text-purple-400/75" : isPersonal ? "text-cyan-400/75" : isSubscriber ? "text-yellow-400/75" : "text-emerald-400/75"}`}>
              {isAdmin ? "Administrador" : isPersonal ? "Personal Trainer" : isSubscriber ? "Assinante" : "Aluno"}
            </span>
          </div>
          {userName && (
            <p className="text-[10px] text-purple-300/25 mt-2 px-1 truncate font-mono-cyber">{userName}</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold px-5 mb-1.5"
                style={{ color: 'rgba(192,132,252,0.45)', letterSpacing: '0.35em' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.page} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent mx-4" />
        <div className="p-3 flex items-center justify-center">
          <p className="text-[9px] text-purple-500/15 font-mono-cyber tracking-widest">BZ · GYM SYSTEM</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-60 pt-16 lg:pt-0 min-h-screen">
        <div className="hidden lg:block fixed top-5 right-6 z-30">
          <NotificationBell />
        </div>
        <motion.div className="p-4 md:p-8"
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