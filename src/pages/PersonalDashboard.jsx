import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import DashboardProfessor from "@/components/dashboard/DashboardProfessor";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const unique = (items) => items.flat().filter((item, index, list) => list.findIndex(other => other.id === item.id) === index);

export default function PersonalDashboard() {
  const { user, loading } = useCurrentUser();
  const today = localDate();
  const enabled = user?.role === "personal";
  const studentsQuery = useQuery({ queryKey: ["professor-dashboard-students", user?.email], queryFn: () => base44.entities.Student.filter({ personal_id: user.email }, "-created_date", 500), enabled, staleTime: 60000 });
  const students = studentsQuery.data || [];
  const activeStudents = students.filter(student => student.active !== false);
  const studentIds = activeStudents.flatMap(student => [student.id, student.email].filter(Boolean));
  const plansQuery = useQuery({ queryKey: ["professor-dashboard-plans", ...studentIds], queryFn: async () => unique(await Promise.all(studentIds.map(id => base44.entities.WorkoutPlan.filter({ student_id: id }, "-created_date", 500)))), enabled: enabled && studentsQuery.isSuccess, staleTime: 60000 });
  const dietsQuery = useQuery({ queryKey: ["professor-dashboard-diets", ...studentIds], queryFn: async () => unique(await Promise.all(studentIds.map(id => base44.entities.DietPlan.filter({ student_id: id }, "-created_date", 500)))), enabled: enabled && studentsQuery.isSuccess, staleTime: 60000 });
  const eventsQuery = useQuery({ queryKey: ["professor-dashboard-events", user?.email, today], queryFn: () => base44.entities.CalendarioEvento.filter({ usuario_id: user.email, data: today }, "horario", 20), enabled, staleTime: 30000 });
  const paymentsQuery = useQuery({ queryKey: ["professor-dashboard-payments", user?.email], queryFn: () => base44.entities.Payment.filter({ personal_id: user.email }, "-due_date", 100), enabled, staleTime: 60000 });
  const checkInsQuery = useQuery({ queryKey: ["professor-dashboard-checkins", user?.email], queryFn: () => base44.entities.CheckIn.filter({ personal_id: user.email }, "-created_date", 100), enabled, staleTime: 30000 });
  const messagesQuery = useQuery({ queryKey: ["professor-dashboard-messages", ...studentIds], queryFn: async () => unique(await Promise.all(studentIds.map(id => base44.entities.ChatMessage.filter({ student_id: id }, "-created_date", 100)))), enabled: enabled && studentsQuery.isSuccess, staleTime: 15000 });

  if (loading || (enabled && studentsQuery.isLoading)) return <DashboardSkeleton />;
  if (!user || user.role !== "personal") return <Navigate to="/AccessDenied" replace />;
  const queries = [studentsQuery, plansQuery, dietsQuery, eventsQuery, paymentsQuery, checkInsQuery, messagesQuery];
  if (queries.some(query => query.isError)) return <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-card p-6 text-center"><p className="font-semibold">Não foi possível carregar a dashboard.</p><p className="mt-1 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p><button onClick={() => queries.forEach(query => query.refetch())} className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Tentar novamente</button></div>;

  const plans = (plansQuery.data || []).filter(plan => plan.active !== false && plan.statusVersao !== "arquivado" && plan.statusVersao !== "substituido");
  const diets = (dietsQuery.data || []).filter(diet => diet.active !== false && diet.statusVersao !== "arquivada" && diet.statusVersao !== "substituida");
  const messages = messagesQuery.data || [];
  const unread = messages.filter(message => !message.is_trainer && !message.read);
  const currentTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const pendingAppointments = (eventsQuery.data || []).filter(event => !["concluido", "cancelado"].includes(event.status)).sort((a, b) => (a.horario || "99:99").localeCompare(b.horario || "99:99"));
  const appointments = [...pendingAppointments.filter(event => !event.horario || event.horario >= currentTime), ...pendingAppointments.filter(event => event.horario && event.horario < currentTime)];
  const pendingReviews = (checkInsQuery.data || []).filter(checkIn => checkIn.status === "enviado" || checkIn.status === "pendente");
  const payments = paymentsQuery.data || [];
  const pendingPayments = payments.filter(payment => payment.status === "pendente" || payment.status === "atrasado");
  const monthPrefix = today.slice(0, 7);
  const financialTotal = payments.filter(payment => payment.status === "pago" && payment.payment_date?.startsWith(monthPrefix)).reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
  const studentsWithPlans = new Set(plans.map(plan => plan.student_id));
  const withoutWorkout = activeStudents.filter(student => !studentsWithPlans.has(student.id) && !studentsWithPlans.has(student.email));
  const alerts = [pendingReviews.length > 0 && { text: `${pendingReviews.length} avaliação(ões) aguardando revisão`, path: "/Progress?tab=checkins" }, withoutWorkout.length > 0 && { text: `${withoutWorkout.length} aluno(s) sem treino ativo`, path: "/WorkoutPlans" }, unread.length > 0 && { text: `${unread.length} mensagem(ns) não lida(s)`, path: "/Chat" }, pendingPayments.length > 0 && { text: `${pendingPayments.length} pagamento(s) pendente(s)`, path: "/Finance" }];

  return <DashboardProfessor user={user} appointment={appointments[0]} today={today} metrics={{ students: activeStudents.length, workouts: plans.length, diets: diets.length, messages: unread.length }} alerts={alerts} financialTotal={financialTotal} />;
}