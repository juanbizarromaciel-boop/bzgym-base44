import React from "react";
import DashboardBase from "@/components/dashboard/DashboardBase";
import ProfessorGreeting from "@/components/dashboard/ProfessorGreeting";
import TodayAppointment from "@/components/dashboard/TodayAppointment";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import ProfessorActions from "@/components/dashboard/ProfessorActions";
import DashboardAlerts from "@/components/dashboard/DashboardAlerts";

export default function DashboardProfessor({ user, appointment, today, metrics, alerts }) {
  return <DashboardBase><ProfessorGreeting user={user} /><TodayAppointment appointment={appointment} today={today} /><DashboardMetrics values={metrics} /><ProfessorActions /><DashboardAlerts alerts={alerts} /></DashboardBase>;
}