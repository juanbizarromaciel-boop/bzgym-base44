import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SubscriberBilling() {
  const [loading, setLoading] = useState(false);
  const { data: user } = useQuery({ queryKey: ["me-billing"], queryFn: () => base44.auth.me() });

  const amount = Number(user?.assinatura_valor || 0);

  const payWithStripe = async () => {
    if (window.self !== window.top) {
      toast.error("O pagamento funciona apenas no app publicado, fora do preview.");
      return;
    }
    if (!amount) {
      toast.error("Nenhum valor de assinatura foi definido. Fale com o administrador.");
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke("createSubscriptionCheckout", {
      amount,
      targetEmail: user.email,
      targetName: user.full_name || user.email,
      targetRole: user.role === "personal" ? "personal" : "assinante",
      description: "Assinatura BZ Gym System"
    });
    window.location.href = res.data.url;
  };

  return <div className="min-h-[70vh] flex items-center justify-center p-4">
    <div className="max-w-md w-full rounded-3xl border border-purple-500/25 bg-purple-500/5 p-7 text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-5">
        <CreditCard className="w-8 h-8 text-purple-200" />
      </div>
      <h1 className="font-cyber text-2xl text-white tracking-widest mb-2">ASSINATURA</h1>
      <p className="text-sm text-purple-100/65 mb-5">Regularize sua assinatura para liberar o acesso ao sistema.</p>
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 mb-5">
        <p className="text-xs text-emerald-200/60">Valor atual</p>
        <p className="font-cyber text-3xl text-emerald-200 mt-1">{amount ? money(amount) : "—"}</p>
        {user?.assinatura_vencimento && <p className="text-xs text-purple-100/45 mt-2">Vencimento: {user.assinatura_vencimento}</p>}
      </div>
      <Button onClick={payWithStripe} disabled={loading || !amount} className="w-full btn-neon-purple">
        <ShieldCheck className="w-4 h-4 mr-2" /> {loading ? "Abrindo pagamento..." : "Pagar com Stripe"}
      </Button>
    </div>
  </div>;
}