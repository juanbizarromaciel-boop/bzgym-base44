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
const blocked = user => user && (user.role === "bloqueado" || (user.role === "assinante" && (user.assinatura_bloqueio_manual || user.assinatura_status === "bloqueada" || !subscriberValid(user))));

export default function AuthenticatedApp() {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [studentAccess, setStudentAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAccountError, setShowAccountError] = useState(false);
  const accountUnavailable = loadError || (!isLoadingAuth && !isLoadingPublicSettings && !loading && !user);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (authError) { setLoading(false); return; }
    let unsubscribeUser;
    let unsubscribeStudent;
    let unsubscribeAccess;
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
          const controls = await base44.entities.StudentAccessControl.filter({ student_email: profile.email }, "-created_date", 1);
          setStudentAccess(controls[0] || null);
        } catch {
          setStudent(null);
          setStudentAccess(null);
        }
      } else {
        setStudentAccess(null);
      }
      setUser(nextUser); setLoading(false); return nextUser;
    };
    load().then(current => {
      if (!current?.email) return;
      try { unsubscribeUser = base44.entities.User.subscribe(event => { if (event.data?.email?.toLowerCase() === current.email.toLowerCase()) load(); }); } catch {}
      try { unsubscribeStudent = base44.entities.Student.subscribe(event => { if (event.data?.email?.toLowerCase() === current.email.toLowerCase()) load(); }); } catch {}
      try { unsubscribeAccess = base44.entities.StudentAccessControl.subscribe(event => { if (event.data?.student_email?.toLowerCase() === current.email.toLowerCase()) load(); }); } catch {}
    }).catch(() => { setLoadError(true); setLoading(false); });
    return () => { unsubscribeUser?.(); unsubscribeStudent?.(); unsubscribeAccess?.(); };
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
  const accessState = user?.role === "user" && studentAccess?.blocked === true ? "student_blocked" : blocked(user) ? "blocked" : user?.role === "recente" ? "onboarding" : user?.role === "user" && student?.active === false ? "pending" : "active";
  return <AppRoutes user={user} accessState={accessState} />;
}