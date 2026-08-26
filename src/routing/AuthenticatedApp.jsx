import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import AccountLoadError from "@/components/AccountLoadError";
import AppLoadingScreen from "@/components/AppLoadingScreen";
import AppRoutes from "@/routing/AppRoutes";
import { getEffectiveRole } from "@/lib/user-role";

const todayIso = () => new Date().toISOString().slice(0, 10);
const subscriberValid = user => user?.assinatura_status === "isenta" || (["ativa", "cancelamento_agendado"].includes(user?.assinatura_status) && (!user.assinatura_vencimento || user.assinatura_vencimento >= todayIso()));
const blocked = user => user && !["admin", "personal", "recente"].includes(user.role) && (user.role === "bloqueado" || user.assinatura_bloqueio_manual || user.assinatura_status === "bloqueada" || (["assinante"].includes(user.role) && !subscriberValid(user)));

export default function AuthenticatedApp() {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAccountError, setShowAccountError] = useState(false);
  const accountUnavailable = loadError || (!isLoadingAuth && !isLoadingPublicSettings && !loading && !user);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (authError) { setLoading(false); return; }
    let unsubscribe;
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      const authUser = await base44.auth.me();
      let profile = authUser;
      try { const response = await base44.functions.invoke("getCurrentUserProfile", {}); profile = response.data.user || authUser; } catch {}
      const role = getEffectiveRole(profile);
      let nextUser = { ...profile, role };
      if (!["admin", "personal"].includes(role)) {
        try {
          const records = await base44.entities.Student.filter({ email: profile.email }, "-created_date", 1);
          const found = records[0] || null;
          if (found?.id && nextUser.student_id !== found.id) { await base44.auth.updateMe({ student_id: found.id }); nextUser = { ...nextUser, student_id: found.id }; }
          setStudent(found);
        } catch {
          setStudent(null);
        }
      }
      setUser(nextUser); setLoading(false); return nextUser;
    };
    load().then(current => {
      if (!current?.email) return;
      try { unsubscribe = base44.entities.User.subscribe(event => { if (event.data?.email?.toLowerCase() === current.email.toLowerCase()) load(); }); } catch {}
    }).catch(() => { setLoadError(true); setLoading(false); });
    return () => unsubscribe?.();
  }, [isLoadingAuth, authError]);

  useEffect(() => {
    if (!accountUnavailable) { setShowAccountError(false); return; }
    const timer = window.setTimeout(() => setShowAccountError(true), 4000);
    return () => window.clearTimeout(timer);
  }, [accountUnavailable]);

  if (isLoadingPublicSettings || isLoadingAuth || loading) return <AppLoadingScreen />;
  if (authError?.type === "user_not_registered") return <UserNotRegisteredError />;
  if (accountUnavailable && !showAccountError) return <AppLoadingScreen message="Carregando os dados da sua conta" />;
  if (accountUnavailable) return <AccountLoadError />;
  const accessState = blocked(user) ? "blocked" : user?.role === "recente" ? "onboarding" : user?.role === "user" && student?.active === false ? "pending" : "active";
  return <AppRoutes user={user} accessState={accessState} />;
}