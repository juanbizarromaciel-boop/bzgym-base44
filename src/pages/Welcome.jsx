import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, MessageCircle, Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Success Icon */}
        <div
          className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent)',
            border: '2px solid rgba(6,182,212,0.4)',
            boxShadow: '0 0 60px rgba(6,182,212,0.3)'
          }}
        >
          <CheckCircle className="w-12 h-12 text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.8))' }} />
        </div>

        {/* Main message */}
        <h1
          className="font-cyber text-4xl md:text-5xl text-white tracking-widest mb-4"
          style={{ textShadow: '0 0 30px rgba(168,85,247,0.6)' }}
        >
          CADASTRO<br />RECEBIDO!
        </h1>

        <p className="text-purple-400/60 font-mono-cyber text-sm md:text-base mb-12 max-w-md mx-auto leading-relaxed">
          Olá, {user?.full_name?.split(" ")[0] || "atleta"}! Seu cadastro foi enviado com sucesso.
          <br /><br />
          Nosso personal trainer já foi notificado e entrará em contato em breve para montar seu treino personalizado.
        </p>

        {/* Steps */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-8 text-left max-w-lg mx-auto">
          <p className="text-xs text-purple-400/50 font-mono-cyber tracking-wider uppercase mb-4 text-center">
            Próximos passos
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-cyber text-cyan-400">1</span>
              </div>
              <div>
                <p className="text-sm text-white font-medium mb-1">Aguarde o contato</p>
                <p className="text-xs text-purple-400/50 leading-relaxed">
                  O personal trainer irá analisar seu perfil e objetivos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-cyber text-purple-400">2</span>
              </div>
              <div>
                <p className="text-sm text-white font-medium mb-1">Treino personalizado</p>
                <p className="text-xs text-purple-400/50 leading-relaxed">
                  Receberá um plano de treino adaptado às suas necessidades
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-cyber text-pink-400">3</span>
              </div>
              <div>
                <p className="text-sm text-white font-medium mb-1">Inicie sua jornada</p>
                <p className="text-xs text-purple-400/50 leading-relaxed">
                  Acesse seus treinos e acompanhe sua evolução
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate("/Chat")}
            className="btn-neon-cyan px-8 py-3 rounded-xl font-medium tracking-wider"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ir para o Chat
          </Button>
        </div>

        <p className="text-purple-500/30 text-xs font-mono-cyber mt-8">
          // você pode acessar o chat a qualquer momento pelo menu lateral
        </p>
      </div>
    </div>
  );
}