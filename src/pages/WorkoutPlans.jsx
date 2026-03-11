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
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, UserCircle } from "lucide-react";
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
          <Button onClick={() => setPlanDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Treino
          </Button>
        }
      />

      <div className="mb-6">
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-full sm:w-64 bg-gray-900/60 border-gray-800 text-white">
            <SelectValue placeholder="Filtrar por aluno" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">Todos os alunos</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-white hover:bg-gray-700">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden">
            <div
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <UserCircle className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500">{getStudentName(plan.student_id)}</span>
                    {plan.day_of_week && (
                      <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                        {days[plan.day_of_week]}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                      {plan.exercises?.length || 0} exercícios
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={(e) => { e.stopPropagation(); openEditPlan(plan); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteMut.mutate(plan.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                {expandedPlan === plan.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </div>
            {expandedPlan === plan.id && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-800/60 pt-4">
                {plan.exercises?.map((ex, idx) => (
                  <ExerciseCard key={idx} exercise={ex} index={idx} showActions={false} />
                ))}
                {(!plan.exercises || plan.exercises.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum exercício adicionado.</p>
                )}
              </div>
            )}
          </div>
        ))}
        {filteredPlans.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>Nenhum treino encontrado.</p>
          </div>
        )}
      </div>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={closePlanDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Treino" : "Novo Treino"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Aluno *</Label>
              <Select value={planForm.student_id} onValueChange={(v) => setPlanForm({ ...planForm, student_id: v })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-white hover:bg-gray-700">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400">Nome do Treino *</Label>
                <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ex: Treino A - Peito" className="bg-gray-800 border-gray-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-400">Dia</Label>
                <Select value={planForm.day_of_week} onValueChange={(v) => setPlanForm({ ...planForm, day_of_week: v })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {Object.entries(days).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-white hover:bg-gray-700">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-gray-400">Exercícios</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditingExerciseIndex(null); setExerciseDialogOpen(true); }}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {planForm.exercises.map((ex, idx) => (
                  <ExerciseCard
                    key={idx}
                    exercise={ex}
                    index={idx}
                    onEdit={openEditExercise}
                    onRemove={removeExercise}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePlanDialog} className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancelar</Button>
            <Button onClick={handleSavePlan} className="bg-emerald-600 hover:bg-emerald-700" disabled={createMut.isPending || updateMut.isPending}>
              Salvar Treino
            </Button>
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