import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, RefreshCw, ChevronDown, ChevronUp, Flame, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FoodSubstituteModal from "./FoodSubstituteModal";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getStorageKey(planId) {
  return `diet_checklist_${planId}_${getTodayKey()}`;
}

function getSubstitutionKey(planId) {
  return `diet_substitutions_${planId}_${getTodayKey()}`;
}

export default function DietChecklist({ plan }) {
  const storageKey = getStorageKey(plan.id);
  const subKey = getSubstitutionKey(plan.id);

  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  });
  const [substitutions, setSubstitutions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(subKey) || "{}"); } catch { return {}; }
  });
  const [expandedMeals, setExpandedMeals] = useState({});
  const [substituteTarget, setSubstituteTarget] = useState(null); // { mealIdx, itemIdx, item }

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(checked)); }, [checked]);
  useEffect(() => { localStorage.setItem(subKey, JSON.stringify(substitutions)); }, [substitutions]);

  // Build item list with substitutions applied
  const meals = (plan.meals || []).map((meal, mi) => ({
    ...meal,
    items: (meal.items || []).map((item, ii) => {
      const subKey2 = `${mi}_${ii}`;
      return substitutions[subKey2] ? { ...substitutions[subKey2], _substituted: true } : item;
    })
  }));

  const allItems = meals.flatMap((m, mi) => (m.items || []).map((it, ii) => ({ ...it, key: `${mi}_${ii}` })));
  const totalItems = allItems.length;
  const checkedCount = allItems.filter(it => checked[it.key]).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  // Consumed macros
  const consumed = allItems.filter(it => checked[it.key]);
  const consumedCal = consumed.reduce((s, it) => s + (it.calories || 0), 0);
  const consumedProt = consumed.reduce((s, it) => s + (it.protein_g || 0), 0);
  const consumedCarb = consumed.reduce((s, it) => s + (it.carbs_g || 0), 0);
  const consumedFat = consumed.reduce((s, it) => s + (it.fat_g || 0), 0);

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubstitute = (mealIdx, itemIdx, item) => {
    setSubstituteTarget({ mealIdx, itemIdx, item });
  };

  const applySubstitution = (newItem) => {
    const key = `${substituteTarget.mealIdx}_${substituteTarget.itemIdx}`;
    setSubstitutions(prev => ({ ...prev, [key]: newItem }));
    setSubstituteTarget(null);
  };

  const resetSubstitution = (mealIdx, itemIdx) => {
    const key = `${mealIdx}_${itemIdx}`;
    setSubstitutions(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const resetAll = () => {
    setChecked({});
    setSubstitutions({});
  };

  const toggleMeal = (idx) => setExpandedMeals(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="cyber-card rounded-2xl border border-purple-900/20 p-5"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.04), transparent)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.3em] uppercase mb-0.5">Progresso de Hoje</p>
            <h3 className="font-cyber text-lg text-white">{checkedCount}/{totalItems} alimentos</h3>
          </div>
          <div className="text-right">
            <p className="font-cyber text-3xl text-emerald-400" style={{ textShadow: '0 0 12px rgba(52,211,153,0.5)' }}>{progress}%</p>
            {progress === 100 && <p className="text-[10px] text-emerald-400/60 font-mono-cyber">// meta atingida!</p>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-black/50 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ background: progress === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #a855f7, #22d3ee)' }}
          />
        </div>

        {/* Consumed macros */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "KCAL", val: Math.round(consumedCal), total: Math.round(plan.total_calories || 0), color: "text-orange-400" },
            { label: "PROT", val: consumedProt.toFixed(1) + "g", total: (plan.protein_g || 0) + "g", color: "text-pink-400" },
            { label: "CARB", val: consumedCarb.toFixed(1) + "g", total: (plan.carbs_g || 0) + "g", color: "text-yellow-400" },
            { label: "GORD", val: consumedFat.toFixed(1) + "g", total: (plan.fat_g || 0) + "g", color: "text-cyan-400" },
          ].map(m => (
            <div key={m.label} className="rounded-xl bg-black/30 border border-purple-900/15 p-2 text-center">
              <p className={`font-cyber text-xs ${m.color}`}>{m.val}</p>
              <p className="text-[8px] font-mono-cyber text-purple-500/25 mt-0.5">/{m.total}</p>
              <p className="text-[7px] font-mono-cyber text-purple-500/30 tracking-widest">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-3">
          <button onClick={resetAll} className="text-[9px] font-mono-cyber text-purple-500/30 hover:text-purple-300 flex items-center gap-1 transition-colors">
            <RefreshCw className="w-3 h-3" /> RESETAR DIA
          </button>
        </div>
      </div>

      {/* Meal checklists */}
      <div className="space-y-2">
        {meals.map((meal, mi) => {
          const mealItems = meal.items || [];
          const mealChecked = mealItems.filter((_, ii) => checked[`${mi}_${ii}`]).length;
          const mealDone = mealItems.length > 0 && mealChecked === mealItems.length;
          const isExpanded = expandedMeals[mi] !== false; // default expanded

          return (
            <div key={mi} className="cyber-card rounded-xl overflow-hidden border transition-all"
              style={{ borderColor: mealDone ? 'rgba(52,211,153,0.3)' : 'rgba(168,85,247,0.15)' }}>
              {/* Meal header */}
              <button
                onClick={() => toggleMeal(mi)}
                className="w-full flex items-center justify-between p-3 hover:bg-purple-500/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    mealDone ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-purple-500/10 border border-purple-500/15"
                  }`}>
                    {mealDone
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <span className="font-cyber text-[9px] text-purple-400">{mi + 1}</span>
                    }
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{meal.name}</p>
                    <p className="text-[9px] font-mono-cyber text-purple-500/35">
                      {mealChecked}/{mealItems.length} · {Math.round((meal.items || []).reduce((s, it) => s + (it.calories || 0), 0))} kcal
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {meal.time && <span className="text-[9px] font-mono-cyber text-purple-500/30">{meal.time}</span>}
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-purple-500/40" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-500/40" />}
                </div>
              </button>

              {/* Items */}
              <AnimatePresence>
                {isExpanded && mealItems.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-purple-900/15 divide-y divide-purple-900/10">
                      {mealItems.map((item, ii) => {
                        const key = `${mi}_${ii}`;
                        const done = !!checked[key];
                        const isSub = !!item._substituted;
                        return (
                          <div key={ii} className={`flex items-center gap-3 px-4 py-2.5 transition-all ${done ? "opacity-60" : ""}`}>
                            <button onClick={() => toggle(key)} className="flex-shrink-0">
                              {done
                                ? <CheckCircle2 className="w-5 h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.6))' }} />
                                : <Circle className="w-5 h-5 text-purple-500/30 hover:text-purple-400 transition-colors" />
                              }
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm ${done ? "line-through text-purple-400/40" : "text-white"} transition-all`}>
                                  {item.food_name}
                                </span>
                                {isSub && (
                                  <span className="text-[8px] font-mono-cyber text-cyan-400/60 border border-cyan-500/20 px-1 rounded">SUB</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono-cyber">
                                <span className="text-purple-500/30">{item.quantity_g}g</span>
                                <span className="text-orange-400/50">{item.calories} kcal</span>
                                <span className="text-pink-400/50">{item.protein_g}g P</span>
                              </div>
                            </div>
                            {/* Substitute button */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isSub && (
                                <button
                                  onClick={() => resetSubstitution(mi, ii)}
                                  className="text-[8px] font-mono-cyber text-purple-500/30 hover:text-purple-300 transition-colors px-1"
                                  title="Desfazer substituição"
                                >
                                  ↩
                                </button>
                              )}
                              <button
                                onClick={() => handleSubstitute(mi, ii, item)}
                                className="p-1 rounded-lg text-purple-500/25 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                title="Substituir alimento"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Substitute modal */}
      {substituteTarget && (
        <FoodSubstituteModal
          open={!!substituteTarget}
          onClose={() => setSubstituteTarget(null)}
          item={substituteTarget.item}
          onSelect={applySubstitution}
        />
      )}
    </div>
  );
}