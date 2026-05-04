import React from "react";
import { ShieldOff } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#02020a] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 0 30px rgba(239,68,68,0.1)' }}>
          <ShieldOff className="w-10 h-10 text-red-400" style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' }} />
        </div>

        <h1 className="font-cyber text-3xl text-white tracking-widest mb-3"
          style={{ textShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
          ACESSO NEGADO
        </h1>

        <div className="rounded-xl p-5 border mb-6 text-left space-y-3"
          style={{ background: 'rgba(8,4,22,0.8)', borderColor: 'rgba(168,85,247,0.18)' }}>
          <p className="text-sm text-purple-200/70 leading-relaxed">
            Sua conta ainda não tem permissão para acessar esta área.
          </p>
          <p className="text-sm text-purple-200/70 leading-relaxed">
            Por favor, <span className="text-purple-300 font-semibold">responda o questionário inicial</span> para que seu personal trainer possa ativar seu perfil.
          </p>
          <div className="border-t border-purple-900/30 pt-3">
            <p className="text-[11px] text-purple-500/30 font-mono-cyber tracking-wider">
              // aguarde a aprovação do personal trainer
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.href = "/Onboarding"}
          className="w-full py-3.5 rounded-xl font-cyber text-sm tracking-widest mb-3"
          style={{
            background: 'rgba(168,85,247,0.2)',
            border: '1px solid rgba(168,85,247,0.45)',
            color: '#edd9ff',
            boxShadow: '0 0 20px rgba(168,85,247,0.15)',
          }}>
          RESPONDER QUESTIONÁRIO →
        </button>

        <button
          onClick={() => base44.auth.logout("/")}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'transparent', border: '1px solid rgba(168,85,247,0.1)', color: 'rgba(168,85,247,0.4)' }}>
          Sair da conta
        </button>
      </div>
    </div>
  );
}