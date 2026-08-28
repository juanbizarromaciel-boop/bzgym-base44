import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Flame, Clock, Calculator, CheckSquare, History, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "../components/shared/PageHeader";
import MacroDonutChart from "../components/diet/MacroDonutChart";
import CalorieSimulator from "../components/diet/CalorieSimulator";
import DietChecklist from "../components/diet/DietChecklist";
import DietHistory from "../components/diet/DietHistory";
import MealDetailModal from "../components/diet/MealDetailModal";
import AiDietEvolutionDialog from "../components/diet/AiDietEvolutionDialog";
import DietSectionTabs from "@/components/diet/DietSectionTabs";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const GOAL_LABELS = { bulking: "BULKING", cutting: "CUTTING", manutencao: "MANUTENÇÃO" };
const GOAL_COLORS = {
  bulking: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
  cutting: "bg-pink-500/10 border-pink-500/20 text-pink-300",
  manutencao: "bg-purple-500/10 border-purple-500/20 text-purple-300",
};

const VALID_TABS = ["plano", "checklist", "historico", "simulador"];

export default function MyDiet() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    return VALID_TABS.includes(requestedTab) ? requestedTab : "plano";
  });
  const [simPlanId, setSimPlanId] = useState("");
  const [historyPlanId, setHistoryPlanId] = useState("");
  const [mealDetail, setMealDetail] = useState(null); // { plan, mealIndex }
  const [aiDietTarget, setAiDietTarget] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      let mergedUser = authUser;
      try {
        const profileResponse = await base44.functions.invoke('getCurrentUserProfile', {});
        mergedUser = profileResponse.data.user || authUser;
      } catch (error) {
        mergedUser = authUser;
      }
      const baseRole = mergedUser.role || "user";
      const hasSubscriberProfile = mergedUser.account_type === "assinante" || mergedUser.assinatura_status || mergedUser.assinatura_vencimento || mergedUser.assinatura_origem || mergedUser.stripe_subscription_id;
      const role = hasSubscriberProfile && !["admin", "personal", "recente", "bloqueado"].includes(baseRole)
        ? "assinante"
        : baseRole;
      setUser({ ...mergedUser, role });
      setLoadingUser(false);
    }).catch(() => {
      setLoadingUser(false);
    });
  }, []);

  const { data: students = [], isLoading: loadingStudents } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const matchedStudent = user ? students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase()) : null;
  const { data: allPlans = [] } = useQuery({ queryKey: ["diet_plans"], queryFn: () => base44.entities.DietPlan.list() });

  useEffect(() => {
    if (user && students.length > 0) {
      setStudent(students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase()) || null);
    }
  }, [user, students]);

  const isSubscriber = user?.role === "assinante" || user?.account_type === "assinante";
  const myPlans = allPlans.filter(p => p.active !== false && (
    (student && p.student_id === student.id) ||
    (user && (p.student_id === user.email || p.usuarioId === user.email || p.assinanteId === user.email || p.alunoId === user.email))
  ));
  const simPlan = simPlanId ? myPlans.find(p => p.id === simPlanId) : myPlans[0];
  const histPlan = historyPlanId ? myPlans.find(p => p.id === historyPlanId) : myPlans[0];

  // Plans that have items-based meals (support checklist/history)
  const plansWithItems = myPlans.filter(p => (p.meals || []).some(m => (m.items || []).length > 0));

  if (loadingUser || loadingStudents) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  if (user && !(student || matchedStudent) && !isSubscriber) return (
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
      {/* Page Header with cyberpunk style */}
      <PageHeader
        title="Minha Dieta"
        subtitle="Plano Nutricional Personalizado"
        accentColor="#10b981"
      />

      <motion.div variants={fadeUp}>
        <DietSectionTabs activeTab={activeTab} onChange={setActiveTab} />
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
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-2xl border overflow-hidden p-6"
                    style={{
                      borderColor: 'rgba(16,185,129,0.35)',
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))',
                      boxShadow: '0 0 40px rgba(16,185,129,0.15), inset 0 0 25px rgba(16,185,129,0.08), inset 0 1px 0 rgba(16,185,129,0.2)'
                    }}>
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent)' }} />
                    <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l rounded-tl opacity-75" style={{ borderColor: 'rgba(16,185,129,0.6)', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />

                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex-1">
                        <h2 className="font-cyber text-2xl font-black text-white tracking-wider mb-2">{plan.name}</h2>
                        <div className="flex flex-wrap gap-2">
                          {plan.goal && (
                            <Badge className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs border font-bold tracking-widest ${GOAL_COLORS[plan.goal]}`}
                              style={{
                                boxShadow: `0 0 15px ${plan.goal === 'cutting' ? 'rgba(236,72,153,0.3)' : plan.goal === 'bulking' ? 'rgba(6,182,212,0.3)' : 'rgba(168,85,247,0.3)'}`
                              }}>
                              <Sparkles className="w-3 h-3" />
                              {GOAL_LABELS[plan.goal]}
                            </Badge>
                          )}
                          {isSubscriber && <button onClick={() => setAiDietTarget(plan)} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs border font-bold tracking-widest border-emerald-500/25 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20">
                            <Sparkles className="w-3 h-3" /> EVOLUIR MINHA DIETA COM IA
                          </button>}
                          {isSubscriber && <button onClick={() => setAiDietTarget(plan)} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs border font-bold tracking-widest border-cyan-500/25 text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20">
                            TROCAR ALIMENTOS COM IA
                          </button>}
                        </div>
                      </div>
                      {plan.total_calories > 0 && (
                        <motion.div
                          className="text-right flex-shrink-0 p-4 rounded-xl border"
                          style={{
                            borderColor: 'rgba(251,191,36,0.35)',
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.05))',
                            boxShadow: '0 0 20px rgba(251,191,36,0.2), inset 0 0 12px rgba(251,191,36,0.1)'
                          }}
                          whileHover={{ scale: 1.05 }}>
                          <p className="font-cyber text-3xl font-black" style={{
                            color: '#fbbf24',
                            textShadow: '0 0 15px rgba(251,191,36,0.8), 0 0 30px rgba(251,191,36,0.4)'
                          }}>
                            {plan.total_calories}
                          </p>
                          <p className="text-[9px] font-mono-cyber text-yellow-400/70 tracking-widest mt-1">KCAL/DIA</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Macro chart */}
                  {(plan.protein_g > 0 || plan.carbs_g > 0 || plan.fat_g > 0) && (
                    <MacroDonutChart protein={plan.protein_g} carbs={plan.carbs_g} fat={plan.fat_g} targetCalories={plan.total_calories} />
                  )}

                  {/* Meals — clickable cards */}
                  {plan.meals?.length > 0 && (
                    <div className="space-y-2">
                      {plan.meals.map((meal, i) => {
                        const mealCal = Math.round((meal.items || []).reduce((s, it) => s + (it.calories || 0), 0) || meal.calories || 0);
                        const mealProt = (meal.items || []).reduce((s, it) => s + (it.protein_g || 0), 0).toFixed(1);
                        const mealCarb = (meal.items || []).reduce((s, it) => s + (it.carbs_g || 0), 0).toFixed(1);
                        const mealFat = (meal.items || []).reduce((s, it) => s + (it.fat_g || 0), 0).toFixed(1);
                        return (
                           <motion.button
                             key={i}
                             onClick={() => setMealDetail({ plan, mealIndex: i })}
                             className="w-full text-left rounded-2xl border p-5 transition-all group relative overflow-hidden"
                             whileHover={{ scale: 1.02, y: -2 }}
                             whileTap={{ scale: 0.98 }}
                             style={{
                               background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
                               borderColor: 'rgba(16,185,129,0.3)',
                               boxShadow: '0 0 25px rgba(16,185,129,0.1), inset 0 0 15px rgba(16,185,129,0.05)'
                             }}>
                             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                               style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.15), transparent 70%)` }} />
                             <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                               style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent)' }} />

                             <div className="flex items-center justify-between gap-4 relative z-10">
                               <div className="flex items-center gap-4 flex-1 min-w-0">
                                 <motion.div
                                   className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-cyber text-lg font-black border"
                                   style={{
                                     background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                                     borderColor: 'rgba(16,185,129,0.4)',
                                     color: '#10b981',
                                     boxShadow: '0 0 15px rgba(16,185,129,0.3), inset 0 0 8px rgba(16,185,129,0.2)',
                                     textShadow: '0 0 8px rgba(16,185,129,0.8)'
                                   }}
                                   whileHover={{ scale: 1.15, rotate: 3 }}>
                                   {i + 1}
                                 </motion.div>
                                 <div className="min-w-0 flex-1">
                                   <p className="font-bold text-white text-sm truncate">{meal.name}</p>
                                   <div className="flex items-center gap-2.5 mt-1.5 text-[9px] font-mono-cyber flex-wrap">
                                     {meal.time && (
                                       <span className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'rgba(16,185,129,0.12)', color: 'rgba(16,185,129,0.8)' }}>
                                         <Clock className="w-2.5 h-2.5" />
                                         {meal.time}
                                       </span>
                                     )}
                                     <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(168,85,247,0.12)', color: 'rgba(168,85,247,0.7)' }}>
                                       {(meal.items || []).length} alimentos
                                     </span>
                                   </div>
                                 </div>
                               </div>
                               <div className="flex items-center gap-4 flex-shrink-0">
                                 <div className="text-right">
                                   <motion.p
                                     className="text-sm font-cyber font-bold flex items-center gap-1.5 justify-end mb-1"
                                     style={{
                                       color: '#fbbf24',
                                       textShadow: '0 0 10px rgba(251,191,36,0.6)'
                                     }}
                                     whileHover={{ scale: 1.1 }}>
                                     <Flame className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.8))' }} />
                                     {mealCal} kcal
                                   </motion.p>
                                   <p className="text-[8px] font-mono-cyber text-green-400/60 hidden sm:block tracking-wider">
                                     P: {mealProt}g · C: {mealCarb}g · G: {mealFat}g
                                   </p>
                                 </div>
                                 <ChevronRight className="w-5 h-5 text-green-400/60 group-hover:text-green-400 group-hover:translate-x-1 transition-all relative z-10"
                                   style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
                               </div>
                             </div>
                           </motion.button>
                         );
                        })}
                    </div>
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
      {/* Meal detail modal — read-only for student */}
      <MealDetailModal
        open={!!mealDetail}
        onClose={() => setMealDetail(null)}
        meal={mealDetail ? mealDetail.plan.meals[mealDetail.mealIndex] : null}
        mealIndex={mealDetail?.mealIndex}
        onSave={() => {}}
        readOnly={true}
      />
      <AiDietEvolutionDialog
        open={!!aiDietTarget}
        onOpenChange={() => setAiDietTarget(null)}
        plan={aiDietTarget}
        owner={student || user}
        currentUser={user}
        allPlans={allPlans}
        selfMode={isSubscriber}
      />
    </motion.div>
  );
}