import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle, Dumbbell, PlayCircle, Trophy, TrendingDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";
import RestTimer from "../components/workout/RestTimer";
import LastWeightBadge from "../components/workout/LastWeightBadge";
import MuscleMap from "../components/workout/MuscleMap";
import { sortExercisesByProgression, getExerciseProgression } from "../utils/progressionSort";

export default function StudentWorkout() {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [setsData, setSetsData] = useState({});
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const qc = useQueryClient();
  const { user: currentUser } = useCurrentUser();

  const { data: allStudents = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list(), staleTime: 60000 });
  const { data: allPlans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list(), staleTime: 60000 });

  const isAdmin = currentUser?.role === "admin";
  const students = isAdmin
    ? allStudents.filter(s => s.active !== false)
    : allStudents.filter(s => s.active !== false && s.personal_id === currentUser?.email);
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list(), staleTime: 60000 });
  const { data: allLogs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => base44.entities.WorkoutLog.list(), staleTime: 30000 });

  const myPlans = isAdmin ? allPlans : allPlans.filter(p => p.personal_id === currentUser?.email);
  const studentPlans = myPlans.filter((p) => p.student_id === selectedStudentId);
  const selectedPlan = myPlans.find((p) => p.id === selectedPlanId);

  // Sort exercises by progression (worst first)
  const sortedExercises = selectedPlan && selectedStudentId
    ? sortExercisesByProgression(selectedPlan.exercises || [], allLogs, selectedStudentId)
    : [];

  const logMut = useMutation({
    mutationFn: (data) => base44.entities.WorkoutLog.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });

  // Use exercise_name as stable key instead of index to avoid data loss on re-renders
  const getExerciseKey = (exercise, idx) => exercise.exercise_name || `exercise_${idx}`;

  const initSets = (exerciseKey, numSets) => {
    if (setsData[exerciseKey]) return setsData[exerciseKey];
    return Array.from({ length: numSets }, (_, i) => ({ set_number: i + 1, reps_done: 0, load_kg: 0 }));
  };

  const updateSet = (exerciseKey, setIdx, field, value, numSets) => {
    const current = initSets(exerciseKey, numSets || 3);
    const updated = [...current];
    updated[setIdx] = { ...updated[setIdx], [field]: parseFloat(value) || 0 };
    setSetsData(prev => ({ ...prev, [exerciseKey]: updated }));
  };

  const applyWeightToAllSets = (exerciseKey, kg, numSets) => {
    const current = setsData[exerciseKey] || initSets(exerciseKey, numSets || 3);
    const updated = current.map(s => ({ ...s, load_kg: kg }));
    setSetsData(prev => ({ ...prev, [exerciseKey]: updated }));
  };

  const saveExerciseLog = (exerciseIdx) => {
    const exercise = selectedPlan.exercises[exerciseIdx];
    const exerciseKey = getExerciseKey(exercise, exerciseIdx);
    const sets = setsData[exerciseKey] || initSets(exerciseKey, exercise.sets);
    const maxLoad = Math.max(...sets.map((s) => s.load_kg), 0);

    logMut.mutate({
      student_id: selectedStudentId,
      workout_plan_id: selectedPlanId,
      exercise_id: exercise.exercise_id || "",
      exercise_name: exercise.exercise_name,
      date: new Date().toISOString().split("T")[0],
      sets_completed: sets,
      technique_used: exercise.technique || "normal",
      max_load_kg: maxLoad,
    });

    setCompletedExercises(new Set([...completedExercises, exerciseIdx]));
    toast.success(`${exercise.exercise_name} registrado!`);
  };

  const allExercisesDone = selectedPlan && selectedPlan.exercises?.length > 0 &&
    completedExercises.size === selectedPlan.exercises.length;

  const handleFinishWorkout = () => {
    setWorkoutFinished(true);
  };

  const handleResetWorkout = () => {
    setWorkoutFinished(false);
    setSetsData({});
    setCompletedExercises(new Set());
    setSelectedPlanId("");
    setSelectedStudentId("");
  };

  const getExerciseVideo = (exerciseId) => {
    return exercises.find(ex => ex.id === exerciseId)?.video_url;
  };

  const openVideoDialog = (videoUrl) => {
    setSelectedVideo(videoUrl);
    setVideoDialogOpen(true);
  };

  return (
    <div>
      <PageHeader title="Treinar Aluno" subtitle="Selecione o aluno e registre o treino" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Select value={selectedStudentId} onValueChange={(v) => { setSelectedStudentId(v); setSelectedPlanId(""); setSetsData({}); setCompletedExercises(new Set()); }}>
          <SelectTrigger className="cyber-input">
            <SelectValue placeholder="Selecione o aluno" />
          </SelectTrigger>
          <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPlanId} onValueChange={(v) => { setSelectedPlanId(v); setSetsData({}); setCompletedExercises(new Set()); }}>
          <SelectTrigger className="cyber-input">
            <SelectValue placeholder="Selecione o treino" />
          </SelectTrigger>
          <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
            {studentPlans.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlan && (
        <div className="space-y-4">
          {/* Muscle Map */}
          <div className="relative rounded-xl p-5 border mb-4 overflow-hidden"
            style={{ background: 'linear-gradient(145deg, var(--bg-card) 0%, var(--bg-void) 100%)', borderColor: 'rgba(168,85,247,0.30)', boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(168,85,247,0.08)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), rgba(6,182,212,0.4), transparent)' }} />
            <div className="absolute top-0 left-0 w-3 h-3" style={{ borderTop: '2px solid rgba(168,85,247,0.9)', borderLeft: '2px solid rgba(168,85,247,0.9)' }} />
            <p className="text-[10px] font-mono-cyber tracking-[0.2em] uppercase mb-4"
              style={{ color: 'rgba(168,85,247,0.7)', textShadow: '0 0 8px rgba(168,85,247,0.5)' }}>
              Grupos Musculares — {selectedPlan.name}
            </p>
            <MuscleMap exercises={selectedPlan.exercises || []} exerciseLibrary={exercises} size="md" showLabels={true} />
          </div>

          {/* Progress bar */}
          <div className="relative rounded-xl p-4 border mb-6 overflow-hidden"
            style={{ background: 'linear-gradient(145deg, var(--bg-card) 0%, var(--bg-void) 100%)', borderColor: 'rgba(168,85,247,0.30)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.7), transparent)' }} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs tracking-wider font-mono-cyber" style={{ color: 'rgba(168,85,247,0.7)', textShadow: '0 0 6px rgba(168,85,247,0.5)' }}>PROGRESSO DO TREINO</span>
              <span className="font-cyber text-sm" style={{ color: '#a855f7', textShadow: '0 0 10px rgba(168,85,247,0.8)' }}>{completedExercises.size}/{selectedPlan.exercises?.length || 0}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(168,85,247,0.12)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${selectedPlan.exercises?.length ? (completedExercises.size / selectedPlan.exercises.length) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #a855f7, #ec4899, #06b6d4)',
                  boxShadow: '0 0 12px rgba(168,85,247,0.9), 0 0 24px rgba(168,85,247,0.5)'
                }}
              />
            </div>
          </div>

          {/* Botão Finalizar Treino */}
          {allExercisesDone && !workoutFinished && (
            <button
              onClick={handleFinishWorkout}
              className="w-full btn-neon-purple py-4 rounded-xl font-cyber text-base tracking-widest flex items-center justify-center gap-3 mb-2"
              style={{boxShadow: '0 0 30px rgba(168,85,247,0.4)'}}
            >
              <Trophy className="w-5 h-5" />
              FINALIZAR TREINO
            </button>
          )}

          {sortedExercises.map((exercise, displayIdx) => {
            const exerciseIdx = exercise.originalIndex;
            const exerciseKey = getExerciseKey(exercise, exerciseIdx);
            const isCompleted = completedExercises.has(exerciseIdx);
            const sets = setsData[exerciseKey] || initSets(exerciseKey, exercise.sets);
            const progression = getExerciseProgression(exercise.exercise_name, allLogs, selectedStudentId);

            return (
              <div
                key={exerciseIdx}
                className="relative rounded-xl p-5 border transition-all overflow-hidden"
                style={isCompleted ? {
                  background: 'linear-gradient(145deg, rgba(6,182,212,0.06) 0%, var(--bg-void) 100%)',
                  borderColor: 'rgba(6,182,212,0.45)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(6,182,212,0.12)',
                } : {
                  background: 'linear-gradient(145deg, var(--bg-card) 0%, var(--bg-void) 100%)',
                  borderColor: 'rgba(168,85,247,0.28)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 16px rgba(168,85,247,0.06)',
                }}>
                {/* Top scanline */}
                <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                  style={{ background: isCompleted
                    ? 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(168,85,247,0.7), rgba(236,72,153,0.3), transparent)' }} />
                {/* Tech corner */}
                <div className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
                  style={{ borderTop: isCompleted ? '1.5px solid rgba(6,182,212,0.9)' : '1.5px solid rgba(168,85,247,0.8)', borderLeft: isCompleted ? '1.5px solid rgba(6,182,212,0.9)' : '1.5px solid rgba(168,85,247,0.8)' }} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0"
                      style={isCompleted
                        ? { background: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.45)', boxShadow: '0 0 12px rgba(6,182,212,0.3)' }
                        : { background: 'rgba(168,85,247,0.12)', borderColor: 'rgba(168,85,247,0.45)', boxShadow: '0 0 10px rgba(168,85,247,0.25)' }}>
                      {isCompleted
                        ? <CheckCircle className="w-5 h-5" style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.9))' }} />
                        : <span className="font-cyber text-xs" style={{ color: '#a855f7', textShadow: '0 0 8px rgba(168,85,247,0.9)' }}>#{exerciseIdx + 1}</span>
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{exercise.exercise_name}</h3>
                        {getExerciseVideo(exercise.exercise_id) && (
                          <button
                            onClick={() => openVideoDialog(getExerciseVideo(exercise.exercise_id))}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="Ver vídeo do exercício"
                          >
                            <PlayCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {progression && (progression.type === "down" || progression.type === "same") && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono-cyber px-2 py-1 rounded-md w-fit"
                          style={{ background: `${progression.color}12`, border: `1px solid ${progression.color}30`, color: progression.color }}>
                          {progression.type === "down" ? <TrendingDown className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {progression.label}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <LastWeightBadge
                          exerciseName={exercise.exercise_name}
                          logs={allLogs.filter(l => l.student_id === selectedStudentId)}
                          onApply={(kg) => applyWeightToAllSets(exerciseKey, kg, exercise.sets)}
                          disabled={isCompleted}
                        />
                        <Badge className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono-cyber">
                          {exercise.sets}x{exercise.reps}
                        </Badge>
                        {exercise.load_kg > 0 && (
                          <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
                            {exercise.load_kg}kg ref.
                          </Badge>
                        )}
                        {exercise.technique && exercise.technique !== "normal" && (
                          <Badge className="bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs">
                            {exercise.technique.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      {exercise.technique_details && (
                        <p className="text-xs text-purple-400/40 mt-1 font-mono-cyber italic">{exercise.technique_details}</p>
                      )}
                    </div>
                  </div>
                  <RestTimer initialSeconds={exercise.rest_seconds || 60} />
                </div>

                {/* Sets Grid */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-mono-cyber uppercase tracking-wider px-2 mb-1"
                    style={{ color: 'rgba(168,85,247,0.55)' }}>
                    <span className="col-span-2">Série</span>
                    <span className="col-span-5">Reps feitas</span>
                    <span className="col-span-5">Carga (kg)</span>
                  </div>
                  {sets.map((set, setIdx) => (
                    <div key={setIdx} className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-2 text-center text-sm font-cyber rounded-lg py-2"
                        style={{ color: 'rgba(168,85,247,0.8)', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', textShadow: '0 0 6px rgba(168,85,247,0.6)' }}>
                        {setIdx + 1}
                      </span>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          value={set.reps_done || ""}
                          onChange={(e) => updateSet(exerciseKey, setIdx, "reps_done", e.target.value, exercise.sets)}
                          placeholder={exercise.reps}
                          className="cyber-input text-center"
                          disabled={isCompleted}
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          value={set.load_kg || ""}
                          onChange={(e) => updateSet(exerciseKey, setIdx, "load_kg", e.target.value, exercise.sets)}
                          placeholder={exercise.load_kg?.toString() || "0"}
                          className="cyber-input text-center"
                          disabled={isCompleted}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => saveExerciseLog(exerciseIdx)}
                    className="w-full mt-4 py-3 rounded-lg text-sm font-cyber tracking-widest flex items-center justify-center gap-2 transition-all"
                    disabled={logMut.isPending}
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.22), rgba(236,72,153,0.12))',
                      border: '1px solid rgba(168,85,247,0.65)',
                      color: '#ffffff',
                      boxShadow: '0 0 18px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
                      textShadow: '0 0 8px rgba(168,85,247,0.8)',
                    }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 5px rgba(168,85,247,0.9))' }} />
                    CONCLUIR EXERCÍCIO
                  </button>
                )}

                {isCompleted && (
                  <div className="mt-4 text-center py-2 rounded-lg"
                    style={{ border: '1px solid rgba(6,182,212,0.35)', background: 'rgba(6,182,212,0.06)', boxShadow: '0 0 12px rgba(6,182,212,0.12)' }}>
                    <span className="text-xs font-mono-cyber tracking-wider" style={{ color: '#06b6d4', textShadow: '0 0 8px rgba(6,182,212,0.8)' }}>✓ CONCLUÍDO</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!selectedPlanId && selectedStudentId && studentPlans.length === 0 && (
        <div className="text-center py-16 text-purple-500/30">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-mono-cyber text-sm">// nenhum treino encontrado</p>
        </div>
      )}

      {!selectedStudentId && (
        <div className="text-center py-16 text-purple-500/30">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-20" style={{filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.4))'}} />
          <p className="font-mono-cyber text-sm">// selecione um aluno para começar</p>
        </div>
      )}

      {/* Workout Finished Modal */}
      {workoutFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="cyber-card rounded-2xl p-8 border border-purple-500/40 text-center"
              style={{boxShadow: '0 0 60px rgba(168,85,247,0.2), 0 0 120px rgba(168,85,247,0.08)'}}>

              {/* Trophy Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center"
                  style={{boxShadow: '0 0 40px rgba(168,85,247,0.4)'}}>
                  <Trophy className="w-12 h-12 text-purple-300" style={{filter: 'drop-shadow(0 0 12px rgba(168,85,247,1))'}} />
                </div>
              </div>

              <h2 className="font-cyber text-2xl text-white tracking-widest mb-2"
                style={{textShadow: '0 0 20px rgba(168,85,247,0.6)'}}>
                TREINO CONCLUÍDO!
              </h2>

              <p className="text-purple-400/60 font-mono-cyber text-xs mb-6">
                // {students.find(s => s.id === selectedStudentId)?.name}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                  <p className="text-2xl font-cyber text-purple-300">{selectedPlan.exercises?.length || 0}</p>
                  <p className="text-[10px] text-purple-500/50 font-mono-cyber uppercase tracking-wider mt-1">Exercícios</p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                  <p className="text-2xl font-cyber text-cyan-300">
                    {Object.values(setsData).reduce((acc, sets) => acc + sets.length, 0) || 
                     (selectedPlan.exercises?.reduce((acc, ex) => acc + (ex.sets || 0), 0) || 0)}
                  </p>
                  <p className="text-[10px] text-cyan-500/50 font-mono-cyber uppercase tracking-wider mt-1">Séries</p>
                </div>
              </div>

              <p className="text-purple-200/70 text-sm mb-6 leading-relaxed">
                Os dados do treino foram registrados no <span className="text-purple-300 font-semibold">progresso do aluno</span> automaticamente.
              </p>

              <div className="border-t border-purple-900/30 pt-5">
                <p className="text-[11px] text-purple-500/40 font-mono-cyber mb-4">
                  // dados disponíveis em: Progresso → {students.find(s => s.id === selectedStudentId)?.name}
                </p>
                <button
                  onClick={handleResetWorkout}
                  className="w-full btn-neon-purple py-3 rounded-xl font-cyber text-sm tracking-widest"
                >
                  NOVO TREINO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="bg-[#0a0a16] border-purple-500/30 text-white max-w-3xl p-0">
          {selectedVideo && (
            <video
              src={selectedVideo}
              controls
              autoPlay
              className="w-full rounded-lg"
              style={{ maxHeight: '80vh' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}