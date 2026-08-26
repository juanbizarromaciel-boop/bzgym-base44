import React from "react";
import { LockKeyhole, ShieldCheck, UserCircle } from "lucide-react";

export default function StudentPaymentPanel({ students, controls, onToggle, pendingId }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {students.map(student => {
      const control = controls.find(item => item.student_id === student.id);
      const blocked = control?.blocked === true;
      return <article key={student.id} className="app-glass-card rounded-[18px] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="app-glass-icon flex h-11 w-11 items-center justify-center overflow-hidden rounded-full">
            {student.photo_url ? <img src={student.photo_url} alt={student.name} className="h-full w-full object-cover" /> : <UserCircle className="h-6 w-6 text-app-primary" />}
          </div>
          <div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-app-text">{student.name}</h3><p className="truncate text-xs text-app-muted">{student.email || "Sem e-mail vinculado"}</p></div>
        </div>
        <div className={`mb-4 rounded-xl border p-3 text-sm ${blocked ? "border-red-500/25 bg-red-500/10 text-red-200" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"}`}>
          {blocked ? "Acesso ao aplicativo bloqueado" : "Acesso ao aplicativo ativo"}
        </div>
        <button onClick={() => onToggle(student, control)} disabled={pendingId === student.id} className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold disabled:opacity-50 ${blocked ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
          {blocked ? <ShieldCheck className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}{pendingId === student.id ? "Salvando..." : blocked ? "Ativar acesso" : "Bloquear acesso"}
        </button>
      </article>;
    })}
  </div>;
}