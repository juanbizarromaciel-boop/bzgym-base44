import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardCheck, Scale, Moon, Zap, Apple, Dumbbell, SmilePlus,
  ChevronRight, CheckCircle2, ArrowLeft, Send
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const SCORES = [1,2,3,4,5];
const SCORE_EMOJIS = { sleep: ["😴","😪","😐","😊","🌟"], energy: ["💤","😩","😐","⚡","🔥"], hunger: ["🍽️","😐","🙂","😋","🤤"], mood: ["😢","😞","😐","😊","😁"], workout: ["❌","😣","😐","💪","🏆"], diet: ["❌","😣","😐","✅","🌟"] };
const SCORE_LABELS = { 1: "Muito ruim", 2: "Ruim", 3: "Regular", 4: "Bom", 5: "Excelente" };

function ScoreSelector({ field, icon: Icon, label, color, value, onChange, emojis }) {
  return (
    <div className="p-4 rounded-xl border" style={{ borderColor: `${color}25`, background: `${color}06` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
        <span className="text-xs font-mono-cyber tracking-wider uppercase" style={{ color: `${color}90` }}>{label}</span>
        {value && <span className="ml-auto text-[10px] font-mono-cyber" style={{ color }}>{SCORE_LABELS[value]}</span>}
      </div>
      <div className="flex gap-2">
        {SCORES.map(s => (
          <button key={s} onClick={() => onChange(s)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all"
            style={{
              background: value === s ? `${color}25` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${value === s ? color : 'rgba(255,255,255,0.08)'}`,
              boxShadow: value === s ? `0 0 12px ${color}40` : 'none',
              transform: value === s ? 'scale(1.05)' : 'scale(1)',
            }}>
            <span className="text-lg leading-none">{emojis[s-1]}</span>
            <span className="text-[9px] font-mono-cyber" style={{ color: value === s ? color : 'rgba(255,255,255,0.3)' }}>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CheckInPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const todayStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: todayStr, weight_kg: "", sleep_score: 0, energy_score: 0,
    hunger_score: 0, mood_score: 0, workout_adherence: 0, diet_adherence: 0, notes: ""
  });

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list(), enabled: !!user });
  const { data: existingCheckIns = [] } = useQuery({ queryKey: ["checkIns"], queryFn: () => base44.entities.CheckIn.list(), enabled: !!user });

  useEffect(() => {
    if (user && students.length > 0) {
      const found = students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase());
      setStudent(found || null);
    }
  }, [user, students]);

  const todayCheckIn = student ? existingCheckIns.find(c => c.student_id === student.id && c.date === todayStr) : null;

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.CheckIn.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkIns"] });
      toast.success("Check-in enviado!");
      setTimeout(() => navigate("/StudentDashboard"), 1200);
    }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CheckIn.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkIns"] });
      toast.success("Check-in atualizado!");
      setTimeout(() => navigate("/StudentDashboard"), 1200);
    }
  });

  const handleSubmit = () => {
    if (!student) { toast.error("Perfil não encontrado"); return; }
    const payload = {
      student_id: student.id,
      personal_id: student.personal_id || "",
      date: form.date,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      sleep_score: form.sleep_score || null,
      energy_score: form.energy_score || null,
      hunger_score: form.hunger_score || null,
      mood_score: form.mood_score || null,
      workout_adherence: form.workout_adherence || null,
      diet_adherence: form.diet_adherence || null,
      notes: form.notes,
      status: "enviado"
    };
    if (todayCheckIn) {
      updateMut.mutate({ id: todayCheckIn.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const completedScores = [form.sleep_score, form.energy_score, form.hunger_score, form.mood_score, form.workout_adherence, form.diet_adherence].filter(Boolean).length;
  const progress = Math.round((completedScores / 6) * 100);

  if (!user || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="max-w-lg mx-auto space-y-5" initial="hidden" animate="show" variants={stagger}>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Link to="/StudentDashboard" className="flex items-center gap-1.5 text-xs font-mono-cyber text-purple-400/60 hover:text-purple-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> VOLTAR
        </Link>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.4), transparent)' }} />
      </motion.div>

      {/* Title card */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(4,12,20,0.99), rgba(4,18,26,0.99))',
          border: '1px solid rgba(6,182,212,0.35)',
          boxShadow: '0 0 40px rgba(6,182,212,0.10)',
        }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), rgba(168,85,247,0.4), transparent)' }} />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', boxShadow: '0 0 20px rgba(6,182,212,0.20)' }}>
            <ClipboardCheck className="w-7 h-7" style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 6px #06b6d4)' }} />
          </div>
          <div>
            <p className="text-[9px] font-mono-cyber uppercase tracking-[0.35em] mb-1" style={{ color: 'rgba(6,182,212,0.65)' }}>// check-in diário</p>
            <h1 className="font-cyber text-xl font-black text-white tracking-wider">
              {todayCheckIn ? "ATUALIZAR CHECK-IN" : "NOVO CHECK-IN"}
            </h1>
            <p className="text-xs mt-1 font-mono-cyber" style={{ color: 'rgba(6,182,212,0.55)' }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-mono-cyber uppercase tracking-widest" style={{ color: 'rgba(6,182,212,0.5)' }}>progresso</span>
            <span className="text-[9px] font-mono-cyber" style={{ color: '#06b6d4' }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #06b6d4, #a855f7)', boxShadow: '0 0 8px rgba(6,182,212,0.5)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }} />
          </div>
        </div>
      </motion.div>

      {/* Peso */}
      <motion.div variants={fadeUp} className="p-4 rounded-xl border" style={{ borderColor: 'rgba(168,85,247,0.20)', background: 'rgba(168,85,247,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-4 h-4" style={{ color: '#a855f7', filter: 'drop-shadow(0 0 4px #a855f7)' }} />
          <span className="text-xs font-mono-cyber tracking-wider uppercase" style={{ color: 'rgba(168,85,247,0.80)' }}>Peso atual (opcional)</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            placeholder="Ex: 82.5"
            value={form.weight_kg}
            onChange={e => setForm(prev => ({ ...prev, weight_kg: e.target.value }))}
            className="cyber-input w-full px-4 py-3 rounded-xl text-white text-base font-mono-cyber"
          />
          <span className="text-sm font-mono-cyber flex-shrink-0" style={{ color: 'rgba(168,85,247,0.60)' }}>kg</span>
        </div>
      </motion.div>

      {/* Scores */}
      <motion.div variants={fadeUp}>
        <ScoreSelector field="sleep" icon={Moon} label="Qualidade do Sono" color="#a855f7" value={form.sleep_score}
          onChange={v => setForm(p => ({ ...p, sleep_score: v }))} emojis={SCORE_EMOJIS.sleep} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <ScoreSelector field="energy" icon={Zap} label="Nível de Energia" color="#06b6d4" value={form.energy_score}
          onChange={v => setForm(p => ({ ...p, energy_score: v }))} emojis={SCORE_EMOJIS.energy} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <ScoreSelector field="hunger" icon={Apple} label="Nível de Fome" color="#10b981" value={form.hunger_score}
          onChange={v => setForm(p => ({ ...p, hunger_score: v }))} emojis={SCORE_EMOJIS.hunger} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <ScoreSelector field="mood" icon={SmilePlus} label="Humor" color="#ec4899" value={form.mood_score}
          onChange={v => setForm(p => ({ ...p, mood_score: v }))} emojis={SCORE_EMOJIS.mood} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <ScoreSelector field="workout" icon={Dumbbell} label="Adesão ao Treino" color="#f59e0b" value={form.workout_adherence}
          onChange={v => setForm(p => ({ ...p, workout_adherence: v }))} emojis={SCORE_EMOJIS.workout} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <ScoreSelector field="diet" icon={Apple} label="Adesão à Dieta" color="#84cc16" value={form.diet_adherence}
          onChange={v => setForm(p => ({ ...p, diet_adherence: v }))} emojis={SCORE_EMOJIS.diet} />
      </motion.div>

      {/* Observações */}
      <motion.div variants={fadeUp} className="p-4 rounded-xl border" style={{ borderColor: 'rgba(168,85,247,0.15)', background: 'rgba(168,85,247,0.03)' }}>
        <p className="text-[10px] font-mono-cyber uppercase tracking-widest mb-2" style={{ color: 'rgba(168,85,247,0.50)' }}>// observações (opcional)</p>
        <Textarea
          placeholder="Como você está se sentindo? Algo importante para o seu personal saber..."
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="cyber-input resize-none text-sm"
          rows={3}
        />
      </motion.div>

      {/* Submit */}
      <motion.div variants={fadeUp} className="pb-6">
        <button onClick={handleSubmit}
          disabled={createMut.isPending || updateMut.isPending}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(168,85,247,0.20))',
            border: '1px solid rgba(6,182,212,0.45)',
            color: '#ffffff',
            boxShadow: '0 0 30px rgba(6,182,212,0.20)',
          }}>
          {createMut.isPending || updateMut.isPending ? (
            <div className="w-5 h-5 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 5px #06b6d4)' }} />
          )}
          <span>{todayCheckIn ? "ATUALIZAR CHECK-IN" : "ENVIAR CHECK-IN"}</span>
        </button>
      </motion.div>

    </motion.div>
  );
}