import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaymentFormDialog({ payment, students, personalId, onClose, onSaved }) {
  const [form, setForm] = useState({
    student_id: "",
    user_name: "",
    amount: "",
    payment_date: "",
    due_date: "",
    status: "pendente",
    description: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      setForm({
        student_id: payment.student_id || "",
        user_name: payment.user_name || "",
        amount: payment.amount || "",
        payment_date: payment.payment_date || "",
        due_date: payment.due_date || "",
        status: payment.status || "pendente",
        description: payment.description || "",
        notes: payment.notes || "",
      });
    }
  }, [payment]);

  const handleSave = async () => {
    if (!form.student_id) { toast.error("Selecione um aluno."); return; }
    if (!form.due_date) { toast.error("Informe a data de vencimento."); return; }
    setSaving(true);
    try {
      const selectedStudent = students.find(student => student.id === form.student_id);
      if (!selectedStudent?.email) { toast.error("O aluno selecionado precisa ter um e-mail cadastrado."); setSaving(false); return; }
      const data = {
        ...form,
        user_email: selectedStudent.email,
        user_name: form.user_name.trim() || selectedStudent.name || selectedStudent.email,
        amount: form.amount ? parseFloat(form.amount) : 0,
        personal_id: personalId,
      };
      if (payment?.id) {
        await base44.entities.Payment.update(payment.id, data);
        toast.success("Pagamento atualizado!");
      } else {
        await base44.entities.Payment.create(data);
        toast.success("Pagamento registrado!");
      }
      onSaved();
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setSaving(false);
  };

  const inputStyle = {
    background: 'rgba(4,2,14,0.7)',
    border: '1px solid rgba(168,85,247,0.25)',
    color: '#f0e6ff',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  };

  const labelStyle = { fontSize: '0.7rem', color: 'rgba(192,132,252,0.6)', marginBottom: '0.25rem', display: 'block', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.1em' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="app-glass-card relative w-full max-w-md rounded-2xl p-6">
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' }} />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-app-text">{payment?.id ? "EDITAR PAGAMENTO" : "NOVO PAGAMENTO"}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-purple-500/10">
            <X className="w-4 h-4 text-purple-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label style={labelStyle}>E-MAIL DO ALUNO</label>
            <select value={form.student_id} onChange={e => {
              const student = students.find(item => item.id === e.target.value);
              setForm(f => ({ ...f, student_id: e.target.value, user_name: student?.name || "" }));
            }} style={inputStyle}>
              <option value="">Selecionar e-mail...</option>
              {students.filter(student => student.email).map(student => <option key={student.id} value={student.id}>{student.email}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>NOME DO ALUNO (OPCIONAL)</label>
            <input type="text" placeholder="Nome para exibição" value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>VALOR (R$)</label>
              <input type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>STATUS</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                <option value="pago">✅ Pago</option>
                <option value="pendente">⏳ Pendente</option>
                <option value="atrasado">🚨 Atrasado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>VENCIMENTO</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>DATA PAGAMENTO</label>
              <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>DESCRIÇÃO</label>
            <input type="text" placeholder="Ex: Mensalidade Maio/2025" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>OBSERVAÇÕES</label>
            <textarea rows={2} placeholder="Observações opcionais..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(196,181,224,0.7)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#e9d5ff', boxShadow: '0 0 14px rgba(168,85,247,0.15)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}