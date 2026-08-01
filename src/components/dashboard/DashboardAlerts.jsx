import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronRight, CircleDollarSign } from "lucide-react";

export default function DashboardAlerts({ alerts, financialTotal = 0 }) {
  const visible = alerts.filter(Boolean).slice(0, 2);
  const formattedTotal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialTotal);
  return (
    <section className="grid grid-cols-2 gap-2.5">
      <div className="min-h-[154px] rounded-[18px] border border-amber-400/15 bg-professor-card/70 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[11px] font-medium text-amber-300"><AlertCircle className="h-4 w-4" /> Alertas</div>
        <div className="mt-3 space-y-2">
          {visible.length ? visible.map(alert => <Link key={alert.text} to={alert.path} className="flex items-center gap-1.5 border-b border-white/5 pb-2 text-[9px] leading-tight text-professor-muted last:border-0"><span className="flex-1 line-clamp-2">{alert.text}</span><ChevronRight className="h-3 w-3 shrink-0 text-amber-300" /></Link>) : <div className="flex items-center gap-2 text-[10px] text-professor-muted"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Tudo em dia</div>}
        </div>
      </div>
      <div className="min-h-[154px] rounded-[18px] border border-emerald-400/15 bg-professor-card/70 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-300"><CircleDollarSign className="h-4 w-4" /> Financeiro</div>
        <p className="mt-4 text-[9px] text-professor-muted">Recebimentos do mês</p>
        <p className="mt-1 truncate text-[20px] font-semibold leading-none">{formattedTotal}</p>
        <Link to="/Finance" className="mt-5 flex min-h-8 items-center justify-between text-[10px] text-emerald-300">Ver relatórios <ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
    </section>
  );
}