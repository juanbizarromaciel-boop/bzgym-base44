import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, UserCircle, AlertTriangle, Copy, EyeOff, Eye, Archive } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
import ExerciseCard from "../components/workout/ExerciseCard";
import ExerciseFormDialog from "../components/workout/ExerciseFormDialog";
import WorkoutPdfExport from "../components/workout/WorkoutPdfExport";

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
  const { user: currentUser } = useCurrentUser();
  const qc = useQueryClient();

  const { data: allStudents = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: allPlans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });

  // Admin vê tudo; personal vê apenas seus alunos/planos
  const isPersonal = currentUser?.role === "personal";
  const isAdmin = currentUser?.role === "admin";
  const students = isAdmin ? allStudents : allStudents.filter(s => s.personal_id === currentUser?.email);
  const plans = isAdmin ? allPlans : allPlans.filter(p => p.personal_id === currentUser?.email);
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
      personal_id: (currentUser?.role === "personal" || currentUser?.role === "admin") ? currentUser.email : plan.personal_id,
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
    const dataToSave = (isPersonal || isAdmin)
      ? { ...planForm, personal_id: currentUser.email }
      : planForm;
    editingPlan
      ? updateMut.mutate({ id: editingPlan.id, data: dataToSave })
      : createMut.mutate(dataToSave);
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

  const [expandedStudent, setExpandedStudent] = useState(null);
  const [showArchived, setShowArchived] = useState({}); // studentId -> bool

  const toggleArchiveVisibility = (studentId) =>
    setShowArchived(prev => ({ ...prev, [studentId]: !prev[studentId] }));

  const toggleActivePlan = (plan) => {
    updateMut.mutate({ id: plan.id, data: { ...plan, active: plan.active === false ? true : false } });
  };

  const filteredPlans = filterStudent === "all" ? plans : plans.filter((p) => p.student_id === filterStudent);

  // Group plans by student — active and archived separately
  const plansByStudent = students
    .map(s => ({
      student: s,
      activePlans: filteredPlans.filter(p => p.student_id === s.id && p.active !== false),
      archivedPlans: filteredPlans.filter(p => p.student_id === s.id && p.active === false),
    }))
    .filter(g => g.activePlans.length > 0 || g.archivedPlans.length > 0);

  // Plans with no matching student
  const orphanPlans = filteredPlans.filter(p => !students.find(s => s.id === p.student_id));

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      <PageHeader
        title="Treinos"
        accentColor="#ec4899"
        subtitle="Monte treinos personalizados para seus alunos"
        action={
          <button onClick={() => setPlanDialogOpen(true)} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" /> NOVO TREINO
          </button>
        }
      />

      <motion.div variants={fadeUp} className="mb-6">
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
      </motion.div>

      <motion.div variants={stagger} className="space-y-4">
        {plansByStudent.map(({ student, activePlans, archivedPlans }) => {
          const isOpen = expandedStudent === student.id || filterStudent === student.id;
          const totalPlans = activePlans.length + archivedPlans.length;
          const archiveOpen = showArchived[student.id];

          const PlanRow = ({ plan, isArchived }) => (
            <div key={plan.id} className="bg-black/20">
              <div
                className="pl-10 pr-5 py-4 flex items-center justify-between cursor-pointer hover:bg-purple-500/3 transition-all"
                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full" style={{
                    background: isArchived ? 'linear-gradient(to bottom, #6b7280, #4b5563)' : 'linear-gradient(to bottom, #a855f7, #06b6d4)',
                    opacity: isArchived ? 0.3 : 0.5,
                    boxShadow: isArchived ? 'none' : '0 0 6px rgba(168,85,247,0.4)'
                  }} />
                  <div>
                    <h3 className={`font-medium text-sm ${isArchived ? 'text-purple-400/40' : 'text-white'}`}>{plan.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {plan.day_of_week && (
                        <Badge className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px]">
                          {days[plan.day_of_week]}
                        </Badge>
                      )}
                      <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px]">
                        {plan.exercises?.length || 0} exerc.
                      </Badge>
                      {isArchived && (
                        <Badge className="bg-gray-500/10 border border-gray-500/20 text-gray-400 text-[10px]">oculto</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" className={`h-7 w-7 ${isArchived ? 'text-emerald-500/50 hover:text-emerald-400' : 'text-purple-400/40 hover:text-amber-400'}`}
                    title={isArchived ? "Restaurar treino" : "Ocultar treino"}
                    onClick={(e) => { e.stopPropagation(); toggleActivePlan(plan); }}>
                    {isArchived ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-400/40 hover:text-cyan-300" title="Duplicar" onClick={(e) => { e.stopPropagation(); setDuplicatePlan(plan); setDupeStudentId(plan.student_id); }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center h-7 w-7">
                    <WorkoutPdfExport studentId={plan.student_id} studentName={getStudentName(plan.student_id)} planId={plan.id} compact={true} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-400/40 hover:text-purple-300" onClick={(e) => { e.stopPropagation(); openEditPlan(plan); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-400/40 hover:text-pink-400" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(plan.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  {expandedPlan === plan.id ? <ChevronUp className="w-3.5 h-3.5 text-purple-500/40" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-500/40" />}
                </div>
              </div>
              {expandedPlan === plan.id && (
                <div className="pl-12 pr-5 pb-4 space-y-2 border-t border-purple-900/10 pt-3">
                  {plan.exercises?.map((ex, idx) => (
                    <ExerciseCard key={idx} exercise={ex} index={idx} showActions={false} />
                  ))}
                  {(!plan.exercises || plan.exercises.length === 0) && (
                    <p className="text-sm text-purple-500/30 text-center py-4 font-mono-cyber">// nenhum exercício adicionado</p>
                  )}
                </div>
              )}
            </div>
          );

          return (
            <motion.div key={student.id} variants={fadeUp} className="cyber-card rounded-xl border overflow-hidden"
              style={{ borderColor: 'rgba(168,85,247,0.30)' }}>
              {/* Student Folder Header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-purple-500/5 transition-all"
                onClick={() => setExpandedStudent(isOpen ? null : student.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white text-sm">{student.name}</p>
                    <p className="text-[10px] font-mono-cyber text-purple-500/40 mt-0.5">
                      {activePlans.length} ativo{activePlans.length !== 1 ? "s" : ""}
                      {archivedPlans.length > 0 && ` · ${archivedPlans.length} oculto${archivedPlans.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {activePlans.slice(0, 4).map(p => (
                      <span key={p.id} className="text-[9px] px-2 py-0.5 rounded font-mono-cyber"
                        style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(192,132,252,0.7)' }}>
                        {p.name.length > 10 ? p.name.slice(0, 10) + "…" : p.name}
                      </span>
                    ))}
                    {activePlans.length > 4 && <span className="text-[9px] text-purple-500/40 font-mono-cyber self-center">+{activePlans.length - 4}</span>}
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-purple-500/40" /> : <ChevronDown className="w-4 h-4 text-purple-500/40" />}
                </div>
              </button>

              {/* Plans inside this student folder */}
              {isOpen && (
                <div className="border-t border-purple-900/20 divide-y divide-purple-900/10">
                  {/* Active plans */}
                  {activePlans.map((plan) => <PlanRow key={plan.id} plan={plan} isArchived={false} />)}

                  {activePlans.length === 0 && archivedPlans.length === 0 && (
                    <p className="text-sm text-purple-500/30 text-center py-6 font-mono-cyber">// nenhum treino</p>
                  )}

                  {/* Archived folder */}
                  {archivedPlans.length > 0 && (
                    <div>
                      <button
                        className="w-full flex items-center gap-2 pl-10 pr-5 py-3 hover:bg-amber-500/3 transition-all"
                        onClick={() => toggleArchiveVisibility(student.id)}
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-500/50" />
                        <span className="text-[10px] font-mono-cyber text-amber-500/50 tracking-wider">
                          TREINOS OCULTOS ({archivedPlans.length})
                        </span>
                        {archiveOpen ? <ChevronUp className="w-3 h-3 text-amber-500/40 ml-auto" /> : <ChevronDown className="w-3 h-3 text-amber-500/40 ml-auto" />}
                      </button>
                      {archiveOpen && (
                        <div className="bg-amber-500/2 border-t border-amber-900/20 divide-y divide-purple-900/10">
                          {archivedPlans.map((plan) => <PlanRow key={plan.id} plan={plan} isArchived={true} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {orphanPlans.map((plan) => (
          <motion.div key={plan.id} variants={fadeUp} className="cyber-card rounded-xl border border-purple-900/20 overflow-hidden hover:border-purple-500/25 transition-all">
            <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 rounded-full bg-gradient-to-b from-purple-500 to-cyan-500 opacity-60" />
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">{plan.exercises?.length || 0} exerc.</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-purple-300" onClick={(e) => { e.stopPropagation(); openEditPlan(plan); }}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-pink-400" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(plan.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                {expandedPlan === plan.id ? <ChevronUp className="w-4 h-4 text-purple-500/40" /> : <ChevronDown className="w-4 h-4 text-purple-500/40" />}
              </div>
            </div>
            {expandedPlan === plan.id && (
              <div className="px-5 pb-5 space-y-2 border-t border-purple-900/20 pt-4">
                {plan.exercises?.map((ex, idx) => <ExerciseCard key={idx} exercise={ex} index={idx} showActions={false} />)}
              </div>
            )}
          </motion.div>
        ))}

        {filteredPlans.length === 0 && (
          <motion.div variants={fadeUp} className="text-center py-16 text-purple-500/30">
            <p className="font-mono-cyber text-sm">// nenhum treino encontrado</p>
          </motion.div>
        )}
      </motion.div>

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
    </motion.div>
  );
}