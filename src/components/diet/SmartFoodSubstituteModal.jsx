import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, Check, Sparkles, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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

// Calculate equivalent quantity to match original calories
function equivalentQty(origItem, food) {
  if (!food.calories_per_100g || !origItem.calories) return food.serving_size_g || 100;
  const targetCal = origItem.calories;
  return Math.round((targetCal / food.calories_per_100g) * 100);
}

// Similarity score (lower = more similar)
function similarity(food, item) {
  const qty = item.quantity_g || 100;
  const origPer100 = {
    cal: (item.calories || 0) / qty * 100,
    prot: (item.protein_g || 0) / qty * 100,
    carbs: (item.carbs_g || 0) / qty * 100,
    fat: (item.fat_g || 0) / qty * 100,
  };
  return (
    Math.abs((food.calories_per_100g || 0) - origPer100.cal) * 1.5 +
    Math.abs((food.protein_per_100g || 0) - origPer100.prot) * 1.2 +
    Math.abs((food.carbs_per_100g || 0) - origPer100.carbs) +
    Math.abs((food.fat_per_100g || 0) - origPer100.fat)
  );
}

// Similarity percentage (100% = identical)
function similarityPct(food, item) {
  const score = similarity(food, item);
  return Math.max(0, Math.round(100 - (score / 5)));
}

