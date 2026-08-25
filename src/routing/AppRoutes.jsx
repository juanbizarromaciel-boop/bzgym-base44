import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/Layout";
import RoleRoute from "@/routing/RoleRoute";
import PageNotFound from "@/lib/PageNotFound";
import AdminDashboard from "@/pages/AdminDashboard";
import AISettings from "@/pages/AISettings";
import AICoach from "@/pages/AICoach";
import AppThemes from "@/pages/AppThemes";
import CalendarioGeral from "@/pages/CalendarioGeral";
import CalendarioHormonalAdmin from "@/pages/CalendarioHormonalAdmin";
import CH from "@/pages/CH";
import Chat from "@/pages/Chat";
import CheckInPage from "@/pages/CheckInPage";
import ClassCalendar from "@/pages/ClassCalendar";
import Comunidade from "@/pages/Comunidade";
import ConsultancyBilling from "@/pages/ConsultancyBilling";
import Diet from "@/pages/Diet";
import DietAI from "@/pages/DietAI";
import DietLogs from "@/pages/DietLogs";
import ExerciseLibrary from "@/pages/ExerciseLibrary";
import Finance from "@/pages/Finance";
import FocusRoutine from "@/pages/FocusRoutine";
import FoodDatabase from "@/pages/FoodDatabase";
import LearnExercises from "@/pages/LearnExercises";
import MyDiet from "@/pages/MyDiet";
import MyWorkout from "@/pages/MyWorkout";
import NewsManagement from "@/pages/NewsManagement";
import Notificacoes from "@/pages/Notificacoes";
import Onboarding from "@/pages/Onboarding";
import PaymentOverdue from "@/pages/PaymentOverdue";
import PendingStudents from "@/pages/PendingStudents";
import PersonalDashboard from "@/pages/PersonalDashboard";
import PersonalManagement from "@/pages/PersonalManagement";
import PRBoard from "@/pages/PRBoard";
import Profile from "@/pages/Profile";
import Progress from "@/pages/Progress";
import Relatorios from "@/pages/Relatorios";
import SportsNewsDetail from "@/pages/SportsNewsDetail";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentDocuments from "@/pages/StudentDocuments";
import StudentWorkout from "@/pages/StudentWorkout";
import Students from "@/pages/Students";
import SubscriberBilling from "@/pages/SubscriberBilling";
import SubscriberDashboard from "@/pages/SubscriberDashboard";
import SubscriptionManagement from "@/pages/SubscriptionManagement";
import TimerPage from "@/pages/TimerPage";
import Welcome from "@/pages/Welcome";
import WorkoutAI from "@/pages/WorkoutAI";
import WorkoutPlans from "@/pages/WorkoutPlans";

const A = "admin", P = "personal", U = "user", S = "assinante";
const pages = [
  ["AdminDashboard", AdminDashboard, [A]], ["PersonalDashboard", PersonalDashboard, [P]], ["StudentDashboard", StudentDashboard, [U]], ["SubscriberDashboard", SubscriberDashboard, [S]],
  ["Students", Students, [A,P]], ["PendingStudents", PendingStudents, [A,P]], ["StudentWorkout", StudentWorkout, [A,P]], ["WorkoutPlans", WorkoutPlans, [A,P,S]], ["MyWorkout", MyWorkout, [A,U,S]], ["WorkoutAI", WorkoutAI, [A,P,S]], ["ExerciseLibrary", ExerciseLibrary, [A,P,S]],
  ["Diet", Diet, [A,P,S]], ["MyDiet", MyDiet, [A,U,S]], ["DietAI", DietAI, [A,P,S]], ["DietLogs", DietLogs, [A,P]], ["FoodDatabase", FoodDatabase, [A,P]],
  ["Progress", Progress, [A,P,U]], ["CheckIn", CheckInPage, [A,U]], ["StudentDocuments", StudentDocuments, [A,P,U]], ["LearnExercises", LearnExercises, [A,P,U]], ["PRBoard", PRBoard, [A,P,U]], ["CH", CH, [A,P,U]],
  ["Chat", Chat, [A,P,U]], ["CalendarioGeral", CalendarioGeral, [A,P,U]], ["ClassCalendar", ClassCalendar, [A,P]], ["Comunidade", Comunidade, [A,P,U,S]], ["Notificacoes", Notificacoes, [A,P,U,S]],
  ["AICoach", AICoach, [A,P,S]], ["Relatorios", Relatorios, [A,P]], ["Finance", Finance, [A,P]], ["ConsultancyBilling", ConsultancyBilling, [A,P]], ["SubscriptionManagement", SubscriptionManagement, [A,P]],
  ["PersonalManagement", PersonalManagement, [A]], ["AISettings", AISettings, [A]], ["CalendarioHormonalAdmin", CalendarioHormonalAdmin, [A]], ["NewsManagement", NewsManagement, [A]],
  ["SportsNewsDetail", SportsNewsDetail, [A,P,U,S]], ["FocusRoutine", FocusRoutine, [A,P,U,S]], ["TimerPage", TimerPage, [A,P,U]], ["Profile", Profile, [A,P,U,S]], ["AppThemes", AppThemes, [A,P,U,S]], ["SubscriberBilling", SubscriberBilling, [A,S]],
];
const home = { admin: "/AdminDashboard", personal: "/PersonalDashboard", user: "/StudentDashboard", assinante: "/SubscriberDashboard" };
const wrapped = (name, Page, user, allowed) => <RoleRoute user={user} allowed={allowed}><Layout currentPageName={name}><Page /></Layout></RoleRoute>;

export default function AppRoutes({ user, accessState }) {
  if (accessState === "blocked") return <Routes><Route path="/PaymentOverdue" element={<PaymentOverdue />} /><Route path="/SubscriberBilling" element={<SubscriberBilling />} /><Route path="*" element={<Navigate to="/PaymentOverdue" replace />} /></Routes>;
  if (accessState === "onboarding") return <Routes><Route path="/Onboarding" element={<Onboarding />} /><Route path="*" element={<Navigate to="/Onboarding" replace />} /></Routes>;
  if (accessState === "pending") return <Routes><Route path="/Welcome" element={<Welcome />} /><Route path="/Chat" element={<Layout currentPageName="Chat"><Chat /></Layout>} /><Route path="/AppThemes" element={<Layout currentPageName="AppThemes"><AppThemes /></Layout>} /><Route path="*" element={<Navigate to="/Welcome" replace />} /></Routes>;
  return <Routes>
    <Route path="/" element={<Navigate to={home[user?.role] || "/AccessDenied"} replace />} />
    {pages.map(([name, Page, allowed]) => <Route key={name} path={`/${name}`} element={wrapped(name, Page, user, allowed)} />)}
    <Route path="/PaymentOverdue" element={<PaymentOverdue />} /><Route path="/AccessDenied" element={<Navigate to={home[user?.role] || "/"} replace />} /><Route path="*" element={<PageNotFound />} />
  </Routes>;
}