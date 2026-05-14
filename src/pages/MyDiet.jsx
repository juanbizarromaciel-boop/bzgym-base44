import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Flame, Clock, Calculator, CheckSquare, History } from "lucide-react";
import { motion } from "framer-motion";
import MacroDonutChart from "../components/diet/MacroDonutChart";
import CalorieSimulator from "../components/diet/CalorieSimulator";
import DietChecklist from "../components/diet/DietChecklist";
import DietHistory from "../components/diet/DietHistory";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const GOAL_LABELS = { bulking: "BULKING", cutting: "CUTTING", manutencao: "MANUTENÇÃO" };
const GOAL_COLORS = {
  bulking: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
  cutting: "bg-pink-500/10 border-pink-500/20 text-pink-300",
  manutencao: "bg-purple-500/10 border-purple-500/20 text-purple-300",
};

const TABS = [
  { id: "plano", label: "MEU PLANO", icon: Utensils },
  { id: "checklist", label: "CHECKLIST", icon: CheckSquare },
  { id: "historico", label: "HISTÓRICO", icon: History },
  { id: "simulador", label: "SIMULADOR", icon: Calculator },
];

export default function MyDiet() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("plano");
  const [simPlanId, setSimPlanId] = useState("");
  const [historyPlanId, setHistoryPlanId] = useState("");

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: allPlans = [] } = useQuery({ queryKey: ["diet_plans"], queryFn: () => base44.entities.DietPlan.list() });

  useEffect(() => {
    if (user && students.length > 0) {
      setStudent(students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase()) || null);
    }
  }, [user, students]);

  const myPlans = student ? allPlans.filter(p => p.student_id === student.id && p.active !== false) : [];
  const simPlan = simPlanId ? myPlans.find(p => p.id === simPlanId) : myPlans[0];
  const histPlan = historyPlanId ? myPlans.find(p => p.id === historyPlanId) : myPlans[0];

  // Plans that have items-based meals (support checklist/history)
  const plansWithItems = myPlans.filter(p => (p.meals || []).some(m => (m.items || []).length > 0));

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (user && students.length > 0 && !student) return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
        <Utensils className="w-8 h-8 text-purple-500/40" />
      </div>
      <h2 className="font-cyber text-lg text-white tracking-widest mb-3">PERFIL NÃO ENCONTRADO</h2>
      <p className="text-purple-400/40 text-sm font-mono-cyber">// contate seu personal trainer</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <p className="text-[10px] font-mono-cyber text-purple-500/30 tracking-[0.4em] mb-1">PLANO NUTRICIONAL</p>
        <h1 className="font-cyber text-3xl text-white tracking-widest" style={{ textShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
          MINHA DIETA
        </h1>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 mb-6 p-1 rounded-xl border border-purple-900/20 bg-black/40 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? "bg-purple-500/15 text-purple-300 border border-purple-500/25"
                : "text-purple-500/40 hover:text-purple-300"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ── PLANO TAB ── */}
      {activeTab === "plano" && (
        <>
          {myPlans.length === 0 ? (
            <motion.div variants={fadeUp} className="text-center py-20 text-purple-500/30">
              <Utensils className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-mono-cyber text-sm">// nenhuma dieta atribuída<br />// fale com seu personal</p>
            </motion.div>
          ) : (
            <motion.div variants={stagger} className="space-y-6">
              {myPlans.map(plan => (
                <motion.div key={plan.id} variants={fadeUp} className="space-y-3">
                  {/* Plan header */}
                  <div className="cyber-card rounded-xl border border-purple-900/20 p-5"
                    style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.05), transparent)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-cyber text-lg text-white tracking-wider">{plan.name}</h2>
                        {plan.goal && <Badge className={`mt-2 text-xs border ${GOAL_COLORS[plan.goal]}`}>{GOAL_LABELS[plan.goal]}</Badge>}
                      </div>
                      {plan.total_calories > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className="font-cyber text-2xl text-orange-400" style={{ textShadow: '0 0 10px rgba(251,146,60,0.5)' }}>{plan.total_calories}</p>
                          <p className="text-[10px] font-mono-cyber text-orange-400/40 tracking-wider">KCAL/DIA</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Macro chart */}
                  {(plan.protein_g > 0 || plan.carbs_g > 0 || plan.fat_g > 0) && (
                    <MacroDonutChart protein={plan.protein_g} carbs={plan.carbs_g} fat={plan.fat_g} targetCalories={plan.total_calories} />
                  )}

                  {/* Meals */}
                  {plan.meals?.length > 0 && (
                    <div className="space-y-3">
                      {plan.meals.map((meal, i) => (
                        <div key={i} className="rounded-2xl border overflow-hidden"
                          style={{ background: 'rgba(7,5,22,0.96)', borderColor: 'rgba(168,85,247,0.15)' }}>
                          {/* Meal header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b"
                            style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center flex-shrink-0">
                                <span className="font-cyber text-[9px] text-purple-400">{i + 1}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-white text-sm">{meal.name}</h3>
                                {meal.time && (
                                  <div className="flex items-center gap-1 mt-0.5 text-purple-400/40">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span className="text-[9px] font-mono-cyber">{meal.time}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {meal.calories > 0 && (
                              <div className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400/70" />
                                <span className="text-xs font-mono-cyber text-orange-400/70">{Math.round(meal.calories)} kcal</span>
                              </div>
                            )}
                          </div>

                          {/* Food items */}
                          {(meal.items || []).length > 0 && (
                            <div className="divide-y" style={{ borderColor: 'rgba(168,85,247,0.07)' }}>
                              {(meal.items || []).map((item, j) => (
                                <div key={j} className="flex items-center justify-between px-4 py-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">{item.food_name}</span>
                                    <span className="text-[10px] text-purple-500/40 font-mono-cyber flex-shrink-0">{item.quantity_g}g</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-mono-cyber flex-shrink-0 ml-3">
                                    <span className="text-orange-400/80">{item.calories} kcal</span>
                                    <span className="text-pink-400/80 hidden sm:inline">{item.protein_g}g P</span>
                                    <span className="text-yellow-400/80 hidden sm:inline">{item.carbs_g}g C</span>
                                    <span className="text-cyan-400/80 hidden sm:inline">{item.fat_g}g G</span>
                                  </div>
                                </div>
                              ))}
                              {/* Meal total */}
                              <div className="flex items-center justify-between px-4 py-2.5"
                                style={{ background: 'rgba(168,85,247,0.04)' }}>
                                <span className="text-[9px] font-mono-cyber text-purple-500/30 tracking-wider">TOTAL</span>
                                <div className="flex items-center gap-3 text-[9px] font-mono-cyber">
                                  <span className="text-orange-400">{Math.round((meal.items || []).reduce((s, it) => s + (it.calories || 0), 0))} kcal</span>
                                  <span className="text-pink-400 hidden sm:inline">{((meal.items || []).reduce((s, it) => s + (it.protein_g || 0), 0)).toFixed(1)}g P</span>
                                  <span className="text-yellow-400 hidden sm:inline">{((meal.items || []).reduce((s, it) => s + (it.carbs_g || 0), 0)).toFixed(1)}g C</span>
                                  <span className="text-cyan-400 hidden sm:inline">{((meal.items || []).reduce((s, it) => s + (it.fat_g || 0), 0)).toFixed(1)}g G</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Legado: texto livre */}
                          {!(meal.items?.length) && meal.foods && (
                            <p className="text-xs text-purple-300/50 leading-relaxed px-4 py-3">{meal.foods}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {plan.notes && (
                    <p className="text-xs text-purple-400/30 font-mono-cyber px-2 italic">// {plan.notes}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* ── CHECKLIST TAB ── */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          {plansWithItems.length === 0 ? (
            <div className="text-center py-20 text-purple-500/30">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-mono-cyber text-sm">// nenhuma dieta com alimentos detalhados<br />// peça ao seu personal para atualizar seu plano</p>
            </div>
          ) : (
            plansWithItems.map(plan => (
              <div key={plan.id}>
                {plansWithItems.length > 1 && (
                  <p className="text-xs font-cyber text-white tracking-wider mb-3">{plan.name}</p>
                )}
                <DietChecklist plan={plan} student={student} />
              </div>
            ))
          )}
        </div>
      )}

      {/* ── HISTÓRICO TAB ── */}
      {activeTab === "historico" && (
        <div className="space-y-4">
          {plansWithItems.length === 0 ? (
            <div className="text-center py-20 text-purple-500/30">
              <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-mono-cyber text-sm">// nenhum histórico disponível</p>
            </div>
          ) : (
            <>
              {plansWithItems.length > 1 && (
                <div className="mb-4">
                  <p className="text-purple-400/60 text-[10px] tracking-wider font-mono-cyber mb-1.5 uppercase">Ver histórico do plano</p>
                  <Select value={historyPlanId || plansWithItems[0]?.id} onValueChange={setHistoryPlanId}>
                    <SelectTrigger className="cyber-input w-full sm:w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                      {plansWithItems.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DietHistory student={student} plan={histPlan || plansWithItems[0]} />
            </>
          )}
        </div>
      )}

      {/* ── SIMULADOR TAB ── */}
      {activeTab === "simulador" && (
        <div>
          {myPlans.length > 1 && (
            <div className="mb-5">
              <p className="text-purple-400/60 text-[10px] tracking-wider font-mono-cyber mb-1.5 uppercase">Simular com base no plano</p>
              <Select value={simPlanId || myPlans[0]?.id} onValueChange={setSimPlanId}>
                <SelectTrigger className="cyber-input w-full sm:w-72"><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  {myPlans.map(p => <SelectItem key={p.id} value={p.id} className="text-white">{p.name} — {p.total_calories} kcal</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {myPlans.length === 0 ? (
            <div className="text-center py-20 text-purple-500/30">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-mono-cyber text-sm">// você precisa ter uma dieta para simular</p>
            </div>
          ) : (
            <CalorieSimulator defaultCalories={simPlan?.total_calories || 0} />
          )}
        </div>
      )}
    </motion.div>
  );
}