export default function SmartFoodSubstituteModal({ open, onClose, item, onConfirm }) {
  const [search, setSearch] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [step, setStep] = useState("list"); // "list" | "confirm"
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedQty, setSelectedQty] = useState(null);
  const qc = useQueryClient();

  const { data: foods = [] } = useQuery({
    queryKey: ["foods"],
    queryFn: () => base44.entities.Food.list(),
    enabled: open,
  });

  const createFoodMut = useMutation({
    mutationFn: (d) => base44.entities.Food.create(d),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["foods"] });
      toast.success(`"${created.name}" cadastrado e adicionado!`);
    },
  });

  if (!item) return null;

  // Build suggestions: same category first, then by similarity
  const suggestions = foods
    .filter(f => f.id !== item.food_id && f.name?.toLowerCase() !== item.food_name?.toLowerCase())
    .map(f => ({
      ...f,
      score: similarity(f, item),
      pct: similarityPct(f, item),
      eqQty: equivalentQty(item, f),
    }))
    .sort((a, b) => {
      // Same category boost
      const aCatMatch = a.category === item.category ? -20 : 0;
      const bCatMatch = b.category === item.category ? -20 : 0;
      return (a.score + aCatMatch) - (b.score + bCatMatch);
    })
    .slice(0, 8);

  const filtered = search
    ? foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) && f.id !== item.food_id).slice(0, 8).map(f => ({
        ...f, pct: similarityPct(f, item), eqQty: equivalentQty(item, f)
      }))
    : suggestions;

  const handleSelect = (food) => {
    setSelectedFood(food);
    setSelectedQty(food.eqQty);
    setStep("confirm");
  };

  const handleConfirm = () => {
    const qty = selectedQty || selectedFood.eqQty;
    const macros = calcMacros(selectedFood, qty);
    onConfirm({
      food_id: selectedFood.id,
      food_name: selectedFood.name,
      quantity_g: qty,
      category: selectedFood.category,
      ...macros,
    });
    toast.success(`Substituído por ${selectedFood.name}!`);
    onClose();
  };

  // AI: search and auto-create food
  const handleAISearch = async () => {
    if (!search || search.length < 2) return;
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um nutricionista especialista. Forneça os dados nutricionais para 100g de "${search}". Responda APENAS com JSON válido.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string", enum: ["proteina", "carboidrato", "gordura", "fruta", "vegetal", "laticinios", "leguminosa", "oleaginosa", "bebida", "outro"] },
            calories_per_100g: { type: "number" },
            protein_per_100g: { type: "number" },
            carbs_per_100g: { type: "number" },
            fat_per_100g: { type: "number" },
            fiber_per_100g: { type: "number" },
            serving_size_g: { type: "number" },
          }
        }
      });
      const created = await createFoodMut.mutateAsync({ ...result, name: result.name || search });
      const food = { ...created, pct: similarityPct(created, item), eqQty: equivalentQty(item, created) };
      handleSelect(food);
    } catch (e) {
      toast.error("Erro ao buscar dados nutricionais via IA");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border text-white max-w-md max-h-[85vh] overflow-y-auto"
        style={{ background: 'linear-gradient(145deg, #060414, #03020c)', borderColor: 'rgba(6,182,212,0.35)' }}>
        <DialogHeader>
          <DialogTitle className="font-cyber tracking-widest text-cyan-300 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> TROCAR ALIMENTO
          </DialogTitle>
        </DialogHeader>

        {/* Original food */}
        <div className="rounded-xl border p-3 mb-2" style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.2)' }}>
          <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-widest mb-1">SUBSTITUINDO</p>
          <p className="text-sm font-semibold text-white">{item.food_name}</p>
          <div className="flex items-center gap-3 mt-1 text-[10px] font-mono-cyber">
            <span className="text-purple-400/50">{item.quantity_g}g</span>
            <span className="text-orange-400/70">{item.calories} kcal</span>
            <span className="text-pink-400/70">{item.protein_g}g P</span>
            <span className="text-yellow-400/70">{item.carbs_g}g C</span>
            <span className="text-cyan-400/70">{item.fat_g}g G</span>
          </div>
        </div>

        {step === "list" && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-500/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar substituto..."
                className="cyber-input pl-9 pr-9 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500/40 hover:text-purple-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* AI search button */}
            {search && foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <button
                onClick={handleAISearch}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/8 text-purple-300 text-xs font-medium tracking-wider hover:bg-purple-500/15 transition-all"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {aiLoading ? "BUSCANDO DADOS NUTRICIONAIS..." : `BUSCAR "${search}" COM IA`}
              </button>
            )}

            {/* Section label */}
            <p className="text-[9px] font-mono-cyber text-purple-500/30 tracking-widest">
              {search ? "RESULTADOS DA BUSCA" : "SUBSTITUTOS SUGERIDOS (por equivalência de macros)"}
            </p>

            {/* Suggestions list */}
            <div className="space-y-2">
              {filtered.length === 0 && !search && (
                <p className="text-center text-xs text-purple-500/30 font-mono-cyber py-6">// nenhum alimento no banco para sugerir</p>
              )}
              {filtered.map((food, i) => {
                const eqQty = food.eqQty || equivalentQty(item, food);
                const previewMacros = calcMacros(food, eqQty);
                const pct = food.pct || similarityPct(food, item);
                return (
                  <button key={food.id} onClick={() => handleSelect(food)}
                    className="w-full text-left rounded-xl border p-3 transition-all group hover:border-cyan-500/40 hover:bg-cyan-500/5"
                    style={{ borderColor: i === 0 && !search ? 'rgba(52,211,153,0.3)' : 'rgba(168,85,247,0.15)', background: 'rgba(0,0,0,0.4)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {i === 0 && !search && (
                            <span className="text-[8px] font-mono-cyber text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded tracking-widest">
                              MAIS SIMILAR
                            </span>
                          )}
                          <span className="text-sm font-medium text-white group-hover:text-cyan-200 transition-colors">{food.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] font-mono-cyber">
                          <span className="text-purple-400/50">{eqQty}g equiv.</span>
                          <span className="text-orange-400/70">{previewMacros.calories} kcal</span>
                          <span className="text-pink-400/70">{previewMacros.protein_g}g P</span>
                          <span className="text-yellow-400/70">{previewMacros.carbs_g}g C</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Similarity pill */}
                        <div className="flex flex-col items-center">
                          <span className={`font-cyber text-xs ${pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-400' : 'text-purple-400'}`}>
                            {pct}%
                          </span>
                          <span className="text-[7px] font-mono-cyber text-purple-500/30">similar</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-purple-500/30 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "confirm" && selectedFood && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4 space-y-3"
              style={{ background: 'rgba(6,182,212,0.04)', borderColor: 'rgba(6,182,212,0.25)' }}>
              <p className="text-[9px] font-mono-cyber text-cyan-400/50 tracking-widest">SUBSTITUIR POR</p>
              <p className="text-base font-semibold text-white">{selectedFood.name}</p>

              {/* Quantity editor */}
              <div>
                <label className="text-[10px] text-purple-400/60 font-mono-cyber tracking-wider">QUANTIDADE (g)</label>
                <Input
                  type="number"
                  value={selectedQty}
                  onChange={e => setSelectedQty(parseFloat(e.target.value) || 0)}
                  className="cyber-input mt-1 text-center text-xl font-cyber"
                />
                <p className="text-[9px] text-purple-500/30 font-mono-cyber mt-1 text-center">
                  // quantidade calculada para equivalência calórica
                </p>
              </div>

              {/* Macro comparison */}
              {selectedQty > 0 && (() => {
                const nm = calcMacros(selectedFood, selectedQty);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-2 space-y-1.5" style={{ borderColor: 'rgba(168,85,247,0.15)', background: 'rgba(0,0,0,0.4)' }}>
                      <p className="text-[8px] font-mono-cyber text-purple-500/30 tracking-widest text-center">ORIGINAL</p>
                      <div className="space-y-0.5 text-[10px] font-mono-cyber">
                        <div className="flex justify-between"><span className="text-orange-400/60">Kcal</span><span className="text-white">{item.calories}</span></div>
                        <div className="flex justify-between"><span className="text-pink-400/60">Prot</span><span className="text-white">{item.protein_g}g</span></div>
                        <div className="flex justify-between"><span className="text-yellow-400/60">Carb</span><span className="text-white">{item.carbs_g}g</span></div>
                        <div className="flex justify-between"><span className="text-cyan-400/60">Gord</span><span className="text-white">{item.fat_g}g</span></div>
                      </div>
                    </div>
                    <div className="rounded-lg border p-2 space-y-1.5" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.04)' }}>
                      <p className="text-[8px] font-mono-cyber text-cyan-500/40 tracking-widest text-center">SUBSTITUTO</p>
                      <div className="space-y-0.5 text-[10px] font-mono-cyber">
                        <div className="flex justify-between"><span className="text-orange-400/60">Kcal</span><span className="text-white">{nm.calories}</span></div>
                        <div className="flex justify-between"><span className="text-pink-400/60">Prot</span><span className="text-white">{nm.protein_g}g</span></div>
                        <div className="flex justify-between"><span className="text-yellow-400/60">Carb</span><span className="text-white">{nm.carbs_g}g</span></div>
                        <div className="flex justify-between"><span className="text-cyan-400/60">Gord</span><span className="text-white">{nm.fat_g}g</span></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep("list")}
                className="flex-1 py-2.5 rounded-xl border border-purple-900/30 text-purple-400/60 hover:bg-purple-500/5 text-sm font-medium transition-all">
                VOLTAR
              </button>
              <button onClick={handleConfirm}
                className="flex-1 btn-neon-cyan py-2.5 rounded-xl text-sm font-medium tracking-widest flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> CONFIRMAR
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}