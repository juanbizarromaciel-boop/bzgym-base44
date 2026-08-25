import {
  Activity, Bell, BookOpen, Brain, CalendarDays, ClipboardCheck, ClipboardList,
  CreditCard, DollarSign, Dumbbell, FileImage, GraduationCap, LayoutDashboard,
  Library, Lock, LogOut, MessageSquare, Newspaper, Settings, Sparkles, Timer,
  TrendingUp, Trophy, UserCircle, UserCog, Users, Users2, Utensils
} from "lucide-react";

const all = ["admin", "personal", "user", "assinante"];
const staff = ["admin", "personal"];
const aiRoles = ["admin", "personal", "assinante"];

export const navigationItems = [
  { id: "admin-home", label: "Início", description: "Visão administrativa", icon: LayoutDashboard, route: "/AdminDashboard", section: "Início", allowedRoles: ["admin"], priority: 1, bottomPriority: { admin: 1 }, isHome: true },
  { id: "personal-home", label: "Início", description: "Resumo do professor", icon: LayoutDashboard, route: "/PersonalDashboard", section: "Início", allowedRoles: ["personal"], priority: 1, bottomPriority: { personal: 1 }, isHome: true },
  { id: "student-home", label: "Início", description: "Minha rotina", icon: LayoutDashboard, route: "/StudentDashboard", section: "Início", allowedRoles: ["user"], priority: 1, bottomPriority: { user: 1 }, isHome: true },
  { id: "subscriber-home", label: "Início", description: "Recursos da assinatura", icon: LayoutDashboard, route: "/SubscriberDashboard", section: "Início", allowedRoles: ["assinante"], priority: 1, bottomPriority: { assinante: 1 }, isHome: true },

  { id: "students", label: "Alunos", description: "Cadastros, vínculos e evolução", icon: Users, route: "/Students", section: "Treinos e alunos", allowedRoles: staff, priority: 10, bottomPriority: { admin: 2, personal: 2 } },
  { id: "pending-students", label: "Aprovações", description: "Novos cadastros aguardando análise", icon: ClipboardCheck, route: "/PendingStudents", section: "Usuários", allowedRoles: staff, priority: 11 },
  { id: "personals", label: "Professores e personais", description: "Equipe, perfis e acessos", icon: UserCog, route: "/PersonalManagement", section: "Usuários", allowedRoles: ["admin"], priority: 12 },
  { id: "subscribers", label: "Assinantes", description: "Planos e liberações", icon: CreditCard, route: "/SubscriptionManagement", section: "Usuários", allowedRoles: staff, priority: 13 },
  { id: "student-documents", label: "Documentos", description: "Fotos, exames e arquivos", icon: FileImage, route: "/StudentDocuments", section: "Avaliações e evolução", allowedRoles: ["admin", "personal", "user"], priority: 14 },

  { id: "student-workout", label: "Treinar aluno", description: "Selecionar aluno e gerenciar o treino atual", icon: GraduationCap, route: "/StudentWorkout", section: "Treinos e alunos", allowedRoles: staff, priority: 20 },
  { id: "workout-plans", label: "Planos de treino", description: "Criar, editar, trocar e acompanhar treinos", icon: ClipboardList, route: "/WorkoutPlans", section: "Treinos e alunos", allowedRoles: ["admin", "personal", "assinante"], priority: 21 },
  { id: "my-workout", label: "Meu treino", description: "Visualizar e executar meu treino", icon: Dumbbell, route: "/MyWorkout", section: "Treino e dieta", allowedRoles: ["user", "assinante"], priority: 22, bottomPriority: { user: 2 } },
  { id: "exercise-library", label: "Biblioteca de exercícios", description: "Exercícios e orientações", icon: Library, route: "/ExerciseLibrary", section: "Treinos e alunos", allowedRoles: ["admin", "personal", "assinante"], priority: 23 },
  { id: "learn-exercises", label: "Exercícios do meu treino", description: "Aprender a execução dos exercícios", icon: BookOpen, route: "/LearnExercises", section: "Treino e dieta", allowedRoles: ["user"], priority: 24 },
  { id: "pr-board", label: "Mural de PRs", description: "Recordes pessoais", icon: Trophy, route: "/PRBoard", section: "Avaliações e evolução", allowedRoles: ["admin", "personal", "user"], priority: 25 },

  { id: "diets", label: "Dietas", description: "Criar, editar, trocar e acompanhar dietas", icon: Utensils, route: "/Diet", section: "Dietas e avaliações", allowedRoles: ["admin", "personal", "assinante"], priority: 30 },
  { id: "my-diet", label: "Minha dieta", description: "Visualizar minha dieta atribuída", icon: Utensils, route: "/MyDiet", section: "Treino e dieta", allowedRoles: ["user", "assinante"], priority: 31, bottomPriority: { user: 3 } },
  { id: "diet-history", label: "Histórico de dietas", description: "Registros e acompanhamento nutricional", icon: ClipboardList, route: "/DietLogs", section: "Dietas e avaliações", allowedRoles: staff, priority: 32 },
  { id: "foods", label: "Base de alimentos", description: "Biblioteca nutricional", icon: BookOpen, route: "/FoodDatabase", section: "Dietas e avaliações", allowedRoles: staff, priority: 33 },
  { id: "progress", label: "Avaliações e evolução", description: "IMC, bioimpedância, medidas, fotos e progresso", icon: TrendingUp, route: "/Progress", section: "Avaliações e evolução", allowedRoles: ["admin", "personal", "user"], priority: 34 },
  { id: "checkin", label: "Check-in", description: "Registrar acompanhamento diário", icon: ClipboardCheck, route: "/CheckIn", section: "Avaliações e evolução", allowedRoles: ["user"], priority: 35 },
  { id: "health", label: "Saúde e exames", description: "Avaliações e informações de saúde", icon: Activity, route: "/CH", section: "Avaliações e evolução", allowedRoles: ["admin", "personal", "user"], priority: 36 },

  { id: "bzi", label: "BZI", description: "Assistente inteligente para treinos, dietas e conteúdos", icon: Sparkles, route: "/AICoach", section: "Inteligência artificial", allowedRoles: aiRoles, requiredPlan: "active_for_subscriber", requiredFeature: "ai", priority: 40, bottomPriority: { assinante: 2 } },
  { id: "workout-ai", label: "IA de treino", description: "Criar e evoluir treinos com IA", icon: Dumbbell, route: "/WorkoutAI", section: "BZI e recursos", allowedRoles: ["assinante"], requiredPlan: "active", priority: 41 },
  { id: "diet-ai", label: "IA de dieta", description: "Criar e ajustar dietas com IA", icon: Utensils, route: "/DietAI", section: "BZI e recursos", allowedRoles: ["assinante"], requiredPlan: "active", priority: 42 },
  { id: "ai-settings", label: "Configurações de IA", description: "Parâmetros administrativos da inteligência artificial", icon: Brain, route: "/AISettings", section: "Inteligência artificial", allowedRoles: ["admin"], requiredPermission: "admin", priority: 43 },

  { id: "calendar", label: "Agenda", description: "Compromissos e calendário", icon: CalendarDays, route: "/CalendarioGeral", section: "Comunicação", allowedRoles: ["admin", "personal", "user"], priority: 50, bottomPriority: { personal: 3, user: 4 } },
  { id: "class-calendar", label: "Calendário de aulas", description: "Agenda de atendimentos", icon: CalendarDays, route: "/ClassCalendar", section: "Comunicação", allowedRoles: staff, priority: 51 },
  { id: "chat", label: "Mensagens", description: "Conversas e acompanhamento", icon: MessageSquare, route: "/Chat", section: "Comunicação", allowedRoles: ["admin", "personal", "user"], priority: 52 },
  { id: "notifications", label: "Notificações", description: "Avisos e atualizações", icon: Bell, route: "/Notificacoes", section: "Comunicação", allowedRoles: all, badge: "unreadNotifications", priority: 53 },
  { id: "community", label: "Comunidade e conteúdos", description: "Conteúdos e publicações", icon: Users2, route: "/Comunidade", section: "Comunicação", allowedRoles: all, priority: 54, bottomPriority: { assinante: 3 } },

  { id: "finance", label: "Financeiro", description: "Recebimentos e pagamentos", icon: DollarSign, route: "/Finance", section: "Gestão", allowedRoles: staff, priority: 60, bottomPriority: { admin: 3, personal: 4 } },
  { id: "billing", label: "Cobrança", description: "Cobranças da consultoria", icon: CreditCard, route: "/ConsultancyBilling", section: "Gestão", allowedRoles: staff, priority: 61 },
  { id: "subscriber-plan", label: "Meu plano", description: "Assinatura, pagamentos e renovação", icon: CreditCard, route: "/SubscriberBilling", section: "Assinatura", allowedRoles: ["assinante"], requiredPlan: "subscriber", priority: 62, bottomPriority: { assinante: 4 } },
  { id: "reports", label: "Relatórios", description: "Indicadores e relatórios de evolução", icon: TrendingUp, route: "/Relatorios", section: "Gestão", allowedRoles: staff, priority: 63, bottomPriority: { admin: 4 } },
  { id: "news", label: "Gestão de notícias", description: "Conteúdos esportivos", icon: Newspaper, route: "/NewsManagement", section: "Gestão", allowedRoles: ["admin"], priority: 64 },
  { id: "hormonal-calendar", label: "Calendário hormonal", description: "Módulo administrativo restrito", icon: Lock, route: "/CalendarioHormonalAdmin", section: "Gestão", allowedRoles: ["admin"], priority: 65 },

  { id: "focus", label: "Foco e rotina", description: "Organização pessoal", icon: Brain, route: "/FocusRoutine", section: "Conta", allowedRoles: all, priority: 70 },
  { id: "timer", label: "Cronômetro", description: "Temporizador de treino", icon: Timer, route: "/TimerPage", section: "Conta", allowedRoles: ["admin", "personal", "user"], priority: 71 },
  { id: "profile", label: "Perfil", description: "Dados pessoais e conta", icon: UserCircle, route: "/Profile", section: "Conta", allowedRoles: all, priority: 72 },
  { id: "themes", label: "Configurações visuais", description: "Tema e aparência do aplicativo", icon: Settings, route: "/AppThemes", section: "Conta", allowedRoles: all, priority: 73 },
  { id: "logout", label: "Sair", description: "Encerrar a sessão com segurança", icon: LogOut, route: null, action: "logout", section: "Conta", allowedRoles: all, priority: 99 }
];

const studentVisibleItems = new Set(["student-home", "my-workout", "my-diet", "student-documents", "pr-board", "progress", "calendar", "community", "profile", "logout"]);
export const getNavigationItems = (role) => navigationItems.filter(item => item.allowedRoles.includes(role) && (role !== "user" || studentVisibleItems.has(item.id)));
export const getBottomNavigation = (role) => getNavigationItems(role).filter(item => item.bottomPriority?.[role]).sort((a, b) => a.bottomPriority[role] - b.bottomPriority[role]);
export const getMoreNavigation = (role) => getNavigationItems(role).filter(item => !item.isHome).sort((a, b) => a.priority - b.priority);

const sectionColors = ["#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
export const getNavigationGroups = (role) => Object.entries(getNavigationItems(role).filter(item => !item.action).reduce((groups, item) => {
  (groups[item.section] ||= []).push({ name: item.label, icon: item.icon, page: item.route.slice(1) });
  return groups;
}, {})).map(([label, items], index) => ({ label, color: sectionColors[index % sectionColors.length], items }));