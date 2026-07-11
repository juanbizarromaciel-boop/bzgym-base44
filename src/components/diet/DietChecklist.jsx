import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, RefreshCw, ChevronDown, ChevronUp, Flame, Clock, RotateCcw, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FoodSubstituteModal from "./FoodSubstituteModal";
import { toast } from "sonner";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export default function DietChecklist({ plan, student }) {
  const qc = useQueryClient();
  const today = getTodayKey();
  const saveTimer = useRef(null);
  const pendingSave = useRef(null);
  const isSaving = useRef(false);

  const [checked, setChecked] = useState({});
  const [substitutions, setSubstitutions] = useState({});
  const [expandedMeals, setExpandedMeals] = useState({});
  const [substituteTarget, setSubstituteTarget] = useState(null);
  const [logId, setLogId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved

  // Fetch today's log from DB
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["diet_logs", student?.id, student?.email, plan.id, today],
    queryFn: async () => {
      const ids = [student.id, student.email].filter(Boolean);
      const lists = await Promise.all(ids.map(id => base44.entities.DietLog.filter({ student_id: id, plan_id: plan.id, date: today })));
      return lists.flat().filter((log, index, list) => list.findIndex(l => l.id === log.id) === index);
    },
    enabled: !!student?.id,
    staleTime: 0,
  });

  // Hydrate state from DB on first load
  useEffect(() => {
    if (logs.length > 0) {
      const log = logs[0];
      setLogId(log.id);
      setChecked(log.checked_items || {});
      setSubstitutions(log.substitutions || {});
    } else {
      // No log for today — reset (new day)
      setLogId(null);
      setChecked({});
      setSubstitutions({});
    }
  }, [logs]);

  // Watch for day change (reinicia checklist ao virar o dia)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDay = getTodayKey();
      if (currentDay !== today) {
        qc.invalidateQueries({ queryKey: ["diet_logs"] });
        qc.invalidateQueries({ queryKey: ["diet_logs_history"] });
      }
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, [today, qc]);

  const buildPayload = useCallback((newChecked, newSubs) => {
    const allI = (plan.meals || []).flatMap((m, mi) =>
      (m.items || []).map((it, ii) => {
        const k = `${mi}_${ii}`;
        const item = newSubs[k] ? { ...newSubs[k] } : it;
        return newChecked[k] ? item : null;
      })
    ).filter(Boolean);

    const totalCal = allI.reduce((s, it) => s + (it.calories || 0), 0);
    const totalProt = allI.reduce((s, it) => s + (it.protein_g || 0), 0);
    const totalCarb = allI.reduce((s, it) => s + (it.carbs_g || 0), 0);
    const totalFat = allI.reduce((s, it) => s + (it.fat_g || 0), 0);
    const allKeys = (plan.meals || []).flatMap((m, mi) => (m.items || []).map((_, ii) => `${mi}_${ii}`));
    const checkedCount = allKeys.filter(k => newChecked[k]).length;
    const prog = allKeys.length > 0 ? Math.round((checkedCount / allKeys.length) * 100) : 0;

    return {
      student_id: student.id,
      plan_id: plan.id,
      date: today,
      checked_items: newChecked,
      substitutions: newSubs,
      total_calories_consumed: Math.round(totalCal),
      total_protein_consumed: parseFloat(totalProt.toFixed(1)),
      total_carbs_consumed: parseFloat(totalCarb.toFixed(1)),
      total_fat_consumed: parseFloat(totalFat.toFixed(1)),
      progress_percent: prog,
    };
  }, [plan, student, today]);

  // Flush pending save immediately (used when we need current logId)
  const flushSave = useCallback(async (payload, currentLogId) => {
    if (isSaving.current) return;
    isSaving.current = true;
    setSaveStatus("saving");
    try {
      if (currentLogId) {
        await base44.entities.DietLog.update(currentLogId, payload);
      } else {
        const newLog = await base44.entities.DietLog.create(payload);
        setLogId(newLog.id);
      }
      setSaveStatus("saved");
      qc.invalidateQueries({ queryKey: ["diet_logs_history"] });
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setSaveStatus("idle");
      toast.error("Erro ao salvar: " + e.message);
    }
    isSaving.current = false;

    // If another save was queued while we were saving, flush it now
    if (pendingSave.current) {
      const { p, id } = pendingSave.current;
      pendingSave.current = null;
      flushSave(p, id || logId);
    }
  }, [qc, logId]);

  // Debounced persist — queues payload and flushes after 600ms
  const persistState = useCallback((newChecked, newSubs) => {
    if (!student?.id) return;
    const payload = buildPayload(newChecked, newSubs);

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (isSaving.current) {
        // Queue for after current save finishes
        pendingSave.current = { p: payload, id: logId };
      } else {
        flushSave(payload, logId);
      }
    }, 600);
  }, [student, buildPayload, flushSave, logId]);

  // Build meals with substitutions applied
  const meals = (plan.meals || []).map((meal, mi) => ({
    ...meal,
    items: (meal.items || []).map((item, ii) => {
      const k = `${mi}_${ii}`;
      return substitutions[k] ? { ...substitutions[k], _substituted: true, _origKey: k } : item;
    })
  }));

  const allItems = meals.flatMap((m, mi) => (m.items || []).map((it, ii) => ({ ...it, key: `${mi}_${ii}` })));
  const totalItems = allItems.length;
  const checkedCount = allItems.filter(it => checked[it.key]).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const consumed = allItems.filter(it => checked[it.key]);
  const consumedCal = consumed.reduce((s, it) => s + (it.calories || 0), 0);
  const consumedProt = consumed.reduce((s, it) => s + (it.protein_g || 0), 0);
  const consumedCarb = consumed.reduce((s, it) => s + (it.carbs_g || 0), 0);
  const consumedFat = consumed.reduce((s, it) => s + (it.fat_g || 0), 0);

  const toggle = (key) => {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    persistState(next, substitutions);
  };

  const applySubstitution = (newItem) => {
    const k = `${substituteTarget.mealIdx}_${substituteTarget.itemIdx}`;
    const nextSubs = { ...substitutions, [k]: newItem };
    setSubstitutions(nextSubs);
    setSubstituteTarget(null);
    persistState(checked, nextSubs);
  };

  const resetSubstitution = (mi, ii) => {
    const k = `${mi}_${ii}`;
    const nextSubs = { ...substitutions };
    delete nextSubs[k];
    setSubstitutions(nextSubs);
    persistState(checked, nextSubs);
  };

  const resetAll = () => {
    if (!confirm("Resetar o checklist de hoje? Isso apaga o progresso atual.")) return;
    setChecked({});
    setSubstitutions({});
    persistState({}, {});
  };

  const toggleMeal = (idx) => setExpandedMeals(prev => ({ ...prev, [idx]: prev[idx] === false ? true : false }));

  if (isLoading) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Overall progress card */}
      <div className="cyber-card rounded-2xl border border-purple-900/20 p-5"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(168,85,247,0.03))' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.3em] uppercase mb-0.5">Progresso de Hoje</p>
            <h3 className="font-cyber text-lg text-white">
              {checkedCount}<span className="text-purple-500/50">/{totalItems}</span> alimentos
            </h3>
          </div>
          <div className="text-right">
            <p className="font-cyber text-3xl"
              style={{
                color: progress === 100 ? '#34d399' : '#a855f7',
                textShadow: progress === 100 ? '0 0 16px rgba(52,211,153,0.6)' : '0 0 12px rgba(168,85,247,0.5)'
              }}>
              {progress}%
            </p>
            {progress === 100 && <p className="text-[10px] text-emerald-400/60 font-mono-cyber">// meta atingida! 🎯</p>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-black/50 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              background: progress === 100
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #a855f7, #22d3ee)'
            }}
          />
        </div>

        {/* Consumed macros */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "KCAL", val: Math.round(consumedCal), total: Math.round(plan.total_calories || 0), color: "text-orange-400", totalColor: "text-orange-400/30" },
            { label: "PROT", val: consumedProt.toFixed(1) + "g", total: (plan.protein_g || 0) + "g", color: "text-pink-400", totalColor: "text-pink-400/30" },
            { label: "CARB", val: consumedCarb.toFixed(1) + "g", total: (plan.carbs_g || 0) + "g", color: "text-yellow-400", totalColor: "text-yellow-400/30" },
            { label: "GORD", val: consumedFat.toFixed(1) + "g", total: (plan.fat_g || 0) + "g", color: "text-cyan-400", totalColor: "text-cyan-400/30" },
          ].map(m => (
            <div key={m.label} className="rounded-xl bg-black/30 border border-purple-900/15 p-2.5 text-center">
              <p className={`font-cyber text-sm ${m.color}`}>{m.val}</p>
              <p className={`text-[9px] font-mono-cyber mt-0.5 ${m.totalColor}`}>/{m.total}</p>
              <p className="text-[7px] font-mono-cyber text-purple-500/25 tracking-widest mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Save status */}
          <div className="flex items-center gap-1.5">
            {saveStatus === "saving" && (
              <span className="text-[9px] font-mono-cyber text-purple-400/50 flex items-center gap-1">
                <div className="w-2 h-2 border border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
                salvando...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-[9px] font-mono-cyber text-emerald-400/60 flex items-center gap-1">
                <Save className="w-2.5 h-2.5" /> salvo
              </span>
            )}
          </div>
          <button onClick={resetAll} className="text-[9px] font-mono-cyber text-purple-500/30 hover:text-purple-300 flex items-center gap-1.5 transition-colors">
            <RotateCcw className="w-3 h-3" /> RESETAR DIA
          </button>
        </div>
      </div>

      {/* Meal cards */}
      <div className="space-y-3">
        {meals.map((meal, mi) => {
          const mealItems = meal.items || [];
          const mealChecked = mealItems.filter((_, ii) => checked[`${mi}_${ii}`]).length;
          const mealDone = mealItems.length > 0 && mealChecked === mealItems.length;
          const isExpanded = expandedMeals[mi] !== false; // default expanded
          const mealCal = Math.round(mealItems.reduce((s, it) => s + (it.calories || 0), 0));

          return (
            <div key={mi}
              className="rounded-2xl overflow-hidden border transition-all duration-300"
              style={{
                background: mealDone ? 'rgba(16,185,129,0.03)' : 'rgba(7,5,22,0.96)',
                borderColor: mealDone ? 'rgba(52,211,153,0.3)' : 'rgba(168,85,247,0.15)',
                boxShadow: mealDone ? '0 0 20px rgba(52,211,153,0.06)' : 'none'
              }}
            >
              {/* Meal header */}
              <button
                onClick={() => toggleMeal(mi)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    mealDone
                      ? "bg-emerald-500/15 border border-emerald-500/30"
                      : "bg-purple-500/10 border border-purple-500/20"
                  }`}>
                    {mealDone
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.7))' }} />
                      : <span className="font-cyber text-xs text-purple-400">{mi + 1}</span>
                    }
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{meal.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-mono-cyber text-purple-500/35">
                        {mealChecked}/{mealItems.length} alimentos
                      </span>
                      {mealCal > 0 && (
                        <span className="text-[9px] font-mono-cyber text-orange-400/50 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />{mealCal} kcal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {meal.time && (
                    <span className="text-[9px] font-mono-cyber text-purple-500/30 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{meal.time}
                    </span>
                  )}
                  <div className="w-12 h-1 bg-black/50 rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: mealItems.length > 0 ? `${(mealChecked / mealItems.length) * 100}%` : '0%',
                        background: mealDone ? '#34d399' : '#a855f7'
                      }}
                    />
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-purple-500/40" />
                    : <ChevronDown className="w-4 h-4 text-purple-500/40" />
                  }
                </div>
              </button>

              {/* Items list */}
              <AnimatePresence initial={false}>
                {isExpanded && mealItems.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t divide-y"
                      style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
                      {mealItems.map((item, ii) => {
                        const key = `${mi}_${ii}`;
                        const done = !!checked[key];
                        const isSub = !!item._substituted;

                        return (
                          <div key={ii}
                            className={`flex items-center gap-3 px-4 py-3 transition-all ${done ? "opacity-50" : ""}`}
                            style={{ borderColor: 'rgba(168,85,247,0.08)' }}
                          >
                            {/* Checkbox */}
                            <button onClick={() => toggle(key)} className="flex-shrink-0 transition-transform active:scale-90">
                              {done
                                ? <CheckCircle2 className="w-5 h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.7))' }} />
                                : <Circle className="w-5 h-5 text-purple-500/30 hover:text-purple-400 transition-colors" />
                              }
                            </button>

                            {/* Food info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium transition-all ${done ? "line-through text-purple-400/40" : "text-white"}`}>
                                  {item.food_name}
                                </span>
                                <span className="text-[10px] text-purple-500/40 font-mono-cyber">{item.quantity_g}g</span>
                                {isSub && (
                                  <span className="text-[8px] font-mono-cyber text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-1.5 py-0.5 rounded tracking-widest">
                                    SUBSTITUÍDO
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[9px] font-mono-cyber flex-wrap">
                                <span className="text-orange-400/70">{item.calories} kcal</span>
                                <span className="text-pink-400/70">{item.protein_g}g P</span>
                                <span className="text-yellow-400/70">{item.carbs_g}g C</span>
                                <span className="text-cyan-400/70">{item.fat_g}g G</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isSub && (
                                <button
                                  onClick={() => resetSubstitution(mi, ii)}
                                  title="Desfazer substituição"
                                  className="p-1.5 rounded-lg text-purple-500/30 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => setSubstituteTarget({ mealIdx: mi, itemIdx: ii, item })}
                                title="Substituir alimento"
                                className="p-1.5 rounded-lg text-purple-500/25 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Meal total */}
                    {mealItems.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-2.5 border-t"
                        style={{ borderColor: 'rgba(168,85,247,0.08)', background: 'rgba(168,85,247,0.03)' }}>
                        <span className="text-[9px] font-mono-cyber text-purple-500/30 tracking-wider">TOTAL DA REFEIÇÃO</span>
                        <div className="flex items-center gap-3 text-[9px] font-mono-cyber">
                          <span className="text-orange-400/70">{Math.round(mealItems.reduce((s, it) => s + (it.calories || 0), 0))} kcal</span>
                          <span className="text-pink-400/70 hidden sm:inline">{mealItems.reduce((s, it) => s + (it.protein_g || 0), 0).toFixed(1)}g P</span>
                          <span className="text-yellow-400/70 hidden sm:inline">{mealItems.reduce((s, it) => s + (it.carbs_g || 0), 0).toFixed(1)}g C</span>
                          <span className="text-cyan-400/70 hidden sm:inline">{mealItems.reduce((s, it) => s + (it.fat_g || 0), 0).toFixed(1)}g G</span>
                        </div>
                      </div>
                    )}
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