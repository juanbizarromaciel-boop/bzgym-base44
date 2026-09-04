import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search, Beef, Wheat, Droplets, Flame, X, PlusCircle, RefreshCw } from "lucide-react";
import FoodSubstituteModal from "@/components/diet/FoodSubstituteModal";
import { toast } from "sonner";

const CATEGORIES = {
  proteina: "Proteína", carboidrato: "Carboidrato", gordura: "Gordura",
  fruta: "Fruta", vegetal: "Vegetal", laticinios: "Laticínios",
  leguminosa: "Leguminosa", oleaginosa: "Oleaginosa", bebida: "Bebida", outro: "Outro"
};

const emptyFood = {
  name: "", category: "proteina",
  calories_per_100g: 0, protein_per_100g: 0, carbs_per_100g: 0,
  fat_per_100g: 0, fiber_per_100g: 0, serving_size_g: 100
};

function calcMacros(food, qty) {
  const ratio = (qty || 0) / 100;
  return {
    calories: Math.round((food.calories_per_100g || 0) * ratio),
    protein_g: parseFloat(((food.protein_per_100g || 0) * ratio).toFixed(1)),
    carbs_g: parseFloat(((food.carbs_per_100g || 0) * ratio).toFixed(1)),
    fat_g: parseFloat(((food.fat_per_100g || 0) * ratio).toFixed(1)),
  };
}

