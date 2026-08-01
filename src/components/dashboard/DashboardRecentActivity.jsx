import React from "react";
import { Link } from "react-router-dom";
import { Activity, ChevronRight } from "lucide-react";

const when = value => value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "";

export default function DashboardRecentActivity({ items }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between"><h2 className="app-section-title text-[13px]">Atividade recente</h2><Link to="/Notificacoes" className="text-[10px] text-purple-200">Ver tudo</Link></div>
      <div className="app-glass-card rounded-[18px] p-3">
        {items.length ? items.slice(0, 4).map(item => <Link key={item.id} to={item.path} className="flex min-h-11 items-center gap-2 border-b border-white/5 py-2 last:border-0"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-400/10 text-purple-200"><Activity className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-[10px] text-professor">{item.text}</p><p className="mt-0.5 text-[9px] text-professor-muted">{when(item.date)}</p></div><ChevronRight className="h-3.5 w-3.5 shrink-0 text-purple-200/60" /></Link>) : <div className="flex min-h-20 items-center justify-center text-[10px] text-professor-muted">Nenhuma atividade recente.</div>}
      </div>
    </section>
  );
}