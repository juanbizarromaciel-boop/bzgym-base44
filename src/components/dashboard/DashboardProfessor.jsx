import React from "react";
import DashboardBase from "@/components/dashboard/DashboardBase";
import TodayAppointment from "@/components/dashboard/TodayAppointment";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import ProfessorActions from "@/components/dashboard/ProfessorActions";
import DashboardAlerts from "@/components/dashboard/DashboardAlerts";

export default function DashboardProfessor({ user, appointment, today, metrics, alerts, financialTotal }) {
  return <DashboardBase user={user} roleLabel="Professor / Personal"><TodayAppointment appointment={appointment} today={today} /><DashboardMetrics values={metrics} /><ProfessorActions /><DashboardAlerts alerts={alerts} financialTotal={financialTotal} /></DashboardBase>;
}