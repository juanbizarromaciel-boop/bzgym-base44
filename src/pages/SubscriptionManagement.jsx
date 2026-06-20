import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Search, CheckCircle2, Lock, Unlock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const todayIso = () => new Date().toISOString().slice(0, 10);
const addMonth = (date) => {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  if (d.getDate() !== day) d.setDate(0);
  return d.toISOString().slice(0, 10);
};
const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const isOverdue = (user) => user.assinatura_vencimento && user.assinatura_vencimento < todayIso() && user.assinatura_status !== "ativa";

export default function SubscriptionManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [payingUser, setPayingUser] = useState(null);
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [amount, setAmount] = useState("");
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({ queryKey: ["subscription-users"], queryFn: () => base44.entities.User.list() });
  const { data: payments = [] } = useQuery({ queryKey: ["subscription-payments"], queryFn: () => base44.entities.Payment.list("-created_date") });

  const managedUsers = useMemo(() => users
    .filter((u) => ["assinante", "personal", "user", "bloqueado"].includes(u.role))
    .filter((u) => roleFilter === "todos" || u.role === roleFilter)
    .filter((u) => `${u.full_name || ""} ${u.email || ""}`.toLowerCase().includes(search.toLowerCase())), [users, roleFilter, search]);

  const lastPaymentByEmail = useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      if (!p.user_email) return;
      if (!map[p.user_email] || (p.payment_date || p.created_date || "") > (map[p.user_email].payment_date || map[p.user_email].created_date || "")) map[p.user_email] = p;
    });
    return map;
  }, [payments]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["subscription-users"] });
    qc.invalidateQueries({ queryKey: ["subscription-payments"] });
  };

  const markPaid = async () => {
    if (!payingUser) return;
    const paidAt = paymentDate || todayIso();
    const nextDue = addMonth(paidAt);
    const finalAmount = Number(amount || payingUser.assinatura_valor || 0);
    await base44.entities.Payment.create({
      user_email: payingUser.email,
      user_name: payingUser.full_name || payingUser.email,
      user_role: payingUser.role === "bloqueado" ? "assinante" : payingUser.role,
      amount: finalAmount,
      payment_date: paidAt,
      due_date: paidAt,
      next_due_date: nextDue,
      status: "pago",
      description: "Assinatura paga manualmente",
      payment_method: "manual"
    });
    await base44.entities.User.update(payingUser.id, {
      role: payingUser.role === "bloqueado" ? "assinante" : payingUser.role,
      assinatura_status: "ativa",
      assinatura_vencimento: nextDue,
      assinatura_valor: finalAmount
    });
    toast.success("Pagamento confirmado e próximo vencimento criado.");
    setPayingUser(null);
    setAmount("");
    refresh();
  };

  const blockUser = async (user) => {
    await base44.entities.User.update(user.id, { role: "bloqueado", assinatura_status: "bloqueada" });
    toast.success("Acesso bloqueado.");
    refresh();
  };

  const unblockUser = async (user) => {
    await base44.entities.User.update(user.id, { role: "assinante", assinatura_status: "ativa" });
    toast.success("Acesso liberado.");
    refresh();
  };

  const createStripeCheckout = async (user) => {
    if (window.self !== window.top) {
      toast.error("Checkout Stripe funciona apenas no app publicado, fora do preview.");
      return;
    }
    const value = Number(user.assinatura_valor || 0);
    if (!value) {
      toast.error("Defina um valor primeiro marcando um pagamento manual ou editando o usuário.");
      return;
    }
    const res = await base44.functions.invoke("createSubscriptionCheckout", {
      amount: value,
      targetEmail: user.email,
      targetName: user.full_name || user.email,
      targetRole: user.role === "personal" ? "personal" : "assinante",
      description: "Assinatura BZ Gym System"
    });
    window.location.href = res.data.url;
  };

  return <div className="space-y-6 max-w-6xl">
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center"><CreditCard className="w-6 h-6 text-emerald-300" /></div>
        <div><h1 className="font-cyber text-2xl text-white">GESTÃO DE ASSINATURAS</h1><p className="text-sm text-emerald-100/60">Assinantes, Personais, vencimentos, bloqueios e pagamentos.</p></div>
      </div>
      <Badge className="bg-purple-500/15 border border-purple-500/30 text-purple-200">Admin</Badge>
    </div>

    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/50" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou email..." className="cyber-input pl-10" /></div>
      <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="cyber-input md:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="assinante">Assinantes</SelectItem><SelectItem value="personal">Personais</SelectItem><SelectItem value="user">Alunos</SelectItem><SelectItem value="bloqueado">Bloqueados</SelectItem></SelectContent></Select>
    </div>

    <div className="rounded-xl border border-purple-500/15 overflow-hidden">
      <div className="hidden md:grid grid-cols-12 bg-purple-500/10 px-4 py-3 text-[10px] font-mono-cyber text-purple-200/60 uppercase tracking-widest"><div className="col-span-3">Usuário</div><div className="col-span-2">Tipo</div><div className="col-span-2">Vencimento</div><div className="col-span-2">Último pagamento</div><div className="col-span-3 text-right">Ações</div></div>
      {isLoading ? <div className="p-10 text-center text-purple-300/50">Carregando...</div> : managedUsers.map((u) => {
        const blocked = u.role === "bloqueado" || u.assinatura_status === "bloqueada" || isOverdue(u);
        const last = lastPaymentByEmail[u.email];
        return <div key={u.id} className="grid md:grid-cols-12 gap-3 items-center px-4 py-4 border-t border-purple-500/10">
          <div className="md:col-span-3"><p className="font-semibold text-white">{u.full_name || "Sem nome"}</p><p className="text-xs text-purple-200/45">{u.email}</p></div>
          <div className="md:col-span-2"><Badge className={blocked ? "bg-red-500/15 border border-red-500/30 text-red-200" : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-200"}>{blocked ? "bloqueado" : u.role}</Badge></div>
          <div className="md:col-span-2 text-sm text-purple-100/70">{u.assinatura_vencimento || "—"}</div>
          <div className="md:col-span-2 text-sm text-purple-100/70">{last ? `${money(last.amount)} em ${last.payment_date || last.created_date?.slice(0,10)}` : "—"}</div>
          <div className="md:col-span-3 flex flex-wrap justify-end gap-2">
            <Button size="sm" onClick={() => { setPayingUser(u); setAmount(u.assinatura_valor || ""); }} className="btn-neon-green"><CheckCircle2 className="w-4 h-4 mr-1" /> Pago</Button>
            <Button size="sm" variant="outline" onClick={() => createStripeCheckout(u)} className="border-purple-500/30 text-purple-100"><ExternalLink className="w-4 h-4 mr-1" /> Stripe</Button>
            {blocked ? <Button size="sm" variant="outline" onClick={() => unblockUser(u)} className="border-emerald-500/30 text-emerald-200"><Unlock className="w-4 h-4" /></Button> : <Button size="sm" variant="outline" onClick={() => blockUser(u)} className="border-red-500/30 text-red-200"><Lock className="w-4 h-4" /></Button>}
          </div>
        </div>;
      })}
    </div>

    <Dialog open={!!payingUser} onOpenChange={(v) => !v && setPayingUser(null)}><DialogContent className="text-white"><DialogHeader><DialogTitle>Confirmar pagamento</DialogTitle></DialogHeader><div className="space-y-3"><p className="text-sm text-purple-100/70">{payingUser?.full_name || payingUser?.email}</p><Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="cyber-input" /><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor da assinatura" className="cyber-input" /><p className="text-xs text-emerald-200/60">O próximo vencimento será no mesmo dia do mês seguinte.</p></div><DialogFooter><Button variant="outline" onClick={() => setPayingUser(null)}>Cancelar</Button><Button onClick={markPaid} className="btn-neon-green">Confirmar</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}