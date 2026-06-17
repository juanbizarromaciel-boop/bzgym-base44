import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Lock, Eye, EyeOff, Shield, AlertTriangle,
  Calendar, Edit, Trash2, FileText, CheckCircle2, XCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const TIPO_EVENTO = {
  exame: { label: "Exame", color: "#06b6d4" },
  consulta: { label: "Consulta", color: "#a855f7" },
  lembrete: { label: "Lembrete", color: "#f59e0b" },
  acompanhamento: { label: "Acompanhamento", color: "#10b981" },
  documento: { label: "Documento", color: "#ec4899" },
  observacao: { label: "Observação", color: "#84cc16" },
};

const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "#10b981" },
  concluido: { label: "Concluído", color: "#06b6d4" },
  pausado: { label: "Pausado", color: "#f59e0b" },
  cancelado: { label: "Cancelado", color: "#ef4444" },
};

const EMPTY_FORM = {
  titulo: "", descricao: "", student_id: "", personal_id: "",
  data_inicio: new Date().toISOString().split("T")[0], data_fim: "",
  tipo_evento: "lembrete", status: "ativo",
  visivel_para_aluno: false, visivel_para_personal: false,
  arquivo_url: "", observacoes_privadas_admin: "", observacoes_visiveis_aluno: "",
};

