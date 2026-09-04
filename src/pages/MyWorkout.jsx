import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Dumbbell, Flame, ChevronRight, Trophy, Calendar, PlayCircle, Flag, TrendingDown, AlertTriangle, RotateCcw, XCircle, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ExerciseTimers from "../components/workout/ExerciseTimers";
import UncheckExerciseDialog from "../components/workout/UncheckExerciseDialog";
import LastWeightBadge from "../components/workout/LastWeightBadge";
import MuscleMap from "../components/workout/MuscleMap";
import WorkoutPdfExport from "../components/workout/WorkoutPdfExport";
import WorkoutElapsedTimer from "@/components/workout/WorkoutElapsedTimer";
import WorkoutShareComposer from "@/components/workout/WorkoutShareComposer";
import WorkoutFeedbackDialog from "@/components/workout/WorkoutFeedbackDialog";
import ExerciseSearchButton from "@/components/exercise/ExerciseSearchButton";
import ExerciseSearchModal from "@/components/exercise/ExerciseSearchModal";
import { usePersistentWorkoutSession } from "@/hooks/usePersistentWorkoutSession";
import { sortExercisesByProgression, getExerciseProgression } from "../utils/progressionSort";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const DAY_MAP = { 0: "domingo", 1: "segunda", 2: "terca", 3: "quarta", 4: "quinta", 5: "sexta", 6: "sabado" };
const DAY_LABELS = { segunda: "SEG", terca: "TER", quarta: "QUA", quinta: "QUI", sexta: "SEX", sabado: "SAB", domingo: "DOM" };
const GOAL_LABELS = { hipertrofia: "HIPERTROFIA", emagrecimento: "EMAGRECIMENTO", resistencia: "RESISTÊNCIA", forca: "FORÇA", saude: "SAÚDE" };

