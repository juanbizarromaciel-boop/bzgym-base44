import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Dumbbell, Flame, ChevronRight, Trophy, Calendar, PlayCircle, Flag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import RestTimer from "../components/workout/RestTimer";
import MuscleMap from "../components/workout/MuscleMap";

const DAY_MAP = { 0: "domingo", 1: "segunda", 2: "terca", 3: "quarta", 4: "quinta", 5: "sexta", 6: "sabado" };
const DAY_LABELS = { segunda: "SEG", terca: "TER", quarta: "QUA", quinta: "QUI", sexta: "SEX", sabado: "SAB", domingo: "DOM" };
const GOAL_LABELS = { hipertrofia: "HIPERTROFIA", emagrecimento: "EMAGRECIMENTO", resistencia: "RESISTÊNCIA", forca: "FORÇA", saude: "SAÚDE" };

export default function MyWorkout() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [setsData, setSetsData] = useState({});
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [workoutDone, setWorkoutDone] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const qc = useQueryClient();

  const today = DAY_MAP[new Date().getDay()];

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: allPlans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list() });

  useEffect(() => {
    if (user && students.length > 0) {
      const found = students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase());
      if (!found || !found.goal) {
        window.location.href = "/Onboarding";
      } else {
        setStudent(found);
      }
    }
  }, [user, students]);

  const myPlans = student ? allPlans.filter(p => p.student_id === student.id && p.active !== false) : [];
  const selectedPlan = myPlans.find(p => p.id === selectedPlanId);
  const todayPlans = myPlans.filter(p => p.day_of_week === today);

  const logMut = useMutation({
    mutationFn: (data) => base44.entities.WorkoutLog.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });

  const initSets = (exerciseIdx, numSets) => {
    if (setsData[exerciseIdx]) return setsData[exerciseIdx];
    return Array.from({ length: numSets || 3 }, (_, i) => ({ set_number: i + 1, reps_done: 0, load_kg: 0 }));
  };

  const updateSet = (exerciseIdx, setIdx, field, value) => {
    const current = setsData[exerciseIdx] || initSets(exerciseIdx, selectedPlan.exercises[exerciseIdx]?.sets || 3);
    const updated = [...current];
    updated[setIdx] = { ...updated[setIdx], [field]: parseFloat(value) || 0 };
    setSetsData({ ...setsData, [exerciseIdx]: updated });
  };

  const saveExerciseLog = (exerciseIdx) => {
    const exercise = selectedPlan.exercises[exerciseIdx];
    const sets = setsData[exerciseIdx] || initSets(exerciseIdx, exercise.sets);
    const maxLoad = Math.max(...sets.map(s => s.load_kg), 0);
    logMut.mutate({
      student_id: student.id,
      workout_plan_id: selectedPlanId,
      exercise_id: exercise.exercise_id || "",
      exercise_name: exercise.exercise_name,
      date: new Date().toISOString().split("T")[0],
      sets_completed: sets,
      technique_used: exercise.technique || "normal",
      max_load_kg: maxLoad,
    });
    const newCompleted = new Set([...completedExercises, exerciseIdx]);
    setCompletedExercises(newCompleted);
    toast.success(`${exercise.exercise_name} concluído!`);
  };

  const finishWorkout = () => {
    setWorkoutDone(true);
    setTimeout(() => {
      window.location.href = "/Progress";
    }, 3000);
  };

  const getExerciseVideo = (exerciseId) => {
    return exercises.find(ex => ex.id === exerciseId)?.video_url;
  };

  const openVideoDialog = (videoUrl) => {
    setSelectedVideo(videoUrl);
    setVideoDialogOpen(true);
  };

  // Loading
  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Not linked to a student or not active yet
  if (user && students.length > 0 && (!student || !student.active)) {
    if (student && !student.active) {
      window.location.href = "/Welcome";
      return null;
    }
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
          <Dumbbell className="w-8 h-8 text-purple-500/40" />
        </div>
        <h2 className="font-cyber text-lg text-white tracking-widest mb-3">PERFIL NÃO ENCONTRADO</h2>
        <p className="text-purple-400/40 text-sm font-mono-cyber leading-relaxed">
          // seu email não está vinculado a nenhum aluno<br />
          // contate seu personal trainer
        </p>
      </div>
    );
  }

  // Workout complete celebration
  if (workoutDone) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center mb-6 animate-pulse"
        style={{ 
          background: 'radial-gradient(circle, rgba(6,182,212,0.2), rgba(168,85,247,0.1), transparent)', 
          border: '2px solid rgba(6,182,212,0.6)', 
          boxShadow: '0 0 80px rgba(6,182,212,0.4), 0 0 120px rgba(168,85,247,0.3)' 
        }}
      >
        <Trophy className="w-16 h-16 text-cyan-400" style={{ filter: 'drop-shadow(0 0 15px rgba(6,182,212,1))' }} />
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/50" />
          <span className="text-[10px] font-mono-cyber text-cyan-500/60 tracking-[0.4em]">TREINO FINALIZADO</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500/50" />
        </div>
        <h2 className="font-cyber text-5xl md:text-6xl text-white tracking-widest mb-2" style={{ textShadow: '0 0 40px rgba(6,182,212,0.6), 0 0 60px rgba(168,85,247,0.4)' }}>
          PARABÉNS!
        </h2>
        <p className="text-cyan-400/80 font-mono-cyber text-lg mt-2">// você destruiu o treino</p>
      </div>
      <div className="cyber-card rounded-xl p-6 border border-cyan-500/20 bg-cyan-500/5 mb-8 max-w-md">
        <p className="text-white font-semibold mb-3">{selectedPlan?.name}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <p className="font-cyber text-2xl text-cyan-400">{selectedPlan?.exercises?.length}</p>
            <p className="text-[10px] text-purple-400/40 font-mono-cyber tracking-wider uppercase">Exercícios</p>
          </div>
          <div className="text-center">
            <p className="font-cyber text-2xl text-purple-400">{completedExercises.size}</p>
            <p className="text-[10px] text-purple-400/40 font-mono-cyber tracking-wider uppercase">Concluídos</p>
          </div>
        </div>
      </div>
      <p className="text-xs font-mono-cyber text-purple-500/40 mb-2">// redirecionando para o progresso...</p>
      <div className="flex gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );

  // Plan selection
  if (!selectedPlanId) return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-900/40" />
          <span className="text-[10px] font-mono-cyber text-purple-500/30 tracking-[0.25em]">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-900/40" />
        </div>
        <h1
          className="font-cyber text-3xl md:text-4xl text-white tracking-widest mt-5"
          style={{ textShadow: '0 0 30px rgba(168,85,247,0.4)' }}
        >
          OLÁ, {student?.name?.split(" ")[0]?.toUpperCase() || "ATLETA"}
        </h1>
        <p className="text-purple-400/40 font-mono-cyber text-sm mt-1">// pronto para destruir o treino?</p>
        {student?.goal && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ boxShadow: '0 0 4px rgba(168,85,247,1)' }} />
            <span className="text-xs font-mono-cyber text-purple-400/60 tracking-wider">{GOAL_LABELS[student.goal] || student.goal}</span>
          </div>
        )}
      </div>

      {/* Today's workout highlight */}
      {todayPlans.length > 0 && (
        <div
          className="mb-6 rounded-xl p-5 border"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(6,182,212,0.03))', borderColor: 'rgba(168,85,247,0.3)', boxShadow: '0 0 25px rgba(168,85,247,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-pink-400" style={{ filter: 'drop-shadow(0 0 4px rgba(236,72,153,0.8))' }} />
            <span className="text-xs font-mono-cyber text-pink-400 tracking-[0.2em]">TREINO DE HOJE</span>
          </div>
          {todayPlans.map(plan => (
            <div key={plan.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{plan.name}</p>
                <p className="text-xs text-purple-400/40 mt-0.5 font-mono-cyber">{plan.exercises?.length || 0} exercícios</p>
              </div>
              <button onClick={() => setSelectedPlanId(plan.id)} className="btn-neon-purple px-5 py-2.5 rounded-lg text-sm font-medium tracking-wider">
                INICIAR →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* All plans */}
      <div>
        <p className="text-[10px] text-purple-500/40 font-mono-cyber uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
          <Calendar className="w-3 h-3" /> Todos os treinos
        </p>
        <div className="space-y-2">
          {myPlans.map(plan => {
            const isToday = plan.day_of_week === today;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`w-full text-left rounded-xl p-4 border transition-all group ${
                  isToday ? "border-purple-500/25 bg-purple-500/5" : "cyber-card border-purple-900/20 hover:border-purple-500/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                      isToday ? "bg-purple-500/15 border-purple-500/30" : "bg-purple-900/20 border-purple-900/30"
                    }`}>
                      <Dumbbell className={`w-4 h-4 ${isToday ? "text-purple-400" : "text-purple-700"}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${isToday ? "text-white" : "text-white/60"}`}>{plan.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {plan.day_of_week && (
                          <Badge className={`text-xs ${isToday ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" : "bg-purple-900/20 border border-purple-900/30 text-purple-600"}`}>
                            {DAY_LABELS[plan.day_of_week]}
                          </Badge>
                        )}
                        <span className="text-xs text-purple-500/40 font-mono-cyber">{plan.exercises?.length || 0} exerc.</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-600/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            );
          })}
          {myPlans.length === 0 && (
            <div className="text-center py-16 text-purple-500/30">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-mono-cyber text-sm">// nenhum treino atribuído<br />// fale com seu personal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Workout execution
  const progress = selectedPlan.exercises?.length ? (completedExercises.size / selectedPlan.exercises.length) * 100 : 0;

  return (
    <div>
      {/* Muscle Map */}
      <div className="cyber-card rounded-xl p-5 border border-purple-900/20 mb-5">
        <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-4">Grupos Musculares - {selectedPlan?.name}</p>
        <MuscleMap exercises={selectedPlan?.exercises || []} size="sm" showLabels={true} />
      </div>

      {/* Back + Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <button
            onClick={() => { setSelectedPlanId(null); setSetsData({}); setCompletedExercises(new Set()); }}
            className="text-xs text-purple-500/40 font-mono-cyber hover:text-purple-400 transition-colors mb-2 flex items-center gap-1"
          >
            ← VOLTAR
          </button>
          <h2 className="font-cyber text-lg text-white tracking-widest">{selectedPlan?.name}</h2>
        </div>
        <div className="text-right">
          <span className="font-cyber text-2xl text-purple-300" style={{ textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
            {completedExercises.size}<span className="text-purple-600 text-base">/{selectedPlan.exercises?.length || 0}</span>
          </span>
          <p className="text-[10px] font-mono-cyber text-purple-500/40">CONCLUÍDOS</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1 bg-purple-900/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #a855f7, #06b6d4)', boxShadow: '0 0 8px rgba(168,85,247,0.8)' }}
          />
        </div>
      </div>

      {/* Finish Workout Button */}
      {completedExercises.size === selectedPlan.exercises?.length && completedExercises.size > 0 && (
        <div className="mb-6">
          <button
            onClick={finishWorkout}
            className="w-full py-4 rounded-xl font-cyber text-lg tracking-widest transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.15))',
              border: '2px solid rgba(6,182,212,0.5)',
              boxShadow: '0 0 30px rgba(6,182,212,0.3)',
              color: 'white'
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <Flag className="w-6 h-6" />
              <span>FINALIZAR TREINO</span>
            </div>
          </button>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        {selectedPlan.exercises?.map((exercise, exerciseIdx) => {
          const isCompleted = completedExercises.has(exerciseIdx);
          const sets = setsData[exerciseIdx] || initSets(exerciseIdx, exercise.sets);

          return (
            <div
              key={exerciseIdx}
              className={`cyber-card rounded-xl p-5 border transition-all ${
                isCompleted ? "border-cyan-500/20" : "border-purple-900/20"
              }`}
              style={isCompleted ? { opacity: 0.6, background: 'rgba(6,182,212,0.02)' } : {}}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
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
                      <Badge className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono-cyber">
                        {exercise.sets}x{exercise.reps}
                      </Badge>
                      {exercise.load_kg > 0 && (
                        <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
                          ref: {exercise.load_kg}kg
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
                    {exercise.notes && (
                      <p className="text-xs text-purple-400/30 mt-0.5">{exercise.notes}</p>
                    )}
                  </div>
                </div>
                <RestTimer initialSeconds={exercise.rest_seconds || 60} />
              </div>

              {/* Sets input */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-purple-400/30 font-mono-cyber uppercase tracking-wider px-1 mb-1">
                  <span className="col-span-2">#</span>
                  <span className="col-span-5">REPS</span>
                  <span className="col-span-5">KG</span>
                </div>
                {sets.map((set, setIdx) => (
                  <div key={setIdx} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-2 text-center text-sm font-cyber text-purple-400/50 bg-purple-900/20 border border-purple-900/30 rounded-lg py-2">
                      {setIdx + 1}
                    </span>
                    <div className="col-span-5">
                      <Input
                        type="number"
                        inputMode="numeric"
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
                        inputMode="decimal"
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

              {!isCompleted ? (
                <button
                  onClick={() => saveExerciseLog(exerciseIdx)}
                  className="w-full mt-4 btn-neon-cyan py-3 rounded-lg text-sm font-medium tracking-widest flex items-center justify-center gap-2"
                  disabled={logMut.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  CONCLUIR
                </button>
              ) : (
                <div className="mt-3 text-center py-2 border border-cyan-500/20 rounded-lg bg-cyan-500/5">
                  <span className="text-xs font-mono-cyber text-cyan-400 tracking-wider">✓ CONCLUÍDO</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

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