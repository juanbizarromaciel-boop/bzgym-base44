import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Zap, TrendingUp, Heart, Dumbbell } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.Student.list().then(students => {
        const found = students.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
        setStudent(found);
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
      
      if (student) {
        await base44.entities.Student.update(student.id, {
          goal: goalValue,
          phone: phone.trim(),
          notes: notes.trim() || student.notes
        });
      } else {
        await base44.entities.Student.create({
          name: user.full_name || user.email,
          email: user.email,
          phone: phone.trim(),
          goal: goalValue,
          notes: notes.trim(),
          active: false
        });
      }

      toast.success("Cadastro enviado!");
      setTimeout(() => navigate("/Welcome"), 600);
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
            <Input
              placeholder="Ex: Preparação para maratona, reabilitação..."
              value={customGoal}
              onChange={(e) => { setCustomGoal(e.target.value); setSelectedGoal(""); }}
              className="cyber-input"
            />
          </div>
        </div>

        {/* Phone - Required */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-6">
          <label className="text-xs text-purple-400/50 font-mono-cyber tracking-wider uppercase mb-3 block">
            Telefone (WhatsApp) *
          </label>
          <Input
            type="tel"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="cyber-input"
            required
          />
          <p className="text-[10px] text-purple-500/30 font-mono-cyber mt-2">
            // seu personal trainer entrará em contato
          </p>
        </div>

        {/* Notes */}
        <div className="cyber-card rounded-2xl p-6 md:p-8 border border-purple-900/30 mb-6">
          <label className="text-xs text-purple-400/50 font-mono-cyber tracking-wider uppercase mb-3 block">
            Informações adicionais (opcional)
          </label>
          <Textarea
            placeholder="Ex: Lesões, restrições médicas, experiência com treino..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="cyber-input min-h-[100px]"
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