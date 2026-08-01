import React from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ChevronRight } from "lucide-react";

const statusLabel = { pendente: "Pendente", concluido: "Concluído", cancelado: "Cancelado" };

export default function TodayAppointment({ appointment, today }) {
  return (
    <section className="rounded-3xl border border-primary/25 bg-card/70 p-5 shadow-lg shadow-black/20 backdrop-blur-md">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"><CalendarCheck className="h-7 w-7 text-primary" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Próximo atendimento</p>
          {appointment ? <><h2 className="mt-2 truncate text-lg font-semibold">{appointment.titulo}</h2><p className="text-sm text-muted-foreground">{appointment.horario || "Horário não informado"}{appointment.descricao ? ` · ${appointment.descricao}` : ""}</p><span className="mt-3 inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">{statusLabel[appointment.status] || appointment.status}</span></> : <p className="mt-3 text-sm text-muted-foreground">Nenhum atendimento agendado para hoje.</p>}
        </div>
      </div>
      <Link to={`/CalendarioGeral?date=${today}`} className="mt-4 flex min-h-11 items-center justify-end gap-1 text-sm font-medium text-primary">Ver agenda <ChevronRight className="h-4 w-4" /></Link>
    </section>
  );
}