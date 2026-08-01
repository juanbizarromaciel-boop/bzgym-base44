import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import DashboardAluno from "@/components/dashboard/DashboardAluno";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import DashboardErrorState from "@/components/dashboard/DashboardErrorState";

const DAY_MAP = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const unique = items => items.flat().filter((item, index, list) => list.findIndex(other => other.id === item.id) === index);
const scoped = (entity, field, ids, sort = "-created_date", limit = 100) => Promise.all(ids.map(id => base44.entities[entity].filter({ [field]: id }, sort, limit))).then(unique);

export default function StudentDashboard() {
  const { user, loading } = useCurrentUser();
  const enabled = user?.role === "user";
  const studentQuery = useQuery({ queryKey: ["student-dashboard-profile", user?.email], queryFn: () => base44.entities.Student.filter({ email: user.email }, "-created_date", 1), enabled, staleTime: 60000 });
  const student = studentQuery.data?.[0];
  const dataQuery = useQuery({
    queryKey: ["student-dashboard-data", student?.id, student?.email],
    enabled: enabled && !!student,
    staleTime: 30000,
    queryFn: async () => {
      const ids = [student.id, student.email, user.email].filter(Boolean);
      const [plans, diets, messages, events, logs] = await Promise.all([
        scoped("WorkoutPlan", "student_id", ids), scoped("DietPlan", "student_id", ids),
        scoped("ChatMessage", "student_id", ids), scoped("CalendarioEvento", "student_id", ids, "data", 50),
        scoped("WorkoutLog", "student_id", ids, "-date", 100),
      ]);
      return { plans, diets, messages, events, logs };
    },
  });

  if (loading || studentQuery.isLoading || (student && dataQuery.isLoading)) return <DashboardSkeleton />;
  if (!user || user.role !== "user") return <Navigate to="/AccessDenied" replace />;
  if (studentQuery.isError || dataQuery.isError) return <DashboardErrorState onRetry={() => { studentQuery.refetch(); dataQuery.refetch(); }} />;
  if (!student) return <Navigate to="/Onboarding" replace />;
  if (student.active === false) return <Navigate to="/Welcome" replace />;
  const data = dataQuery.data || { plans: [], diets: [], messages: [], events: [], logs: [] };
  const plans = data.plans.filter(plan => plan.active !== false && !["arquivado", "substituido"].includes(plan.statusVersao));
  const diets = data.diets.filter(plan => plan.active !== false && !["arquivada", "substituida"].includes(plan.statusVersao));
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyWorkouts = new Set(data.logs.filter(log => new Date(`${log.date}T12:00:00`) >= weekAgo).map(log => log.date)).size;
  const todayPlan = plans.find(plan => plan.day_of_week === DAY_MAP[new Date().getDay()]) || plans[0];
  const unreadMessages = data.messages.filter(message => message.is_trainer && !message.read).length;
  const appointments = data.events.filter(event => event.data >= today && !["concluido", "cancelado"].includes(event.status)).length;
  return <DashboardAluno user={user} student={student} todayPlan={todayPlan} dietPlan={diets[0]} unreadMessages={unreadMessages} appointments={appointments} weeklyWorkouts={weeklyWorkouts} />;
}