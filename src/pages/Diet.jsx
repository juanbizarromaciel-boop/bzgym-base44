import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Utensils, Flame, Beef, Wheat, Droplets, ChevronRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import DietPdfExport from "../components/diet/DietPdfExport";
import MealFoodEditor from "../components/diet/MealFoodEditor";
import MealDetailModal from "../components/diet/MealDetailModal";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const GOAL_LABELS = { bulking: "BULKING", cutting: "CUTTING", manutencao: "MANUTENÇÃO" };
const GOAL_COLORS = {
  bulking: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
  cutting: "bg-pink-500/10 border-pink-500/20 text-pink-300",
  manutencao: "bg-purple-500/10 border-purple-500/20 text-purple-300"
};

const emptyPlan = {
  student_id: "", name: "", goal: "manutencao",
  total_calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
  meals: [], notes: "", active: true
};
const emptyMeal = { name: "", time: "", calories: 0, items: [] };

export default function Diet() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStudent, setFilterStudent] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [mealDetail, setMealDetail] = useState(null); // { plan, mealIndex }
  const qc = useQueryClient();

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["diet_plans"], queryFn: () => base44.entities.DietPlan.list() });

  const createMut = useMutation({ mutationFn: (d) => base44.entities.DietPlan.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["diet_plans"] }); closeDialog(); toast.success("Dieta criada!"); } });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => base44.entities.DietPlan.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["diet_plans"] }); closeDialog(); toast.success("Dieta atualizada!"); } });
  const deleteMut = useMutation({ mutationFn: (id) => base44.entities.DietPlan.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["diet_plans"] }); toast.success("Dieta removida!"); } });

  const openCreate = () => { setEditing(null); setForm(emptyPlan); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  // Auto-calc total macros from all meal items
  const recalcTotals = (meals) => {
    const all = (meals || []).flatMap(m => m.items || []);
    return {
      total_calories: all.reduce((s, it) => s + (it.calories || 0), 0),
      protein_g: parseFloat(all.reduce((s, it) => s + (it.protein_g || 0), 0).toFixed(1)),
      carbs_g: parseFloat(all.reduce((s, it) => s + (it.carbs_g || 0), 0).toFixed(1)),
      fat_g: parseFloat(all.reduce((s, it) => s + (it.fat_g || 0), 0).toFixed(1)),
    };
  };

  const handleSave = () => {
    if (!form.student_id || !form.name) { toast.error("Aluno e nome são obrigatórios"); return; }
    const totals = recalcTotals(form.meals);
    const data = { ...form, ...totals };
    if (editing) updateMut.mutate({ id: editing.id, d: data });
    else createMut.mutate(data);
  };

  const addMeal = () => setForm({ ...form, meals: [...(form.meals || []), { ...emptyMeal }] });
  const updateMeal = (idx, field, val) => {
    const meals = [...(form.meals || [])];
    meals[idx] = { ...meals[idx], [field]: val };
    if (field === "items") {
      meals[idx].calories = val.reduce((s, it) => s + (it.calories || 0), 0);
    }
    setForm({ ...form, meals });
  };
  const removeMeal = (idx) => {
    const meals = [...(form.meals || [])];
    meals.splice(idx, 1);
    setForm({ ...form, meals });
  };

  const filtered = filterStudent === "all" ? plans : plans.filter(p => p.student_id === filterStudent);
  const getStudent = (id) => students.find(s => s.id === id);

  // Save meal items change from MealDetailModal
  const handleMealSave = (plan, mealIndex, newItems) => {
    const meals = (plan.meals || []).map((m, i) => {
      if (i !== mealIndex) return m;
      const cal = newItems.reduce((s, it) => s + (it.calories || 0), 0);
      return { ...m, items: newItems, calories: cal };
    });
    const all = meals.flatMap(m => m.items || []);
    const totals = {
      total_calories: all.reduce((s, it) => s + (it.calories || 0), 0),
      protein_g: parseFloat(all.reduce((s, it) => s + (it.protein_g || 0), 0).toFixed(1)),
      carbs_g: parseFloat(all.reduce((s, it) => s + (it.carbs_g || 0), 0).toFixed(1)),
      fat_g: parseFloat(all.reduce((s, it) => s + (it.fat_g || 0), 0).toFixed(1)),
    };
    updateMut.mutate({ id: plan.id, d: { ...plan, meals, ...totals } });
  };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Custom Cyber Header */}
      <div className="mb-8 relative">
        {/* Top decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent)' }} />
        
        {/* Main header content */}
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, #10b981, #a855f7)', borderRadius: '2px', boxShadow: '0 0 12px rgba(16,185,129,0.6)' }} />
              <h1 className="text-3xl font-black font-cyber tracking-wider" style={{ color: '#ffffff', textShadow: '0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(168,85,247,0.3)' }}>
                DIETAS
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ paddingLeft: '14px' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981, 0 0 16px rgba(16,185,129,0.6)' }} />
              <p className="text-sm font-mono-cyber tracking-wide" style={{ color: 'rgba(16,185,129,0.8)', textShadow: '0 0 10px rgba(16,185,129,0.5)' }}>
                Planos nutricionais dos alunos
              </p>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="relative px-5 py-3 rounded-xl font-medium tracking-wider flex items-center gap-2 overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(16,185,129,0.15))',
              border: '1px solid rgba(168,85,247,0.6)',
              boxShadow: '0 0 20px rgba(168,85,247,0.25), inset 0 0 12px rgba(168,85,247,0.08)'
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(16,185,129,0.25))' }} />
            
            <Plus className="w-5 h-5 relative z-10" style={{ color: '#a855f7', filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' }} />
            <span className="text-sm font-bold relative z-10" style={{ color: '#ffffff', textShadow: '0 0 8px rgba(168,85,247,0.5)' }}>NOVA DIETA</span>
          </button>
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.6), rgba(168,85,247,0.8), rgba(16,185,129,0.6), transparent)' }} />
      </div>

      {/* Filter */}
      <motion.div variants={fadeUp} className="mb-6">
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="cyber-input w-full sm:w-64">
            <SelectValue placeholder="Filtrar por aluno" />
          </SelectTrigger>
          <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
            <SelectItem value="all" className="text-white">Todos os alunos</SelectItem>
            {students.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Plans list */}
      <motion.div variants={stagger} className="space-y-3">
        {filtered.length === 0 && (
          <motion.div variants={fadeUp} className="text-center py-16 text-purple-500/30">
            <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-mono-cyber text-sm">// nenhuma dieta cadastrada</p>
          </motion.div>
        )}
        {filtered.map(plan => {
          const st = getStudent(plan.student_id);
          const isExpanded = expandedId === plan.id;
          return (
            <motion.div key={plan.id} variants={fadeUp} whileHover={{ scale: 1.005 }} transition={{ duration: 0.15 }}
              className="cyber-card rounded-xl border border-purple-900/20 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-500/5 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : plan.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{plan.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {st && <span className="text-xs text-purple-400/40 font-mono-cyber">{st.name}</span>}
                      {plan.goal && <Badge className={`text-xs border ${GOAL_COLORS[plan.goal]}`}>{GOAL_LABELS[plan.goal]}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {plan.total_calories > 0 && (
                    <span className="hidden sm:flex items-center gap-1 text-sm font-cyber text-orange-400" style={{ textShadow: '0 0 6px rgba(251,146,60,0.5)' }}>
                      <Flame className="w-3.5 h-3.5" /> {plan.total_calories}
                    </span>
                  )}
                  <span onClick={e => e.stopPropagation()}>
                    <DietPdfExport plan={plan} studentName={st?.name || 'aluno'} />
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); openEdit(plan); }} className="p-1.5 text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(plan); }} className="p-1.5 text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-purple-500/40" /> : <ChevronDown className="w-4 h-4 text-purple-500/40" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-purple-900/20 p-4">
                  {/* Macros */}
                  {(plan.total_calories > 0 || plan.protein_g > 0 || plan.carbs_g > 0 || plan.fat_g > 0) && (
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "KCAL", val: plan.total_calories, icon: Flame, color: "text-orange-400", glow: "rgba(251,146,60,0.5)" },
                        { label: "PROT", val: `${plan.protein_g}g`, icon: Beef, color: "text-pink-400", glow: "rgba(236,72,153,0.5)" },
                        { label: "CARB", val: `${plan.carbs_g}g`, icon: Wheat, color: "text-yellow-400", glow: "rgba(250,204,21,0.5)" },
                        { label: "GORD", val: `${plan.fat_g}g`, icon: Droplets, color: "text-cyan-400", glow: "rgba(6,182,212,0.5)" },
                      ].map(m => (
                        <div key={m.label} className="text-center p-3 rounded-lg bg-black/40 border border-purple-900/20">
                          <m.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${m.color}`} style={{ filter: `drop-shadow(0 0 4px ${m.glow})` }} />
                          <p className={`font-cyber text-sm ${m.color}`} style={{ textShadow: `0 0 6px ${m.glow}` }}>{m.val}</p>
                          <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>
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
                          <button
                            key={i}
                            onClick={() => setMealDetail({ plan, mealIndex: i })}
                            className="w-full text-left rounded-xl border p-3 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
                            style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(168,85,247,0.15)' }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center flex-shrink-0">
                                  <span className="font-cyber text-[9px] text-purple-400">{i + 1}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{meal.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono-cyber">
                                    {meal.time && <span className="text-purple-400/40 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{meal.time}</span>}
                                    <span className="text-purple-500/30">{(meal.items || []).length} alimentos</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                  <p className="text-xs font-cyber text-orange-400">{mealCal} kcal</p>
                                  <p className="text-[9px] font-mono-cyber text-purple-500/30">
                                    P:{mealProt}g · C:{mealCarb}g · G:{mealFat}g
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-purple-500/30 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {plan.notes && <p className="text-xs text-purple-400/30 font-mono-cyber mt-3 italic">// {plan.notes}</p>}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="border border-pink-900/40 text-white max-w-sm" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-pink-400">EXCLUIR DIETA</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-purple-300/70">Tem certeza que deseja excluir a dieta</p>
            <p className="text-white font-semibold mt-1">"{deleteConfirm?.name}"</p>
            <p className="text-xs text-purple-500/40 font-mono-cyber mt-2">// esta ação não pode ser desfeita</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button
              onClick={() => { deleteMut.mutate(deleteConfirm.id); setDeleteConfirm(null); }}
              className="btn-neon-pink px-4 py-2 rounded-lg text-sm font-medium"
              disabled={deleteMut.isPending}
            >
              EXCLUIR
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="border border-purple-900/40 text-white max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">{editing ? "EDITAR DIETA" : "NOVA DIETA"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">ALUNO *</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  {students.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">NOME *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Dieta Bulking" className="cyber-input mt-1" />
              </div>
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">OBJETIVO</Label>
                <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
                  <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                    <SelectItem value="bulking" className="text-white">Bulking</SelectItem>
                    <SelectItem value="cutting" className="text-white">Cutting</SelectItem>
                    <SelectItem value="manutencao" className="text-white">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Macros são calculados automaticamente a partir dos alimentos */}
            <div className="p-3 rounded-lg border border-purple-900/20 bg-black/20">
              <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-wider mb-2">// macros calculados automaticamente pelos alimentos</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "KCAL", val: recalcTotals(form.meals).total_calories, color: "text-orange-400" },
                  { label: "PROT", val: `${recalcTotals(form.meals).protein_g}g`, color: "text-pink-400" },
                  { label: "CARB", val: `${recalcTotals(form.meals).carbs_g}g`, color: "text-yellow-400" },
                  { label: "GORD", val: `${recalcTotals(form.meals).fat_g}g`, color: "text-cyan-400" },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className={`font-cyber text-sm ${m.color}`}>{m.val}</p>
                    <p className="text-[9px] font-mono-cyber text-purple-500/40">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Meals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-purple-400/60 text-xs tracking-wider">REFEIÇÕES</Label>
                <button type="button" onClick={addMeal} className="btn-neon-cyan px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> ADICIONAR REFEIÇÃO
                </button>
              </div>
              <div className="space-y-4">
                {(form.meals || []).map((meal, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-purple-900/25 bg-black/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input value={meal.name} onChange={e => updateMeal(idx, "name", e.target.value)} placeholder="Café da manhã" className="cyber-input text-xs flex-1" />
                      <Input value={meal.time} onChange={e => updateMeal(idx, "time", e.target.value)} placeholder="07:00" className="cyber-input text-xs w-20" />
                      <button type="button" onClick={() => removeMeal(idx)} className="p-2 text-pink-400/50 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-all flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <MealFoodEditor
                      items={meal.items || []}
                      onChange={(items) => updateMeal(idx, "items", items)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas sobre a dieta..." className="cyber-input mt-1 h-16" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={handleSave} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium" disabled={createMut.isPending || updateMut.isPending}>
              SALVAR DIETA
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Meal detail modal */}
      <MealDetailModal
        open={!!mealDetail}
        onClose={() => setMealDetail(null)}
        meal={mealDetail ? mealDetail.plan.meals[mealDetail.mealIndex] : null}
        mealIndex={mealDetail?.mealIndex}
        onSave={(mealIndex, newItems) => handleMealSave(mealDetail.plan, mealIndex, newItems)}
        readOnly={false}
      />
    </motion.div>
  );
}