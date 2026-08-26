import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CheckCircle2, CreditCard, Dumbbell, Flame, ShieldCheck, Sparkles, Trophy, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";

const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const plans = [
  {
    id: "monthly",
    name: "Plano Mensal BZ",
    price: 19.9,
    interval: "month",
    period: "/mês",
    badge: "Comece agora",
    headline: "Acesso total por menos que um lanche",
    description: "Ideal para destravar o app hoje e manter sua evolução ativa mês a mês.",
  },
  {
    id: "yearly",
    name: "Plano Anual BZ Elite",
    price: 214.9,
    interval: "year",
    period: "/ano",
    badge: "Melhor escolha",
    headline: "Economize 10% e elimine a preocupação mensal",
    description: "Para quem decidiu levar treino, dieta e progresso a sério durante o ano inteiro.",
    featured: true,
  },
];

const benefits = [
  "Treinos próprios com criação e edição ilimitada",
  "IA para evoluir treino específico ou plano completo",
  "Dieta personalizada com criação, edição e troca de alimentos",
  "IA de dieta para ajustes de macros, refeições e adesão",
  "Gráficos de volume, pizza por grupos musculares e relatórios",
  "Histórico de progresso para não começar do zero nunca mais",
];

export default function SubscriberBilling() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const { data: user, refetch } = useQuery({ queryKey: ["me-billing"], queryFn: async () => (await base44.functions.invoke("getCurrentUserProfile", {})).data.user });
  const blocked = user?.role === "bloqueado" || user?.assinatura_status === "bloqueada";
  const hasSubscription = user?.role === "assinante" && ["ativa", "cancelamento_agendado", "isenta"].includes(user?.assinatura_status);
  const cancellationScheduled = user?.assinatura_status === "cancelamento_agendado";

  const payWithStripe = async (plan) => {
    if (window.self !== window.top) {
      toast.error("O pagamento funciona apenas no app publicado, fora do preview.");
      return;
    }
    setLoadingPlan(plan.id);
    const res = await base44.functions.invoke("createSubscriptionCheckout", {
      amount: plan.price,
      targetEmail: user.email,
      targetName: user.full_name || user.email,
      targetRole: "assinante",
      description: plan.name,
      billingInterval: plan.interval,
      billingPlan: plan.id
    });
    window.location.href = res.data.url;
  };

  const cancelAtPeriodEnd = async () => {
    if (!window.confirm("Cancelar a renovação? Seu acesso continuará até o fim do período pago.")) return;
    setCancelling(true);
    await base44.functions.invoke("cancelSubscription", {});
    await refetch();
    setCancelling(false);
    toast.success("Cancelamento agendado para o fim do período.");
  };

  return <div className="min-h-screen p-4 md:p-8 bg-grid" style={{ backgroundColor: "var(--bg-void)" }}>
    <div className="max-w-6xl mx-auto space-y-7">
      <section className="rounded-3xl border border-purple-500/30 bg-purple-500/5 p-6 md:p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(168,85,247,0.26), transparent 48%)" }} />
        <div className="relative z-10">
          <Badge className="mb-4 bg-pink-500/15 border border-pink-500/30 text-pink-200">{blocked ? "Oferta de retorno liberada" : "Planos oficiais BZ Gym"}</Badge>
          <h1 className="font-cyber text-3xl md:text-5xl text-white tracking-widest mb-4">ASSINE O BZ GYM SYSTEM</h1>
          <p className="max-w-3xl mx-auto text-purple-100/70 leading-relaxed">Você não está comprando “acesso”. Você está comprando clareza, constância e velocidade: treino, dieta, IA, gráficos e evolução em um só lugar.</p>
          {blocked && <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-100 text-sm"><Flame className="w-4 h-4" /> Volte agora e recupere tudo que ficou travado.</div>}
        </div>
      </section>

      {hasSubscription ? <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-1 h-6 w-6 text-emerald-300" />
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-200/60">Status da assinatura</p>
              <h2 className="mt-1 text-xl font-bold text-white">{cancellationScheduled ? "Cancelamento agendado" : user.assinatura_status === "isenta" ? "Assinatura isenta" : "Assinatura ativa"}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-purple-100/60"><CalendarClock className="h-4 w-4" />{cancellationScheduled ? `Acesso disponível até ${user.assinatura_vencimento || "o fim do período"}` : `Próxima renovação: ${user.assinatura_vencimento || "não informada"}`}</p>
            </div>
          </div>
          {!cancellationScheduled && user.assinatura_status !== "isenta" && <Button variant="outline" onClick={cancelAtPeriodEnd} disabled={cancelling} className="border-red-500/30 text-red-200"><XCircle className="mr-2 h-4 w-4" />{cancelling ? "Cancelando..." : "Cancelar assinatura"}</Button>}
        </div>
      </section> : <div className="grid lg:grid-cols-2 gap-4">
        {plans.map((plan) => <div key={plan.id} className={`rounded-3xl border p-6 relative overflow-hidden ${plan.featured ? "border-emerald-400/45 bg-emerald-500/10" : "border-purple-500/25 bg-purple-500/5"}`}>
          {plan.featured && <div className="absolute top-0 right-0 rounded-bl-2xl bg-emerald-400/20 border-l border-b border-emerald-400/35 px-4 py-2 text-xs text-emerald-100 font-bold">MAIS INTELIGENTE</div>}
          <Badge className={plan.featured ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-100" : "bg-purple-500/15 border border-purple-500/30 text-purple-100"}>{plan.badge}</Badge>
          <h2 className="font-cyber text-2xl text-white mt-4 tracking-widest">{plan.name}</h2>
          <p className="text-sm text-purple-100/60 mt-2">{plan.headline}</p>
          <div className="my-5"><span className="font-cyber text-5xl text-white">{money(plan.price)}</span><span className="text-purple-100/45 ml-2">{plan.period}</span></div>
          <p className="text-sm text-purple-100/60 mb-5">{plan.description}</p>
          <Button onClick={() => payWithStripe(plan)} disabled={!!loadingPlan} className={`w-full ${plan.featured ? "btn-neon-green" : "btn-neon-purple"}`}>
            <ShieldCheck className="w-4 h-4 mr-2" /> {loadingPlan === plan.id ? "Abrindo Stripe..." : blocked ? "Reativar agora" : "Assinar agora"}
          </Button>
        </div>)}
      </div>}

      <section className="rounded-3xl border border-cyan-500/25 bg-cyan-500/5 p-6">
        <div className="flex items-center gap-3 mb-5"><Sparkles className="w-6 h-6 text-cyan-300" /><h2 className="font-cyber text-xl text-white tracking-widest">O QUE VOCÊ GANHA ASSINANDO</h2></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {benefits.map((benefit) => <div key={benefit} className="rounded-2xl border border-purple-500/20 bg-black/25 p-4 flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" /><p className="text-sm text-purple-100/75">{benefit}</p></div>)}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        {[{ icon: Dumbbell, title: "Treino que evolui", text: "Pare de repetir o mesmo treino sem saber se está funcionando." }, { icon: Zap, title: "IA no seu ritmo", text: "Use dados do seu histórico para sugerir ajustes mais inteligentes." }, { icon: Trophy, title: "Progresso visível", text: "Volume, cargas e relatórios para enxergar sua evolução." }].map((item) => <div key={item.title} className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-5"><item.icon className="w-6 h-6 text-pink-300 mb-3" /><h3 className="font-bold text-white">{item.title}</h3><p className="text-sm text-purple-100/55 mt-2">{item.text}</p></div>)}
      </section>
    </div>
  </div>;
}