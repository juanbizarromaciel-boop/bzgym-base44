import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, ChevronRight } from "lucide-react";

export default function DashboardPlanCard({ status, dueDate }) {
  const statusLabel = status === "ativa" ? "Ativa" : status === "isenta" ? "Isenta" : status || "Não informada";
  return (
    <section className="app-glass-card rounded-[18px] p-4">
      <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-200"><CreditCard className="h-4 w-4" />Assinatura</div>
      <div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-[10px] text-professor-muted">Status do plano</p><p className="mt-1 text-lg font-medium text-professor">{statusLabel}</p>{dueDate && <p className="mt-1 text-[10px] text-professor-muted">Válida até {new Date(`${dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</p>}</div><Link to="/SubscriberBilling" className="flex min-h-9 items-center gap-1 text-[10px] text-purple-200">Ver plano<ChevronRight className="h-3.5 w-3.5" /></Link></div>
    </section>
  );
}