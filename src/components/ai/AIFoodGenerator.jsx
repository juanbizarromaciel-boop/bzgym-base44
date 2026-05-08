import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, CheckCircle2, Save, Edit2, X, Utensils, Plus, Trash2
} from "lucide-react";
import { toast } from "sonner";

const QUICK_PROMPTS = [
  "Cadastre 100g de arroz branco cozido",
  "Adicione peito de frango grelhado 100g",
  "Cadastre ovo inteiro cozido",
  "Adicione banana prata média",
  "Cadastre aveia em flocos 40g",
  "Cadastre arroz branco, feijão preto, frango, ovo, banana, aveia e azeite de oliva",
];

const CATEGORY_LABELS = {
  proteina: "Proteína", carboidrato: "Carboidrato", gordura: "Gordura",
  fruta: "Fruta", vegetal: "Vegetal", laticinios: "Laticínios",
  leguminosa: "Leguminosa", oleaginosa: "Oleaginosa", bebida: "Bebida", outro: "Outro"
};

function FoodCard({ food, index, onEdit, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState(food);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Food.create({
        name: data.name,
        category: data.category,
        calories_per_100g: parseFloat(data.calories) || 0,
        protein_per_100g: parseFloat(data.protein) || 0,
        carbs_per_100g: parseFloat(data.carbs) || 0,
        fat_per_100g: parseFloat(data.fat) || 0,
        fiber_per_100g: parseFloat(data.fiber) || 0,
        serving_size_g: parseFloat(data.base_quantity) || 100,
      });
      toast.success(`${data.name} salvo no banco!`);
      onSave(index);
    } catch {
      toast.error("Erro ao salvar alimento.");
    }
    setSaving(false);
  };

  const field = (key, label, type = "number") => (
    <div>
      <label className="text-[10px] font-mono-cyber uppercase tracking-wider block mb-1" style={{ color: 'rgba(168,85,247,0.6)' }}>{label}</label>
      <Input type={type} value={data[key] ?? ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} className="cyber-input text-sm" />
    </div>
  );

  return (
    <div className="rounded-xl border p-4 relative" style={{ background: 'rgba(8,5,20,0.95)', borderColor: data.is_verified === false ? 'rgba(245,158,11,0.3)' : 'rgba(168,85,247,0.2)' }}>
      {data.is_verified === false && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-400 font-mono-cyber">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> não verificado — revise antes de salvar
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div>
          {editing
            ? <Input value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))} className="cyber-input text-sm font-semibold mb-1" />
            : <p className="font-semibold text-white">{data.name}</p>
          }
          <Badge className="text-xs mt-1" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)', color: '#d8b4fe' }}>
            {CATEGORY_LABELS[data.category] || data.category}
          </Badge>
        </div>
        <button onClick={() => onRemove(index)} className="text-purple-500/30 hover:text-red-400 transition-colors ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      {editing ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {field('calories', 'Kcal')}
          {field('protein', 'Proteína (g)')}
          {field('carbs', 'Carbos (g)')}
          {field('fat', 'Gordura (g)')}
          {field('fiber', 'Fibras (g)')}
          {field('base_quantity', 'Qtd base (g)')}
          <div className="col-span-2 md:col-span-3">{field('category', 'Categoria', 'text')}</div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { label: 'Kcal', val: data.calories },
            { label: 'Prot.', val: `${data.protein}g` },
            { label: 'Carbo', val: `${data.carbs}g` },
            { label: 'Gord.', val: `${data.fat}g` },
            { label: 'Fibra', val: `${data.fiber ?? '—'}g` },
          ].map((m, i) => (
            <div key={i} className="text-center p-2 rounded-lg" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
              <p className="text-xs font-semibold text-purple-200">{m.val ?? '—'}</p>
              <p className="text-[9px] font-mono-cyber mt-0.5" style={{ color: 'rgba(168,85,247,0.5)' }}>{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setEditing(!editing)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: '#d8b4fe' }}>
          <Edit2 className="w-3.5 h-3.5" /> {editing ? "Concluir edição" : "Editar"}
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar no banco
        </button>
      </div>
    </div>
  );
}

