import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Send, Bot, User, RotateCcw } from "lucide-react";
import { toast } from "sonner";

/**
 * AIRefinementChat
 * Props:
 *  - type: "workout" | "diet"
 *  - plan: the current generated plan object
 *  - onPlanChange: (updatedPlan) => void — called when IA returns a modified plan
 */
export default function AIRefinementChat({ type, plan, onPlanChange }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: type === "workout"
        ? "Olá! Analisei o treino gerado. Pode me pedir alterações — trocar exercícios, mudar séries/reps, adicionar técnicas, ajustar dias, etc."
        : "Olá! Analisei a dieta gerada. Pode me pedir alterações — trocar alimentos, ajustar macros, mudar refeições, alterar calorias, etc."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await base44.functions.invoke("aiCoach", {
        type: type === "workout" ? "workout_refine" : "diet_refine",
        prompt: userMsg,
        context: JSON.stringify(plan),
        history: JSON.stringify(
          messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        )
      });

      const d = res?.data?.data;
      const updatedPlan = d?.plan || d?.response?.plan || null;
      const reply = d?.message || d?.response?.message || "";

      if (updatedPlan) {
        onPlanChange(updatedPlan);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: reply || "Feito! Apliquei as alterações ao " + (type === "workout" ? "treino" : "à dieta") + ". Revise acima."
        }]);
      } else if (reply) {
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Não consegui processar. Tente reformular o pedido." }]);
      }
    } catch (e) {
      toast.error("Erro: " + e.message);
      setMessages(prev => [...prev, { role: "assistant", content: "Erro ao processar. Tente novamente." }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QUICK_EDITS = type === "workout" ? [
    "Troque os exercícios de peito por variações com halteres",
    "Adicione drop set no último exercício de cada dia",
    "Reduza o volume total em 20%, está muito excessivo",
    "Adicione um dia de cardio/mobilidade",
    "Mude o descanso de todos os exercícios para 90 segundos",
  ] : [
    "Retire todos os laticínios da dieta",
    "Adicione mais 50g de proteína dividida nas refeições",
    "Reduza os carboidratos em 30g e compense com gordura",
    "Troque o café da manhã por algo mais prático",
    "Adicione um lanche pré-treino com 40g de carbo",
  ];

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{
        background: 'rgba(6,4,18,0.95)',
        borderColor: 'rgba(168,85,247,0.2)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)'
      }}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(168,85,247,0.15)', background: 'rgba(168,85,247,0.06)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.35)' }}>
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
        </div>
        <div>
          <p className="text-xs font-semibold text-purple-200">
            Refinamento com IA — {type === "workout" ? "Treino" : "Dieta"}
          </p>
          <p className="text-[9px] font-mono-cyber text-purple-500/50">
            Peça alterações e a IA modifica o plano em tempo real
          </p>
        </div>
        <button
          onClick={() => setMessages([{
            role: "assistant",
            content: type === "workout"
              ? "Chat reiniciado. Pode me pedir alterações no treino."
              : "Chat reiniciado. Pode me pedir alterações na dieta."
          }])}
          className="ml-auto p-1.5 rounded-lg text-purple-500/40 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
          title="Reiniciar chat"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: msg.role === "user" ? 'rgba(168,85,247,0.25)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${msg.role === "user" ? 'rgba(168,85,247,0.4)' : 'rgba(16,185,129,0.3)'}`
              }}>
              {msg.role === "user"
                ? <User className="w-3 h-3 text-purple-300" />
                : <Bot className="w-3 h-3 text-emerald-400" />
              }
            </div>
            <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
              style={{
                background: msg.role === "user" ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === "user" ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)'}`,
                color: msg.role === "user" ? '#e9d5ff' : 'rgba(210,190,240,0.8)'
              }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Bot className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
              <span className="text-[10px] font-mono-cyber text-purple-500/60">processando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick edits */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_EDITS.map((q, i) => (
            <button key={i} onClick={() => setInput(q)}
              className="text-[10px] font-mono-cyber px-2.5 py-1 rounded-lg transition-all hover:scale-105"
              style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.16)', color: 'rgba(192,132,252,0.65)' }}>
              {q.slice(0, 38)}{q.length > 38 ? '…' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={type === "workout"
              ? "Ex: Troque o supino por variações com halteres..."
              : "Ex: Retire o leite e substitua por bebida vegetal..."}
            rows={2}
            className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'rgba(2,1,8,0.98)',
              border: '1px solid rgba(168,85,247,0.3)',
              color: '#f5e8ff',
              caretColor: '#a855f7',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}>
            <Send className="w-4 h-4 text-purple-300" />
          </button>
        </div>
        <p className="text-[9px] font-mono-cyber mt-1.5 text-purple-600/40">Enter para enviar · Shift+Enter para nova linha</p>
      </div>
    </div>
  );
}