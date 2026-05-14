import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Clock, Beef, Wheat, Droplets, Leaf, Plus, Pencil, Trash2, RefreshCw, Check, X, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import SmartFoodSubstituteModal from "./SmartFoodSubstituteModal";

function calcMacros(food, qty) {
  const r = (qty || 0) / 100;
  return {
    calories: Math.round((food.calories_per_100g || 0) * r),
    protein_g: parseFloat(((food.protein_per_100g || 0) * r).toFixed(1)),
    carbs_g: parseFloat(((food.carbs_per_100g || 0) * r).toFixed(1)),
    fat_g: parseFloat(((food.fat_per_100g || 0) * r).toFixed(1)),
    fiber_g: parseFloat(((food.fiber_per_100g || 0) * r).toFixed(1)),
  };
}

function MacroTag({ color, label, value }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`font-cyber text-xs ${color}`}>{value}</span>
      <span className="text-[8px] font-mono-cyber text-purple-500/30 tracking-widest">{label}</span>
    </div>
  );
}

// Inline food card
function FoodCard({ item, idx, foods, onUpdate, onRemove, onSubstitute, readOnly }) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyVal, setQtyVal] = useState(String(item.quantity_g || ""));

  const confirmQty = () => {
    const qty = parseFloat(qtyVal);
    if (!qty || qty <= 0) return;
    const food = foods.find(f => f.id === item.food_id);
    if (food) {
      const macros = calcMacros(food, qty);
      onUpdate(idx, { ...item, quantity_g: qty, ...macros });
    } else {
      // No food in DB (legacy), just update quantity proportionally
      const ratio = qty / (item.quantity_g || 100);
      onUpdate(idx, {
        ...item,
        quantity_g: qty,
        calories: Math.round((item.calories || 0) * ratio),
        protein_g: parseFloat(((item.protein_g || 0) * ratio).toFixed(1)),
        carbs_g: parseFloat(((item.carbs_g || 0) * ratio).toFixed(1)),
        fat_g: parseFloat(((item.fat_g || 0) * ratio).toFixed(1)),
      });
    }
    setEditingQty(false);
  };

  return (
    <div className="rounded-2xl border p-4 transition-all"
      style={{ background: 'rgba(7,5,22,0.97)', borderColor: 'rgba(168,85,247,0.18)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{item.food_name}</span>
            {/* Quantity badge */}
            {editingQty ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={qtyVal}
                  onChange={e => setQtyVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") confirmQty(); if (e.key === "Escape") setEditingQty(false); }}
                  className="cyber-input text-center text-xs w-16 h-6 px-1"
                  autoFocus
                />
                <span className="text-[10px] text-purple-400/50 font-mono-cyber">g</span>
                <button onClick={confirmQty} className="text-emerald-400 hover:text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingQty(false)} className="text-pink-400/50 hover:text-pink-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button
                onClick={() => !readOnly && setEditingQty(true)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono-cyber transition-all ${
                  readOnly ? "border-purple-900/20 text-purple-400/40 cursor-default" : "border-purple-500/25 text-purple-300 hover:border-purple-400/50 hover:bg-purple-500/10"
                }`}
              >
                {item.quantity_g}g
                {!readOnly && <Pencil className="w-2.5 h-2.5 opacity-60" />}
              </button>
            )}
          </div>

          {/* Macro row */}
          <div className="flex items-center gap-4 mt-3">
            <MacroTag color="text-orange-400" label="KCAL" value={item.calories || 0} />
            <MacroTag color="text-pink-400" label="PROT" value={`${item.protein_g || 0}g`} />
            <MacroTag color="text-yellow-400" label="CARB" value={`${item.carbs_g || 0}g`} />
            <MacroTag color="text-cyan-400" label="GORD" value={`${item.fat_g || 0}g`} />
            {(item.fiber_g > 0) && <MacroTag color="text-green-400" label="FIB" value={`${item.fiber_g}g`} />}
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => onSubstitute(idx, item)}
              title="Trocar alimento"
              className="p-1.5 rounded-lg text-purple-500/30 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRemove(idx)}
              title="Remover"
              className="p-1.5 rounded-lg text-purple-500/25 hover:text-pink-400 hover:bg-pink-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Add food panel
function AddFoodPanel({ onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState("");
  const qc = useQueryClient();

  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: () => base44.entities.Food.list() });

  const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 15);

  const handleAdd = () => {
    if (!selected || !qty || parseFloat(qty) <= 0) { toast.error("Selecione um alimento e a quantidade"); return; }
    const macros = calcMacros(selected, parseFloat(qty));
    onAdd({ food_id: selected.id, food_name: selected.name, quantity_g: parseFloat(qty), ...macros });
    onClose();
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'rgba(4,2,14,0.98)', borderColor: 'rgba(6,182,212,0.25)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-cyber text-cyan-300 tracking-widest">ADICIONAR ALIMENTO</span>
        <button onClick={onClose} className="text-purple-500/40 hover:text-purple-300"><X className="w-4 h-4" /></button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-500/40" />
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setSelected(null); }}
          placeholder="Buscar alimento..."
          className="cyber-input pl-9 text-sm"
          autoFocus
        />
      </div>
      {!selected && (
        <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 && search && (
            <p className="text-xs text-purple-500/40 font-mono-cyber text-center py-4">// nenhum resultado</p>
          )}
          {filtered.map(food => (
            <button key={food.id} onClick={() => { setSelected(food); setQty(String(food.serving_size_g || 100)); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-purple-900/20 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left">
              <span className="text-sm text-white">{food.name}</span>
              <span className="text-[10px] font-mono-cyber text-orange-400">{food.calories_per_100g} kcal/100g</span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5">
            <span className="text-sm text-white font-medium">{selected.name}</span>
            <button onClick={() => setSelected(null)} className="text-purple-500/40 hover:text-purple-300"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div>
            <Label className="text-[10px] text-purple-400/60 tracking-wider">QUANTIDADE (g)</Label>
            <Input type="number" value={qty} onChange={e => setQty(e.target.value)}
              placeholder="100" className="cyber-input mt-1 text-center text-lg font-cyber" />
          </div>
          {qty && parseFloat(qty) > 0 && (() => {
            const m = calcMacros(selected, parseFloat(qty));
            return (
              <div className="grid grid-cols-4 gap-1.5">
                {[["KCAL", m.calories, "text-orange-400"], ["PROT", `${m.protein_g}g`, "text-pink-400"], ["CARB", `${m.carbs_g}g`, "text-yellow-400"], ["GORD", `${m.fat_g}g`, "text-cyan-400"]].map(([l, v, c]) => (
                  <div key={l} className="text-center p-2 rounded-lg bg-black/40 border border-purple-900/20">
                    <p className={`font-cyber text-xs ${c}`}>{v}</p>
                    <p className="text-[8px] font-mono-cyber text-purple-500/30">{l}</p>
                  </div>
                ))}
              </div>
            );
          })()}
          <button onClick={handleAdd} className="w-full btn-neon-cyan py-2.5 rounded-lg text-sm font-medium tracking-widest">
            ADICIONAR
          </button>
        </div>
      )}
    </div>
  );
}

export default function MealDetailModal({ open, onClose, meal, mealIndex, onSave, readOnly = false }) {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [substituteTarget, setSubstituteTarget] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { data: foods = [] } = useQuery({
    queryKey: ["foods"],
    queryFn: () => base44.entities.Food.list(),
    enabled: !readOnly,
  });

  // Reset when modal opens or meal changes (use open + mealIndex + name to avoid ref instability)
  React.useEffect(() => {
    if (open) {
      setItems(meal?.items ? [...meal.items] : []);
      setDirty(false);
      setShowAdd(false);
    }
  }, [open, mealIndex, meal?.name]);

  const totals = items.reduce((acc, it) => ({
    cal: acc.cal + (it.calories || 0),
    prot: acc.prot + (it.protein_g || 0),
    carbs: acc.carbs + (it.carbs_g || 0),
    fat: acc.fat + (it.fat_g || 0),
  }), { cal: 0, prot: 0, carbs: 0, fat: 0 });

  const handleUpdate = (idx, updated) => {
    const next = items.map((it, i) => i === idx ? updated : it);
    setItems(next);
    setDirty(true);
  };

  const handleRemove = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const handleAdd = (newItem) => {
    setItems([...items, newItem]);
    setDirty(true);
    setShowAdd(false);
  };

  const handleSubstituteConfirm = (idx, newItem) => {
    handleUpdate(idx, newItem);
    setSubstituteTarget(null);
  };

  const handleSave = () => {
    onSave(mealIndex, items);
    setDirty(false);
    onClose();
    toast.success("Refeição atualizada!");
  };

  if (!meal) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="border text-white max-w-lg max-h-[90vh] overflow-y-auto"
          style={{ background: 'linear-gradient(145deg, #060414 0%, #03020c 100%)', borderColor: 'rgba(168,85,247,0.3)' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300 text-base">{meal.name?.toUpperCase()}</DialogTitle>
          </DialogHeader>

          {/* Meal summary */}
          <div className="rounded-xl border p-4 mb-1"
            style={{ background: 'rgba(168,85,247,0.04)', borderColor: 'rgba(168,85,247,0.15)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {meal.time && (
                  <span className="flex items-center gap-1 text-[10px] font-mono-cyber text-purple-400/50">
                    <Clock className="w-3 h-3" />{meal.time}
                  </span>
                )}
                <span className="text-[10px] font-mono-cyber text-purple-500/30">{items.length} alimentos</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,146,60,0.7))' }} />
                <span className="font-cyber text-xl text-orange-400" style={{ textShadow: '0 0 8px rgba(251,146,60,0.5)' }}>
                  {Math.round(totals.cal)}
                </span>
                <span className="text-[10px] font-mono-cyber text-orange-400/50 ml-0.5">kcal</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-black/30 border border-pink-500/15">
                <p className="font-cyber text-sm text-pink-400">{totals.prot.toFixed(1)}g</p>
                <p className="text-[8px] font-mono-cyber text-pink-400/30 tracking-widest">PROTEÍNA</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-black/30 border border-yellow-500/15">
                <p className="font-cyber text-sm text-yellow-400">{totals.carbs.toFixed(1)}g</p>
                <p className="text-[8px] font-mono-cyber text-yellow-400/30 tracking-widest">CARBOIDRATO</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-black/30 border border-cyan-500/15">
                <p className="font-cyber text-sm text-cyan-400">{totals.fat.toFixed(1)}g</p>
                <p className="text-[8px] font-mono-cyber text-cyan-400/30 tracking-widest">GORDURA</p>
              </div>
            </div>
          </div>

          {/* Food cards */}
          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <FoodCard
                key={`${item.food_id || item.food_name}_${idx}`}
                item={item}
                idx={idx}
                foods={foods}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                onSubstitute={(i, it) => setSubstituteTarget({ idx: i, item: it })}
                readOnly={readOnly}
              />
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-purple-500/30">
                <Flame className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-mono-cyber text-sm">// nenhum alimento nesta refeição</p>
              </div>
            )}
          </div>

          {/* Add food */}
          {!readOnly && (
            <div className="mt-2">
              {showAdd ? (
                <AddFoodPanel onAdd={handleAdd} onClose={() => setShowAdd(false)} />
              ) : (
                <button onClick={() => setShowAdd(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-cyan-900/40 text-cyan-400/50 hover:text-cyan-400 hover:border-cyan-500/40 transition-all text-xs font-mono-cyber">
                  <PlusCircle className="w-4 h-4" /> ADICIONAR ALIMENTO
                </button>
              )}
            </div>
          )}

          {/* Save button */}
          {!readOnly && dirty && (
            <button onClick={handleSave}
              className="w-full mt-1 btn-neon-purple py-3 rounded-xl text-sm font-medium tracking-widest">
              SALVAR ALTERAÇÕES
            </button>
          )}
        </DialogContent>
      </Dialog>

      {/* Smart substitute modal */}
      {substituteTarget && (
        <SmartFoodSubstituteModal
          open={!!substituteTarget}
          onClose={() => setSubstituteTarget(null)}
          item={substituteTarget.item}
          onConfirm={(newItem) => handleSubstituteConfirm(substituteTarget.idx, newItem)}
        />
      )}
    </>
  );
}