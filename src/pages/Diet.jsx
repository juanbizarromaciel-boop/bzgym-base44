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
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Utensils, Flame, Beef, Wheat, Droplets, FileDown } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";
import DietPdfExport from "../components/diet/DietPdfExport";

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
const emptyMeal = { name: "", time: "", calories: 0, foods: "" };

export default function Diet() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStudent, setFilterStudent] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null); // plan to delete
  const qc = useQueryClient();

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["diet_plans"], queryFn: () => base44.entities.DietPlan.list() });

  const createMut = useMutation({ mutationFn: (d) => base44.entities.DietPlan.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["diet_plans"] }); closeDialog(); toast.success("Dieta criada!"); } });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => base44.entities.DietPlan.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["diet_plans"] }); closeDialog(); toast.success("Dieta atualizada!"); } });
  const deleteMut = useMutation({ mutationFn: (id) => base44.entities.DietPlan.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["diet_plans"] }); toast.success("Dieta removida!"); } });

  const openCreate = () => { setEditing(null); setForm(emptyPlan); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSave = () => {
    if (!form.student_id || !form.name) { toast.error("Aluno e nome são obrigatórios"); return; }
    if (editing) updateMut.mutate({ id: editing.id, d: form });
    else createMut.mutate(form);
  };

  const addMeal = () => setForm({ ...form, meals: [...(form.meals || []), { ...emptyMeal }] });
  const updateMeal = (idx, field, val) => {
    const meals = [...(form.meals || [])];
    meals[idx] = { ...meals[idx], [field]: val };
    setForm({ ...form, meals });
  };
  const removeMeal = (idx) => {
    const meals = [...(form.meals || [])];
    meals.splice(idx, 1);
    setForm({ ...form, meals });
  };

  const filtered = filterStudent === "all" ? plans : plans.filter(p => p.student_id === filterStudent);
  const getStudent = (id) => students.find(s => s.id === id);

  return (
    <div>
      <PageHeader
        title="Dietas"
        subtitle="Planos nutricionais dos alunos"
        action={
          <button onClick={openCreate} className="btn-neon-purple px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 tracking-wider">
            <Plus className="w-4 h-4" /> NOVA DIETA
          </button>
        }
      />

      {/* Filter */}
      <div className="mb-6">
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="cyber-input w-full sm:w-64">
            <SelectValue placeholder="Filtrar por aluno" />
          </SelectTrigger>
          <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
            <SelectItem value="all" className="text-white">Todos os alunos</SelectItem>
            {students.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Plans list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-purple-500/30">
            <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-mono-cyber text-sm">// nenhuma dieta cadastrada</p>
          </div>
        )}
        {filtered.map(plan => {
          const st = getStudent(plan.student_id);
          const isExpanded = expandedId === plan.id;
          return (
            <div key={plan.id} className="cyber-card rounded-xl border border-purple-900/20 overflow-hidden">
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
                  {/* Meals */}
                  {plan.meals?.length > 0 && (
                    <div className="space-y-2">
                      {plan.meals.map((meal, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-purple-900/15 bg-black/30">
                          <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="font-cyber text-[10px] text-purple-400">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{meal.name}</p>
                              {meal.time && <span className="text-xs text-purple-400/40 font-mono-cyber">{meal.time}</span>}
                              {meal.calories > 0 && <span className="text-xs text-orange-400 font-mono-cyber">{meal.calories} kcal</span>}
                            </div>
                            {meal.foods && <p className="text-xs text-purple-400/40 mt-1 leading-relaxed">{meal.foods}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {plan.notes && <p className="text-xs text-purple-400/30 font-mono-cyber mt-3 italic">// {plan.notes}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "KCAL", field: "total_calories" },
                { label: "PROT (g)", field: "protein_g" },
                { label: "CARB (g)", field: "carbs_g" },
                { label: "GORD (g)", field: "fat_g" },
              ].map(m => (
                <div key={m.field}>
                  <Label className="text-purple-400/60 text-[10px] tracking-wider">{m.label}</Label>
                  <Input type="number" value={form[m.field] || ""} onChange={e => setForm({ ...form, [m.field]: parseFloat(e.target.value) || 0 })} className="cyber-input mt-1 text-center" />
                </div>
              ))}
            </div>

            {/* Meals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-purple-400/60 text-xs tracking-wider">REFEIÇÕES</Label>
                <button onClick={addMeal} className="btn-neon-cyan px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> ADICIONAR
                </button>
              </div>
              <div className="space-y-3">
                {(form.meals || []).map((meal, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-purple-900/25 bg-black/30 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={meal.name} onChange={e => updateMeal(idx, "name", e.target.value)} placeholder="Café da manhã" className="cyber-input text-xs" />
                      <Input value={meal.time} onChange={e => updateMeal(idx, "time", e.target.value)} placeholder="07:00" className="cyber-input text-xs" />
                      <div className="flex gap-1">
                        <Input type="number" value={meal.calories || ""} onChange={e => updateMeal(idx, "calories", parseFloat(e.target.value) || 0)} placeholder="kcal" className="cyber-input text-xs text-center" />
                        <button onClick={() => removeMeal(idx)} className="p-2 text-pink-400/50 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <Textarea value={meal.foods} onChange={e => updateMeal(idx, "foods", e.target.value)} placeholder="Ex: 3 ovos mexidos, 2 fatias de pão integral, 1 banana..." className="cyber-input text-xs h-16" />
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
    </div>
  );
}