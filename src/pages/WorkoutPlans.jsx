import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, UserCircle, AlertTriangle, Copy } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import ExerciseCard from "../components/workout/ExerciseCard";
import ExerciseFormDialog from "../components/workout/ExerciseFormDialog";

const days = {
  segunda: "Segunda", terca: "Terça", quarta: "Quarta",
  quinta: "Quinta", sexta: "Sexta", sabado: "Sábado", domingo: "Domingo",
};

export default function WorkoutPlans() {
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ student_id: "", name: "", day_of_week: "segunda", exercises: [] });
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [filterStudent, setFilterStudent] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [duplicatePlan, setDuplicatePlan] = useState(null);
  const [dupeStudentId, setDupeStudentId] = useState("");
  const qc = useQueryClient();

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list() });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.WorkoutPlan.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); closePlanDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkoutPlan.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); closePlanDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.WorkoutPlan.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const duplicateMut = useMutation({
    mutationFn: ({ plan, studentId }) => base44.entities.WorkoutPlan.create({
      student_id: studentId,
      name: `${plan.name} dupe`,
      day_of_week: plan.day_of_week,
      exercises: plan.exercises || [],
      active: plan.active,
    }),
    onSuccess: (newPlan) => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      setDuplicatePlan(null);
      setDupeStudentId("");
      // Open the new plan for editing right away
      openEditPlan(newPlan);
    },
  });

  const closePlanDialog = () => {
    setPlanDialogOpen(false);
    setEditingPlan(null);
    setPlanForm({ student_id: "", name: "", day_of_week: "segunda", exercises: [] });
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      student_id: plan.student_id,
      name: plan.name,
      day_of_week: plan.day_of_week || "segunda",
      exercises: plan.exercises || [],
    });
    setPlanDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!planForm.name || !planForm.student_id) return;
    editingPlan
      ? updateMut.mutate({ id: editingPlan.id, data: planForm })
      : createMut.mutate(planForm);
  };

  const addOrUpdateExercise = (exerciseData) => {
    const newExercises = [...planForm.exercises];
    if (editingExerciseIndex !== null) {
      newExercises[editingExerciseIndex] = exerciseData;
    } else {
      newExercises.push({ ...exerciseData, order: newExercises.length });
    }
    setPlanForm({ ...planForm, exercises: newExercises });
    setEditingExerciseIndex(null);
  };

  const removeExercise = (index) => {
    setPlanForm({ ...planForm, exercises: planForm.exercises.filter((_, i) => i !== index) });
  };

  const openEditExercise = (index) => {
    setEditingExerciseIndex(index);
    setExerciseDialogOpen(true);
  };

  const getStudentName = (id) => students.find((s) => s.id === id)?.name || "—";

  const filteredPlans = filterStudent === "all" ? plans : plans.filter((p) => p.student_id === filterStudent);

  return (
    <div>
      <PageHeader
        title="Treinos"
        subtitle="Monte treinos personalizados para seus alunos"
        action={
          <button onClick={() => setPlanDialogOpen(true)} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" /> NOVO TREINO
          </button>
        }
      />

      <div className="mb-6">
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-full sm:w-64 cyber-input">
            <SelectValue placeholder="Filtrar por aluno" />
          </SelectTrigger>
          <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
            <SelectItem value="all" className="text-white">Todos os alunos</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className="cyber-card rounded-xl border border-purple-900/20 overflow-hidden hover:border-purple-500/25 transition-all">
            <div
              className="p-5 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 rounded-full bg-gradient-to-b from-purple-500 to-cyan-500 opacity-60" style={{boxShadow: '0 0 8px rgba(168,85,247,0.5)'}} />
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <UserCircle className="w-3.5 h-3.5 text-purple-500/40" />
                    <span className="text-xs text-purple-400/40 font-mono-cyber">{getStudentName(plan.student_id)}</span>
                    {plan.day_of_week && (
                      <Badge className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs">
                        {days[plan.day_of_week]}
                      </Badge>
                    )}
                    <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
                      {plan.exercises?.length || 0} exerc.
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-cyan-300" title="Duplicar treino" onClick={(e) => { e.stopPropagation(); setDuplicatePlan(plan); setDupeStudentId(plan.student_id); }}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-purple-300" onClick={(e) => { e.stopPropagation(); openEditPlan(plan); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-pink-400" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(plan.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                {expandedPlan === plan.id ? <ChevronUp className="w-4 h-4 text-purple-500/40" /> : <ChevronDown className="w-4 h-4 text-purple-500/40" />}
              </div>
            </div>
            {expandedPlan === plan.id && (
              <div className="px-5 pb-5 space-y-2 border-t border-purple-900/20 pt-4">
                {plan.exercises?.map((ex, idx) => (
                  <ExerciseCard key={idx} exercise={ex} index={idx} showActions={false} />
                ))}
                {(!plan.exercises || plan.exercises.length === 0) && (
                  <p className="text-sm text-purple-500/30 text-center py-4 font-mono-cyber">// nenhum exercício adicionado</p>
                )}
              </div>
            )}
          </div>
        ))}
        {filteredPlans.length === 0 && (
          <div className="text-center py-16 text-purple-500/30">
            <p className="font-mono-cyber text-sm">// nenhum treino encontrado</p>
          </div>
        )}
      </div>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={closePlanDialog}>
        <DialogContent className="border border-purple-900/40 text-white max-w-lg max-h-[90vh] overflow-y-auto" style={{background: '#04040e'}}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">{editingPlan ? "EDITAR TREINO" : "NOVO TREINO"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">ALUNO *</Label>
              <Select value={planForm.student_id} onValueChange={(v) => setPlanForm({ ...planForm, student_id: v })}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">NOME DO TREINO *</Label>
                <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ex: Treino A - Peito" className="cyber-input mt-1" />
              </div>
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">DIA</Label>
                <Select value={planForm.day_of_week} onValueChange={(v) => setPlanForm({ ...planForm, day_of_week: v })}>
                  <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                    {Object.entries(days).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-purple-400/60 text-xs tracking-wider">EXERCÍCIOS</Label>
                <button
                  onClick={() => { setEditingExerciseIndex(null); setExerciseDialogOpen(true); }}
                  className="btn-neon-cyan px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> ADICIONAR
                </button>
              </div>
              <div className="space-y-2">
                {planForm.exercises.map((ex, idx) => (
                  <ExerciseCard key={idx} exercise={ex} index={idx} onEdit={openEditExercise} onRemove={removeExercise} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePlanDialog} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={handleSavePlan} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium" disabled={createMut.isPending || updateMut.isPending}>
              SALVAR TREINO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="border border-pink-900/40 text-white max-w-sm" style={{background: '#04040e'}}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-pink-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> CONFIRMAR EXCLUSÃO
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-purple-400/60 mt-1">
            Tem certeza que deseja apagar este treino? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button
              onClick={() => { deleteMut.mutate(deleteConfirmId); setDeleteConfirmId(null); }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30 transition-colors"
            >
              APAGAR TREINO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={!!duplicatePlan} onOpenChange={() => { setDuplicatePlan(null); setDupeStudentId(""); }}>
        <DialogContent className="border border-cyan-900/40 text-white max-w-sm" style={{background: '#04040e'}}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-cyan-300 flex items-center gap-2">
              <Copy className="w-4 h-4" /> DUPLICAR TREINO
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-sm text-purple-400/60">
              Duplicando: <span className="text-cyan-300 font-medium">{duplicatePlan?.name}</span>
              <br />
              <span className="text-xs text-purple-500/40">O treino será criado como "{duplicatePlan?.name} dupe" e você poderá editá-lo em seguida.</span>
            </p>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">PASSAR PARA O ALUNO</Label>
              <Select value={dupeStudentId} onValueChange={setDupeStudentId}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDuplicatePlan(null); setDupeStudentId(""); }} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button
              onClick={() => duplicateMut.mutate({ plan: duplicatePlan, studentId: dupeStudentId })}
              disabled={!dupeStudentId || duplicateMut.isPending}
              className="btn-neon-cyan px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            >
              DUPLICAR E EDITAR
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExerciseFormDialog
        open={exerciseDialogOpen}
        onClose={() => { setExerciseDialogOpen(false); setEditingExerciseIndex(null); }}
        onSave={addOrUpdateExercise}
        exercise={editingExerciseIndex !== null ? planForm.exercises[editingExerciseIndex] : null}
        exercisesList={exercises}
      />
    </div>
  );
}