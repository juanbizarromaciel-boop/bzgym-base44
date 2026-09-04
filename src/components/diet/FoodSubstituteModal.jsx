import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const categories = ["proteina", "carboidrato", "gordura", "fruta", "vegetal", "laticinios", "leguminosa", "oleaginosa", "bebida", "outro"];
const macros = (food, qty) => ({ calories: Math.round((food.calories_per_100g || 0) * qty / 100), protein_g: +((food.protein_per_100g || 0) * qty / 100).toFixed(1), carbs_g: +((food.carbs_per_100g || 0) * qty / 100).toFixed(1), fat_g: +((food.fat_per_100g || 0) * qty / 100).toFixed(1) });
const target100 = item => { const q = item.quantity_g || 100; return { calories: (item.calories || 0) * 100 / q, protein: (item.protein_g || 0) * 100 / q, carbs: (item.carbs_g || 0) * 100 / q, fat: (item.fat_g || 0) * 100 / q }; };
const score = (food, item) => { const t = target100(item); return Math.abs((food.calories_per_100g || 0) - t.calories) * 1.5 + Math.abs((food.protein_per_100g || 0) - t.protein) * 1.2 + Math.abs((food.carbs_per_100g || 0) - t.carbs) + Math.abs((food.fat_per_100g || 0) - t.fat); };
const equivalentQty = (food, item) => food.calories_per_100g && item.calories ? Math.max(1, Math.round(item.calories * 100 / food.calories_per_100g)) : (item.quantity_g || food.serving_size_g || 100);

export default function FoodSubstituteModal({ open, onClose, item, onSelect }) {
  const qc = useQueryClient();
  const [extraFoods, setExtraFoods] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(0);
  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: () => base44.entities.Food.list(), enabled: open });
  if (!item) return null;
  const suggestions = [...foods, ...extraFoods].filter((f, i, all) => f.name?.toLowerCase() !== item.food_name?.toLowerCase() && all.findIndex(x => x.name?.toLowerCase() === f.name?.toLowerCase()) === i).map(f => ({ ...f, matchScore: score(f, item) })).sort((a, b) => a.matchScore - b.matchScore).slice(0, 14);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const t = target100(item);
      const result = await base44.integrations.Core.InvokeLLM({ prompt: `Sugira 6 alimentos comuns no Brasil que possam substituir ${item.food_name}, com macronutrientes semelhantes por 100g. Evite estes já disponíveis: ${foods.map(f => f.name).slice(0, 80).join(", ")}. Meta aproximada: ${t.calories.toFixed(0)} kcal, ${t.protein.toFixed(1)}g proteína, ${t.carbs.toFixed(1)}g carboidratos e ${t.fat.toFixed(1)}g gordura.`, response_json_schema: { type: "object", properties: { foods: { type: "array", items: { type: "object", properties: { name: { type: "string" }, category: { type: "string", enum: categories }, calories_per_100g: { type: "number" }, protein_per_100g: { type: "number" }, carbs_per_100g: { type: "number" }, fat_per_100g: { type: "number" }, fiber_per_100g: { type: "number" }, serving_size_g: { type: "number" } }, required: ["name", "category", "calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"] } } }, required: ["foods"] } });
      const fresh = (result.foods || []).filter(f => !foods.some(x => x.name?.toLowerCase() === f.name?.toLowerCase()));
      const created = fresh.length ? await base44.entities.Food.bulkCreate(fresh) : [];
      setExtraFoods(created);
      qc.invalidateQueries({ queryKey: ["foods"] });
      if (!created.length) toast.info("As melhores opções disponíveis já estão na lista.");
    } catch { toast.error("Não foi possível buscar mais opções agora."); }
    finally { setLoadingMore(false); }
  };

  const choose = food => { setSelected(food); setQty(equivalentQty(food, item)); };
  const confirm = () => { const values = macros(selected, qty); onSelect({ food_id: selected.id, food_name: selected.name, quantity_g: qty, category: selected.category, ...values }); onClose(); };
  const selectedMacros = selected ? macros(selected, qty) : null;

  return <Dialog open={open} onOpenChange={onClose}><DialogContent className="max-h-[85vh] max-w-md overflow-y-auto border text-white" style={{ background: "linear-gradient(145deg,#060414,#03020c)", borderColor: "rgba(6,182,212,.35)" }}><DialogHeader><DialogTitle className="flex items-center gap-2 text-sm font-cyber tracking-widest text-cyan-300"><RefreshCw className="h-4 w-4" /> TROCAR ALIMENTO</DialogTitle></DialogHeader>
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3"><p className="text-sm font-semibold">{item.food_name} · {item.quantity_g}g</p><p className="mt-1 text-[10px] text-purple-300/60">{item.calories} kcal · {item.protein_g}g P · {item.carbs_g}g C · {item.fat_g}g G</p></div>
    {!selected ? <><p className="text-[10px] tracking-widest text-purple-300/50">OPÇÕES COM MACROS PARECIDOS</p><div className="space-y-2">{suggestions.slice(0, extraFoods.length ? 14 : 8).map((food, i) => { const eq = equivalentQty(food, item); const m = macros(food, eq); return <button key={food.id || food.name} onClick={() => choose(food)} className="group w-full rounded-xl border border-purple-500/15 bg-black/30 p-3 text-left hover:border-cyan-500/40"><div className="flex justify-between gap-2"><span className="text-sm font-medium">{i === 0 && <small className="mr-2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">MAIS SIMILAR</small>}{food.name}</span><ChevronRight className="h-4 w-4 text-purple-300/40" /></div><p className="mt-1 text-[10px] text-purple-300/60">{eq}g · {m.calories} kcal · {m.protein_g}g P · {m.carbs_g}g C · {m.fat_g}g G</p></button>; })}</div><button onClick={loadMore} disabled={loadingMore} className="w-full rounded-xl border border-dashed border-cyan-500/30 py-2.5 text-xs text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50">{loadingMore ? "Buscando mais opções..." : "Ver mais opções"}</button></> : <div className="space-y-4"><div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4"><p className="font-semibold">{selected.name}</p><label className="mt-3 block text-[10px] text-purple-300/60">QUANTIDADE (g)</label><Input type="number" value={qty} onChange={e => setQty(+e.target.value || 0)} className="cyber-input mt-1 text-center" /><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-lg bg-black/30 p-2">Original<br />{item.calories} kcal · {item.protein_g}g P · {item.carbs_g}g C · {item.fat_g}g G</div><div className="rounded-lg bg-black/30 p-2">Substituto<br />{selectedMacros.calories} kcal · {selectedMacros.protein_g}g P · {selectedMacros.carbs_g}g C · {selectedMacros.fat_g}g G</div></div></div><div className="flex gap-2"><button onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-purple-500/20 py-2.5">Voltar</button><button onClick={confirm} disabled={!qty} className="btn-neon-cyan flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5"><Check className="h-4 w-4" /> Confirmar</button></div></div>}
  </DialogContent></Dialog>;
}