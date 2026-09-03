import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, Check, X, Circle,
  Dumbbell, Utensils, ClipboardCheck, Calendar, Star,
  DollarSign, Bell, Stethoscope, MoreHorizontal
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const TIPO_CONFIG = {
  treino:    { label: "Treino",    icon: Dumbbell,       color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  dieta:     { label: "Dieta",     icon: Utensils,       color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  checkin:   { label: "Check-in",  icon: ClipboardCheck, color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
  avaliacao: { label: "Avaliação", icon: Star,           color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  tarefa:    { label: "Tarefa",    icon: Check,          color: "#ec4899", bg: "rgba(236,72,153,0.15)" },
  lembrete:  { label: "Lembrete", icon: Bell,           color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
  pagamento: { label: "Pagamento", icon: DollarSign,    color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  consulta:  { label: "Consulta",  icon: Stethoscope,   color: "#14b8a6", bg: "rgba(20,184,166,0.15)" },
  outro:     { label: "Outro",     icon: MoreHorizontal,color: "#64748b", bg: "rgba(100,116,139,0.15)" },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const EMPTY_FORM = {
  titulo: "", descricao: "", tipo: "tarefa",
  data: new Date().toISOString().split("T")[0],
  horario: "", recorrencia: "nenhuma", status: "pendente",
  student_id: "", student_email: "", cor: "", observacoes: "",
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarioGeral() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const today = new Date();
  const requestedDate = urlParams.get("date");
  const initialDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today.toISOString().split("T")[0];
  const initialViewDate = new Date(`${initialDate}T12:00:00`);
  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterTipo, setFilterTipo] = useState("todos");
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const isPersonalManager = ["admin", "personal"].includes(user?.role);

  const { data: students = [] } = useQuery({
    queryKey: ["agendaStudents", user?.email],
    queryFn: async () => {
      const assigned = await base44.entities.Student.filter({ personal_id: user.email });
      return assigned.filter(student => student.active !== false && student.email);
    },
    enabled: !!user && isPersonalManager,
  });

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["calendarioEventos", user?.email, user?.role],
    queryFn: async () => {
      if (!isPersonalManager) return base44.entities.CalendarioEvento.list("-created_date", 200);
      const [assigned, created] = await Promise.all([
        base44.entities.CalendarioEvento.filter({ personal_id: user.email }, "-created_date", 200),
        base44.entities.CalendarioEvento.filter({ usuario_id: user.email }, "-created_date", 200),
      ]);
      return [...new Map([...assigned, ...created].map(event => [event.id, event])).values()];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.CalendarioEvento.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarioEventos"] }); toast.success("Evento criado"); setDialogOpen(false); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.CalendarioEvento.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarioEventos"] }); toast.success("Atualizado"); setDialogOpen(false); setEditingEvento(null); }
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.CalendarioEvento.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarioEventos"] }); toast.success("Removido"); }
  });

  const openNew = (date) => {
    setEditingEvento(null);
    setForm({ ...EMPTY_FORM, data: date || selectedDate, usuario_id: user?.email, personal_id: user?.email });
    setDialogOpen(true);
  };
  const openEdit = (ev) => {
    setEditingEvento(ev);
    setForm({ titulo: ev.titulo || "", descricao: ev.descricao || "", tipo: ev.tipo || "tarefa", data: ev.data || "", horario: ev.horario || "", recorrencia: ev.recorrencia || "nenhuma", status: ev.status || "pendente", student_id: ev.student_id || "", student_email: ev.student_email || "", cor: ev.cor || "", observacoes: ev.observacoes || "" });
    setDialogOpen(true);
  };
  const handleSubmit = () => {
    if (!form.titulo || !form.data) { toast.error("Preencha título e data"); return; }
    const selectedStudent = students.find(student => student.id === form.student_id);
    const payload = {
      ...form,
      usuario_id: user?.email,
      personal_id: user?.email,
      student_id: selectedStudent?.id || "",
      student_email: selectedStudent?.email || "",
    };
    editingEvento ? updateMut.mutate({ id: editingEvento.id, d: payload }) : createMut.mutate(payload);
  };
  const toggleStatus = (ev) => {
    updateMut.mutate({ id: ev.id, d: { status: ev.status === "concluido" ? "pendente" : "concluido" } });
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const getDateStr = (day) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const eventosForDate = (dateStr) => eventos.filter(e => e.data === dateStr && (filterTipo === "todos" || e.tipo === filterTipo));
  const selectedEventos = eventosForDate(selectedDate);
  const todayStr = today.toISOString().split("T")[0];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }} />
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded" style={{ background: 'linear-gradient(to bottom, #a855f7, #06b6d4)', boxShadow: '0 0 12px rgba(168,85,247,0.6)' }} />
              <h1 className="font-cyber text-3xl font-black tracking-wider text-white" style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>CALENDÁRIO</h1>
            </div>
            <p className="text-xs font-mono-cyber text-purple-400/50 pl-4">// organize sua rotina e compromissos</p>
          </div>
          {user?.role !== "user" && <button onClick={() => openNew(todayStr)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.40)', color: '#ffffff' }}>
            <Plus className="w-4 h-4" style={{ color: '#a855f7' }} /> EVENTO
          </button>}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(6,182,212,0.4), transparent)' }} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["todos", ...Object.keys(TIPO_CONFIG)].map(t => {
          const cfg = TIPO_CONFIG[t];
          return (
            <button key={t} onClick={() => setFilterTipo(t)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono-cyber tracking-wider transition-all capitalize"
              style={filterTipo === t ? {
                background: cfg ? cfg.bg : 'rgba(168,85,247,0.18)',
                border: `1px solid ${cfg ? cfg.color : '#a855f7'}55`,
                color: cfg ? cfg.color : '#a855f7',
              } : { background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(168,85,247,0.40)' }}>
              {cfg ? cfg.label : "Todos"}
            </button>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl overflow-hidden border border-purple-900/30" style={{ background: 'rgba(4,4,14,0.85)' }}>
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/20">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-purple-500/10 transition-all">
            <ChevronLeft className="w-5 h-5 text-purple-400" />
          </button>
          <h2 className="font-cyber text-lg text-white tracking-wider">
            {MONTHS[viewMonth]} <span style={{ color: '#a855f7' }}>{viewYear}</span>
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-purple-500/10 transition-all">
            <ChevronRight className="w-5 h-5 text-purple-400" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-purple-900/15">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-[9px] font-mono-cyber tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.45)' }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-1 min-h-[56px] border-b border-r border-purple-900/10" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = getDateStr(day);
            const dayEventos = eventosForDate(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <button key={day} onClick={() => setSelectedDate(dateStr)}
                className="p-1 min-h-[56px] border-b border-r border-purple-900/10 text-left hover:bg-purple-500/05 transition-all relative"
                style={{ background: isSelected ? 'rgba(168,85,247,0.10)' : undefined }}>
                <span className={`text-xs font-mono-cyber flex items-center justify-center w-6 h-6 rounded-full mx-auto mb-1 ${isToday ? 'text-black font-bold' : isSelected ? 'text-purple-300' : 'text-white/50'}`}
                  style={isToday ? { background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.8)' } : undefined}>
                  {day}
                </span>
                <div className="flex flex-wrap justify-center gap-0.5">
                  {dayEventos.slice(0, 3).map((ev, idx) => {
                    const cfg = TIPO_CONFIG[ev.tipo] || TIPO_CONFIG.outro;
                    return <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />;
                  })}
                  {dayEventos.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-white/30" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-mono-cyber text-purple-400/70">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {user?.role !== "user" && <button onClick={() => openNew(selectedDate)}
            className="text-[10px] font-mono-cyber flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
            style={{ border: '1px solid rgba(168,85,247,0.30)', color: 'rgba(168,85,247,0.70)' }}>
            <Plus className="w-3 h-3" /> novo
          </button>}
        </div>

        {selectedEventos.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-purple-900/15">
            <Calendar className="w-8 h-8 mx-auto mb-3 text-purple-500/15" />
            <p className="text-xs font-mono-cyber text-purple-500/30">// nenhum evento neste dia</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedEventos.map(ev => {
              const cfg = TIPO_CONFIG[ev.tipo] || TIPO_CONFIG.outro;
              const Icon = cfg.icon;
              const isDone = ev.status === "concluido";
              const isCancelled = ev.status === "cancelado";
              const canManage = user?.role === "admin" || ev.usuario_id === user?.email || ev.personal_id === user?.email;
              return (
                <motion.div key={ev.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                  style={{ borderColor: `${cfg.color}25`, background: `${cfg.color}08`, opacity: isDone || isCancelled ? 0.5 : 1 }}>
                  {canManage ? <button onClick={() => toggleStatus(ev)} className="flex-shrink-0">
                    {isDone ? <Check className="w-4 h-4" style={{ color: '#10b981' }} /> : <Circle className="w-4 h-4" style={{ color: cfg.color }} />}
                  </button> : <Circle className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />}
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDone || isCancelled ? 'line-through text-white/30' : 'text-white'}`}>{ev.titulo}</p>
                    {ev.horario && <p className="text-[10px] font-mono-cyber text-purple-400/40">{ev.horario}{isCancelled ? " · Cancelada" : ""}</p>}
                    {ev.descricao && <p className="text-[11px] text-white/40 truncate">{ev.descricao}</p>}
                  </div>
                  {canManage && <div className="flex gap-1">
                    <button onClick={() => openEdit(ev)} className="p-1 rounded text-purple-400/30 hover:text-purple-300 hover:bg-purple-500/10 transition-all text-xs">✏</button>
                    <button onClick={() => deleteMut.mutate(ev.id)} className="p-1 rounded text-purple-400/30 hover:text-pink-400 hover:bg-pink-500/10 transition-all text-xs">✕</button>
                  </div>}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => { setDialogOpen(false); setEditingEvento(null); }}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">
              {editingEvento ? "EDITAR EVENTO" : "NOVO EVENTO"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">TÍTULO *</Label>
              <input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" placeholder="Ex: Treino de pernas" />
            </div>
            {isPersonalManager && <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">ALUNO</Label>
              <Select value={form.student_id || "sem_aluno"} onValueChange={value => {
                const student = students.find(item => item.id === value);
                setForm(previous => ({ ...previous, student_id: value === "sem_aluno" ? "" : value, student_email: student?.email || "" }));
              }}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  <SelectItem value="sem_aluno" className="text-white">Evento pessoal, sem aluno</SelectItem>
                  {students.map(student => <SelectItem key={student.id} value={student.id} className="text-white">{student.name || student.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">TIPO</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                    {Object.entries(TIPO_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">RECORRÊNCIA</Label>
                <Select value={form.recorrencia} onValueChange={v => setForm(p => ({ ...p, recorrencia: v }))}>
                  <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                    <SelectItem value="nenhuma" className="text-white">Nenhuma</SelectItem>
                    <SelectItem value="diaria" className="text-white">Diária</SelectItem>
                    <SelectItem value="semanal" className="text-white">Semanal</SelectItem>
                    <SelectItem value="mensal" className="text-white">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">DATA *</Label>
                <input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
                  className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" />
              </div>
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">HORÁRIO</Label>
                <input type="time" value={form.horario} onChange={e => setForm(p => ({ ...p, horario: e.target.value }))}
                  className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">DESCRIÇÃO</Label>
              <textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm resize-none" rows={2} />
            </div>
            <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
              className="w-full btn-neon-purple py-2.5 rounded-xl text-sm font-medium tracking-wider">
              {editingEvento ? "ATUALIZAR" : "CRIAR EVENTO"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}