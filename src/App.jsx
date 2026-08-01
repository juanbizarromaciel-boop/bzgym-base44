import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Onboarding from './pages/Onboarding';
import Chat from './pages/Chat';
import PendingStudents from './pages/PendingStudents';
import AICoach from './pages/AICoach';
import AISettings from './pages/AISettings';
import PersonalManagement from './pages/PersonalManagement';
import Finance from './pages/Finance';
import ClassCalendar from './pages/ClassCalendar';
import ConsultancyBilling from './pages/ConsultancyBilling';
import SubscriberDashboard from './pages/SubscriberDashboard';
import AccessDenied from './pages/AccessDenied';
import MyWorkout from './pages/MyWorkout';
import WorkoutPlans from './pages/WorkoutPlans';
import MyDiet from './pages/MyDiet';
import Diet from './pages/Diet';
import DietLogs from './pages/DietLogs';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Welcome from './pages/Welcome';
import CH from './pages/CH';
import PRBoard from './pages/PRBoard.jsx';
import Profile from './pages/Profile.jsx';
import StudentDocuments from './pages/StudentDocuments';
import LearnExercises from './pages/LearnExercises';
import { base44 } from '@/api/base44Client';
import { ThemeProvider } from '@/lib/ThemeContext';
import AppThemes from './pages/AppThemes';
import FocusRoutine from './pages/FocusRoutine';
import CheckInPage from './pages/CheckInPage';
import PersonalDashboard from './pages/PersonalDashboard';
import Comunidade from './pages/Comunidade';
import CalendarioHormonalAdmin from './pages/CalendarioHormonalAdmin';
import CalendarioGeral from './pages/CalendarioGeral';
import Relatorios from './pages/Relatorios';
import AdminDashboard from './pages/AdminDashboard';
import Notificacoes from './pages/Notificacoes';
import NewsManagement from './pages/NewsManagement';
import SportsNewsDetail from './pages/SportsNewsDetail';
import SubscriptionManagement from './pages/SubscriptionManagement';
import PaymentOverdue from './pages/PaymentOverdue';
import SubscriberBilling from './pages/SubscriberBilling';
import WorkoutAI from './pages/WorkoutAI';
import DietAI from './pages/DietAI';
import { useState, useEffect } from 'react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const todayIso = () => new Date().toISOString().slice(0, 10);

const hasValidSubscriberAccess = (user) => {
  if (!user) return false;
  if (user.assinatura_bloqueio_manual || user.assinatura_status === 'bloqueada') return false;
  if (user.assinatura_status === 'isenta') return true;
  if (user.assinatura_status !== 'ativa') return false;
  if (user.assinatura_vencimento && user.assinatura_vencimento < todayIso()) return false;
  return user.assinatura_origem === 'manual' || user.assinatura_origem === 'stripe' || !!user.stripe_subscription_id || !user.assinatura_origem;
};

