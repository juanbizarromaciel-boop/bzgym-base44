import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, Dumbbell, CheckCircle2, Save, X,
  ChevronDown, ChevronUp, AlertTriangle, Users, PlusCircle, CheckCheck, Image
} from "lucide-react";
import { toast } from "sonner";
import AddExerciseToLibraryModal from "./AddExerciseToLibraryModal";
import ExerciseMediaModal from "@/components/exercise/ExerciseMediaModal";

const QUICK_PROMPTS = [
  "Monte um treino Upper/Lower 4x na semana para hipertrofia, aluno intermediário",
  "Crie um treino ABC para iniciante com foco em hipertrofia geral",
  "Monte um treino de peito e tríceps com top set e back-off set",
  "Crie um treino feminino com foco em glúteos e posteriores, 3x na semana",
  "Monte um treino ABCD para aluno avançado com técnicas avançadas",
  "Crie um treino de força com series de 3-5 reps, estilo powerlifting",
];

const TECH_MAP = {
  normal: 'normal', cluster: 'cluster', rest_pause: 'rest_pause',
  drop_set: 'drop_set', super_set: 'super_set', giant_set: 'giant_set',
  piramidal: 'piramidal', fst7: 'fst7', myo_reps: 'myo_reps', tempo_controlado: 'tempo_controlado'
};

const DAY_MAP = {
  'segunda': 'segunda', 'terca': 'terca', 'quarta': 'quarta',
  'quinta': 'quinta', 'sexta': 'sexta', 'sabado': 'sabado', 'domingo': 'domingo',
  'monday': 'segunda', 'tuesday': 'terca', 'wednesday': 'quarta',
  'thursday': 'quinta', 'friday': 'sexta', 'saturday': 'sabado', 'sunday': 'domingo',
};

