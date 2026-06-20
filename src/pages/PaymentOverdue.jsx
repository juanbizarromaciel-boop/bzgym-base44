import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentOverdue() {
  return <div className="min-h-screen flex items-center justify-center p-5 bg-grid" style={{ backgroundColor: "var(--bg-void)" }}>
    <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-red-500/5 p-8 text-center shadow-2xl">
      <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
        <ShieldAlert className="w-10 h-10 text-red-300" />
      </div>
      <h1 className="font-cyber text-2xl text-white tracking-widest mb-2">PAGAMENTO ATRASADO</h1>
      <p className="text-red-100/75 text-sm leading-relaxed mb-6">Seu acesso está temporariamente bloqueado porque existe uma assinatura vencida. Regularize o pagamento para voltar a usar o BZ Gym System.</p>
      <div className="grid gap-2">
        <Link to="/SubscriberBilling"><Button className="w-full btn-neon-purple"><CreditCard className="w-4 h-4 mr-2" /> Regularizar pagamento</Button></Link>
        <Button variant="outline" className="border-purple-500/30 text-purple-200"><MessageCircle className="w-4 h-4 mr-2" /> Falar com o responsável</Button>
      </div>
    </div>
  </div>;
}