export default function CalendarioHormonalAdmin() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedStudent, setSelectedStudent] = useState("todos");
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== "admin") navigate("/AccessDenied");
    }).catch(() => {});
  }, [navigate]);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    enabled: !!user,
  });

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["calendarioHormonal"],
    queryFn: () => base44.entities.CalendarioHormonal.list("-created_date", 100),
    enabled: !!user,
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.CalendarioHormonal.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarioHormonal"] }); toast.success("Evento criado"); setDialogOpen(false); setEditing(null); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.CalendarioHormonal.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarioHormonal"] }); toast.success("Atualizado"); setDialogOpen(false); setEditing(null); }
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.CalendarioHormonal.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarioHormonal"] }); toast.success("Removido"); }
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      titulo: ev.titulo || "", descricao: ev.descricao || "",
      student_id: ev.student_id || "", personal_id: ev.personal_id || "",
      data_inicio: ev.data_inicio || EMPTY_FORM.data_inicio, data_fim: ev.data_fim || "",
      tipo_evento: ev.tipo_evento || "lembrete", status: ev.status || "ativo",
      visivel_para_aluno: ev.visivel_para_aluno || false, visivel_para_personal: ev.visivel_para_personal || false,
      arquivo_url: ev.arquivo_url || "", observacoes_privadas_admin: ev.observacoes_privadas_admin || "",
      observacoes_visiveis_aluno: ev.observacoes_visiveis_aluno || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.titulo || !form.student_id || !form.data_inicio) {
      toast.error("Preencha: título, aluno e data de início"); return;
    }
    const payload = { ...form, criado_por: user?.email, autorizado_por_admin: true };
    editing ? updateMut.mutate({ id: editing.id, d: payload }) : createMut.mutate(payload);
  };

  const toggleVisibility = (ev, field) => {
    updateMut.mutate({ id: ev.id, d: { [field]: !ev[field] } });
  };

  const filteredEventos = selectedStudent === "todos" ? eventos : eventos.filter(e => e.student_id === selectedStudent);
  const getStudentName = (id) => students.find(s => s.id === id)?.name || "Aluno";

  if (!user || user.role !== "admin") return null;

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(132,204,22,0.8), transparent)' }} />
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded" style={{ background: 'linear-gradient(to bottom, #84cc16, #a855f7)', boxShadow: '0 0 12px rgba(132,204,22,0.6)' }} />
              <h1 className="font-cyber text-3xl font-black tracking-wider text-white" style={{ textShadow: '0 0 20px rgba(132,204,22,0.5)' }}>CALENDÁRIO HORMONAL</h1>
            </div>
            <p className="text-xs font-mono-cyber text-green-400/50 pl-4">// gestão administrativa — acesso restrito</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.40)', color: '#84cc16', boxShadow: '0 0 14px rgba(132,204,22,0.12)' }}>
            <Plus className="w-4 h-4" /> NOVO EVENTO
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(132,204,22,0.5), rgba(168,85,247,0.6), transparent)' }} />
      </motion.div>

      {/* Security banner */}
      <motion.div variants={fadeUp} className="flex items-start gap-3 p-4 rounded-xl border"
        style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)' }}>
        <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-mono-cyber text-amber-300 font-semibold">INFORMAÇÃO SENSÍVEL — ACESSO RESTRITO</p>
          <p className="text-[10px] text-amber-400/50 font-mono-cyber mt-0.5">
            Este módulo é visível apenas para administradores. Nenhum dado aqui aparece em relatórios gerais, comunidade ou dashboards públicos. Observações privadas NUNCA são exibidas ao aluno ou personal.
          </p>
        </div>
      </motion.div>

      {/* Filter by student */}
      <motion.div variants={fadeUp}>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-full sm:w-64 cyber-input">
            <SelectValue placeholder="Filtrar por aluno" />
          </SelectTrigger>
          <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
            <SelectItem value="todos" className="text-white">Todos os alunos</SelectItem>
            {students.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Events list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" /></div>
      ) : filteredEventos.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-16 rounded-2xl border border-purple-900/20">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-green-500/20" />
          <p className="font-mono-cyber text-sm text-purple-500/30">// nenhum evento cadastrado</p>
          <button onClick={openNew} className="mt-5 btn-neon-green px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 mx-auto"><Plus className="w-4 h-4" /> Criar evento</button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredEventos.map(ev => {
            const tipo = TIPO_EVENTO[ev.tipo_evento] || TIPO_EVENTO.lembrete;
            const statusCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.ativo;
            return (
              <motion.div key={ev.id} variants={fadeUp}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: `${tipo.color}25`, background: 'rgba(4,4,14,0.85)' }}>
                <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${tipo.color}, transparent)` }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-mono-cyber px-2 py-0.5 rounded"
                          style={{ background: `${tipo.color}15`, color: tipo.color, border: `1px solid ${tipo.color}30` }}>
                          {tipo.label}
                        </span>
                        <span className="text-[9px] font-mono-cyber px-2 py-0.5 rounded"
                          style={{ background: `${statusCfg.color}15`, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}>
                          {statusCfg.label}
                        </span>
                        <Lock className="w-3 h-3 text-amber-400/50" />
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate">{ev.titulo}</h3>
                      <p className="text-[10px] font-mono-cyber text-purple-400/50 mt-0.5">
                        {getStudentName(ev.student_id)} · {ev.data_inicio}
                        {ev.data_fim && ` → ${ev.data_fim}`}
                      </p>
                      {ev.descricao && <p className="text-xs text-white/50 mt-1 line-clamp-2">{ev.descricao}</p>}
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      {/* Toggle visibility for student */}
                      <button onClick={() => toggleVisibility(ev, "visivel_para_aluno")}
                        className="p-1.5 rounded-lg transition-all group"
                        title={ev.visivel_para_aluno ? "Ocultar do aluno" : "Mostrar ao aluno"}
                        style={{ background: ev.visivel_para_aluno ? 'rgba(16,185,129,0.12)' : 'rgba(168,85,247,0.06)', border: `1px solid ${ev.visivel_para_aluno ? 'rgba(16,185,129,0.30)' : 'rgba(168,85,247,0.15)'}` }}>
                        {ev.visivel_para_aluno
                          ? <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          : <EyeOff className="w-3.5 h-3.5 text-purple-400/40" />}
                      </button>
                      <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMut.mutate(ev.id)} className="p-1.5 rounded-lg text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Visibility indicators */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-purple-900/15">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono-cyber"
                      style={{ color: ev.visivel_para_aluno ? '#10b981' : 'rgba(168,85,247,0.25)' }}>
                      {ev.visivel_para_aluno ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      Aluno
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono-cyber"
                      style={{ color: ev.visivel_para_personal ? '#06b6d4' : 'rgba(168,85,247,0.25)' }}>
                      {ev.visivel_para_personal ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      Personal
                    </div>
                    {ev.arquivo_url && (
                      <div className="flex items-center gap-1 text-[9px] font-mono-cyber text-cyan-400/50">
                        <FileText className="w-3 h-3" /> Arquivo
                      </div>
                    )}
                    {ev.observacoes_privadas_admin && (
                      <div className="flex items-center gap-1 text-[9px] font-mono-cyber text-amber-400/40">
                        <Lock className="w-3 h-3" /> Obs. privada
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => { setDialogOpen(false); setEditing(null); }}>
        <DialogContent className="border border-green-900/40 text-white max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-green-300 flex items-center gap-2">
              <Lock className="w-4 h-4" /> {editing ? "EDITAR EVENTO" : "NOVO EVENTO HORMONAL"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 p-3 rounded-lg mb-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <p className="text-[9px] font-mono-cyber text-amber-400/70">Área administrativa. Não gera prescrição médica automática.</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-green-400/60 text-xs tracking-wider">TÍTULO *</Label>
              <input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" placeholder="Ex: Exame de sangue — Agosto" />
            </div>
            <div>
              <Label className="text-green-400/60 text-xs tracking-wider">ALUNO *</Label>
              <Select value={form.student_id} onValueChange={v => setForm(p => ({ ...p, student_id: v }))}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecionar aluno" /></SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  {students.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-green-400/60 text-xs tracking-wider">TIPO EVENTO</Label>
                <Select value={form.tipo_evento} onValueChange={v => setForm(p => ({ ...p, tipo_evento: v }))}>
                  <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                    {Object.entries(TIPO_EVENTO).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-green-400/60 text-xs tracking-wider">STATUS</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-green-400/60 text-xs tracking-wider">DATA INÍCIO *</Label>
                <input type="date" value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" />
              </div>
              <div>
                <Label className="text-green-400/60 text-xs tracking-wider">DATA FIM</Label>
                <input type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-green-400/60 text-xs tracking-wider">DESCRIÇÃO (visível ao aluno autorizado)</Label>
              <textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm resize-none" rows={2} placeholder="Descrição que o aluno poderá ver se autorizado..." />
            </div>
            <div>
              <Label className="text-amber-400/60 text-xs tracking-wider flex items-center gap-1"><Lock className="w-3 h-3" /> OBSERVAÇÕES PRIVADAS (somente admin)</Label>
              <textarea value={form.observacoes_privadas_admin} onChange={e => setForm(p => ({ ...p, observacoes_privadas_admin: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg mt-1 text-white text-sm resize-none"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', outline: 'none' }}
                rows={2} placeholder="Notas internas — jamais visíveis ao aluno ou personal..." />
            </div>

            {/* Visibility toggles */}
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-xl border"
                style={{ borderColor: form.visivel_para_aluno ? 'rgba(16,185,129,0.35)' : 'rgba(168,85,247,0.15)', background: form.visivel_para_aluno ? 'rgba(16,185,129,0.08)' : 'rgba(168,85,247,0.04)' }}>
                <input type="checkbox" checked={form.visivel_para_aluno} onChange={e => setForm(p => ({ ...p, visivel_para_aluno: e.target.checked }))} className="hidden" />
                {form.visivel_para_aluno ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-purple-400/30" />}
                <span className="text-xs font-mono-cyber" style={{ color: form.visivel_para_aluno ? '#34d399' : 'rgba(168,85,247,0.40)' }}>Visível ao aluno</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-xl border"
                style={{ borderColor: form.visivel_para_personal ? 'rgba(6,182,212,0.35)' : 'rgba(168,85,247,0.15)', background: form.visivel_para_personal ? 'rgba(6,182,212,0.08)' : 'rgba(168,85,247,0.04)' }}>
                <input type="checkbox" checked={form.visivel_para_personal} onChange={e => setForm(p => ({ ...p, visivel_para_personal: e.target.checked }))} className="hidden" />
                {form.visivel_para_personal ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-purple-400/30" />}
                <span className="text-xs font-mono-cyber" style={{ color: form.visivel_para_personal ? '#22d3ee' : 'rgba(168,85,247,0.40)' }}>Visível ao personal</span>
              </label>
            </div>

            <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
              className="w-full py-2.5 rounded-xl text-sm font-medium tracking-wider transition-all"
              style={{ background: 'rgba(132,204,22,0.15)', border: '1px solid rgba(132,204,22,0.40)', color: '#84cc16' }}>
              {editing ? "ATUALIZAR EVENTO" : "SALVAR EVENTO"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}