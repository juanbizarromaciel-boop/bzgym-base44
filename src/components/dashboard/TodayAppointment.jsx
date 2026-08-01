import React from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ChevronRight } from "lucide-react";

const statusLabel = { pendente: "Pendente", concluido: "Concluído", cancelado: "Cancelado" };
const typeLabel = { treino: "Treino de hoje", dieta: "Nutrição", checkin: "Check-in", avaliacao: "Avaliação", tarefa: "Tarefa", lembrete: "Lembrete", pagamento: "Pagamento", consulta: "Consulta", outro: "Atendimento" };

export default function TodayAppointment({ appointment, today }) {
  return (
    <section className="grid min-h-[132px] grid-cols-[48px_minmax(0,1fr)_auto] gap-3 rounded-[20px] border border-professor-border/20 bg-professor-card/75 p-3.5 backdrop-blur-md">
      <div className="flex h-12 w-12 items-center justify-center self-center rounded-full border border-professor-border/30 bg-professor-border/10 shadow-[0_0_14px_rgba(168,85,247,0.08)]"><CalendarCheck className="h-[22px] w-[22px] text-purple-300" /></div>
      <div className="min-w-0 self-center">
        <p className="text-[10px] font-medium text-purple-300">{appointment ? typeLabel[appointment.tipo] || "Atendimento" : "Próximo atendimento"}</p>
        {appointment ? <><h2 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-tight">{appointment.titulo}</h2><p className="mt-1 text-xs text-professor-muted">{appointment.horario || "Horário não informado"}</p>{appointment.descricao && <p className="mt-1 line-clamp-1 text-[10px] text-professor-muted/70">{appointment.descricao}</p>}</> : <p className="mt-2 text-[12px] leading-relaxed text-professor-muted">Nenhum atendimento agendado para hoje</p>}
      </div>
      <div className="flex min-w-[68px] flex-col items-end justify-between py-1">
        {appointment ? <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2 py-1 text-[9px] text-emerald-300">{statusLabel[appointment.status] || appointment.status}</span> : <span />}
        <Link to={`/CalendarioGeral?date=${today}`} className="flex min-h-9 items-center gap-1 whitespace-nowrap text-[10px] font-medium text-purple-300">Ver agenda <ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
    </section>
  );
}