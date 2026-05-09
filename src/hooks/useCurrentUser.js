import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

let cachedUser = null;
let pendingPromise = null;

/**
 * Hook compartilhado para obter o usuário atual.
 * Usa cache em memória para evitar múltiplas chamadas auth.me() por página.
 */
export function useCurrentUser() {
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }
    if (!pendingPromise) {
      pendingPromise = base44.auth.me().catch(() => null);
    }
    pendingPromise.then((u) => {
      cachedUser = u;
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading, role: user?.role || null, isAdmin: user?.role === "admin", isPersonal: user?.role === "personal" };
}