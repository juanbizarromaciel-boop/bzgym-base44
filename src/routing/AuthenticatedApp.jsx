import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import AppRoutes from "@/routing/AppRoutes";
import { getEffectiveRole } from "@/lib/user-role";

const todayIso = () => new Date().toISOString().slice(0, 10);
const subscriberValid = user => user?.assinatura_status === "isenta" || (user?.assinatura_status === "ativa" && (!user.assinatura_vencimento || user.assinatura_vencimento >= todayIso()));
const blocked = user => user && !["admin", "personal", "recente"].includes(user.role) && (user.role === "bloqueado" || user.assinatura_bloqueio_manual || user.assinatura_status === "bloqueada" || (["assinante"].includes(user.role) && !subscriberValid(user)));

export default function AuthenticatedApp() {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoadingAuth || authError) { setLoading(false); return; }
    let unsubscribe;
    const load = async () => {
      const authUser = await base44.auth.me();
      let profile = authUser;
      try { const response = await base44.functions.invoke("getCurrentUserProfile", {}); profile = response.data.user || authUser; } catch {}
      const role = getEffectiveRole(profile);
      let nextUser = { ...profile, role };
      if (!["admin", "personal"].includes(role)) {
        const records = await base44.entities.Student.filter({ email: profile.email }, "-created_date", 1);
        const found = records[0] || null;
        if (found?.id && nextUser.student_id !== found.id) { await base44.auth.updateMe({ student_id: found.id }); nextUser = { ...nextUser, student_id: found.id }; }
        setStudent(found);
      }
      setUser(nextUser); setLoading(false); return nextUser;
    };
    load().then(current => { unsubscribe = base44.entities.User.subscribe(event => { if (event.data?.email?.toLowerCase() === current.email?.toLowerCase()) load(); }); }).catch(() => setLoading(false));
    return () => unsubscribe?.();
  }, [isLoadingAuth, authError]);

  if (isLoadingPublicSettings || isLoadingAuth || loading) return <div className="fixed inset-0 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-app-primary/20 border-t-app-primary" /></div>;
  if (authError?.type === "user_not_registered") return <UserNotRegisteredError />;
  if (authError?.type === "auth_required") { navigateToLogin(); return null; }
  const accessState = blocked(user) ? "blocked" : user?.role === "recente" ? "onboarding" : user?.role === "user" && student?.active === false ? "pending" : "active";
  return <AppRoutes user={user} accessState={accessState} />;
}