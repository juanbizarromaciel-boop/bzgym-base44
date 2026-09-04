import React from "react";
import { CheckCircle2, Clock3, Sigma } from "lucide-react";

export default function ClassPaymentSummary({ classes, formatMoney }) {
  const active = classes.filter(item => item.status !== "cancelado");
  if (!active.length) return null;

  const completed = active.filter(item => item.status === "concluido");
  const pending = active.filter(item => item.status !== "concluido");
  const sum = items => items.reduce((total, item) => total + Number(item.class_value || 0), 0);
  const items = [
    { label: "Feitas", count: completed.length, value: sum(completed), Icon: CheckCircle2, color: "text-emerald-300", surface: "border-emerald-500/20 bg-emerald-500/5" },
    { label: "Não feitas", count: pending.length, value: sum(pending), Icon: Clock3, color: "text-amber-300", surface: "border-amber-500/20 bg-amber-500/5" },
    { label: "Total", count: active.length, value: sum(active), Icon: Sigma, color: "text-cyan-300", surface: "border-cyan-500/20 bg-cyan-500/5" },
  ];

  return <div className="mt-2 grid grid-cols-3 gap-1.5">
    {items.map(({ label, count, value, Icon, color, surface }) => <div key={label} className={`rounded-lg border p-2 ${surface}`}>
      <p className={`flex items-center gap-1 text-[9px] font-semibold uppercase ${color}`}><Icon className="h-3 w-3" />{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-app-text">{formatMoney(value)}</p>
      <p className="text-[9px] text-app-muted">{count} aula{count === 1 ? "" : "s"}</p>
    </div>)}
  </div>;
}