export default function MyWorkout() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const [student, setStudent] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [setsData, setSetsData] = useState({});
  const [exerciseNotes, setExerciseNotes] = useState({});
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [workoutDone, setWorkoutDone] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [startedAt, setStartedAt] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchExerciseName, setSearchExerciseName] = useState(null);
  const [uncheckDialog, setUncheckDialog] = useState(null); // { exerciseIdx, exerciseName }
  const restoredRef = useRef(false);
  const qc = useQueryClient();

  const today = DAY_MAP[new Date().getDay()];
  const isSubscriber = user?.role === "assinante" || user?.account_type === "assinante";
  const owner = student || (isSubscriber && user ? {
    id: user.email,
    email: user.email,
    name: user.full_name || user.email,
    active: true,
    goal: user.goal
  } : null);

  const { data: students = [], isLoading: loadingStudents } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list(), staleTime: 60000 });
  const matchedStudent = user ? students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase()) : null;
  const { data: allLogs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => base44.entities.WorkoutLog.list(), staleTime: 30000, placeholderData: (prev) => prev });
  const { data: allPlans = [], isFetched: plansFetched } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list(), staleTime: 60000, placeholderData: (prev) => prev });
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list(), staleTime: 60000 });

  useEffect(() => {
    if (user && students.length > 0) {
      const found = students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase());
      if (isSubscriber) {
        setStudent(found || null);
      } else if (!found || !found.goal) {
        navigate("/Onboarding", { replace: true });
      } else if (!found.active) {
        navigate("/Welcome", { replace: true });
      } else {
        setStudent(found);
      }
    }
  }, [user, students, isSubscriber, navigate]);

  const myPlans = owner ? allPlans.filter(p => p.active !== false && !["arquivado", "substituido"].includes(p.statusVersao) && (
    p.student_id === owner.id ||
    p.student_id === owner.email ||
    p.usuarioId === owner.email ||
    p.assinanteId === owner.email
  )) : [];
  const selectedPlan = myPlans.find(p => p.id === selectedPlanId);
  const todayPlans = myPlans.filter(p => p.day_of_week === today);

  const workoutSnapshot = useMemo(() => ({
    trainer_email: user?.email || "",
    student_id: owner?.id || owner?.email || "",
    student_email: owner?.email || user?.email || "",
    workout_plan_id: selectedPlanId || "",
    sets_data: { ...setsData, __exercise_notes: exerciseNotes, __workout_notes: workoutNotes },
    completed_exercises: Array.from(completedExercises),
    status: "active",
    started_at: startedAt,
  }), [user?.email, owner?.id, owner?.email, selectedPlanId, setsData, exerciseNotes, workoutNotes, completedExercises, startedAt]);

  const { restoredSession, isLoaded: sessionLoaded, closeSession, reopenSession } = usePersistentWorkoutSession({
    trainerEmail: user?.email,
    snapshot: workoutSnapshot,
    enabled: !!owner && !!selectedPlanId && !!startedAt,
  });

  useEffect(() => {
    if (!sessionLoaded || !plansFetched || !owner || restoredRef.current) return;
    restoredRef.current = true;
    if (!restoredSession) return;
    if (!myPlans.some(plan => plan.id === restoredSession.workout_plan_id)) {
      closeSession();
      return;
    }
    setSelectedPlanId(restoredSession.workout_plan_id);
    const { __exercise_notes = {}, __workout_notes = "", ...restoredSets } = restoredSession.sets_data || {};
    setSetsData(restoredSets);
    setExerciseNotes(__exercise_notes);
    setWorkoutNotes(__workout_notes);
    setCompletedExercises(new Set(restoredSession.completed_exercises || []));
    setStartedAt(restoredSession.started_at || new Date().toISOString());
    toast.info("Andamento do treino restaurado.");
  }, [sessionLoaded, plansFetched, owner, restoredSession, myPlans, closeSession]);

  // Use exercise_name as stable key to avoid data loss on re-renders/refetches
  const getExKey = (exercise, idx) => exercise.exercise_name || `ex_${idx}`;

  const initSets = (exKey, numSets) => {
    if (setsData[exKey]) return setsData[exKey];
    return Array.from({ length: numSets || 3 }, (_, i) => ({ set_number: i + 1, reps_done: 0, load_kg: 0 }));
  };

  const updateSet = (exKey, setIdx, field, value, numSets) => {
    const current = setsData[exKey] || initSets(exKey, numSets || 3);
    const updated = [...current];
    updated[setIdx] = { ...updated[setIdx], [field]: parseFloat(value) || 0 };
    setSetsData(prev => ({ ...prev, [exKey]: updated }));
  };

  const applyWeightToAllSets = (exKey, kg, numSets) => {
    const current = setsData[exKey] || initSets(exKey, numSets || 3);
    const updated = current.map(s => ({ ...s, load_kg: kg }));
    setSetsData(prev => ({ ...prev, [exKey]: updated }));
  };

  const saveExerciseLog = (exerciseIdx) => {
    const exercise = selectedPlan.exercises[exerciseIdx];
    const exKey = getExKey(exercise, exerciseIdx);
    const sets = setsData[exKey] || initSets(exKey, exercise.sets);
    setSetsData(prev => ({ ...prev, [exKey]: sets }));
    setCompletedExercises(prev => new Set([...prev, exerciseIdx]));
    toast.success(`${exercise.exercise_name} registrado no andamento!`);
  };

  const handleUncheckRequest = (exerciseIdx, exerciseName) => {
    setUncheckDialog({ exerciseIdx, exerciseName });
  };

  const confirmUncheck = () => {
    if (uncheckDialog) {
      const newCompleted = new Set(completedExercises);
      newCompleted.delete(uncheckDialog.exerciseIdx);
      setCompletedExercises(newCompleted);
      toast.info(`${uncheckDialog.exerciseName} desmarcado.`);
      setUncheckDialog(null);
    }
  };

  const finishWorkout = async () => {
    if (!selectedPlan || completedExercises.size !== selectedPlan.exercises?.length) return;
    setIsFinalizing(true);
    try {
      const logs = selectedPlan.exercises.map((exercise, exerciseIdx) => {
        const exKey = getExKey(exercise, exerciseIdx);
        const sets = setsData[exKey] || initSets(exKey, exercise.sets);
        return { student_id: owner.id || owner.email, workout_plan_id: selectedPlanId, exercise_id: exercise.exercise_id || "", exercise_name: exercise.exercise_name, date: new Date().toISOString().split("T")[0], sets_completed: sets, technique_used: exercise.technique || "normal", notes: exerciseNotes[exKey]?.trim() || "", workout_notes: workoutNotes.trim(), max_load_kg: Math.max(...sets.map(set => Number(set.load_kg) || 0), 0) };
      });
      await base44.entities.WorkoutLog.bulkCreate(logs);
      await closeSession();
      await qc.invalidateQueries({ queryKey: ["logs"] });
      setWorkoutDone(true);
    } catch {
      toast.error("Não foi possível finalizar. Seu andamento continua salvo.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const cancelWorkout = async () => {
    if (!window.confirm("Cancelar este treino? O andamento será descartado e não entrará no histórico.")) return;
    await closeSession();
    setSelectedPlanId(null);
    setSetsData({});
    setExerciseNotes({});
    setWorkoutNotes("");
    setCompletedExercises(new Set());
    setStartedAt("");
    toast.info("Treino cancelado sem salvar no histórico.");
  };

  const startWorkout = (planId) => {
    reopenSession();
    setSelectedPlanId(planId);
    setSetsData({});
    setExerciseNotes({});
    setWorkoutNotes("");
    setCompletedExercises(new Set());
    setStartedAt(new Date().toISOString());
  };

  const getExerciseVideo = (exerciseId) => {
    return exercises.find(ex => ex.id === exerciseId)?.video_url;
  };

  const openVideoDialog = (videoUrl) => {
    setSelectedVideo(videoUrl);
    setVideoDialogOpen(true);
  };

  // Loading
  if (userLoading || loadingStudents) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  // Not linked to a student or not active yet
  if (user && !isSubscriber && (!(student || matchedStudent) || !(student || matchedStudent).active)) {
    if ((student || matchedStudent) && !(student || matchedStudent).active) {
      navigate("/Welcome", { replace: true });
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

  const shareStats = selectedPlan ? {
    name: selectedPlan.name,
    durationMinutes: startedAt ? Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)) : 0,
    volumeKg: Object.values(setsData).flat().reduce((sum, set) => sum + (Number(set.load_kg) || 0) * (Number(set.reps_done) || 0), 0),
    exercises: selectedPlan.exercises.map((exercise, index) => ({ name: exercise.exercise_name, maxLoad: Math.max(...(setsData[getExKey(exercise, index)] || []).map(set => Number(set.load_kg) || 0), 0) })),
  } : null;

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
      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <button onClick={() => setShareOpen(true)} className="btn-neon-cyan flex flex-1 items-center justify-center gap-2 rounded-xl py-3"><Share2 className="h-4 w-4" /> COMPARTILHAR TREINO</button>
        <button onClick={() => navigate("/Progress")} className="flex-1 rounded-xl border border-purple-500/25 py-3 text-sm text-purple-200">VER PROGRESSO</button>
      </div>
      <WorkoutShareComposer open={shareOpen} onClose={() => setShareOpen(false)} stats={shareStats} />
    </div>
  );

  // Plan selection
  if (!selectedPlanId) return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Hero */}
      <motion.div variants={fadeUp} className="mb-8">
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
          OLÁ, {owner?.name?.split(" ")[0]?.toUpperCase() || "ATLETA"}
        </h1>
        <p className="text-purple-400/40 font-mono-cyber text-sm mt-1">// pronto para destruir o treino?</p>
        {owner?.goal && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ boxShadow: '0 0 4px rgba(168,85,247,1)' }} />
            <span className="text-xs font-mono-cyber text-purple-400/60 tracking-wider">{GOAL_LABELS[owner.goal] || owner.goal}</span>
          </div>
        )}
        </motion.div>

        {/* Today's workout highlight */}
      {todayPlans.length > 0 && (
        <motion.div variants={fadeUp}
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
              <button onClick={() => startWorkout(plan.id)} className="btn-neon-purple px-5 py-2.5 rounded-lg text-sm font-medium tracking-wider">
                INICIAR →
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* All plans */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-purple-500/40 font-mono-cyber uppercase tracking-[0.25em] flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Todos os treinos
          </p>
          {owner && myPlans.length > 0 && (
            <WorkoutPdfExport
              studentId={owner.id}
              studentName={owner.name}
            />
          )}
        </div>
        <motion.div variants={stagger} className="space-y-2">
          {myPlans.map(plan => {
            const isToday = plan.day_of_week === today;
            return (
              <motion.button variants={fadeUp} whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}
                key={plan.id}
                onClick={() => startWorkout(plan.id)}
                className={`w-full text-left rounded-xl p-4 border transition-all group ${
                  isToday ? "border-purple-500/25 bg-purple-500/5" : "cyber-card border-purple-900/20 hover:border-purple-500/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 bg-purple-500/10 border-purple-500/20">
                      <Dumbbell className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{plan.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {plan.day_of_week && (
                          <Badge className={`text-xs ${isToday ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" : "bg-purple-900/20 border border-purple-900/30 text-purple-400/60"}`}>
                            {DAY_LABELS[plan.day_of_week]}{isToday ? " · HOJE" : ""}
                          </Badge>
                        )}
                        <span className="text-xs text-purple-500/40 font-mono-cyber">{plan.exercises?.length || 0} exerc.</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-600/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.button>
            );
          })}
          {myPlans.length === 0 && (
            <motion.div variants={fadeUp} className="text-center py-16 text-purple-500/30">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-mono-cyber text-sm">// nenhum treino atribuído<br />// fale com seu personal</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );

  // Workout execution
  const progress = selectedPlan.exercises?.length ? (completedExercises.size / selectedPlan.exercises.length) * 100 : 0;
  const ownerIds = owner ? [owner.id, owner.email].filter(Boolean) : [];
  const sortedExercises = owner ? sortExercisesByProgression(selectedPlan.exercises || [], allLogs, ownerIds) : [];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Muscle Map */}
      <div className="cyber-card rounded-xl p-5 border border-purple-900/20 mb-5">
        <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-4">Grupos Musculares - {selectedPlan?.name}</p>
        <MuscleMap exercises={selectedPlan?.exercises || []} exerciseLibrary={exercises} size="sm" showLabels={true} />
      </div>

      {/* Back + Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <button
            onClick={cancelWorkout}
            disabled={isFinalizing}
            className="mb-2 flex items-center gap-1 text-xs font-mono-cyber text-red-300/70 transition-colors hover:text-red-300 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" /> CANCELAR TREINO
          </button>
          <h2 className="font-cyber text-lg text-white tracking-widest">{selectedPlan?.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <WorkoutElapsedTimer startedAt={startedAt} />
          <div className="text-right">
            <span className="font-cyber text-2xl text-purple-300" style={{ textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
              {completedExercises.size}<span className="text-purple-600 text-base">/{selectedPlan.exercises?.length || 0}</span>
            </span>
            <p className="text-[10px] font-mono-cyber text-purple-500/40">CONCLUÍDOS</p>
          </div>
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
        <div className="mb-6 space-y-3">
          <WorkoutFeedbackDialog
            title="Observação do treino"
            label="Adicionar observação do treino"
            value={workoutNotes}
            onChange={setWorkoutNotes}
          />
          <button
            onClick={finishWorkout}
            disabled={isFinalizing}
            className="w-full py-4 rounded-xl font-cyber text-lg tracking-widest transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.15))',
              border: '2px solid rgba(6,182,212,0.5)',
              boxShadow: '0 0 30px rgba(6,182,212,0.3)',
              color: 'white'
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <Flag className="w-6 h-6" />
              <span>{isFinalizing ? "FINALIZANDO..." : "FINALIZAR TREINO"}</span>
            </div>
          </button>
        </div>
      )}

      {/* Exercises */}
      <motion.div variants={stagger} className="space-y-4">
        {sortedExercises.map((exercise, displayIdx) => {
          const exerciseIdx = exercise.originalIndex;
          const exKey = getExKey(exercise, exerciseIdx);
          const isCompleted = completedExercises.has(exerciseIdx);
          const sets = setsData[exKey] || initSets(exKey, exercise.sets);
          const progression = ownerIds.length ? getExerciseProgression(exercise.exercise_name, allLogs, ownerIds) : null;

          return (
            <motion.div variants={fadeUp}
              key={exerciseIdx}
              className={`cyber-card rounded-xl p-5 border transition-all ${
                isCompleted ? "border-cyan-500/20" : "border-purple-900/20"
              }`}
              style={isCompleted ? { opacity: 0.6, background: 'rgba(6,182,212,0.02)' } : {}}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
               <div className="flex min-w-0 items-start gap-3">
              ...
                 <div className="min-w-0 flex-1">
                   <div className="flex min-w-0 items-start gap-2">
                     <h3 className="min-w-0 flex-1 break-words font-semibold leading-snug text-white">{exercise.exercise_name}</h3>
                     <ExerciseSearchButton exerciseName={exercise.exercise_name} onSearch={setSearchExerciseName} />
                     <WorkoutFeedbackDialog
                       iconOnly
                       title={`Parecer sobre ${exercise.exercise_name}`}
                       label={`Adicionar parecer sobre ${exercise.exercise_name}`}
                       value={exerciseNotes[exKey] || ""}
                       onChange={(value) => setExerciseNotes(prev => ({ ...prev, [exKey]: value }))}
                     />
                     {getExerciseVideo(exercise.exercise_id) && (
                        <button
                          onClick={() => openVideoDialog(getExerciseVideo(exercise.exercise_id))}
                          className="flex-shrink-0 text-cyan-400 transition-colors hover:text-cyan-300"
                          title="Ver vídeo do exercício"
                        >
                          <PlayCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {progression && (progression.type === "down" || progression.type === "same") && (
                      <div className="flex items-center gap-1.5 mt-1 mb-1 text-[10px] font-mono-cyber px-2 py-1 rounded-md w-fit"
                        style={{ background: `${progression.color}12`, border: `1px solid ${progression.color}30`, color: progression.color }}>
                        {progression.type === "down" ? <TrendingDown className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {progression.label}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <LastWeightBadge
                        exerciseName={exercise.exercise_name}
                        logs={owner ? allLogs.filter(l => l.student_id === owner.id || l.student_id === owner.email) : []}
                        onApply={(kg) => applyWeightToAllSets(exKey, kg, exercise.sets)}
                        disabled={isCompleted}
                      />
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
                <ExerciseTimers restSeconds={exercise.rest_seconds || 60} technique={exercise.technique || "normal"} />
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
                       onChange={(e) => updateSet(exKey, setIdx, "reps_done", e.target.value, exercise.sets)}
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
                       onChange={(e) => updateSet(exKey, setIdx, "load_kg", e.target.value, exercise.sets)}
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
                  disabled={isFinalizing}
                >
                  <CheckCircle className="w-4 h-4" />
                  CONCLUIR
                </button>
              ) : (
                <button
                  onClick={() => handleUncheckRequest(exerciseIdx, exercise.exercise_name)}
                  className="mt-3 w-full py-2.5 rounded-lg flex items-center justify-center gap-2 group transition-all"
                  style={{ border: '1px solid rgba(6,182,212,0.35)', background: 'rgba(6,182,212,0.06)', boxShadow: '0 0 10px rgba(6,182,212,0.1)' }}>
                  <CheckCircle className="w-4 h-4 group-hover:hidden" style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.8))' }} />
                  <RotateCcw className="w-4 h-4 hidden group-hover:block" style={{ color: '#fbbf24' }} />
                  <span className="text-xs font-mono-cyber tracking-wider group-hover:hidden" style={{ color: '#06b6d4' }}>✓ CONCLUÍDO</span>
                  <span className="text-xs font-mono-cyber tracking-wider hidden group-hover:block" style={{ color: '#fbbf24' }}>DESMARCAR</span>
                </button>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Uncheck Confirmation Dialog */}
      <UncheckExerciseDialog
        open={!!uncheckDialog}
        exerciseName={uncheckDialog?.exerciseName}
        onConfirm={confirmUncheck}
        onCancel={() => setUncheckDialog(null)}
      />

      <ExerciseSearchModal
        exerciseName={searchExerciseName}
        onClose={() => setSearchExerciseName(null)}
      />

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="bg-[#0a0a16] border-purple-500/30 text-white max-w-3xl p-0">
          {selectedVideo && (() => {
            // YouTube
            const ytMatch = selectedVideo.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
            if (ytMatch) {
              return (
                <div className="relative w-full rounded-lg overflow-hidden" style={{paddingBottom: '56.25%'}}>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                </div>
              );
            }
            // Direct video file
            return (
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full rounded-lg"
                style={{ maxHeight: '80vh' }}
              />
            );
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}