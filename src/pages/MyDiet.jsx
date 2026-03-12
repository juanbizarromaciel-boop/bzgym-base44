import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Utensils, Flame, Beef, Wheat, Droplets, Clock } from "lucide-react";

const GOAL_LABELS = { bulking: "BULKING", cutting: "CUTTING", manutencao: "MANUTENÇÃO" };
const GOAL_COLORS = {
  bulking: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
  cutting: "bg-pink-500/10 border-pink-500/20 text-pink-300",
  manutencao: "bg-purple-500/10 border-purple-500/20 text-purple-300"
};

export default function MyDiet() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: allPlans = [] } = useQuery({ queryKey: ["diet_plans"], queryFn: () => base44.entities.DietPlan.list() });

  useEffect(() => {
    if (user && students.length > 0) {
      const found = students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase());
      setStudent(found || null);
    }
  }, [user, students]);

  const myPlans = student ? allPlans.filter(p => p.student_id === student.id && p.active !== false) : [];

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
      <div className="mb-8">
        <p className="text-[10px] font-mono-cyber text-purple-500/30 tracking-[0.4em] mb-2">PLANO NUTRICIONAL</p>
        <h1 className="font-cyber text-3xl text-white tracking-widest" style={{ textShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
          MINHA DIETA
        </h1>
      </div>

      {myPlans.length === 0 ? (
        <div className="text-center py-20 text-purple-500/30">
          <Utensils className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-mono-cyber text-sm">// nenhuma dieta atribuída<br />// fale com seu personal</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myPlans.map(plan => (
            <div key={plan.id} className="cyber-card rounded-xl border border-purple-900/20 overflow-hidden">
              {/* Plan header */}
              <div className="p-5 border-b border-purple-900/15" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.05), transparent)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-cyber text-lg text-white tracking-wider">{plan.name}</h2>
                    {plan.goal && (
                      <Badge className={`mt-2 text-xs border ${GOAL_COLORS[plan.goal]}`}>{GOAL_LABELS[plan.goal]}</Badge>
                    )}
                  </div>
                  {plan.total_calories > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="font-cyber text-2xl text-orange-400" style={{ textShadow: '0 0 10px rgba(251,146,60,0.5)' }}>{plan.total_calories}</p>
                      <p className="text-[10px] font-mono-cyber text-orange-400/40 tracking-wider">KCAL/DIA</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Macros */}
              {(plan.protein_g > 0 || plan.carbs_g > 0 || plan.fat_g > 0) && (
                <div className="grid grid-cols-3 divide-x divide-purple-900/20 border-b border-purple-900/15">
                  {[
                    { label: "PROTEÍNA", val: plan.protein_g, icon: Beef, color: "text-pink-400", glow: "rgba(236,72,153,0.6)", unit: "g" },
                    { label: "CARBOIDRATO", val: plan.carbs_g, icon: Wheat, color: "text-yellow-400", glow: "rgba(250,204,21,0.6)", unit: "g" },
                    { label: "GORDURA", val: plan.fat_g, icon: Droplets, color: "text-cyan-400", glow: "rgba(6,182,212,0.6)", unit: "g" },
                  ].map(m => (
                    <div key={m.label} className="py-4 flex flex-col items-center gap-1">
                      <m.icon className={`w-4 h-4 ${m.color}`} style={{ filter: `drop-shadow(0 0 4px ${m.glow})` }} />
                      <p className={`font-cyber text-xl ${m.color}`} style={{ textShadow: `0 0 8px ${m.glow}` }}>{m.val}<span className="text-xs ml-0.5">{m.unit}</span></p>
                      <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Meals */}
              {plan.meals?.length > 0 && (
                <div className="p-4 space-y-3">
                  <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-3">Refeições do dia</p>
                  {plan.meals.map((meal, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-4 border border-purple-900/15 transition-all hover:border-purple-500/20"
                      style={{ background: 'rgba(0,0,0,0.4)' }}
                    >
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
                      {meal.foods && (
                        <p className="text-xs text-purple-300/50 leading-relaxed pl-8">{meal.foods}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {plan.notes && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-purple-400/30 font-mono-cyber italic">// {plan.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}