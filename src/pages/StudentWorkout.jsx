import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";
import RestTimer from "../components/workout/RestTimer";

export default function StudentWorkout() {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [setsData, setSetsData] = useState({});
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const qc = useQueryClient();

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: allPlans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => base44.entities.WorkoutPlan.list() });

  const studentPlans = allPlans.filter((p) => p.student_id === selectedStudentId);
  const selectedPlan = allPlans.find((p) => p.id === selectedPlanId);

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

  return (
    <div>
      <PageHeader title="Treinar" subtitle="Registre seu treino do dia" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Select value={selectedStudentId} onValueChange={(v) => { setSelectedStudentId(v); setSelectedPlanId(""); setSetsData({}); setCompletedExercises(new Set()); }}>
          <SelectTrigger className="bg-gray-900/60 border-gray-800 text-white">
            <SelectValue placeholder="Selecione o aluno" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-white hover:bg-gray-700">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPlanId} onValueChange={(v) => { setSelectedPlanId(v); setSetsData({}); setCompletedExercises(new Set()); }}>
          <SelectTrigger className="bg-gray-900/60 border-gray-800 text-white">
            <SelectValue placeholder="Selecione o treino" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {studentPlans.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-white hover:bg-gray-700">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlan && (
        <div className="space-y-6">
          {selectedPlan.exercises?.map((exercise, exerciseIdx) => {
            const isCompleted = completedExercises.has(exerciseIdx);
            const sets = setsData[exerciseIdx] || initSets(exerciseIdx, exercise.sets);

            return (
              <div
                key={exerciseIdx}
                className={`bg-gray-900/60 border rounded-2xl p-5 transition-all ${
                  isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : "border-gray-800/60"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isCompleted ? "bg-emerald-500/20" : "bg-gray-800"
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Dumbbell className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{exercise.exercise_name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                          {exercise.sets}x{exercise.reps}
                        </Badge>
                        {exercise.load_kg > 0 && (
                          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                            {exercise.load_kg}kg sugerido
                          </Badge>
                        )}
                        {exercise.technique && exercise.technique !== "normal" && (
                          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs">
                            {exercise.technique.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      {exercise.technique_details && (
                        <p className="text-xs text-gray-500 mt-1 italic">{exercise.technique_details}</p>
                      )}
                    </div>
                  </div>
                  <RestTimer initialSeconds={exercise.rest_seconds || 60} />
                </div>

                {/* Sets Grid */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-2">
                    <span className="col-span-2">Série</span>
                    <span className="col-span-5">Reps feitas</span>
                    <span className="col-span-5">Carga (kg)</span>
                  </div>
                  {sets.map((set, setIdx) => (
                    <div key={setIdx} className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-2 text-center text-sm font-mono text-gray-500 bg-gray-800/60 rounded-lg py-2">
                        {setIdx + 1}
                      </span>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          value={set.reps_done || ""}
                          onChange={(e) => updateSet(exerciseIdx, setIdx, "reps_done", e.target.value)}
                          placeholder={exercise.reps}
                          className="bg-gray-800 border-gray-700 text-white text-center"
                          disabled={isCompleted}
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          value={set.load_kg || ""}
                          onChange={(e) => updateSet(exerciseIdx, setIdx, "load_kg", e.target.value)}
                          placeholder={exercise.load_kg?.toString() || "0"}
                          className="bg-gray-800 border-gray-700 text-white text-center"
                          disabled={isCompleted}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {!isCompleted && (
                  <Button
                    onClick={() => saveExerciseLog(exerciseIdx)}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                    disabled={logMut.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Registrar Exercício
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!selectedPlanId && selectedStudentId && studentPlans.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum treino encontrado para este aluno.</p>
        </div>
      )}

      {!selectedStudentId && (
        <div className="text-center py-16 text-gray-500">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Selecione um aluno e um treino para começar.</p>
        </div>
      )}
    </div>
  );
}