import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Pencil, Check, X,
  AlertTriangle, Users, Save, Loader2, GripVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ---- FoodRow: editable food item inside a meal ----
function FoodRow({ food, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState({ ...food });

  const commit = () => { onChange(local); setEditing(false); };
  const cancel = () => { setLocal({ ...food }); setEditing(false); };

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-2 border-b group" style={{ borderColor: 'rgba(16,185,129,0.08)' }}>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-white">{food.name || food.foodName}</span>
          <span className="text-[11px] font-mono-cyber ml-2" style={{ color: 'rgba(110,231,183,0.5)' }}>
            {food.quantity}{food.unit}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-[11px] font-mono-cyber" style={{ color: 'rgba(110,231,183,0.6)' }}>
            {food.calories != null && <span>{Math.round(food.calories)} kcal</span>}
            {food.protein != null && <span>{Math.round(food.protein)}g prot</span>}
            {food.carbs != null && <span>{Math.round(food.carbs)}g carb</span>}
            {food.fat != null && <span>{Math.round(food.fat)}g gord</span>}
          </div>
          <button onClick={() => setEditing(true)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: 'rgba(110,231,183,0.6)' }}>
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={onRemove}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all text-red-400/60 hover:text-red-400">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 border-b space-y-2" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
      <div className="grid grid-cols-2 gap-2">
        <input value={local.name || ''} onChange={e => setLocal({ ...local, name: e.target.value })}
          placeholder="Nome do alimento"
          className="rounded-lg px-3 py-1.5 text-sm outline-none"
          style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.3)', color: '#f0e6ff' }} />
        <div className="flex gap-1">
          <input value={local.quantity || ''} onChange={e => setLocal({ ...local, quantity: e.target.value })}
            placeholder="Qtd"
            className="rounded-lg px-2 py-1.5 text-sm outline-none w-20"
            style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.3)', color: '#f0e6ff' }} />
          <input value={local.unit || ''} onChange={e => setLocal({ ...local, unit: e.target.value })}
            placeholder="uni"
            className="rounded-lg px-2 py-1.5 text-sm outline-none w-16"
            style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.3)', color: '#f0e6ff' }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { field: 'calories', label: 'kcal' },
          { field: 'protein', label: 'prot(g)' },
          { field: 'carbs', label: 'carb(g)' },
          { field: 'fat', label: 'gord(g)' },
        ].map(({ field, label }) => (
          <div key={field}>
            <p className="text-[9px] font-mono-cyber mb-1" style={{ color: 'rgba(110,231,183,0.5)' }}>{label}</p>
            <input type="number" value={local[field] ?? ''} onChange={e => setLocal({ ...local, [field]: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg px-2 py-1 text-xs outline-none text-center"
              style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(196,181,224,0.7)' }}>
          <X className="w-3 h-3" /> Cancelar
        </button>
        <button onClick={commit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
          <Check className="w-3 h-3" /> Salvar
        </button>
      </div>
    </div>
  );
}

// ---- Blank food template ----
const blankFood = { name: '', quantity: '', unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0 };

// ---- MealEditor: full editable meal card ----
function MealEditor({ meal, idx, onChange, onRemove }) {
  const [open, setOpen] = useState(idx === 0);
  const [addingFood, setAddingFood] = useState(false);
  const [newFood, setNewFood] = useState({ ...blankFood });

  const foods = meal.foods || [];

  const updateFood = (fi, updated) => {
    const nf = [...foods];
    nf[fi] = updated;
    onChange({ ...meal, foods: nf });
  };

  const removeFood = (fi) => {
    const nf = foods.filter((_, i) => i !== fi);
    onChange({ ...meal, foods: nf });
  };

  const addFood = () => {
    if (!newFood.name.trim()) { return; }
    onChange({ ...meal, foods: [...foods, { ...newFood }] });
    setNewFood({ ...blankFood });
    setAddingFood(false);
  };

  // Recalc meal totals from foods
  const calcTotals = () => {
    const kcal = foods.reduce((s, f) => s + (parseFloat(f.calories) || 0), 0);
    const prot = foods.reduce((s, f) => s + (parseFloat(f.protein) || 0), 0);
    const carb = foods.reduce((s, f) => s + (parseFloat(f.carbs) || 0), 0);
    const fat = foods.reduce((s, f) => s + (parseFloat(f.fat) || 0), 0);
    return { kcal, prot, carb, fat };
  };

  const totals = calcTotals();

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
      {/* Header */}
      <div className="flex items-center" style={{ background: open ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.03)' }}>
        <button onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <span className="text-xs font-cyber text-emerald-300">{idx + 1}</span>
          </div>
          <div className="flex-1">
            {/* Editable meal name inline */}
            <input
              value={meal.name}
              onChange={e => onChange({ ...meal, name: e.target.value })}
              onClick={e => e.stopPropagation()}
              className="font-semibold text-white text-sm bg-transparent outline-none border-b border-transparent focus:border-emerald-500/40 w-full"
              placeholder="Nome da refeição"
            />
            <div className="flex items-center gap-3 mt-0.5">
              <input value={meal.time || ''} onChange={e => onChange({ ...meal, time: e.target.value })}
                onClick={e => e.stopPropagation()}
                placeholder="07:00"
                className="text-[11px] font-mono-cyber bg-transparent outline-none border-b border-transparent focus:border-emerald-500/30 w-16"
                style={{ color: 'rgba(110,231,183,0.5)' }} />
              <span className="text-[11px] font-mono-cyber" style={{ color: 'rgba(110,231,183,0.5)' }}>
                {foods.length} alimentos · {Math.round(totals.kcal)} kcal
              </span>
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-emerald-400/50 flex-shrink-0" />}
        </button>
        <button onClick={onRemove} className="px-3 py-2 text-red-400/40 hover:text-red-400 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="px-5 pb-4 pt-3 space-y-2" style={{ background: 'rgba(4,2,14,0.9)' }}>
          {/* Macro summary for this meal */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'kcal', val: Math.round(totals.kcal), color: '#f59e0b' },
              { label: 'prot', val: `${Math.round(totals.prot)}g`, color: '#ef4444' },
              { label: 'carb', val: `${Math.round(totals.carb)}g`, color: '#06b6d4' },
              { label: 'gord', val: `${Math.round(totals.fat)}g`, color: '#a855f7' },
            ].map(m => (
              <div key={m.label} className="text-center py-1.5 rounded-lg" style={{ background: `${m.color}0d`, border: `1px solid ${m.color}20` }}>
                <p className="text-sm font-cyber" style={{ color: m.color }}>{m.val}</p>
                <p className="text-[9px] font-mono-cyber" style={{ color: `${m.color}70` }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Food rows */}
          {foods.map((f, fi) => (
            <FoodRow key={fi} food={f}
              onChange={updated => updateFood(fi, updated)}
              onRemove={() => removeFood(fi)} />
          ))}

          {/* Add food form */}
          {addingFood ? (
            <div className="pt-3 space-y-2 border-t" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
              <p className="text-[10px] font-mono-cyber text-emerald-400/60">NOVO ALIMENTO</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={newFood.name} onChange={e => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="Nome do alimento" autoFocus
                  className="rounded-lg px-3 py-1.5 text-sm outline-none"
                  style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.3)', color: '#f0e6ff' }} />
                <div className="flex gap-1">
                  <input value={newFood.quantity} onChange={e => setNewFood({ ...newFood, quantity: e.target.value })}
                    placeholder="100" className="rounded-lg px-2 py-1.5 text-sm outline-none w-20"
                    style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.3)', color: '#f0e6ff' }} />
                  <input value={newFood.unit} onChange={e => setNewFood({ ...newFood, unit: e.target.value })}
                    placeholder="g" className="rounded-lg px-2 py-1.5 text-sm outline-none w-16"
                    style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.3)', color: '#f0e6ff' }} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { field: 'calories', label: 'kcal' },
                  { field: 'protein', label: 'prot(g)' },
                  { field: 'carbs', label: 'carb(g)' },
                  { field: 'fat', label: 'gord(g)' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <p className="text-[9px] font-mono-cyber mb-1" style={{ color: 'rgba(110,231,183,0.5)' }}>{label}</p>
                    <input type="number" value={newFood[field] || ''} onChange={e => setNewFood({ ...newFood, [field]: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg px-2 py-1 text-xs outline-none text-center"
                      style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setAddingFood(false); setNewFood({ ...blankFood }); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(196,181,224,0.7)' }}>
                  <X className="w-3 h-3" /> Cancelar
                </button>
                <button onClick={addFood}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingFood(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs mt-2 transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px dashed rgba(16,185,129,0.2)', color: 'rgba(110,231,183,0.5)' }}>
              <Plus className="w-3 h-3" /> Adicionar alimento
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Main DietEditor ----
export default function DietEditor({ diet, onDietChange, students, onApply, applying }) {
  const [selectedStudent, setSelectedStudent] = useState("");

  // Derive live totals from meals' foods
  const calcGrandTotals = () => {
    const allFoods = (diet.meals || []).flatMap(m => m.foods || []);
    return {
      calories: allFoods.reduce((s, f) => s + (parseFloat(f.calories) || 0), 0),
      protein: allFoods.reduce((s, f) => s + (parseFloat(f.protein) || 0), 0),
      carbs: allFoods.reduce((s, f) => s + (parseFloat(f.carbs) || 0), 0),
      fat: allFoods.reduce((s, f) => s + (parseFloat(f.fat) || 0), 0),
    };
  };

  const grand = calcGrandTotals();

  const updateMeal = (idx, updated) => {
    const meals = [...(diet.meals || [])];
    meals[idx] = updated;
    onDietChange({ ...diet, meals, totalCalories: calcGrandTotals().calories });
  };

  const removeMeal = (idx) => {
    const meals = (diet.meals || []).filter((_, i) => i !== idx);
    onDietChange({ ...diet, meals });
  };

  const addMeal = () => {
    const meals = [...(diet.meals || []), {
      name: `Refeição ${(diet.meals?.length || 0) + 1}`,
      time: '',
      totalCalories: 0,
      foods: []
    }];
    onDietChange({ ...diet, meals });
  };

  const totals = [
    { label: 'Calorias', val: Math.round(grand.calories), unit: 'kcal', color: '#f59e0b' },
    { label: 'Proteína', val: Math.round(grand.protein), unit: 'g', color: '#ef4444' },
    { label: 'Carbos', val: Math.round(grand.carbs), unit: 'g', color: '#06b6d4' },
    { label: 'Gordura', val: Math.round(grand.fat), unit: 'g', color: '#a855f7' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary header — editable name + live macros */}
      <div className="rounded-xl p-5 border" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))', borderColor: 'rgba(16,185,129,0.3)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
          <p className="text-xs font-mono-cyber text-emerald-300/70">EDITANDO DIETA</p>
        </div>

        {/* Editable diet name */}
        <input
          value={diet.dietName || diet.diet_name || ''}
          onChange={e => onDietChange({ ...diet, dietName: e.target.value })}
          className="font-cyber text-lg text-white tracking-wider bg-transparent outline-none border-b mb-3 w-full"
          style={{ borderColor: 'rgba(16,185,129,0.2)' }}
          placeholder="Nome da dieta"
        />

        {/* Editable goal */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-mono-cyber text-emerald-400/50">OBJETIVO:</span>
          <select value={diet.goal || ''} onChange={e => onDietChange({ ...diet, goal: e.target.value })}
            className="text-xs rounded-lg px-2 py-1 outline-none"
            style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
            <option value="">Selecionar</option>
            <option value="bulking">Bulking</option>
            <option value="cutting">Cutting</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>

        {/* Live macro totals */}
        <div className="grid grid-cols-4 gap-2">
          {totals.map((t, i) => (
            <div key={i} className="text-center p-3 rounded-xl" style={{ background: `${t.color}10`, border: `1px solid ${t.color}25` }}>
              <p className="font-cyber text-lg font-bold" style={{ color: t.color }}>{t.val}</p>
              <p className="text-[9px] font-mono-cyber mt-0.5" style={{ color: `${t.color}70` }}>{t.unit}</p>
              <p className="text-[9px] font-mono-cyber" style={{ color: 'rgba(196,181,224,0.5)' }}>{t.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 p-2.5 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: 'rgba(253,224,71,0.8)' }}>
            Revise todos os valores antes de aplicar. Dietas clínicas exigem nutricionista habilitado.
          </p>
        </div>
      </div>

      {/* Editable meals */}
      <div className="space-y-3">
        {(diet.meals || []).map((meal, i) => (
          <MealEditor key={i} meal={meal} idx={i}
            onChange={updated => updateMeal(i, updated)}
            onRemove={() => removeMeal(i)} />
        ))}
      </div>

      {/* Add meal button */}
      <button onClick={addMeal}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all hover:scale-[1.01]"
        style={{ background: 'rgba(16,185,129,0.04)', border: '1px dashed rgba(16,185,129,0.25)', color: 'rgba(110,231,183,0.55)' }}>
        <Plus className="w-4 h-4" /> Adicionar refeição
      </button>

      {/* Apply section */}
      <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(16,185,129,0.25)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-emerald-200 tracking-wider">APLICAR AO ALUNO</h3>
        </div>
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
          className="cyber-input w-full rounded-lg p-2.5 text-sm mb-4"
          style={{ background: 'rgba(5,3,15,0.85)', border: '1px solid rgba(16,185,129,0.35)', color: '#edd9ff' }}>
          <option value="">Selecionar aluno...</option>
          {(students || []).filter(s => s.active !== false).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button onClick={() => onApply(selectedStudent, grand)} disabled={applying || !selectedStudent}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all"
          style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', boxShadow: '0 0 15px rgba(16,185,129,0.1)' }}>
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Aplicar ao plano alimentar
        </button>
      </div>
    </div>
  );
}