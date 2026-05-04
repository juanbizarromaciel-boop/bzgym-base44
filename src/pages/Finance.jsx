import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign, Plus, Pencil, Trash2, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Users, Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PaymentFormDialog from "../components/finance/PaymentFormDialog";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG = {
  pago:     { label: "Pago",     color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: CheckCircle2 },
  pendente: { label: "Pendente", color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',  icon: Clock },
  atrasado: { label: "Atrasado", color: '#fca5a5', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: AlertTriangle },
};

export default function Finance() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterStudent, setFilterStudent] = useState("");
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-due_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); toast.success("Removido!"); },
  });

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ['payments'] });
    setShowForm(false);
    setEditingPayment(null);
  };

  const getStudentName = (id) => students.find(s => s.id === id)?.name || "—";

  // Auto-mark overdue
  const autoCheckOverdue = (p) => {
    if (p.status === 'pendente' && p.due_date && isPast(parseISO(p.due_date))) return 'atrasado';
    return p.status;
  };

  const filtered = payments.filter(p => {
    const st = filterStatus === "todos" ? true : autoCheckOverdue(p) === filterStatus;
    const stu = filterStudent ? p.student_id === filterStudent : true;
    return st && stu;
  });

  // Stats
  const totalPago = payments.filter(p => p.status === 'pago').reduce((a, p) => a + (p.amount || 0), 0);
  const totalPendente = payments.filter(p => autoCheckOverdue(p) !== 'pago').reduce((a, p) => a + (p.amount || 0), 0);
  const atrasados = payments.filter(p => autoCheckOverdue(p) === 'atrasado');

  const formatMoney = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (d) => { try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; } };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(168,85,247,0.05))', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 0 40px rgba(16,185,129,0.06)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
              <DollarSign className="w-6 h-6 text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.8))' }} />
            </div>
            <div>
              <h1 className="font-cyber text-2xl text-white tracking-wide">FINANCEIRO</h1>
              <p className="text-xs font-mono-cyber mt-0.5" style={{ color: 'rgba(110,231,183,0.5)' }}>Controle de pagamentos dos alunos</p>
            </div>
          </div>
          <button onClick={() => { setEditingPayment(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', boxShadow: '0 0 14px rgba(16,185,129,0.1)' }}>
            <Plus className="w-4 h-4" /> Novo Pagamento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Recebido", value: formatMoney(totalPago), color: '#6ee7b7', border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.07)', icon: TrendingUp },
          { label: "A Receber", value: formatMoney(totalPendente), color: '#fcd34d', border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.07)', icon: Clock },
          { label: "Atrasados", value: atrasados.length, color: '#fca5a5', border: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.07)', icon: AlertTriangle },
          { label: "Alunos", value: [...new Set(payments.map(p => p.student_id))].length, color: '#c084fc', border: 'rgba(168,85,247,0.25)', bg: 'rgba(168,85,247,0.07)', icon: Users },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 border" style={{ background: s.bg, borderColor: s.border }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono-cyber" style={{ color: s.color, opacity: 0.7, letterSpacing: '0.1em' }}>{s.label}</p>
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color, opacity: 0.6 }} />
            </div>
            <p className="text-lg font-cyber" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alerta atrasados */}
      {atrasados.length > 0 && (
        <div className="rounded-xl p-4 border flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">
              {atrasados.length} aluno{atrasados.length > 1 ? 's' : ''} com pagamento atrasado
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(252,165,165,0.6)' }}>
              {atrasados.map(p => getStudentName(p.student_id)).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5">
          {['todos', 'pago', 'pendente', 'atrasado'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{
                background: filterStatus === s ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.05)',
                border: `1px solid ${filterStatus === s ? 'rgba(168,85,247,0.45)' : 'rgba(168,85,247,0.12)'}`,
                color: filterStatus === s ? '#e9d5ff' : 'rgba(196,181,224,0.5)',
              }}>
              {s === 'todos' ? 'Todos' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
          className="flex-1 min-w-[160px] rounded-lg px-3 py-1.5 text-xs outline-none"
          style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(210,190,240,0.7)' }}>
          <option value="">Todos os alunos</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
        <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-mono-cyber uppercase tracking-widest"
          style={{ background: 'rgba(168,85,247,0.08)', borderBottom: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.5)' }}>
          <div className="col-span-3">Aluno</div>
          <div className="col-span-2">Descrição</div>
          <div className="col-span-2">Valor</div>
          <div className="col-span-2">Vencimento</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-10 h-10 mx-auto mb-3 text-purple-500/20" />
            <p className="text-sm" style={{ color: 'rgba(168,85,247,0.4)' }}>Nenhum pagamento encontrado</p>
          </div>
        ) : (
          filtered.map((p, idx) => {
            const status = autoCheckOverdue(p);
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
            const Icon = cfg.icon;
            return (
              <div key={p.id}
                className="grid grid-cols-12 px-4 py-3.5 items-center transition-colors hover:bg-purple-500/5"
                style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(168,85,247,0.07)' : 'none' }}>
                <div className="col-span-3">
                  <p className="text-sm font-medium text-white truncate">{getStudentName(p.student_id)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs truncate" style={{ color: 'rgba(196,181,224,0.6)' }}>{p.description || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-semibold" style={{ color: '#6ee7b7' }}>
                    {p.amount ? formatMoney(p.amount) : '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-mono-cyber" style={{ color: 'rgba(192,132,252,0.55)' }}>
                    {p.due_date ? formatDate(p.due_date) : '—'}
                  </p>
                  {p.payment_date && (
                    <p className="text-[10px]" style={{ color: 'rgba(110,231,183,0.4)' }}>Pago: {formatDate(p.payment_date)}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => { setEditingPayment(p); setShowForm(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-purple-500/10">
                    <Pencil className="w-3 h-3 text-purple-400" />
                  </button>
                  <button onClick={() => { if (window.confirm('Remover este pagamento?')) deleteMutation.mutate(p.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10">
                    <Trash2 className="w-3 h-3 text-red-400/60" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <PaymentFormDialog
          payment={editingPayment}
          students={students.filter(s => s.active !== false)}
          personalId={user?.email}
          onClose={() => { setShowForm(false); setEditingPayment(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}