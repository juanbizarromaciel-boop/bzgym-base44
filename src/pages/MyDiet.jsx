import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Flame, Clock, Calculator } from "lucide-react";
import MacroDonutChart from "../components/diet/MacroDonutChart";
import CalorieSimulator from "../components/diet/CalorieSimulator";

const GOAL_LABELS = { bulking: "BULKING", cutting: "CUTTING", manutencao: "MANUTENÇÃO" };
const GOAL_COLORS = {
  bulking: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
  cutting: "bg-pink-500/10 border-pink-500/20 text-pink-300",
  manutencao: "bg-purple-500/10 border-purple-500/20 text-purple-300",
};

const TABS = [
  { id: "plano", label: "MEU PLANO", icon: Utensils },
  { id: "simulador", label: "SIMULADOR", icon: Calculator },
];

export default function MyDiet() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("plano");
  const [simPlanId, setSimPlanId] = useState("");

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
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-mono-cyber text-purple-500/30 tracking-[0.4em] mb-1">PLANO NUTRICIONAL</p>
        <h1 className="font-cyber text-3xl text-white tracking-widest" style={{ textShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
          MINHA DIETA
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl border border-purple-900/20 bg-black/40" style={{ width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-purple-500/15 text-purple-300 border border-purple-500/25"
                : "text-purple-500/40 hover:text-purple-300"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* PLANO TAB */}
      {activeTab === "plano" && (
        <>
          {myPlans.length === 0 ? (
            <div className="text-center py-20 text-purple-500/30">
              <Utensils className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-mono-cyber text-sm">// nenhuma dieta atribuída<br />// fale com seu personal</p>
            </div>
          ) : (
            <div className="space-y-6">
              {myPlans.map(plan => (
                <div key={plan.id} className="space-y-3">
                  {/* Plan header */}
                  <div
                    className="cyber-card rounded-xl border border-purple-900/20 p-5"
                    style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.05), transparent)' }}
                  >
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
                    <div className="cyber-card rounded-xl border border-purple-900/20 p-4">
                      <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-3">Refeições do dia</p>
                      <div className="space-y-2">
                        {plan.meals.map((meal, i) => (
                          <div key={i} className="rounded-xl p-4 border border-purple-900/15 hover:border-purple-500/20 transition-all" style={{ background: 'rgba(0,0,0,0.4)' }}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/15 flex items-center justify-center flex-shrink-0">
                                  <span className="font-cyber text-[9px] text-purple-400">{i + 1}</span>
                                </div>
                                <h3 className="font-semibold text-white text-sm">{meal.name}</h3>
                              </div>
                              <div className="flex items-center gap-3">
                                {meal.time && (
                                  <div className="flex items-center gap-1 text-purple-400/40">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs font-mono-cyber">{meal.time}</span>
                                  </div>
                                )}
                                {meal.calories > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-400/70" />
                                    <span className="text-xs font-mono-cyber text-orange-400/70">{meal.calories} kcal</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {meal.foods && <p className="text-xs text-purple-300/50 leading-relaxed pl-8">{meal.foods}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.notes && (
                    <p className="text-xs text-purple-400/30 font-mono-cyber px-2 italic">// {plan.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SIMULADOR TAB */}
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
    </div>
  );
}