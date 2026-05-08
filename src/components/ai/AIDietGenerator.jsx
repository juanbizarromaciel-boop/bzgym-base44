import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, Loader2, ClipboardList, Pencil
} from "lucide-react";
import { toast } from "sonner";
import DietEditor from "./DietEditor";

const QUICK_PROMPTS = [
  "Monte uma dieta de cutting com 2200 kcal e 150g de proteína",
  "Monte uma dieta de bulking com 3000 kcal, alta em carboidratos",
  "Dieta de manutenção com 4 refeições, 2500 kcal, para aluno de 75kg",
  "Dieta simples e econômica para emagrecer com 1800 kcal",
  "Dieta com 5 refeições, sem lactose, 2400 kcal",
  "Monte uma dieta de bulking para ganho de massa sem glúten",
];

export default function AIDietGenerator({ settings }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [diet, setDiet] = useState(null); // editable diet object
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
      toast.success("Dieta gerada! Edite antes de aplicar.");
    } catch (e) {
      toast.error("Erro ao conectar: " + e.message);
    }
    setLoading(false);
  };

  const handleApply = async (selectedStudent, grandTotals) => {
    if (!selectedStudent) { toast.error("Selecione um aluno."); return; }
    setApplying(true);
    try {
      const meals = (diet.meals || []).map(m => ({
        name: m.name,
        time: m.time || '',
        calories: m.foods ? m.foods.reduce((s, f) => s + (parseFloat(f.calories) || 0), 0) : (m.totalCalories || 0),
        foods: (m.foods || []).map(f => `${f.name}: ${f.quantity}${f.unit}`).join(', ')
      }));

      const goal = diet.goal?.toLowerCase().includes('bulking') ? 'bulking'
        : diet.goal?.toLowerCase().includes('cutting') || diet.goal?.toLowerCase().includes('perda') ? 'cutting'
        : 'manutencao';

      await base44.entities.DietPlan.create({
        student_id: selectedStudent,
        name: diet.dietName || diet.diet_name || 'Dieta gerada por IA',
        goal,
        total_calories: Math.round(grandTotals.calories),
        protein_g: Math.round(grandTotals.protein),
        carbs_g: Math.round(grandTotals.carbs),
        fat_g: Math.round(grandTotals.fat),
        meals,
        active: true,
        notes: `Gerado por BZ AI Coach. Objetivo: ${diet.goal || ''}. Editado e revisado antes do envio.`
      });
      toast.success("Dieta aplicada com sucesso! Acesse Dietas para visualizar.");
      setDiet(null);
      setPrompt("");
    } catch (e) {
      toast.error("Erro ao aplicar dieta: " + e.message);
    }
    setApplying(false);
  };

  return (
    <div className="space-y-5">
      {/* Prompt card */}
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
            background: 'rgba(2,1,8,0.98)',
            border: '1px solid rgba(16,185,129,0.35)',
            color: '#f5e8ff',
            fontFamily: 'Inter, sans-serif',
            caretColor: '#10b981',
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6)',
          }}
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.35)' }}>Ctrl+Enter para gerar</p>
          <div className="flex gap-2">
            {diet && (
              <button onClick={() => setDiet(null)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(196,181,224,0.7)' }}>
                <Pencil className="w-3.5 h-3.5" /> Nova dieta
              </button>
            )}
            <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', boxShadow: loading ? 'none' : '0 0 14px rgba(16,185,129,0.1)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {diet ? 'Regerar' : 'Gerar dieta'}
            </button>
          </div>
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

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: '2px solid rgba(16,185,129,0.4)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
          <p className="text-xs font-mono-cyber" style={{ color: 'rgba(16,185,129,0.6)' }}>Montando plano alimentar...</p>
        </div>
      )}

      {/* Full editable diet editor */}
      {diet && !loading && (
        <DietEditor
          diet={diet}
          onDietChange={setDiet}
          students={students}
          onApply={handleApply}
          applying={applying}
        />
      )}
    </div>
  );
}