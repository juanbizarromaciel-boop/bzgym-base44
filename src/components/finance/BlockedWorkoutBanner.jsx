import React from "react";
import { ShieldAlert, Heart, Phone } from "lucide-react";

export default function BlockedWorkoutBanner({ studentName, personalName }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-sm w-full rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, rgba(10,4,24,0.98), rgba(6,2,16,0.98))', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 0 60px rgba(239,68,68,0.15), 0 0 120px rgba(239,68,68,0.05)' }}>

        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)' }} />

        {/* Soft orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.8), transparent 70%)', top: '-60px' }} />

        <div className="p-8 text-center relative z-10">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', boxShadow: '0 0 30px rgba(239,68,68,0.2)' }}>
            <ShieldAlert className="w-9 h-9 text-red-400" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.8))' }} />
          </div>

          {/* Title */}
          <h2 className="font-cyber text-xl text-white mb-1 tracking-wide"
            style={{ textShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
            ACESSO BLOQUEADO
          </h2>
          <p className="text-xs font-mono-cyber mb-5" style={{ color: 'rgba(239,68,68,0.6)', letterSpacing: '0.2em' }}>
            PAGAMENTO PENDENTE
          </p>

          {/* Message */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,220,220,0.85)' }}>
              Olá{studentName ? `, <strong>${studentName}</strong>` : ""}! 😊
            </p>
            <p className="text-sm leading-relaxed mt-2" style={{ color: 'rgba(255,200,200,0.75)' }}>
              Identificamos uma <span style={{ color: '#fca5a5' }}>mensalidade em aberto</span>. Para continuar acessando seus treinos, entre em contato com seu personal e regularize o pagamento. 💪
            </p>
          </div>

          {/* Contact hint */}
          <div className="flex items-center justify-center gap-2 rounded-xl p-3"
            style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <Phone className="w-3.5 h-3.5 text-purple-400" />
            <p className="text-xs" style={{ color: 'rgba(196,181,224,0.7)' }}>
              {personalName ? `Entre em contato com ${personalName}` : "Entre em contato com seu personal"}
            </p>
          </div>

          {/* Footer heart */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <Heart className="w-3 h-3 text-red-400/50" />
            <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.3)', letterSpacing: '0.2em' }}>BZ GYM SYSTEM</p>
            <Heart className="w-3 h-3 text-red-400/50" />
          </div>
        </div>
      </div>
    </div>
  );
}