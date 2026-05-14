import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Check } from "lucide-react";

// Similarity score: smaller = more similar
function similarity(food, item) {
  const calDiff = Math.abs((food.calories_per_100g || 0) - (item.calories / (item.quantity_g || 100)) * 100);
  const pDiff = Math.abs((food.protein_per_100g || 0) - (item.protein_g / (item.quantity_g || 100)) * 100);
  const cDiff = Math.abs((food.carbs_per_100g || 0) - (item.carbs_g / (item.quantity_g || 100)) * 100);
  const fDiff = Math.abs((food.fat_per_100g || 0) - (item.fat_g / (item.quantity_g || 100)) * 100);
  return calDiff * 1.5 + pDiff * 1.2 + cDiff + fDiff;
}

export default function FoodSubstituteModal({ open, onClose, item, onSelect }) {
  const { data: foods = [] } = useQuery({
    queryKey: ["foods"],
    queryFn: () => base44.entities.Food.list(),
    enabled: open
  });

  const suggestions = foods
    .filter(f => f.id !== item?.food_id && f.name !== item?.food_name)
    .map(f => ({ ...f, score: similarity(f, item) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);

  const calcMacros = (food, qty) => ({
    calories: Math.round((food.calories_per_100g || 0) * qty / 100),
    protein_g: parseFloat(((food.protein_per_100g || 0) * qty / 100).toFixed(1)),
    carbs_g: parseFloat(((food.carbs_per_100g || 0) * qty / 100).toFixed(1)),
    fat_g: parseFloat(((food.fat_per_100g || 0) * qty / 100).toFixed(1)),
  });

  const handleSelect = (food) => {
    const qty = item?.quantity_g || food.serving_size_g || 100;
    const macros = calcMacros(food, qty);
    onSelect({
      food_id: food.id,
      food_name: food.name,
      quantity_g: qty,
      ...macros
    });
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border border-purple-900/40 text-white max-w-md max-h-[80vh] overflow-y-auto"
        style={{ background: '#04040e' }}>
        <DialogHeader>
          <DialogTitle className="font-cyber tracking-widest text-purple-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> SUBSTITUIR ALIMENTO
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-purple-500/40 font-mono-cyber mb-1">
          Substituindo: <span className="text-purple-300">{item.food_name}</span> ({item.quantity_g}g)
        </p>
        <p className="text-[10px] text-purple-500/30 font-mono-cyber mb-4">
          // sugestões ordenadas por macros mais parecidos
        </p>

        {suggestions.length === 0 ? (
          <p className="text-purple-500/30 text-sm font-mono-cyber text-center py-8">
            // nenhum alimento cadastrado para sugerir
          </p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((food, i) => {
              const qty = item.quantity_g || food.serving_size_g || 100;
              const m = calcMacros(food, qty);
              return (
                <button
                  key={food.id}
                  onClick={() => handleSelect(food)}
                  className="w-full text-left p-3 rounded-xl border border-purple-900/20 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {i === 0 && (
                        <span className="text-[8px] font-mono-cyber text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded tracking-widest">MAIS SIMILAR</span>
                      )}
                      <span className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">{food.name}</span>
                    </div>
                    <Check className="w-4 h-4 text-purple-500/30 group-hover:text-purple-400 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono-cyber">
                    <span className="text-orange-400/80">{m.calories} kcal</span>
                    <span className="text-pink-400/80">{m.protein_g}g P</span>
                    <span className="text-yellow-400/80">{m.carbs_g}g C</span>
                    <span className="text-cyan-400/80">{m.fat_g}g G</span>
                    <span className="text-purple-500/30">({qty}g)</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}