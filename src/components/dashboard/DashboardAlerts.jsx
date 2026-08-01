import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

export default function DashboardAlerts({ alerts }) {
  const visible = alerts.filter(Boolean).slice(0, 2);
  if (!visible.length) return <section className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><div><h2 className="text-sm font-semibold">Tudo em dia.</h2><p className="text-xs text-muted-foreground">Nenhuma pendência importante agora.</p></div></section>;
  return <section><h2 className="mb-3 text-sm font-semibold text-muted-foreground">Alertas e informações úteis</h2><div className="space-y-2">{visible.map(alert => <Link key={alert.text} to={alert.path} className="flex min-h-16 items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><AlertCircle className="h-5 w-5 shrink-0 text-amber-400" /><span className="flex-1 text-sm">{alert.text}</span><ChevronRight className="h-4 w-4 text-amber-300" /></Link>)}</div></section>;
}