export default function AIFoodGenerator({ settings }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [foods, setFoods] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Digite um comando."); return; }
    setLoading(true);
    setFoods([]);
    try {
      const res = await base44.functions.invoke('aiCoach', {
        type: 'food',
        prompt: `Gere dados nutricionais para: ${prompt}. Se for vários alimentos, retorne um array no campo "foods". Se for um alimento, retorne em "food". Formato: {"foods": [...]} ou {"food": {...}}. Cada alimento deve ter: name, category (escolha: proteina/carboidrato/gordura/fruta/vegetal/laticinios/leguminosa/oleaginosa/bebida/outro), calories, protein, carbs, fat, fiber, base_quantity (padrão 100), is_verified (true/false).`
      });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      const d = res?.data?.data;
      let list = [];
      if (d?.foods && Array.isArray(d.foods)) list = d.foods;
      else if (d?.food) list = [d.food];
      else if (Array.isArray(d)) list = d;
      else if (d?.name) list = [d];
      if (list.length === 0) { toast.error("A IA não retornou alimentos válidos. Tente um prompt mais específico."); return; }
      setFoods(list);
    } catch (e) {
      toast.error("Erro ao conectar: " + e.message);
    }
    setLoading(false);
  };

  const saveAll = async () => {
    let saved = 0;
    for (const food of foods) {
      try {
        await base44.entities.Food.create({
          name: food.name, category: food.category,
          calories_per_100g: parseFloat(food.calories) || 0,
          protein_per_100g: parseFloat(food.protein) || 0,
          carbs_per_100g: parseFloat(food.carbs) || 0,
          fat_per_100g: parseFloat(food.fat) || 0,
          fiber_per_100g: parseFloat(food.fiber) || 0,
          serving_size_g: parseFloat(food.base_quantity) || 100,
        });
        saved++;
      } catch {}
    }
    toast.success(`${saved} alimento(s) salvos no banco!`);
    setFoods([]);
    setPrompt("");
  };

  const removeFood = (i) => setFoods(prev => prev.filter((_, idx) => idx !== i));
  const markSaved = (i) => setFoods(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      {/* Prompt area */}
      <div className="rounded-2xl p-5 border relative overflow-hidden backdrop-blur-sm"
        style={{ background: 'rgba(10,6,28,0.85)', borderColor: 'rgba(251,146,60,0.2)', boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(251,146,60,0.08)' }}>
        {/* subtle top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.35), transparent)' }} />

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)' }}>
            <Utensils className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide" style={{ color: '#fed7aa' }}>Cadastrar Alimento com IA</h2>
            <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(251,146,60,0.4)' }}>Descreva o alimento e a IA extrai os nutrientes</p>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
          placeholder="Ex: Cadastre 100g de arroz branco cozido&#10;Ou vários: arroz, feijão, frango, ovo, banana..."
          rows={3}
          className="w-full resize-none rounded-xl p-3.5 text-sm transition-all outline-none placeholder-orange-400/40"
          style={{
            background: 'rgba(2,1,8,0.98)',
            border: '1px solid rgba(251,146,60,0.35)',
            color: '#f5e8ff',
            fontFamily: 'Inter, sans-serif',
            caretColor: '#fb923c',
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6)',
          }}
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.35)' }}>Ctrl+Enter para gerar</p>
          <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.35)', color: '#fed7aa', boxShadow: loading ? 'none' : '0 0 14px rgba(251,146,60,0.12)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar com IA
          </button>
        </div>

        {/* Quick prompts */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(251,146,60,0.1)' }}>
          <p className="text-[10px] font-mono-cyber mb-2.5" style={{ color: 'rgba(251,146,60,0.35)' }}>SUGESTÕES RÁPIDAS</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((q, i) => (
              <button key={i} onClick={() => setPrompt(q)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105"
                style={{ borderColor: 'rgba(251,146,60,0.15)', background: 'rgba(251,146,60,0.05)', color: 'rgba(253,186,116,0.65)' }}>
                {q.length > 35 ? q.slice(0, 35) + '...' : q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: '2px solid rgba(168,85,247,0.4)', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
          <p className="text-xs font-mono-cyber" style={{ color: 'rgba(168,85,247,0.6)' }}>Consultando base nutricional...</p>
        </div>
      )}

      {/* Results */}
      {foods.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold" style={{ color: '#f0e6ff' }}>{foods.length} alimento(s) gerado(s) — revise antes de salvar</p>
            </div>
            {foods.length > 1 && (
              <button onClick={saveAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                <Save className="w-3.5 h-3.5" /> Salvar todos
              </button>
            )}
          </div>
          <div className="space-y-3">
            {foods.map((food, i) => (
              <FoodCard key={i} food={food} index={i} onSave={markSaved} onRemove={removeFood} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}