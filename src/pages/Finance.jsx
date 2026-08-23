import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign, Plus, Pencil, Trash2, AlertTriangle,
  CheckCircle2, Clock
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
import { toast } from "sonner";
import PaymentFormDialog from "../components/finance/PaymentFormDialog";
import MarkPaidDialog from "../components/finance/MarkPaidDialog";
import FinanceStats from "@/components/finance/FinanceStats";
import PageHeader from "@/components/shared/PageHeader";
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
  const [markPaidPayment, setMarkPaidPayment] = useState(null);
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', user?.email],
    queryFn: () => base44.entities.Payment.list('-due_date'),
    enabled: !!user,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', user?.email],
    queryFn: async () => {
      const [owned, created] = await Promise.all([
        base44.entities.Student.filter({ personal_id: user.email }),
        base44.entities.Student.filter({ created_by_id: user.id }),
      ]);
      return [...new Map([...owned, ...created].map(student => [student.id, student])).values()];
    },
    enabled: !!user,
  });

  const filteredPayments = payments.filter(p => p.personal_id === user?.email || p.created_by_id === user?.id);
  const filteredStudents = students;

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

  const filtered = filteredPayments.filter(p => {
    const st = filterStatus === "todos" ? true : autoCheckOverdue(p) === filterStatus;
    const stu = filterStudent ? p.student_id === filterStudent : true;
    return st && stu;
  });

  // Stats
  const totalPago = filteredPayments.filter(p => p.status === 'pago').reduce((a, p) => a + (p.amount || 0), 0);
  const totalPendente = filteredPayments.filter(p => autoCheckOverdue(p) !== 'pago').reduce((a, p) => a + (p.amount || 0), 0);
  const atrasados = filteredPayments.filter(p => autoCheckOverdue(p) === 'atrasado');

  const formatMoney = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (d) => { try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; } };

  return (
    <motion.div className="app-page space-y-6" initial="hidden" animate="show" variants={stagger}>
      <PageHeader title="Financeiro" subtitle="Controle de pagamentos dos alunos" action={<button onClick={() => { setEditingPayment(null); setShowForm(true); }} className="app-button-primary h-11 gap-2 rounded-xl px-4 text-sm"><Plus className="h-4 w-4" />Novo pagamento</button>} />

      <motion.div variants={fadeUp}><FinanceStats received={formatMoney(totalPago)} pending={formatMoney(totalPendente)} overdue={atrasados.length} students={new Set(filteredPayments.map(payment => payment.student_id)).size} /></motion.div>

      {/* Alerta atrasados */}
      {atrasados.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-xl p-4 border flex items-start gap-3"
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
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3 items-center">
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
          {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </motion.div>

      {/* Table — desktop only */}
      <motion.div variants={fadeUp} className="hidden sm:block rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
        <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-body uppercase tracking-widest"
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
                  <p className="text-xs font-body" style={{ color: 'rgba(192,132,252,0.55)' }}>
                    {p.due_date ? formatDate(p.due_date) : '—'}
                  </p>
                  {p.payment_date && (
                    <p className="text-[10px]" style={{ color: 'rgba(110,231,183,0.4)' }}>Pago: {formatDate(p.payment_date)}</p>
                  )}
                </div>
                <div className="col-span-2">
                  {status !== 'pago' ? (
                    <button
                      onClick={() => setMarkPaidPayment(p)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:opacity-80"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, cursor: 'pointer' }}
                      title="Clique para marcar como pago">
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  )}
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
      </motion.div>

      {/* Cards — mobile only */}
      <motion.div variants={stagger} className="sm:hidden space-y-3">
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
          filtered.map((p) => {
            const status = autoCheckOverdue(p);
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
            const Icon = cfg.icon;
            return (
              <motion.div key={p.id} variants={fadeUp} className="rounded-xl p-4 border space-y-3"
                style={{ background: 'rgba(8,4,22,0.8)', borderColor: 'rgba(168,85,247,0.15)' }}>
                {/* Top row: name + actions */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-semibold text-white leading-snug">{getStudentName(p.student_id)}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { setEditingPayment(p); setShowForm(true); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-purple-500/10">
                      <Pencil className="w-4 h-4 text-purple-400" />
                    </button>
                    <button onClick={() => { if (window.confirm('Remover este pagamento?')) deleteMutation.mutate(p.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4 text-red-400/60" />
                    </button>
                  </div>
                </div>

                {/* Value + status */}
                <div className="flex items-center justify-between">
                  <p className="text-xl font-body" style={{ color: '#6ee7b7' }}>
                    {p.amount ? formatMoney(p.amount) : '—'}
                  </p>
                  {status !== 'pago' ? (
                    <button
                      onClick={() => setMarkPaidPayment(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold hover:opacity-80 transition-all"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                      title="Toque para marcar como pago">
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  )}
                </div>

                {/* Description + dates */}
                <div className="space-y-1 pt-1 border-t" style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
                  {p.description && (
                    <p className="text-sm" style={{ color: 'rgba(196,181,224,0.7)' }}>{p.description}</p>
                  )}
                  <div className="flex gap-4 flex-wrap">
                    {p.due_date && (
                      <p className="text-xs font-body" style={{ color: 'rgba(192,132,252,0.6)' }}>
                        Venc.: {formatDate(p.due_date)}
                      </p>
                    )}
                    {p.payment_date && (
                      <p className="text-xs font-body" style={{ color: 'rgba(110,231,183,0.55)' }}>
                        Pago: {formatDate(p.payment_date)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {markPaidPayment && (
        <MarkPaidDialog
          payment={markPaidPayment}
          studentName={getStudentName(markPaidPayment.student_id)}
          onClose={() => setMarkPaidPayment(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['payments'] });
            setMarkPaidPayment(null);
          }}
        />
      )}

      {showForm && (
        <PaymentFormDialog
          payment={editingPayment}
          students={filteredStudents.filter(s => s.active !== false)}
          personalId={user?.email}
          onClose={() => { setShowForm(false); setEditingPayment(null); }}
          onSaved={handleSaved}
        />
      )}
    </motion.div>
  );
}