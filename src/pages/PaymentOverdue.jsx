import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, CreditCard, Sparkles, Timer, Trophy, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentOverdue() {
  return <div className="min-h-screen flex items-center justify-center p-5 bg-grid" style={{ backgroundColor: "var(--bg-void)" }}>
    <div className="max-w-3xl w-full rounded-3xl border border-pink-500/35 bg-pink-500/5 p-6 md:p-9 text-center shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(236,72,153,0.22), transparent 45%)" }} />
      <div className="relative z-10">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
          <ShieldAlert className="w-10 h-10 text-red-300" />
        </div>
        <p className="text-[10px] font-mono-cyber tracking-[0.35em] text-pink-300 uppercase mb-2">acesso premium pausado</p>
        <h1 className="font-cyber text-3xl md:text-4xl text-white tracking-widest mb-3">VOCÊ ESTÁ DEIXANDO RESULTADO NA MESA</h1>
        <p className="text-red-100/80 text-sm md:text-base leading-relaxed mb-6 max-w-2xl mx-auto">Seu acesso foi bloqueado pelo administrador. Enquanto sua assinatura está pausada, você perde seus treinos com IA, dieta inteligente, evolução de cargas, relatórios e ferramentas que aceleram seu progresso.</p>
        <div className="grid sm:grid-cols-3 gap-3 mb-7 text-left">
          {[{ icon: Sparkles, title: "IA travada", text: "Sem criação e evolução automática de treino e dieta." }, { icon: Trophy, title: "Progresso parado", text: "Sem relatórios, PRs e ajustes guiados por dados." }, { icon: LockKeyhole, title: "Vantagem perdida", text: "Cada dia fora é uma chance a menos de evoluir." }].map((item) => <div key={item.title} className="rounded-2xl border border-purple-500/20 bg-black/25 p-4"><item.icon className="w-5 h-5 text-pink-300 mb-3" /><h3 className="font-bold text-white text-sm">{item.title}</h3><p className="text-xs text-purple-100/55 mt-1">{item.text}</p></div>)}
        </div>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 mb-6 flex items-center justify-center gap-2 text-amber-100 text-sm">
          <Timer className="w-4 h-4" /> Oferta ativa agora: volte hoje e recupere seu acesso completo imediatamente após o pagamento.
        </div>
        <Link to="/SubscriberBilling"><Button className="w-full md:w-auto px-8 py-3 btn-neon-purple"><CreditCard className="w-4 h-4 mr-2" /> Reativar minha assinatura agora</Button></Link>
      </div>
    </div>
  </div>;
}