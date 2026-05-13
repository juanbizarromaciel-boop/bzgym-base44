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
import { CheckCircle, Dumbbell, PlayCircle, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";
import RestTimer from "../components/workout/RestTimer";
import LastWeightBadge from "../components/workout/LastWeightBadge";
import MuscleMap from "../components/workout/MuscleMap";

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

  const { data: allStudents = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: allPlans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });

  const isAdmin = currentUser?.role === "admin";
  const students = isAdmin
    ? allStudents.filter(s => s.active !== false)
    : allStudents.filter(s => s.active !== false && s.personal_id === currentUser?.email);
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list() });
  const { data: allLogs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => base44.entities.WorkoutLog.list() });

  const myPlans = isAdmin ? allPlans : allPlans.filter(p => p.personal_id === currentUser?.email);
  const studentPlans = myPlans.filter((p) => p.student_id === selectedStudentId);
  const selectedPlan = myPlans.find((p) => p.id === selectedPlanId);

  const logMut = useMutation({
    mutationFn: (data) => base44.entities.WorkoutLog.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });

  const initSets = (exerciseIdx, numSets) => {
    if (setsData[exerciseIdx]) return setsData[exerciseIdx];
    return Array.from({ length: numSets }, (_, i) => ({ set_number: i + 1, reps_done: 0, load_kg: 0 }));
  };

  const updateSet = (exerciseIdx, setIdx, field, value) => {
    const current = initSets(exerciseIdx, selectedPlan.exercises[exerciseIdx]?.sets || 3);
    const updated = [...current];
    updated[setIdx] = { ...updated[setIdx], [field]: parseFloat(value) || 0 };
    setSetsData({ ...setsData, [exerciseIdx]: updated });
  };

  const applyWeightToAllSets = (exerciseIdx, kg) => {
    const numSets = selectedPlan.exercises[exerciseIdx]?.sets || 3;
    const current = setsData[exerciseIdx] || initSets(exerciseIdx, numSets);
    const updated = current.map(s => ({ ...s, load_kg: kg }));
    setSetsData({ ...setsData, [exerciseIdx]: updated });
  };

  const saveExerciseLog = (exerciseIdx) => {
    const exercise = selectedPlan.exercises[exerciseIdx];
    const sets = setsData[exerciseIdx] || initSets(exerciseIdx, exercise.sets);
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
          <div className="cyber-card rounded-xl p-5 border border-purple-900/20 mb-4">
            <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-4">Grupos Musculares - {selectedPlan.name}</p>
            <MuscleMap exercises={selectedPlan.exercises || []} exerciseLibrary={exercises} size="md" showLabels={true} />
          </div>

          {/* Progress bar */}
          <div className="cyber-card rounded-xl p-4 border border-purple-900/20 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-400/50 tracking-wider font-mono-cyber">PROGRESSO DO TREINO</span>
              <span className="font-cyber text-sm text-purple-300">{completedExercises.size}/{selectedPlan.exercises?.length || 0}</span>
            </div>
            <div className="h-1.5 bg-purple-900/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${selectedPlan.exercises?.length ? (completedExercises.size / selectedPlan.exercises.length) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
                  boxShadow: '0 0 8px rgba(168,85,247,0.8)'
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

          {selectedPlan.exercises?.map((exercise, exerciseIdx) => {
            const isCompleted = completedExercises.has(exerciseIdx);
            const sets = setsData[exerciseIdx] || initSets(exerciseIdx, exercise.sets);

            return (
              <div
                key={exerciseIdx}
                className={`cyber-card rounded-xl p-5 border transition-all ${
                  isCompleted ? "border-cyan-500/30" : "border-purple-900/20"
                }`}
                style={isCompleted ? {background: 'rgba(6,182,212,0.03)'} : {}}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? "bg-cyan-500/10 border-cyan-500/30" : "bg-purple-500/10 border-purple-500/20"
                    }`}>
                      {isCompleted
                        ? <CheckCircle className="w-5 h-5 text-cyan-400" />
                        : <span className="font-cyber text-xs text-purple-400">#{exerciseIdx + 1}</span>
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
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <LastWeightBadge
                          exerciseName={exercise.exercise_name}
                          logs={allLogs.filter(l => l.student_id === selectedStudentId)}
                          onApply={(kg) => applyWeightToAllSets(exerciseIdx, kg)}
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
                  <div className="grid grid-cols-12 gap-2 text-[10px] text-purple-400/40 font-mono-cyber uppercase tracking-wider px-2 mb-1">
                    <span className="col-span-2">Série</span>
                    <span className="col-span-5">Reps feitas</span>
                    <span className="col-span-5">Carga (kg)</span>
                  </div>
                  {sets.map((set, setIdx) => (
                    <div key={setIdx} className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-2 text-center text-sm font-cyber text-purple-400/60 bg-purple-900/20 border border-purple-900/30 rounded-lg py-2">
                        {setIdx + 1}
                      </span>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          value={set.reps_done || ""}
                          onChange={(e) => updateSet(exerciseIdx, setIdx, "reps_done", e.target.value)}
                          placeholder={exercise.reps}
                          className="cyber-input text-center"
                          disabled={isCompleted}
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          value={set.load_kg || ""}
                          onChange={(e) => updateSet(exerciseIdx, setIdx, "load_kg", e.target.value)}
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
                    className="w-full mt-4 btn-neon-cyan py-3 rounded-lg text-sm font-medium tracking-widest flex items-center justify-center gap-2"
                    disabled={logMut.isPending}
                  >
                    <CheckCircle className="w-4 h-4" />
                    CONCLUIR EXERCÍCIO
                  </button>
                )}

                {isCompleted && (
                  <div className="mt-4 text-center py-2 border border-cyan-500/20 rounded-lg bg-cyan-500/5">
                    <span className="text-xs font-mono-cyber text-cyan-400 tracking-wider">✓ CONCLUÍDO</span>
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