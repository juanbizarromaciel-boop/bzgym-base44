import React from "react";
import { CheckCircle2, Clock3, Loader2, RotateCcw, UserRound, XCircle } from "lucide-react";

export default function ScheduledClassList({ date, classes, students, onCancel, cancellingId, onToggleStatus, updatingId }) {
  const items = classes.filter(item => item.data === date);
  return <section className="app-glass-card rounded-xl p-4">
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-muted">Aulas em {date.split("-").reverse().join("/")}</h3>
    {items.length === 0 ? <p className="py-4 text-center text-xs text-app-muted">Nenhuma aula marcada neste dia.</p> : <div className="space-y-2">
      {items.map(item => {
        const student = students.find(value => value.id === item.student_id);
        const cancelled = item.status === "cancelado";
        const completed = item.status === "concluido";
        return <div key={item.id} className={`rounded-xl border p-3 ${cancelled ? "border-red-500/20 bg-red-500/5 opacity-60" : completed ? "border-emerald-500/30 bg-emerald-500/10" : "border-app-primary/20 bg-app-primary/5"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="flex items-center gap-2 text-sm font-semibold text-app-text"><UserRound className={`h-4 w-4 ${completed ? "text-emerald-300" : "text-app-primary"}`} />{student?.name || item.titulo}</p><p className="mt-1 flex items-center gap-2 text-xs text-app-muted"><Clock3 className="h-3.5 w-3.5" />{item.horario || "Sem horário"}{cancelled ? " · Cancelada" : completed ? " · Aula feita" : " · Pendente"}</p></div>
            {!cancelled && <div className="flex flex-wrap gap-2">
              <button onClick={() => onToggleStatus(item)} disabled={updatingId === item.id} className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] disabled:opacity-50 ${completed ? "border-amber-500/25 bg-amber-500/10 text-amber-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>{updatingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : completed ? <RotateCcw className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{completed ? "Desfazer confirmação" : "Confirmar aula"}</button>
              <button onClick={() => onCancel(item)} disabled={cancellingId === item.id} className="flex items-center gap-1 rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-200 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />Cancelar aula</button>
            </div>}
          </div>
        </div>;
      })}
    </div>}
  </section>;
}