function DayCard({ day, idx, onAddExercise, addedExercises, addedExerciseIds }) {
  const [open, setOpen] = useState(idx === 0);
  const [mediaModalEx, setMediaModalEx] = useState(null);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
        style={{ background: open ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <span className="text-xs font-cyber text-purple-300">{idx + 1}</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-white text-sm">{day.dayName || day.day_name || `Dia ${idx + 1}`}</p>
            <p className="text-[11px] font-mono-cyber mt-0.5" style={{ color: 'rgba(192,132,252,0.5)' }}>
              {Array.isArray(day.muscleGroups) ? day.muscleGroups.join(', ') :
               Array.isArray(day.muscle_groups) ? day.muscle_groups.join(', ') : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-xs" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)', color: '#d8b4fe' }}>
            {day.exercises?.length || 0} exerc.
          </Badge>
          {open ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400/50" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-3 space-y-3" style={{ background: 'rgba(4,2,14,0.9)' }}>
          {(day.exercises || []).map((ex, i) => {
            const exName = ex.exerciseName || ex.exercise_name || '';
            const isAdded = addedExercises.has(exName.toLowerCase().trim());
            return (
              <div key={i} className="p-3.5 rounded-xl border" style={{ background: 'rgba(168,85,247,0.04)', borderColor: 'rgba(168,85,247,0.12)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-white text-sm">{exName}</p>
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                    <Badge className="text-[10px]" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}>
                      {ex.sets}×{ex.reps}
                    </Badge>
                    {ex.technique && ex.technique !== 'normal' && (
                      <Badge className="text-[10px]" style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.2)', color: '#f9a8d4' }}>
                        {ex.technique?.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono-cyber" style={{ color: 'rgba(192,132,252,0.55)' }}>
                  {ex.rest && <span>⏱ {ex.rest}</span>}
                  {(ex.rir || ex.rpe) && <span>RIR {ex.rir || ex.rpe}</span>}
                  {ex.cadence && <span>Cad. {ex.cadence}</span>}
                </div>
                {ex.notes && <p className="text-xs mt-1.5 italic" style={{ color: 'rgba(196,181,224,0.5)' }}>{ex.notes}</p>}
                {/* Add to library + media buttons */}
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
                  {isAdded ? (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6ee7b7' }}>
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="font-semibold">Exercício adicionado</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddExercise(ex)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', boxShadow: '0 0 8px rgba(168,85,247,0.08)' }}>
                      <PlusCircle className="w-3.5 h-3.5" />
                      Adicionar exercício
                    </button>
                  )}
                  {isAdded && addedExerciseIds?.[exName.toLowerCase().trim()] && (
                    <button
                      onClick={() => setMediaModalEx({ id: addedExerciseIds[exName.toLowerCase().trim()], name: exName, muscle_group: ex.muscle_group || 'outro', description: ex.notes || '' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                      <Image className="w-3.5 h-3.5" />
                      Adicionar mídia
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ExerciseMediaModal
        exercise={mediaModalEx}
        open={!!mediaModalEx}
        onClose={() => setMediaModalEx(null)}
        onSaved={() => setMediaModalEx(null)}
      />
    </div>
  );
}

export default function AIWorkoutGenerator({ settings }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [applying, setApplying] = useState(false);
  const [addExerciseModal, setAddExerciseModal] = useState(null); // exercise object
  const [addedExercises, setAddedExercises] = useState(new Set());
  const [addedExerciseIds, setAddedExerciseIds] = useState({}); // name.lower -> id

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list()
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list()
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Digite um comando."); return; }
    setLoading(true);
    setPlan(null);
    try {
      const res = await base44.functions.invoke('aiCoach', {
        type: 'workout',
        prompt: `Crie um plano de treino completo para: ${prompt}. 
Retorne JSON com: workoutPlanName, goal, level, weeklyFrequency, split, observations, days (array com: dayName, dayOfWeek (em português: segunda/terca/quarta/quinta/sexta/sabado/domingo), muscleGroups (array), exercises (array com: exerciseName, sets (número), reps (string), rest (string com 's'), rir (string), technique (uma das técnicas válidas), cadence (opcional), notes (opcional))).`
      });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      const d = res?.data?.data;
      if (!d?.days?.length) { toast.error("A IA não gerou um plano válido. Tente um prompt mais detalhado."); return; }
      setPlan(d);
    } catch (e) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  const MUSCLE_GUESS = {
    peito: ['supino', 'crucifixo', 'crossover', 'peck deck', 'flexão', 'chest'],
    costas: ['remada', 'puxada', 'pulldown', 'pullup', 'barra fixa', 'serrote', 'cavalinho', 'hiperextensão'],
    ombros: ['desenvolvimento', 'elevação', 'arnold', 'militar', 'shoulder'],
    biceps: ['rosca', 'curl', 'bicep'],
    triceps: ['tríceps', 'tricep', 'extensão', 'testa', 'pulley', 'frances'],
    pernas: ['agachamento', 'squat', 'leg', 'prensa', 'cadeira', 'mesa', 'stiff', 'terra', 'hack'],
    gluteos: ['glúteo', 'hip thrust', 'elevação pélvica', 'abdução'],
    abdomen: ['abdominal', 'plank', 'prancha', 'crunch', 'vacuum'],
    panturrilha: ['panturrilha', 'gêmeos', 'calf'],
    cardio: ['esteira', 'bicicleta', 'elíptico', 'hiit', 'corrida', 'pulo', 'corda'],
  };

  const guessMusleGroup = (name) => {
    const lower = name.toLowerCase();
    for (const [group, keywords] of Object.entries(MUSCLE_GUESS)) {
      if (keywords.some(k => lower.includes(k))) return group;
    }
    return 'outro';
  };

  const handleApply = async () => {
    if (!selectedStudent) { toast.error("Selecione um aluno para aplicar o treino."); return; }
    if (!plan?.days?.length) return;
    setApplying(true);
    try {
      // Collect all exercise names from the generated plan
      const allAIExercises = plan.days.flatMap(day =>
        (day.exercises || []).map(ex => ({
          name: ex.exerciseName || ex.exercise_name,
          muscle_group: ex.muscleGroup || ex.muscle_group || guessMusleGroup(ex.exerciseName || ex.exercise_name || ''),
        }))
      );

      // Find which ones don't exist in the library (case-insensitive)
      const existingNames = new Set(exercises.map(e => e.name?.toLowerCase().trim()));
      const newExercises = allAIExercises.filter(
        ex => ex.name && !existingNames.has(ex.name.toLowerCase().trim())
      );
      // Deduplicate new ones
      const uniqueNew = newExercises.filter((ex, idx, arr) =>
        arr.findIndex(e => e.name.toLowerCase().trim() === ex.name.toLowerCase().trim()) === idx
      );

      // Create missing exercises in the library
      if (uniqueNew.length > 0) {
        await Promise.all(uniqueNew.map(ex =>
          base44.entities.Exercise.create({ name: ex.name, muscle_group: ex.muscle_group })
        ));
        toast.info(`${uniqueNew.length} novo(s) exercício(s) adicionado(s) à biblioteca.`);
      }

      // Save workout plans
      let saved = 0;
      for (const day of plan.days) {
        const dow = DAY_MAP[(day.dayOfWeek || day.day_of_week || '').toLowerCase()] || 'segunda';
        const dayExercises = (day.exercises || []).map((ex, i) => ({
          exercise_name: ex.exerciseName || ex.exercise_name,
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps || '8-12',
          load_kg: 0,
          rest_seconds: parseInt(String(ex.rest || '90').replace(/[^0-9]/g, '')) || 90,
          technique: TECH_MAP[ex.technique] || 'normal',
          technique_details: ex.cadence ? `Cadência: ${ex.cadence}` : '',
          notes: ex.notes || '',
          order: i + 1,
        }));
        await base44.entities.WorkoutPlan.create({
          student_id: selectedStudent,
          name: `${plan.workoutPlanName || plan.workout_plan_name} - ${day.dayName || day.day_name}`,
          day_of_week: dow,
          exercises: dayExercises,
          active: true,
        });
        saved++;
      }
      toast.success(`${saved} plano(s) criado(s) com sucesso! Acesse Planos de Treino para revisar.`);
      setPlan(null);
      setPrompt("");
    } catch (e) {
      toast.error("Erro ao aplicar o treino: " + e.message);
    }
    setApplying(false);
  };

  return (
    <div className="space-y-5">
      {/* Prompt */}
      <div className="rounded-2xl p-5 border relative overflow-hidden backdrop-blur-sm"
        style={{ background: 'rgba(10,6,28,0.85)', borderColor: 'rgba(168,85,247,0.2)', boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(168,85,247,0.07)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.35), transparent)' }} />

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
            <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-purple-200">Montar Treino com IA</h2>
            <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(192,132,252,0.4)' }}>Descreva o objetivo e a IA monta o plano completo</p>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
          placeholder="Ex: Monte um treino Upper/Lower 4x na semana para hipertrofia, aluno intermediário, usando cadência 1-1-2-1, RIR 1-2 e descanso de 90 a 120 segundos."
          rows={4}
          className="w-full resize-none rounded-xl p-3.5 text-sm transition-all outline-none"
          style={{
            background: 'rgba(4,2,14,0.7)',
            border: '1px solid rgba(168,85,247,0.15)',
            color: '#f0e6ff',
            fontFamily: 'Inter, sans-serif',
            caretColor: '#a855f7',
          }}
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.35)' }}>Ctrl+Enter para gerar</p>
          <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#e9d5ff', boxShadow: loading ? 'none' : '0 0 14px rgba(168,85,247,0.12)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar treino
          </button>
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
          <p className="text-[10px] font-mono-cyber mb-2.5" style={{ color: 'rgba(168,85,247,0.35)' }}>SUGESTÕES RÁPIDAS</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((q, i) => (
              <button key={i} onClick={() => setPrompt(q)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105"
                style={{ borderColor: 'rgba(168,85,247,0.15)', background: 'rgba(168,85,247,0.05)', color: 'rgba(196,181,224,0.65)' }}>
                {q.length > 40 ? q.slice(0, 40) + '...' : q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: '2px solid rgba(168,85,247,0.4)', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
          <p className="text-xs font-mono-cyber" style={{ color: 'rgba(168,85,247,0.6)' }}>Montando plano de treino...</p>
        </div>
      )}

      <AddExerciseToLibraryModal
        exercise={addExerciseModal}
        onClose={() => setAddExerciseModal(null)}
        onSaved={(name, savedId) => {
          const key = name.toLowerCase().trim();
          setAddedExercises(prev => new Set([...prev, key]));
          if (savedId) setAddedExerciseIds(prev => ({ ...prev, [key]: savedId }));
        }}
      />

      {plan && (
        <div>
          {/* Plan summary */}
          <div className="rounded-xl p-5 border mb-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(6,182,212,0.04))', borderColor: 'rgba(168,85,247,0.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold" style={{ color: '#f0e6ff' }}>Treino gerado — revise e aplique</p>
            </div>
            <h3 className="font-cyber text-xl text-white tracking-wider mb-2">{plan.workoutPlanName || plan.workout_plan_name}</h3>
            <div className="flex flex-wrap gap-2 text-xs mb-3">
              {[
                { label: 'Objetivo', val: plan.goal },
                { label: 'Nível', val: plan.level },
                { label: 'Frequência', val: `${plan.weeklyFrequency || plan.weekly_frequency}x/sem` },
                { label: 'Divisão', val: plan.split },
              ].filter(x => x.val).map((x, i) => (
                <Badge key={i} className="text-xs" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)', color: '#c084fc' }}>
                  {x.label}: {x.val}
                </Badge>
              ))}
            </div>
            {plan.observations && (
              <p className="text-xs italic" style={{ color: 'rgba(196,181,224,0.6)' }}>{plan.observations}</p>
            )}
            <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: 'rgba(253,224,71,0.8)' }}>Revise os exercícios antes de aplicar. Você poderá editar no criador de treinos após aplicar.</p>
            </div>
          </div>

          {/* Days */}
          <div className="space-y-3 mb-5">
            {(plan.days || []).map((day, i) => (
              <DayCard
                key={i}
                day={day}
                idx={i}
                onAddExercise={ex => setAddExerciseModal(ex)}
                addedExercises={addedExercises}
                addedExerciseIds={addedExerciseIds}
              />
            ))}
          </div>

          {/* Apply section */}
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(16,185,129,0.25)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-200 tracking-wider">APLICAR AO ALUNO</h3>
            </div>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="cyber-input w-full rounded-lg p-2.5 text-sm mb-4"
              style={{ background: 'rgba(5,3,15,0.85)', border: '1px solid rgba(168,85,247,0.35)', color: '#edd9ff' }}>
              <option value="">Selecionar aluno...</option>
              {students.filter(s => s.active !== false).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => { setPlan(null); setPrompt(""); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(196,181,224,0.7)' }}>
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={handleApply} disabled={applying || !selectedStudent}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', boxShadow: '0 0 15px rgba(16,185,129,0.1)' }}>
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Aplicar ao criador de treino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}