// Mini badge for macro values
function MacroBadge({ icon: Icon, value, unit = "g", color }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono-cyber ${color}`}>
      <Icon className="w-2.5 h-2.5" />{value}{unit}
    </span>
  );
}

export default function MealFoodEditor({ items = [], onChange }) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [qty, setQty] = useState("");
  const [newFoodOpen, setNewFoodOpen] = useState(false);
  const [newFoodForm, setNewFoodForm] = useState(emptyFood);
  const [substituteTarget, setSubstituteTarget] = useState(null);
  const qc = useQueryClient();

  const { data: foods = [] } = useQuery({
    queryKey: ["foods"],
    queryFn: () => base44.entities.Food.list()
  });

  const createFoodMut = useMutation({
    mutationFn: (d) => base44.entities.Food.create(d),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["foods"] });
      toast.success("Alimento cadastrado!");
      setNewFoodOpen(false);
      setNewFoodForm(emptyFood);
      // Auto-select the newly created food
      setSelectedFood(created);
      setQty(String(created.serving_size_g || 100));
    }
  });

  const filtered = foods.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedFood || !qty || parseFloat(qty) <= 0) {
      toast.error("Selecione um alimento e informe a quantidade");
      return;
    }
    const macros = calcMacros(selectedFood, parseFloat(qty));
    const newItem = {
      food_id: selectedFood.id,
      food_name: selectedFood.name,
      quantity_g: parseFloat(qty),
      ...macros
    };
    onChange([...items, newItem]);
    setSelectedFood(null);
    setQty("");
    setSearch("");
    setAddOpen(false);
  };

  const handleRemoveItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleUpdateQty = (idx, newQty) => {
    const item = items[idx];
    const food = foods.find(f => f.id === item.food_id);
    if (!food) return;
    const macros = calcMacros(food, parseFloat(newQty) || 0);
    const next = items.map((it, i) =>
      i === idx ? { ...it, quantity_g: parseFloat(newQty) || 0, ...macros } : it
    );
    onChange(next);
  };

  const handleSaveNewFood = () => {
    if (!newFoodForm.name) { toast.error("Nome obrigatório"); return; }
    createFoodMut.mutate(newFoodForm);
  };

  // Meal totals
  const totals = items.reduce(
    (acc, it) => ({
      cal: acc.cal + (it.calories || 0),
      prot: acc.prot + (it.protein_g || 0),
      carbs: acc.carbs + (it.carbs_g || 0),
      fat: acc.fat + (it.fat_g || 0),
    }),
    { cal: 0, prot: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="space-y-2">
      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={idx}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-900/20 bg-black/30 group">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{item.food_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <MacroBadge icon={Flame} value={item.calories} unit=" kcal" color="text-orange-400/70" />
                  <MacroBadge icon={Beef} value={`${item.protein_g}g`} unit="" color="text-pink-400/70" />
                  <MacroBadge icon={Wheat} value={`${item.carbs_g}g`} unit="" color="text-yellow-400/70" />
                  <MacroBadge icon={Droplets} value={`${item.fat_g}g`} unit="" color="text-cyan-400/70" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Input
                  type="number"
                  value={item.quantity_g || ""}
                  onChange={e => handleUpdateQty(idx, e.target.value)}
                  className="cyber-input text-center text-xs w-16 h-7 px-1"
                />
                <span className="text-[10px] text-purple-500/40 font-mono-cyber">g</span>
                <button type="button" onClick={() => setSubstituteTarget({ idx, item })} title="Trocar alimento" className="p-1 text-cyan-400/40 hover:text-cyan-300 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-pink-400/30 hover:text-pink-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Totals row */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-purple-500/15 bg-purple-500/5">
            <span className="text-[10px] font-mono-cyber text-purple-500/40 tracking-wider">TOTAL</span>
            <div className="flex items-center gap-3 ml-auto">
              <MacroBadge icon={Flame} value={Math.round(totals.cal)} unit=" kcal" color="text-orange-400" />
              <MacroBadge icon={Beef} value={`${totals.prot.toFixed(1)}g`} unit="" color="text-pink-400" />
              <MacroBadge icon={Wheat} value={`${totals.carbs.toFixed(1)}g`} unit="" color="text-yellow-400" />
              <MacroBadge icon={Droplets} value={`${totals.fat.toFixed(1)}g`} unit="" color="text-cyan-400" />
            </div>
          </div>
        </div>
      )}

      {/* Add food button */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-purple-900/30 text-purple-500/40 hover:text-purple-400 hover:border-purple-500/30 transition-all text-xs font-mono-cyber"
      >
        <PlusCircle className="w-3.5 h-3.5" /> ADICIONAR ALIMENTO
      </button>

      {/* Add food dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300 text-sm">ADICIONAR ALIMENTO</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-500/40" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedFood(null); }}
                placeholder="Buscar alimento..."
                className="cyber-input pl-9 text-sm"
              />
            </div>

            {/* Food list */}
            {!selectedFood && (
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {filtered.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-purple-500/40 font-mono-cyber mb-3">// nenhum alimento encontrado</p>
                    <button
                      type="button"
                      onClick={() => { setNewFoodForm({ ...emptyFood, name: search }); setNewFoodOpen(true); }}
                      className="btn-neon-cyan px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 mx-auto"
                    >
                      <Plus className="w-3 h-3" /> CADASTRAR "{search}"
                    </button>
                  </div>
                ) : (
                  filtered.map(food => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => { setSelectedFood(food); setQty(String(food.serving_size_g || 100)); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-purple-900/20 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left"
                    >
                      <span className="text-sm text-white font-medium">{food.name}</span>
                      <div className="flex items-center gap-2 text-[10px] font-mono-cyber">
                        <span className="text-orange-400">{food.calories_per_100g} kcal</span>
                        <span className="text-pink-400">{food.protein_per_100g}g prot</span>
                      </div>
                    </button>
                  ))
                )}
                {filtered.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setNewFoodForm({ ...emptyFood, name: search }); setNewFoodOpen(true); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-cyan-400/60 hover:text-cyan-400 font-mono-cyber transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Cadastrar novo alimento
                  </button>
                )}
              </div>
            )}

            {/* Selected food + quantity */}
            {selectedFood && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedFood.name}</p>
                      <p className="text-[10px] text-purple-400/40 font-mono-cyber mt-0.5">por 100g</p>
                    </div>
                    <button type="button" onClick={() => setSelectedFood(null)} className="text-purple-500/40 hover:text-purple-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { label: "KCAL", val: selectedFood.calories_per_100g, color: "text-orange-400" },
                      { label: "PROT", val: `${selectedFood.protein_per_100g}g`, color: "text-pink-400" },
                      { label: "CARB", val: `${selectedFood.carbs_per_100g}g`, color: "text-yellow-400" },
                      { label: "GORD", val: `${selectedFood.fat_per_100g}g`, color: "text-cyan-400" },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <p className={`font-cyber text-xs ${m.color}`}>{m.val}</p>
                        <p className="text-[9px] font-mono-cyber text-purple-500/40">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-purple-400/60 text-xs tracking-wider">QUANTIDADE (g)</Label>
                  <Input
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    placeholder="Ex: 150"
                    className="cyber-input mt-1 text-center text-lg font-cyber"
                  />
                </div>

                {/* Preview macros */}
                {qty && parseFloat(qty) > 0 && (() => {
                  const m = calcMacros(selectedFood, parseFloat(qty));
                  return (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "KCAL", val: m.calories, color: "text-orange-400" },
                        { label: "PROT", val: `${m.protein_g}g`, color: "text-pink-400" },
                        { label: "CARB", val: `${m.carbs_g}g`, color: "text-yellow-400" },
                        { label: "GORD", val: `${m.fat_g}g`, color: "text-cyan-400" },
                      ].map(mi => (
                        <div key={mi.label} className="text-center p-2 rounded-lg bg-black/40 border border-purple-900/20">
                          <p className={`font-cyber text-sm ${mi.color}`}>{mi.val}</p>
                          <p className="text-[9px] font-mono-cyber text-purple-500/40">{mi.label}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            {selectedFood && (
              <button onClick={handleAddItem} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium">
                ADICIONAR
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New food registration dialog */}
      <Dialog open={newFoodOpen} onOpenChange={setNewFoodOpen}>
        <DialogContent className="border border-cyan-900/40 text-white max-w-md" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-cyan-300 text-sm">CADASTRAR ALIMENTO</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">NOME *</Label>
              <Input value={newFoodForm.name} onChange={e => setNewFoodForm({ ...newFoodForm, name: e.target.value })} placeholder="Ex: Frango grelhado" className="cyber-input mt-1" />
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">CATEGORIA</Label>
              <Select value={newFoodForm.category} onValueChange={v => setNewFoodForm({ ...newFoodForm, category: v })}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-purple-400/60 text-[10px] tracking-wider font-mono-cyber uppercase">Valores por 100g</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "CALORIAS (kcal)", field: "calories_per_100g", color: "text-orange-400" },
                { label: "PROTEÍNA (g)", field: "protein_per_100g", color: "text-pink-400" },
                { label: "CARBOIDRATO (g)", field: "carbs_per_100g", color: "text-yellow-400" },
                { label: "GORDURA (g)", field: "fat_per_100g", color: "text-cyan-400" },
                { label: "FIBRA (g)", field: "fiber_per_100g", color: "text-green-400" },
                { label: "PORÇÃO PADRÃO (g)", field: "serving_size_g", color: "text-purple-400" },
              ].map(m => (
                <div key={m.field}>
                  <Label className={`text-[10px] tracking-wider ${m.color} opacity-60`}>{m.label}</Label>
                  <Input type="number" step="0.1" value={newFoodForm[m.field] || ""} onChange={e => setNewFoodForm({ ...newFoodForm, [m.field]: parseFloat(e.target.value) || 0 })} className="cyber-input mt-1 text-center" />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFoodOpen(false)} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={handleSaveNewFood} className="btn-neon-cyan px-4 py-2 rounded-lg text-sm font-medium" disabled={createFoodMut.isPending}>
              CADASTRAR E ADICIONAR
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {substituteTarget && (
        <FoodSubstituteModal
          open={!!substituteTarget}
          onClose={() => setSubstituteTarget(null)}
          item={substituteTarget.item}
          onSelect={(newItem) => {
            onChange(items.map((item, index) => index === substituteTarget.idx ? newItem : item));
            setSubstituteTarget(null);
          }}
        />
      )}
    </div>
  );
}