const isAccessBlocked = (user) => {
  if (!user || user.role === 'admin' || user.role === 'personal' || user.role === 'recente') return false;
  if (user.role === 'bloqueado') return true;
  if (user.assinatura_bloqueio_manual || user.assinatura_status === 'bloqueada') return true;
  if (user.account_type === 'assinante' || user.role === 'assinante') return !hasValidSubscriberAccess(user);
  return false;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [checkingStudent, setCheckingStudent] = useState(true);

  useEffect(() => {
    let unsubscribeUser = null;
    let pollUser = null;

    const loadCurrentUser = async () => {
      const authUser = await base44.auth.me();
      let mergedUser = authUser;
      try {
        const profileResponse = await base44.functions.invoke('getCurrentUserProfile', {});
        mergedUser = profileResponse.data.user || authUser;
      } catch (error) {
        mergedUser = authUser;
      }
      const baseRole = mergedUser.role || 'user';
      const hasSubscriberProfile = mergedUser.account_type === 'assinante' || mergedUser.assinatura_status || mergedUser.assinatura_vencimento || mergedUser.assinatura_origem || mergedUser.stripe_subscription_id;
      const role = hasSubscriberProfile && !['admin', 'personal', 'recente', 'bloqueado'].includes(baseRole)
        ? 'assinante'
        : baseRole;
      let u = { ...mergedUser, role };
      if (u.role !== 'admin' && u.role !== 'personal') {
        const students = await base44.entities.Student.list();
        const found = students.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
        if (found?.id && u.student_id !== found.id) {
          await base44.auth.updateMe({ student_id: found.id });
          u = { ...u, student_id: found.id };
        }
        setStudent(found);
      }
      setUser(u);
      setCheckingStudent(false);
      return u;
    };

    if (!isLoadingAuth && !authError) {
      loadCurrentUser().then((u) => {
        unsubscribeUser = base44.entities.User.subscribe((event) => {
          if (event.data?.email?.toLowerCase() === u.email?.toLowerCase()) loadCurrentUser();
        });
        pollUser = setInterval(loadCurrentUser, 5000);
      }).catch(() => {
        setCheckingStudent(false);
      });
    } else {
      setCheckingStudent(false);
    }

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (pollUser) clearInterval(pollUser);
    };
  }, [isLoadingAuth, authError]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || checkingStudent) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Usuário sem liberação válida, vencido ou bloqueado manualmente
  if (isAccessBlocked(user)) {
    return <Routes>
      <Route path="/PaymentOverdue" element={<PaymentOverdue />} />
      <Route path="/SubscriberBilling" element={<SubscriberBilling />} />
      <Route path="*" element={<Navigate to="/PaymentOverdue" replace />} />
    </Routes>;
  }

  // Role: recente — só pode fazer onboarding
  if (user && user.role === 'recente') {
    return <Routes>
      <Route path="/Onboarding" element={<Onboarding />} />
      <Route path="*" element={<Navigate to="/Onboarding" replace />} />
    </Routes>;
  }

  // Role: assinante — acesso limitado
  if (user && user.role === 'assinante') {
    return <Routes>
      <Route path="/" element={<LayoutWrapper currentPageName="SubscriberDashboard"><SubscriberDashboard /></LayoutWrapper>} />
      <Route path="/SubscriberDashboard" element={<LayoutWrapper currentPageName="SubscriberDashboard"><SubscriberDashboard /></LayoutWrapper>} />
      <Route path="/MyWorkout" element={<LayoutWrapper currentPageName="MyWorkout"><MyWorkout /></LayoutWrapper>} />
      <Route path="/WorkoutPlans" element={<LayoutWrapper currentPageName="WorkoutPlans"><WorkoutPlans /></LayoutWrapper>} />
      <Route path="/WorkoutAI" element={<LayoutWrapper currentPageName="WorkoutAI"><WorkoutAI /></LayoutWrapper>} />
      <Route path="/ExerciseLibrary" element={<LayoutWrapper currentPageName="ExerciseLibrary"><ExerciseLibrary /></LayoutWrapper>} />
      <Route path="/MyDiet" element={<LayoutWrapper currentPageName="MyDiet"><MyDiet /></LayoutWrapper>} />
      <Route path="/Diet" element={<LayoutWrapper currentPageName="Diet"><Diet /></LayoutWrapper>} />
      <Route path="/DietAI" element={<LayoutWrapper currentPageName="DietAI"><DietAI /></LayoutWrapper>} />
      <Route path="/Comunidade" element={<LayoutWrapper currentPageName="Comunidade"><Comunidade /></LayoutWrapper>} />
      <Route path="/SportsNewsDetail" element={<LayoutWrapper currentPageName="SportsNewsDetail"><SportsNewsDetail /></LayoutWrapper>} />
      <Route path="/FocusRoutine" element={<LayoutWrapper currentPageName="FocusRoutine"><FocusRoutine /></LayoutWrapper>} />
      <Route path="/Profile" element={<LayoutWrapper currentPageName="Profile"><Profile /></LayoutWrapper>} />
      <Route path="/AppThemes" element={<LayoutWrapper currentPageName="AppThemes"><AppThemes /></LayoutWrapper>} />
      <Route path="/SubscriberBilling" element={<LayoutWrapper currentPageName="SubscriberBilling"><SubscriberBilling /></LayoutWrapper>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>;
  }

  // Redirect logic for non-admin/non-personal users (role: user)
  if (user && user.role === 'user') {
    // No student record -> go to onboarding
    if (!student) {
      return <Routes>
        <Route path="/Onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/Onboarding" replace />} />
      </Routes>;
    }
    // Student exists but not approved (active: false)
    if (student.active === false) {
      return <Routes>
        <Route path="/Welcome" element={<Welcome />} />
        <Route path="/Chat" element={<LayoutWrapper currentPageName="Chat"><Chat /></LayoutWrapper>} />
        <Route path="/AppThemes" element={<LayoutWrapper currentPageName="AppThemes"><AppThemes /></LayoutWrapper>} />
        <Route path="*" element={<Navigate to="/Welcome" replace />} />
      </Routes>;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        user?.role === 'admin'
          ? <LayoutWrapper currentPageName="AdminDashboard"><AdminDashboard /></LayoutWrapper>
          : user?.role === 'personal'
            ? <LayoutWrapper currentPageName="PersonalDashboard"><PersonalDashboard /></LayoutWrapper>
            : <LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Onboarding" element={<LayoutWrapper currentPageName="Onboarding"><Onboarding /></LayoutWrapper>} />
      <Route path="/Welcome" element={<Welcome />} />
      <Route path="/Chat" element={<LayoutWrapper currentPageName="Chat"><Chat /></LayoutWrapper>} />
      <Route path="/PendingStudents" element={<LayoutWrapper currentPageName="PendingStudents"><PendingStudents /></LayoutWrapper>} />
      <Route path="/CH" element={<LayoutWrapper currentPageName="CH"><CH /></LayoutWrapper>} />
      <Route path="/PRBoard" element={<LayoutWrapper currentPageName="PRBoard"><PRBoard /></LayoutWrapper>} />
      <Route path="/Profile" element={<LayoutWrapper currentPageName="Profile"><Profile /></LayoutWrapper>} />
      <Route path="/StudentDocuments" element={<LayoutWrapper currentPageName="StudentDocuments"><StudentDocuments /></LayoutWrapper>} />
      <Route path="/LearnExercises" element={<LayoutWrapper currentPageName="LearnExercises"><LearnExercises /></LayoutWrapper>} />
      <Route path="/AICoach" element={<LayoutWrapper currentPageName="AICoach"><AICoach /></LayoutWrapper>} />
      <Route path="/AISettings" element={<LayoutWrapper currentPageName="AISettings"><AISettings /></LayoutWrapper>} />
      <Route path="/PersonalManagement" element={<LayoutWrapper currentPageName="PersonalManagement"><PersonalManagement /></LayoutWrapper>} />
      <Route path="/Finance" element={<LayoutWrapper currentPageName="Finance"><Finance /></LayoutWrapper>} />
      <Route path="/ClassCalendar" element={<LayoutWrapper currentPageName="ClassCalendar"><ClassCalendar /></LayoutWrapper>} />
      <Route path="/ConsultancyBilling" element={<LayoutWrapper currentPageName="ConsultancyBilling"><ConsultancyBilling /></LayoutWrapper>} />
      <Route path="/SubscriberDashboard" element={<LayoutWrapper currentPageName="SubscriberDashboard"><SubscriberDashboard /></LayoutWrapper>} />
      <Route path="/AppThemes" element={<LayoutWrapper currentPageName="AppThemes"><AppThemes /></LayoutWrapper>} />
      <Route path="/DietLogs" element={<LayoutWrapper currentPageName="DietLogs"><DietLogs /></LayoutWrapper>} />
      <Route path="/FocusRoutine" element={<LayoutWrapper currentPageName="FocusRoutine"><FocusRoutine /></LayoutWrapper>} />
      <Route path="/CheckIn" element={<LayoutWrapper currentPageName="CheckIn"><CheckInPage /></LayoutWrapper>} />
      <Route path="/PersonalDashboard" element={<LayoutWrapper currentPageName="PersonalDashboard"><PersonalDashboard /></LayoutWrapper>} />
      <Route path="/Comunidade" element={<LayoutWrapper currentPageName="Comunidade"><Comunidade /></LayoutWrapper>} />
      <Route path="/CalendarioHormonalAdmin" element={<LayoutWrapper currentPageName="CalendarioHormonalAdmin"><CalendarioHormonalAdmin /></LayoutWrapper>} />
      <Route path="/CalendarioGeral" element={<LayoutWrapper currentPageName="CalendarioGeral"><CalendarioGeral /></LayoutWrapper>} />
      <Route path="/Relatorios" element={<LayoutWrapper currentPageName="Relatorios"><Relatorios /></LayoutWrapper>} />
      <Route path="/AdminDashboard" element={<LayoutWrapper currentPageName="AdminDashboard"><AdminDashboard /></LayoutWrapper>} />
      <Route path="/Notificacoes" element={<LayoutWrapper currentPageName="Notificacoes"><Notificacoes /></LayoutWrapper>} />
      <Route path="/NewsManagement" element={<LayoutWrapper currentPageName="NewsManagement"><NewsManagement /></LayoutWrapper>} />
      <Route path="/SubscriptionManagement" element={<LayoutWrapper currentPageName="SubscriptionManagement"><SubscriptionManagement /></LayoutWrapper>} />
      <Route path="/SubscriberBilling" element={<LayoutWrapper currentPageName="SubscriberBilling"><SubscriberBilling /></LayoutWrapper>} />
      <Route path="/WorkoutAI" element={<LayoutWrapper currentPageName="WorkoutAI"><WorkoutAI /></LayoutWrapper>} />
      <Route path="/DietAI" element={<LayoutWrapper currentPageName="DietAI"><DietAI /></LayoutWrapper>} />
      <Route path="/SportsNewsDetail" element={<LayoutWrapper currentPageName="SportsNewsDetail"><SportsNewsDetail /></LayoutWrapper>} />
      <Route path="/PaymentOverdue" element={<PaymentOverdue />} />
      <Route path="/AccessDenied" element={<AccessDenied />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Sonner richColors position="top-right" />
      </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App