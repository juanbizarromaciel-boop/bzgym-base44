import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getEffectiveRole } from "@/lib/user-role";

/**
 * Hook para obter o usuário atual.
 * Sempre busca do servidor para garantir dados frescos.
 */
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      let mergedUser = authUser;
      try {
        const profileResponse = await base44.functions.invoke('getCurrentUserProfile', {});
        mergedUser = profileResponse.data.user || authUser;
      } catch (error) {
        mergedUser = authUser;
      }
      const role = getEffectiveRole(mergedUser);
      setUser({ ...mergedUser, role });
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  return { user, loading, role: user?.role || null, isAdmin: user?.role === "admin", isPersonal: user?.role === "personal" };
}