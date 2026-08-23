import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { format, addMonths } from "date-fns";
import { toast } from "sonner";

// Calcula o Nº dia útil de um mês/ano
function getNthWorkday(year, month, n) {
  let count = 0;
  let day = 1;
  while (count < n) {
    const d = new Date(year, month, day);
    const weekday = d.getDay();
    if (weekday !== 0 && weekday !== 6) count++;
    if (count < n) day++;
  }
  return format(new Date(year, month, day), 'yyyy-MM-dd');
}

function getNextDueDate(currentDueDate) {
  // Próximo mês a partir do vencimento atual
  const base = currentDueDate ? new Date(currentDueDate + "T00:00:00") : new Date();
  const next = addMonths(base, 1);
  return getNthWorkday(next.getFullYear(), next.getMonth(), 5);
}

export default function MarkPaidDialog({ payment, studentName, onClose, onSaved }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [paymentDate, setPaymentDate] = useState(today);
  const [createNext, setCreateNext] = useState(true);
  const [nextDue, setNextDue] = useState(() => getNextDueDate(payment?.due_date));
  const [nextDesc, setNextDesc] = useState(() => {
    // Tenta incrementar o mês na descrição
    const desc = payment?.description || "";
    return desc;
  });
  const [saving, setSaving] = useState(false);

  const inputStyle = {
    background: 'rgba(4,2,14,0.7)',
    border: '1px solid rgba(16,185,129,0.25)',
    color: '#f0e6ff',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  };

  const handleSave = async () => {
    if (!paymentDate) { toast.error("Selecione a data de pagamento."); return; }
    setSaving(true);
    try {
      // Marca como pago
      await base44.entities.Payment.update(payment.id, {
        ...payment,
        status: "pago",
        payment_date: paymentDate,
      });

      // Cria próximo vencimento
      if (createNext) {
        await base44.entities.Payment.create({
          student_id: payment.student_id,
          personal_id: payment.personal_id,
          amount: payment.amount,
          due_date: nextDue,
          payment_date: "",
          status: "pendente",
          description: nextDesc,
          notes: payment.notes || "",
        });
        toast.success("Pago! Próximo vencimento criado automaticamente.");
      } else {
        toast.success("Pagamento registrado!");
      }
      onSaved();
    } catch (e) {
      toast.error("Erro: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="app-glass-card relative w-full max-w-md rounded-2xl p-6">
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-app-text">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              MARCAR COMO PAGO
            </h2>
            <p className="text-xs font-mono-cyber mt-0.5" style={{ color: 'rgba(110,231,183,0.4)' }}>{studentName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-500/10">
            <X className="w-4 h-4" style={{ color: '#6ee7b7' }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Resumo do pagamento */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <p className="text-xs font-mono-cyber" style={{ color: 'rgba(110,231,183,0.5)' }}>{payment.description || "Pagamento"}</p>
            <p className="font-cyber text-xl mt-1" style={{ color: '#6ee7b7' }}>
              {Number(payment.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          {/* Data de pagamento */}
          <div>
            <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(110,231,183,0.5)', letterSpacing: '0.1em' }}>
              DATA DO PAGAMENTO
            </label>
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={inputStyle} />
          </div>

          {/* Criar próximo */}
          <div className="rounded-xl p-4 border space-y-3" style={{ borderColor: createNext ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.1)', background: 'rgba(168,85,247,0.04)' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setCreateNext(v => !v)}
                className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                style={{ background: createNext ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.1)', border: `1px solid ${createNext ? 'rgba(168,85,247,0.6)' : 'rgba(168,85,247,0.2)'}` }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{ left: createNext ? '1.25rem' : '0.125rem', background: createNext ? '#c084fc' : 'rgba(168,85,247,0.3)' }} />
              </div>
              <span className="text-sm text-white">Criar próximo vencimento automaticamente</span>
            </label>

            {createNext && (
              <>
                <div>
                  <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(192,132,252,0.5)', letterSpacing: '0.1em' }}>
                    PRÓXIMO VENCIMENTO (5º DIA ÚTIL — EDITÁVEL)
                  </label>
                  <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)}
                    style={{ ...inputStyle, border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }} />
                </div>
                <div>
                  <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(192,132,252,0.5)', letterSpacing: '0.1em' }}>
                    DESCRIÇÃO DO PRÓXIMO
                  </label>
                  <input type="text" value={nextDesc} onChange={e => setNextDesc(e.target.value)}
                    style={{ ...inputStyle, border: '1px solid rgba(168,85,247,0.3)' }} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', color: 'rgba(110,231,183,0.5)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.45)', color: '#6ee7b7', boxShadow: '0 0 14px rgba(16,185,129,0.12)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}