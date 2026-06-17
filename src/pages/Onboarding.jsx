import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Zap, TrendingUp, Heart, Dumbbell, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";

const GOALS = [
  { id: "hipertrofia", label: "Hipertrofia", icon: Dumbbell, description: "Ganhar massa muscular" },
  { id: "emagrecimento", label: "Emagrecimento", icon: TrendingUp, description: "Perder gordura" },
  { id: "resistencia", label: "Resistência", icon: Zap, description: "Melhorar condicionamento" },
  { id: "forca", label: "Força", icon: Target, description: "Aumentar força máxima" },
  { id: "saude", label: "Saúde", icon: Heart, description: "Qualidade de vida" },
];

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  // Read invite code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (code) setInviteCode(code.toUpperCase());
  }, []);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.Student.list().then(students => {
        const found = students.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
        if (found && found.goal) {
          if (found.active) { navigate("/StudentDashboard"); }
          else { navigate("/Welcome"); }
        } else {
          setStudent(found);
        }
      });
    }).catch(() => {});
  }, [navigate]);

  const handleSubmit = async () => {
    if (!selectedGoal && !customGoal) {
      toast.error("Selecione ou escreva seu objetivo");
      return;
    }

    if (!phone.trim()) {
      toast.error("Preencha seu telefone");
      return;
    }

    setLoading(true);
    try {
      const goalValue = customGoal.trim() || selectedGoal;

      // Check invite code and find personal
      let personalId = "";
      if (inviteCode.trim()) {
        const allCodes = await base44.entities.InviteCode.list();
        const found = allCodes.find(c => c.code === inviteCode.trim().toUpperCase() && c.status === "ativo");
        if (found) {
          personalId = found.personal_id;
          // Mark code as used
          await base44.entities.InviteCode.update(found.id, {
            status: "usado",
            used_by_email: user.email,
            used_at: new Date().toISOString(),
          });
        }
      }

      const notesValue = [notes.trim(), restrictions.trim() ? `Restrições: ${restrictions.trim()}` : ""].filter(Boolean).join(" | ");

      if (student) {
        await base44.entities.Student.update(student.id, {
          goal: goalValue,
          phone: phone.trim(),
          notes: notesValue || student.notes,
          ...(personalId ? { personal_id: personalId } : {}),
        });
      } else {
        await base44.entities.Student.create({
          name: user.full_name || user.email,
          email: user.email,
          phone: phone.trim(),
          goal: goalValue,
          notes: notesValue,
          active: false,
          ...(personalId ? { personal_id: personalId } : {}),
        });
      }

      setSubmitted(true);
    } catch (error) {
      toast.error("Erro ao salvar");
      setLoading(false);
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center"
            style={{boxShadow: '0 0 40px rgba(168,85,247,0.3), 0 0 80px rgba(168,85,247,0.1)'}}>
            <CheckCircle2 className="w-12 h-12 text-purple-400" style={{filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.8))'}} />
          </div>
        </div>

        <h1 className="font-cyber text-3xl md:text-4xl text-white tracking-widest mb-4"
          style={{textShadow: '0 0 25px rgba(168,85,247,0.6)'}}>
          CADASTRO ENVIADO
        </h1>

        <div className="cyber-card rounded-2xl p-6 border border-purple-900/30 mb-6 text-left space-y-4">
          <p className="text-purple-200/80 text-sm leading-relaxed">
            Suas informações foram enviadas ao seu <span className="text-purple-300 font-semibold">personal trainer</span>.
          </p>
          <p className="text-purple-200/80 text-sm leading-relaxed">
            Assim que ele revisar seu perfil, você receberá uma mensagem de boas-vindas com o acesso completo à plataforma.
          </p>
          <div className="border-t border-purple-900/30 pt-4">
            <p className="text-[11px] text-purple-500/40 font-mono-cyber tracking-wider">
              // aguarde o contato do seu professor
            </p>
          </div>
        </div>

        <img
          src="https://media.base44.com/images/public/69b152b7ec586487b4d800db/31da85a7a_IMG_1517.png"
          alt="BZ"
          className="w-12 h-12 rounded-xl object-cover mx-auto opacity-40"
        />
        <p className="text-purple-500/30 font-mono-cyber text-xs mt-3 tracking-widest">BZ GYM</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="https://media.base44.com/images/public/69b152b7ec586487b4d800db/31da85a7a_IMG_1517.png"
              alt="BZ"
              className="w-16 h-16 rounded-xl object-cover"
              style={{boxShadow: '0 0 25px rgba(168,85,247,0.5), 0 0 50px rgba(168,85,247,0.2)'}}
            />
          </div>
          <h1
            className="font-cyber text-4xl md:text-5xl text-white tracking-widest mb-3"
            style={{textShadow: '0 0 30px rgba(168,85,247,0.6)'}}
          >
            BEM-VINDO
          </h1>
          <p className="text-purple-400/60 font-mono-cyber text-sm">// configure seu perfil para começar</p>
        </div>

        {/* Goals */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-purple-400" />
            <h2 className="font-cyber text-lg text-white tracking-wider">QUAL SEU OBJETIVO?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {GOALS.map(goal => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  onClick={() => { setSelectedGoal(goal.id); setCustomGoal(""); }}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "border-purple-500/60 bg-purple-500/10"
                      : "border-purple-900/30 bg-black/20 hover:border-purple-500/30"
                  }`}
                  style={isSelected ? {boxShadow: '0 0 20px rgba(168,85,247,0.2)'} : {}}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                      isSelected ? "bg-purple-500/20 border-purple-500/40" : "bg-purple-900/20 border-purple-900/40"
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? "text-purple-300" : "text-purple-600"}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${isSelected ? "text-white" : "text-white/60"}`}>
                        {goal.label}
                      </p>
                      <p className="text-xs text-purple-500/40 font-mono-cyber">{goal.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <label className="text-xs text-purple-400/50 font-mono-cyber tracking-wider uppercase">
              Ou escreva seu próprio objetivo
            </label>
            <input
              placeholder="Ex: Preparação para maratona, reabilitação..."
              value={customGoal}
              onChange={(e) => { setCustomGoal(e.target.value); setSelectedGoal(""); }}
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: '#1a1030', border: '1px solid rgba(168,85,247,0.4)', color: '#ffffff', caretColor: '#c084fc' }}
            />
          </div>
        </div>

        {/* Training Level */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-6">
          <label className="text-xs text-purple-400/50 font-mono-cyber tracking-wider uppercase mb-3 block">
            Nível de treino
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "iniciante", label: "Iniciante", desc: "Menos de 1 ano" },
              { id: "intermediario", label: "Intermediário", desc: "1-3 anos" },
              { id: "avancado", label: "Avançado", desc: "3+ anos" },
            ].map(lvl => (
              <button key={lvl.id} onClick={() => setTrainingLevel(lvl.id)}
                className="p-3 rounded-xl border text-center transition-all"
                style={trainingLevel === lvl.id ? {
                  background: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.5)',
                  boxShadow: '0 0 15px rgba(168,85,247,0.2)'
                } : { background: '#1a1030', borderColor: 'rgba(168,85,247,0.2)' }}>
                <p className={`text-sm font-semibold ${trainingLevel === lvl.id ? 'text-white' : 'text-white/50'}`}>{lvl.label}</p>
                <p className="text-[9px] font-mono-cyber text-purple-500/40 mt-0.5">{lvl.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Restrictions */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-amber-400" />
            <label className="text-xs text-amber-400/70 font-mono-cyber tracking-wider uppercase">
              Lesões ou restrições (opcional)
            </label>
          </div>
          <textarea
            placeholder="Ex: Tendinite no ombro direito, joelho operado, sem restrições..."
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
            rows={2}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none resize-none"
            style={{ background: '#1a1030', border: '1px solid rgba(245,158,11,0.3)', color: '#ffffff', caretColor: '#fbbf24' }}
          />
          <p className="text-[9px] text-amber-500/30 font-mono-cyber mt-2">// informe lesões para que seu personal possa adaptar os treinos</p>
        </div>

        {/* Phone - Required */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-6">
          <label className="text-xs text-purple-400/50 font-mono-cyber tracking-wider uppercase mb-3 block">
            Telefone (WhatsApp) *
          </label>
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-lg px-4 py-3 text-sm outline-none"
            style={{ background: '#1a1030', border: '1px solid rgba(168,85,247,0.4)', color: '#ffffff', caretColor: '#c084fc' }}
          />
          <p className="text-[10px] text-purple-500/30 font-mono-cyber mt-2">
            // seu personal trainer entrará em contato
          </p>
        </div>

        {/* Invite code */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-6">
          <label className="text-xs text-purple-400/50 font-mono-cyber tracking-wider uppercase mb-3 block">
            Código de convite (opcional)
          </label>
          <input
            placeholder="Ex: AB3XK7PQ"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none font-cyber tracking-[0.3em]"
            style={{ background: '#1a1030', border: '1px solid rgba(6,182,212,0.35)', color: '#22d3ee', caretColor: '#06b6d4' }}
          />
          <p className="text-[10px] text-cyan-500/40 font-mono-cyber mt-2">
            // se o seu personal enviou um código, insira aqui para ser vinculado automaticamente
          </p>
        </div>

        {/* Notes */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-6">
          <label className="text-xs text-purple-400/50 font-mono-cyber tracking-wider uppercase mb-3 block">
            Informações adicionais (opcional)
          </label>
          <textarea
            placeholder="Ex: Lesões, restrições médicas, experiência com treino..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none resize-none"
            style={{ background: '#1a1030', border: '1px solid rgba(168,85,247,0.4)', color: '#ffffff', caretColor: '#c084fc' }}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={loading || (!selectedGoal && !customGoal) || !phone.trim()}
          className="w-full btn-neon-purple py-6 rounded-xl font-cyber text-base tracking-widest"
        >
          {loading ? "ENVIANDO..." : "ENVIAR CADASTRO →"}
        </Button>

        <p className="text-center text-purple-500/30 text-xs font-mono-cyber mt-4">
          * campos obrigatórios
        </p>
      </div>
    </div>
  );
}