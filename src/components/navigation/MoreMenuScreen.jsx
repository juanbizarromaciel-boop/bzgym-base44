import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getMoreNavigation } from "@/components/navigation/navigationConfig";
import MoreMenuSection from "@/components/navigation/MoreMenuSection";

export default function MoreMenuScreen({ open, role, onClose }) {
  const [search, setSearch] = useState("");
  const userQuery = useQuery({ queryKey: ["more-menu-user"], queryFn: () => base44.auth.me(), enabled: open });
  const notificationQuery = useQuery({ queryKey: ["more-menu-notifications", userQuery.data?.email], queryFn: () => base44.entities.Notificacao.filter({ usuario_id: userQuery.data.email, lida: false }, "-created_date", 100), enabled: open && !!userQuery.data?.email });
  useEffect(() => { if (!open) return; document.body.style.overflow = "hidden"; const close = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", close); return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); }; }, [open, onClose]);
  const sections = useMemo(() => {
    const term = search.trim().toLowerCase();
    return Object.entries(getMoreNavigation(role).filter(item => !term || `${item.label} ${item.description}`.toLowerCase().includes(term)).reduce((result, item) => { (result[item.section] ||= []).push(item); return result; }, {}));
  }, [role, search]);
  if (!open) return null;
  const badges = { unreadNotifications: notificationQuery.data?.length || 0 };
  return createPortal(<div role="dialog" aria-modal="true" aria-label="Mais opções" className="premium-app-shell fixed inset-0 z-[100] overflow-y-auto text-professor">
    <header className="app-glass-header sticky top-0 z-10 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))]"><div className="mx-auto max-w-[540px]"><div className="flex h-12 items-center gap-3"><button aria-label="Voltar" onClick={onClose} className="app-glass-icon flex h-11 w-11 items-center justify-center rounded-[14px] focus-visible:ring-2 focus-visible:ring-app-primary"><ArrowLeft className="h-5 w-5" /></button><div><h1 className="text-xl font-semibold">Mais</h1><p className="text-xs text-professor-muted">Todas as funções disponíveis para seu perfil</p></div></div><label className="mt-3 flex h-12 items-center gap-3 rounded-[16px] border border-app-primary/15 bg-professor-card/70 px-4 focus-within:border-app-primary/40"><Search className="h-4 w-4 text-professor-muted" /><span className="sr-only">Buscar função</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou descrição" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-professor-muted" /></label></div></header>
    <main className="mx-auto max-w-[540px] space-y-6 px-4 pb-[calc(28px+env(safe-area-inset-bottom))] pt-5">{userQuery.isLoading ? <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-[16px] bg-professor-card" />)}</div> : userQuery.isError ? <div className="app-glass-card rounded-[18px] p-5 text-center"><p className="text-sm">Não foi possível carregar o menu.</p><button onClick={() => userQuery.refetch()} className="mt-3 h-11 rounded-xl bg-app-primary px-4 text-sm font-medium">Tentar novamente</button></div> : sections.length ? sections.map(([title, items]) => <MoreMenuSection key={title} title={title} items={items} badges={badges} onClose={onClose} />) : <div className="app-glass-card rounded-[18px] p-6 text-center"><p className="font-medium">Nenhuma função encontrada</p><p className="mt-1 text-sm text-professor-muted">Tente buscar por outro termo.</p></div>}</main>
  </div>, document.body);
}