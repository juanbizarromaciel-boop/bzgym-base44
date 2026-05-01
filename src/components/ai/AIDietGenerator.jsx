import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, ClipboardList, CheckCircle2, Save,
  X, AlertTriangle, Users, ChevronDown, ChevronUp, Utensils
} from "lucide-react";
import { toast } from "sonner";

const QUICK_PROMPTS = [
  "Monte uma dieta de cutting com 2200 kcal e 150g de proteína",
  "Monte uma dieta de bulking com 3000 kcal, alta em carboidratos",
  "Dieta de manutenção com 4 refeições, 2500 kcal, para aluno de 75kg",
  "Dieta simples e econômica para emagrecer com 1800 kcal",
  "Dieta com 5 refeições, sem lactose, 2400 kcal",
  "Monte uma dieta de bulking para ganho de massa sem glúten",
];

function MealCard({ meal, idx }) {
  const [open, setOpen] = useState(idx === 0);
  const foods = meal.foods || [];
  const totalKcal = foods.reduce((s, f) => s + (parseFloat(f.calories) || 0), 0);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5"
        style={{ background: open ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.03)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <span className="text-xs font-cyber text-emerald-300">{idx + 1}</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-white text-sm">{meal.name}</p>
            <p className="text-[11px] font-mono-cyber" style={{ color: 'rgba(110,231,183,0.5)' }}>
              {meal.time && `${meal.time} · `}{foods.length} alimentos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-xs" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
            ~{Math.round(meal.totalCalories || totalKcal)} kcal
          </Badge>
          {open ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-emerald-400/50" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-3 space-y-2" style={{ background: 'rgba(4,2,14,0.9)' }}>
          {foods.map((food, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(16,185,129,0.08)' }}>
              <div>
                <p className="text-sm text-white">{food.name || food.foodName}</p>
                <p className="text-[11px] font-mono-cyber" style={{ color: 'rgba(110,231,183,0.5)' }}>
                  {food.quantity}{food.unit}
                </p>
              </div>
              <div className="flex gap-3 text-[11px] font-mono-cyber" style={{ color: 'rgba(110,231,183,0.6)' }}>
                {food.calories && <span>{Math.round(food.calories)} kcal</span>}
                {food.protein && <span>{Math.round(food.protein)}g prot</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIDietGenerator({ settings }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [diet, setDiet] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [applying, setApplying] = useState(false);

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => base44.entities.Student.list() });
  const { data: foods = [] } = useQuery({ queryKey: ['foods'], queryFn: () => base44.entities.Food.list() });

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Digite um comando."); return; }
    setLoading(true);
    setDiet(null);
    try {
      const foodNames = foods.slice(0, 40).map(f => f.name).join(', ');
      const res = await base44.functions.invoke('aiCoach', {
        type: 'diet',
        prompt: `Monte um plano alimentar para: ${prompt}.
${foodNames ? `Alimentos disponíveis no banco: ${foodNames}. Use-os prioritariamente.` : ''}
Retorne JSON com: dietName, goal, totalCalories, totalProtein, totalCarbs, totalFat, totalFiber, meals (array com: name, time, totalCalories, totalProtein, totalCarbs, totalFat, foods (array com: name, quantity (número), unit (g/ml/unidade/colher/scoop), calories, protein, carbs, fat)).`
      });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      const d = res?.data?.data;
      if (!d?.meals?.length) { toast.error("A IA não gerou um plano válido. Tente um prompt mais detalhado."); return; }
      setDiet(d);
    } catch (e) {
      toast.error("Erro ao conectar: " + e.message);
    }
    setLoading(false);
  };

  const handleApply = async () => {
    if (!selectedStudent) { toast.error("Selecione um aluno."); return; }
    setApplying(true);
    try {
      const meals = (diet.meals || []).map(m => ({
        name: m.name,
        time: m.time || '',
        calories: m.totalCalories || 0,
        foods: (m.foods || []).map(f => `${f.name}: ${f.quantity}${f.unit}`).join(', ')
      }));
      await base44.entities.DietPlan.create({
        student_id: selectedStudent,
        name: diet.dietName || diet.diet_name || 'Dieta gerada por IA',
        goal: diet.goal?.toLowerCase().includes('bulking') ? 'bulking' : diet.goal?.toLowerCase().includes('cutting') || diet.goal?.toLowerCase().includes('perda') ? 'cutting' : 'manutencao',
        total_calories: diet.totalCalories || 0,
        protein_g: diet.totalProtein || 0,
        carbs_g: diet.totalCarbs || 0,
        fat_g: diet.totalFat || 0,
        meals,
        active: true,
        notes: `Gerado por BZ AI Coach. Objetivo: ${diet.goal || ''}. Revise antes de enviar ao aluno.`
      });
      toast.success("Dieta aplicada com sucesso! Acesse Dietas para revisar e enviar ao aluno.");
      setDiet(null);
      setPrompt("");
    } catch (e) {
      toast.error("Erro ao aplicar dieta: " + e.message);
    }
    setApplying(false);
  };

  const totals = [
    { label: 'Calorias', val: `${diet?.totalCalories || 0}`, unit: 'kcal', color: '#f59e0b' },
    { label: 'Proteína', val: `${diet?.totalProtein || 0}`, unit: 'g', color: '#ef4444' },
    { label: 'Carbos', val: `${diet?.totalCarbs || 0}`, unit: 'g', color: '#06b6d4' },
    { label: 'Gordura', val: `${diet?.totalFat || 0}`, unit: 'g', color: '#a855f7' },
    { label: 'Fibras', val: `${diet?.totalFiber || 0}`, unit: 'g', color: '#10b981' },
  ];

  return (
    <div className="space-y-5">
      {/* Prompt */}
      <div className="rounded-2xl p-5 border relative overflow-hidden backdrop-blur-sm"
        style={{ background: 'rgba(10,6,28,0.85)', borderColor: 'rgba(16,185,129,0.2)', boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(16,185,129,0.07)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)' }} />

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-emerald-200">Montar Dieta com IA</h2>
            <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(110,231,183,0.4)' }}>
              {foods.length > 0 ? `${foods.length} alimento(s) no banco · usa-os prioritariamente` : 'Descreva o plano alimentar desejado'}
            </p>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
          placeholder="Ex: Monte uma dieta de cutting com 2400 kcal, 150g de proteína, usando alimentos cadastrados, 5 refeições por dia."
          rows={4}
          className="w-full resize-none rounded-xl p-3.5 text-sm transition-all outline-none"
          style={{
            background: 'rgba(4,2,14,0.7)',
            border: '1px solid rgba(16,185,129,0.15)',
            color: '#f0e6ff',
            fontFamily: 'Inter, sans-serif',
            caretColor: '#10b981',
          }}
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.35)' }}>Ctrl+Enter para gerar</p>
          <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', boxShadow: loading ? 'none' : '0 0 14px rgba(16,185,129,0.1)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar dieta
          </button>
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
          <p className="text-[10px] font-mono-cyber mb-2.5" style={{ color: 'rgba(16,185,129,0.35)' }}>SUGESTÕES RÁPIDAS</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((q, i) => (
              <button key={i} onClick={() => setPrompt(q)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105"
                style={{ borderColor: 'rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.04)', color: 'rgba(110,231,183,0.65)' }}>
                {q.length > 40 ? q.slice(0, 40) + '...' : q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: '2px solid rgba(16,185,129,0.4)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
          <p className="text-xs font-mono-cyber" style={{ color: 'rgba(16,185,129,0.6)' }}>Montando plano alimentar...</p>
        </div>
      )}

      {diet && (
        <div>
          {/* Summary */}
          <div className="rounded-xl p-5 border mb-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))', borderColor: 'rgba(16,185,129,0.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold" style={{ color: '#f0e6ff' }}>Dieta gerada — revise e aplique</p>
            </div>
            <h3 className="font-cyber text-xl text-white tracking-wider mb-3">{diet.dietName || diet.diet_name}</h3>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {totals.map((t, i) => (
                <div key={i} className="text-center p-3 rounded-xl" style={{ background: `${t.color}10`, border: `1px solid ${t.color}25` }}>
                  <p className="font-cyber text-lg font-bold" style={{ color: t.color }}>{t.val}</p>
                  <p className="text-[9px] font-mono-cyber mt-0.5" style={{ color: `${t.color}70` }}>{t.unit}</p>
                  <p className="text-[9px] font-mono-cyber" style={{ color: 'rgba(196,181,224,0.5)' }}>{t.label}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: 'rgba(253,224,71,0.8)' }}>
                Dietas clínicas exigem nutricionista habilitado. Esta ferramenta é auxiliar de planejamento. Revise sempre antes de enviar ao aluno.
              </p>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-3 mb-5">
            {(diet.meals || []).map((meal, i) => <MealCard key={i} meal={meal} idx={i} />)}
          </div>

          {/* Apply */}
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(16,185,129,0.25)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-200 tracking-wider">APLICAR AO ALUNO</h3>
            </div>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="cyber-input w-full rounded-lg p-2.5 text-sm mb-4"
              style={{ background: 'rgba(5,3,15,0.85)', border: '1px solid rgba(16,185,129,0.35)', color: '#edd9ff' }}>
              <option value="">Selecionar aluno...</option>
              {students.filter(s => s.active !== false).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => { setDiet(null); setPrompt(""); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(196,181,224,0.7)' }}>
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={handleApply} disabled={applying || !selectedStudent}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', boxShadow: '0 0 15px rgba(16,185,129,0.1)' }}>
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Aplicar ao plano alimentar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}