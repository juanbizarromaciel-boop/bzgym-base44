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
    base44.auth.me().then((u) => {
      setUser(u);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return { user, loading, role: user?.role || null, isAdmin: user?.role === "admin", isPersonal: user?.role === "personal" };
}