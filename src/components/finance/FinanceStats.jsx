import React from "react";
import { AlertTriangle, Clock, TrendingUp, Users } from "lucide-react";

export default function FinanceStats({ received, pending, overdue, students }) {
  const items = [{ label: "Total recebido", value: received, icon: TrendingUp }, { label: "A receber", value: pending, icon: Clock }, { label: "Atrasados", value: overdue, icon: AlertTriangle }, { label: "Alunos", value: students, icon: Users }];
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.map(item => <div key={item.label} className="app-glass-card rounded-[16px] p-4"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] uppercase tracking-wide text-app-muted">{item.label}</p><item.icon className="h-3.5 w-3.5 text-app-primary" /></div><p className="text-lg font-semibold text-app-text">{item.value}</p></div>)}</div>;
}