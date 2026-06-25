import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook para obter o usuário atual.
 * Sempre busca do servidor para garantir dados frescos.
 */
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      const records = await base44.entities.User.filter({ email: authUser.email });
      const userRecord = records?.[0] || {};
      const baseRole = userRecord.role || authUser.role || "user";
      const hasSubscriberProfile = userRecord.account_type === "assinante" || userRecord.assinatura_status || userRecord.assinatura_vencimento || userRecord.assinatura_origem || userRecord.stripe_subscription_id;
      const role = hasSubscriberProfile && !["admin", "personal", "recente", "bloqueado"].includes(baseRole)
        ? "assinante"
        : baseRole;
      setUser({ ...authUser, ...userRecord, role });
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return { user, loading, role: user?.role || null, isAdmin: user?.role === "admin", isPersonal: user?.role === "personal" };
}