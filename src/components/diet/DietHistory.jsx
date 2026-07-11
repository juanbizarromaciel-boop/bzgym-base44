import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, Flame, CheckCircle2, Calendar, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function MacroBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono-cyber text-purple-500/40 w-8 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono-cyber text-purple-400/60 w-12 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

export default function DietHistory({ student, plan }) {
  const [expandedDay, setExpandedDay] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["diet_logs_history", student?.id, student?.email, plan?.id],
    queryFn: async () => {
      const ids = [student.id, student.email].filter(Boolean);
      const lists = await Promise.all(ids.map(id => base44.entities.DietLog.filter({ student_id: id, plan_id: plan.id })));
      return lists.flat().filter((log, index, list) => list.findIndex(l => l.id === log.id) === index);
    },
    enabled: !!student?.id && !!plan?.id,
    staleTime: 30000,
  });

  // Sort by date desc — show all days including today
  const today = new Date().toISOString().split("T")[0];
  const history = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(l => l.date <= today)
    .filter(l => (l.progress_percent || 0) > 0 || Object.keys(l.checked_items || {}).length > 0);

  if (isLoading) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (history.length === 0) return (
    <div className="text-center py-16 text-purple-500/30">
      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
      <p className="font-mono-cyber text-sm">// nenhum histórico ainda<br />// comece a marcar seus alimentos!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="cyber-card rounded-xl p-3 border border-purple-900/20 text-center">
          <p className="font-cyber text-xl text-purple-300">{history.length}</p>
          <p className="text-[9px] font-mono-cyber text-purple-500/30 tracking-wider mt-0.5">DIAS REGISTRADOS</p>
        </div>
        <div className="cyber-card rounded-xl p-3 border border-emerald-900/20 text-center">
          <p className="font-cyber text-xl text-emerald-400">
            {history.filter(l => (l.progress_percent || 0) >= 100).length}
          </p>
          <p className="text-[9px] font-mono-cyber text-emerald-500/30 tracking-wider mt-0.5">DIAS COMPLETOS</p>
        </div>
        <div className="cyber-card rounded-xl p-3 border border-orange-900/20 text-center">
          <p className="font-cyber text-xl text-orange-400">
            {history.length > 0 ? Math.round(history.reduce((s, l) => s + (l.total_calories_consumed || 0), 0) / history.length) : 0}
          </p>
          <p className="text-[9px] font-mono-cyber text-orange-500/30 tracking-wider mt-0.5">KCAL MÉDIA/DIA</p>
        </div>
      </div>

      {/* Daily logs */}
      {history.map((log) => {
        const isExpanded = expandedDay === log.id;
        const prog = log.progress_percent || 0;
        const isComplete = prog >= 100;

        // Build meal detail from plan + log data
        const meals = plan ? (plan.meals || []).map((meal, mi) => ({
          ...meal,
          items: (meal.items || []).map((item, ii) => {
            const k = `${mi}_${ii}`;
            const sub = (log.substitutions || {})[k];
            const wasChecked = !!(log.checked_items || {})[k];
            return { ...(sub || item), _sub: !!sub, _checked: wasChecked };
          })
        })) : [];

        return (
          <div key={log.id}
            className="rounded-2xl overflow-hidden border transition-all"
            style={{
              background: 'rgba(7,5,22,0.96)',
              borderColor: isComplete ? 'rgba(52,211,153,0.25)' : 'rgba(168,85,247,0.15)'
            }}
          >
            {/* Day header */}
            <button
              onClick={() => setExpandedDay(isExpanded ? null : log.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isComplete ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-purple-500/10 border border-purple-500/20"
                }`}>
                  {isComplete
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    : <Calendar className="w-4 h-4 text-purple-400/60" />
                  }
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white capitalize">
                    {log.date === today
                      ? "Hoje"
                      : format(parseISO(log.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono-cyber text-purple-500/35">{prog}% completo</span>
                    {log.total_calories_consumed > 0 && (
                      <span className="text-[9px] font-mono-cyber text-orange-400/50 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />{log.total_calories_consumed} kcal
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Mini circle progress */}
                <div className="relative w-9 h-9 flex-shrink-0">
                  <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(168,85,247,0.1)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none"
                      stroke={isComplete ? '#34d399' : '#a855f7'}
                      strokeWidth="3"
                      strokeDasharray={`${prog * 0.88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-cyber text-white">
                    {prog}%
                  </span>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-purple-500/40" />
                  : <ChevronDown className="w-4 h-4 text-purple-500/40" />
                }
              </div>
            </button>

            {/* Expanded day detail */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="border-t px-4 pt-4 pb-3 space-y-4"
                    style={{ borderColor: 'rgba(168,85,247,0.1)' }}>

                    {/* Macro bars */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-mono-cyber text-purple-500/30 tracking-widest uppercase mb-2">Macros consumidos</p>
                      <MacroBar label="KCAL" value={`${log.total_calories_consumed || 0}`} max={plan?.total_calories || 0} color="#fb923c" />
                      <MacroBar label="PROT" value={`${log.total_protein_consumed || 0}g`} max={plan?.protein_g || 0} color="#f472b6" />
                      <MacroBar label="CARB" value={`${log.total_carbs_consumed || 0}g`} max={plan?.carbs_g || 0} color="#facc15" />
                      <MacroBar label="GORD" value={`${log.total_fat_consumed || 0}g`} max={plan?.fat_g || 0} color="#22d3ee" />
                    </div>

                    {/* Meals breakdown */}
                    {meals.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-mono-cyber text-purple-500/30 tracking-widest uppercase">Refeições</p>
                        {meals.map((meal, mi) => {
                          const checkedItems = meal.items.filter(it => it._checked);
                          if (meal.items.length === 0) return null;
                          return (
                            <div key={mi} className="rounded-xl border p-3"
                              style={{ borderColor: 'rgba(168,85,247,0.1)', background: 'rgba(0,0,0,0.3)' }}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-white">{meal.name}</span>
                                <span className="text-[9px] font-mono-cyber text-purple-500/35">
                                  {checkedItems.length}/{meal.items.length}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {meal.items.map((item, ii) => (
                                  <div key={ii} className={`flex items-center justify-between text-[10px] font-mono-cyber transition-opacity ${item._checked ? "opacity-100" : "opacity-30"}`}>
                                    <div className="flex items-center gap-1.5">
                                      {item._checked
                                        ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                        : <div className="w-3 h-3 rounded-full border border-purple-500/30 flex-shrink-0" />
                                      }
                                      <span className={`${item._checked ? "text-white" : "text-purple-500/40"}`}>
                                        {item.food_name}
                                        {item._sub && <span className="text-cyan-400/60 ml-1">(sub)</span>}
                                      </span>
                                    </div>
                                    <span className="text-purple-500/40">{item.quantity_g}g · {item.calories} kcal</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}