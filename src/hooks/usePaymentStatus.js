import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isPast, parseISO } from "date-fns";

/**
 * Hook que verifica se o aluno logado tem pagamento bloqueado.
 * Retorna { blocked, loading, personalName }
 */
export function usePaymentStatus(student) {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personalName, setPersonalName] = useState("");

  useEffect(() => {
    if (!student?.id) { setLoading(false); return; }

    const check = async () => {
      try {
        const paymentsById = await base44.entities.Payment.filter({ student_id: student.id });
        const paymentsByEmail = student.email ? await base44.entities.Payment.filter({ student_id: student.email }) : [];
        const paymentsByUserEmail = student.email ? await base44.entities.Payment.filter({ user_email: student.email }) : [];
        const payments = [...paymentsById, ...paymentsByEmail, ...paymentsByUserEmail].filter((payment, index, list) => list.findIndex(p => p.id === payment.id) === index);
        if (!payments || payments.length === 0) { setLoading(false); return; }

        // Sort by due_date desc to get latest
        const sorted = [...payments].sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return b.due_date.localeCompare(a.due_date);
        });

        const latest = sorted[0];
        const effectiveStatus = latest.status === 'pendente' && latest.due_date && isPast(parseISO(latest.due_date))
          ? 'atrasado'
          : latest.status;

        if (effectiveStatus === 'atrasado') {
          setBlocked(true);
          // Try to get personal name — filter by email instead of listing all users
          if (student.personal_id) {
            try {
              const users = await base44.entities.User.filter({ email: student.personal_id });
              if (users?.length > 0) setPersonalName(users[0].full_name || users[0].email);
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    check();
  }, [student?.id]);

  return { blocked, loading, personalName };
}