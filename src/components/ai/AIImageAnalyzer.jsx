import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  ImagePlus, Sparkles, Loader2, X, Save, Users,
  Camera, FileImage, AlertTriangle, CheckCircle2, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const ANALYSIS_MODES = [
  { value: "workout", label: "📋 Extrair Treino", description: "Foto de planilha, caderno ou lousa com treino" },
  { value: "diet", label: "🥗 Extrair Dieta", description: "Foto de plano alimentar ou tabela de refeições" },
  { value: "explain", label: "💬 Explicar / Analisar", description: "Entender exercício, postura ou qualquer imagem" },
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

export default function AIImageAnalyzer({ settings }) {
  const [mode, setMode] = useState("workout");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extraNote, setExtraNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [applying, setApplying] = useState(false);
  const fileInputRef = useRef(null);

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list()
  });

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem válida."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagem muito grande. Máximo 10MB."); return; }
    setImageFile(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!imageFile) { toast.error("Selecione uma imagem primeiro."); return; }
    setLoading(true);
    setResult(null);
    try {
      // Upload image first
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

      let prompt = "";
      let responseSchema = null;

      if (mode === "workout") {
        prompt = `Analise esta imagem que contém um plano de treino. Extraia todos os exercícios, séries, repetições, descanso, técnicas e organize em um plano estruturado.
${extraNote ? `Observação adicional: ${extraNote}` : ""}
Retorne JSON com: workoutPlanName (string), goal (string), observations (string), days (array com: dayName (string), dayOfWeek (segunda/terca/quarta/quinta/sexta/sabado/domingo), muscleGroups (array de strings), exercises (array com: exerciseName, sets (número), reps (string), rest (string com 's' no final), technique (normal/cluster/rest_pause/drop_set/super_set/piramidal/myo_reps/tempo_controlado), notes (string opcional))).`;
        responseSchema = {
          type: "object",
          properties: {
            workoutPlanName: { type: "string" },
            goal: { type: "string" },
            observations: { type: "string" },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dayName: { type: "string" },
                  dayOfWeek: { type: "string" },
                  muscleGroups: { type: "array", items: { type: "string" } },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        exerciseName: { type: "string" },
                        sets: { type: "number" },
                        reps: { type: "string" },
                        rest: { type: "string" },
                        technique: { type: "string" },
                        notes: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        };
      } else if (mode === "diet") {
        prompt = `Analise esta imagem que contém um plano alimentar. Extraia todas as refeições, horários, alimentos e quantidades.
${extraNote ? `Observação adicional: ${extraNote}` : ""}
Retorne JSON com: planName (string), totalCalories (número estimado), observations (string), meals (array com: name (string), time (string), calories (número), foods (string com descrição dos alimentos)).`;
        responseSchema = {
          type: "object",
          properties: {
            planName: { type: "string" },
            totalCalories: { type: "number" },
            observations: { type: "string" },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  time: { type: "string" },
                  calories: { type: "number" },
                  foods: { type: "string" }
                }
              }
            }
          }
        };
      } else {
        // explain mode - plain text
        prompt = `Analise esta imagem e forneça uma explicação detalhada em português sobre o que você vê.
${extraNote ? `Foco especial em: ${extraNote}` : ""}
Se for um exercício: explique a execução, músculos trabalhados, erros comuns e dicas.
Se for uma tabela/planilha: explique o conteúdo.
Se for outra coisa: descreva e explique o que é relevante para fitness/saúde.`;
      }

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: responseSchema || undefined,
        model: "claude_sonnet_4_6"
      });

      setResult({ mode, data: res });
      toast.success("Análise concluída!");
    } catch (e) {
      toast.error("Erro ao analisar: " + e.message);
    }
    setLoading(false);
  };

  const handleApplyWorkout = async () => {
    if (!selectedStudent) { toast.error("Selecione um aluno."); return; }
    if (!result?.data?.days?.length) return;
    setApplying(true);
    try {
      const plan = result.data;
      let saved = 0;
      for (const day of plan.days) {
        const dow = DAY_MAP[(day.dayOfWeek || '').toLowerCase()] || 'segunda';
        const exercises = (day.exercises || []).map((ex, i) => ({
          exercise_name: ex.exerciseName || ex.exercise_name,
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps || '8-12',
          load_kg: 0,
          rest_seconds: parseInt(String(ex.rest || '90').replace(/[^0-9]/g, '')) || 90,
          technique: TECH_MAP[ex.technique] || 'normal',
          notes: ex.notes || '',
          order: i + 1,
        }));
        await base44.entities.WorkoutPlan.create({
          student_id: selectedStudent,
          name: `${plan.workoutPlanName || 'Treino'} - ${day.dayName || `Dia ${saved + 1}`}`,
          day_of_week: dow,
          exercises,
          active: true,
        });
        saved++;
      }
      toast.success(`${saved} plano(s) criado(s) com sucesso!`);
      setResult(null);
      setImageFile(null);
      setImagePreview(null);
      setSelectedStudent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      toast.error("Erro ao aplicar: " + e.message);
    }
    setApplying(false);
  };

  const handleApplyDiet = async () => {
    if (!selectedStudent) { toast.error("Selecione um aluno."); return; }
    const plan = result.data;
    setApplying(true);
    try {
      await base44.entities.DietPlan.create({
        student_id: selectedStudent,
        name: plan.planName || "Dieta via foto",
        total_calories: plan.totalCalories || 0,
        meals: (plan.meals || []).map(m => ({
          name: m.name,
          time: m.time,
          calories: m.calories,
          foods: m.foods,
        })),
        notes: plan.observations || "",
        active: true,
      });
      toast.success("Dieta aplicada com sucesso!");
      setResult(null);
      setImageFile(null);
      setImagePreview(null);
      setSelectedStudent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      toast.error("Erro ao aplicar dieta: " + e.message);
    }
    setApplying(false);
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-2xl p-5 border relative overflow-hidden backdrop-blur-sm"
        style={{ background: 'rgba(10,6,28,0.85)', borderColor: 'rgba(168,85,247,0.2)', boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(168,85,247,0.07)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.35), transparent)' }} />

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
            <Camera className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-purple-200">Analisar Foto com IA</h2>
            <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(192,132,252,0.4)' }}>Envie uma foto e a IA extrai ou explica o conteúdo</p>
          </div>
        </div>

        {/* Mode selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {ANALYSIS_MODES.map(m => (
            <button key={m.value} onClick={() => { setMode(m.value); setResult(null); }}
              className="p-3 rounded-xl border text-left transition-all"
              style={{
                background: mode === m.value ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.03)',
                borderColor: mode === m.value ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.12)',
                boxShadow: mode === m.value ? '0 0 14px rgba(168,85,247,0.15)' : 'none'
              }}>
              <p className="text-xs font-semibold text-white mb-0.5">{m.label}</p>
              <p className="text-[10px]" style={{ color: 'rgba(192,132,252,0.5)' }}>{m.description}</p>
            </button>
          ))}
        </div>

        {/* Image upload */}
        {!imagePreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:scale-[1.01]"
            style={{ borderColor: 'rgba(168,85,247,0.25)', background: 'rgba(168,85,247,0.03)' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const fakeEvent = { target: { files: [f] } }; handleImageSelect(fakeEvent); } }}
          >
            <FileImage className="w-10 h-10 mx-auto mb-3 text-purple-500/40" />
            <p className="text-sm font-semibold" style={{ color: 'rgba(210,190,240,0.8)' }}>Clique ou arraste uma foto aqui</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(168,85,247,0.4)' }}>JPG, PNG, WEBP — máx. 10MB</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(168,85,247,0.25)' }}>
            <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-contain" style={{ background: 'rgba(4,2,14,0.9)' }} />
            <button onClick={handleRemoveImage}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}

        {/* Extra note */}
        <textarea
          value={extraNote}
          onChange={e => setExtraNote(e.target.value)}
          placeholder="Observação adicional (opcional) — ex: 'aluno intermediário', 'focar no volume de pernas', etc."
          rows={2}
          className="w-full resize-none rounded-xl p-3 text-sm mt-3 outline-none transition-all"
          style={{
            background: 'rgba(4,2,14,0.7)',
            border: '1px solid rgba(168,85,247,0.15)',
            color: '#f0e6ff',
            fontFamily: 'Inter, sans-serif',
            caretColor: '#a855f7',
          }}
        />

        <div className="flex justify-end mt-3">
          <button onClick={handleAnalyze} disabled={loading || !imageFile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#e9d5ff', boxShadow: '0 0 14px rgba(168,85,247,0.12)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Analisar com IA
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: '2px solid rgba(168,85,247,0.4)', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
          <p className="text-xs font-mono-cyber" style={{ color: 'rgba(168,85,247,0.6)' }}>Analisando imagem...</p>
        </div>
      )}

      {/* Result — explain mode */}
      {result && result.mode === "explain" && (
        <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(168,85,247,0.25)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-200">Análise da IA</p>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(210,190,240,0.85)' }}>{result.data}</p>
        </div>
      )}

      {/* Result — workout mode */}
      {result && result.mode === "workout" && result.data?.days && (
        <div>
          <div className="rounded-xl p-5 border mb-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(6,182,212,0.04))', borderColor: 'rgba(168,85,247,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Treino extraído da imagem</p>
            </div>
            <h3 className="font-cyber text-lg text-white mb-2">{result.data.workoutPlanName || "Treino"}</h3>
            {result.data.observations && (
              <p className="text-xs italic mb-3" style={{ color: 'rgba(196,181,224,0.6)' }}>{result.data.observations}</p>
            )}
            <div className="space-y-2">
              {result.data.days.map((day, i) => (
                <div key={i} className="p-3 rounded-lg border" style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.15)' }}>
                  <p className="text-sm font-semibold text-white mb-1">{day.dayName || `Dia ${i + 1}`} <span className="text-xs text-purple-400">({day.dayOfWeek})</span></p>
                  <div className="space-y-1">
                    {(day.exercises || []).map((ex, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(210,190,240,0.7)' }}>
                        <span className="text-purple-400">•</span>
                        <span>{ex.exerciseName}</span>
                        <Badge className="text-[9px]" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}>
                          {ex.sets}×{ex.reps}
                        </Badge>
                        {ex.rest && <span className="text-purple-500/50">⏱{ex.rest}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: 'rgba(253,224,71,0.8)' }}>Revise antes de aplicar. Poderá editar no criador de treinos.</p>
            </div>
          </div>

          <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(16,185,129,0.25)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-200 tracking-wider">APLICAR AO ALUNO</h3>
            </div>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
              className="cyber-input w-full rounded-lg p-2.5 text-sm mb-4"
              style={{ background: 'rgba(5,3,15,0.85)', border: '1px solid rgba(168,85,247,0.35)', color: '#edd9ff' }}>
              <option value="">Selecionar aluno...</option>
              {students.filter(s => s.active !== false).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setResult(null)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(196,181,224,0.7)' }}>
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={handleApplyWorkout} disabled={applying || !selectedStudent}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7' }}>
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Aplicar treino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result — diet mode */}
      {result && result.mode === "diet" && result.data?.meals && (
        <div>
          <div className="rounded-xl p-5 border mb-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))', borderColor: 'rgba(16,185,129,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Dieta extraída da imagem</p>
            </div>
            <h3 className="font-cyber text-lg text-white mb-1">{result.data.planName || "Plano Alimentar"}</h3>
            {result.data.totalCalories > 0 && (
              <Badge className="text-xs mb-2" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                ~{result.data.totalCalories} kcal/dia
              </Badge>
            )}
            <div className="space-y-2 mt-2">
              {result.data.meals.map((meal, i) => (
                <div key={i} className="p-3 rounded-lg border" style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{meal.name}</p>
                    {meal.time && <span className="text-[10px] font-mono-cyber text-emerald-400/60">{meal.time}</span>}
                    {meal.calories > 0 && <Badge className="text-[9px]" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>{meal.calories} kcal</Badge>}
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(196,181,224,0.65)' }}>{meal.foods}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(16,185,129,0.25)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-200 tracking-wider">APLICAR AO ALUNO</h3>
            </div>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
              className="cyber-input w-full rounded-lg p-2.5 text-sm mb-4"
              style={{ background: 'rgba(5,3,15,0.85)', border: '1px solid rgba(168,85,247,0.35)', color: '#edd9ff' }}>
              <option value="">Selecionar aluno...</option>
              {students.filter(s => s.active !== false).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setResult(null)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(196,181,224,0.7)' }}>
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={handleApplyDiet} disabled={applying || !selectedStudent}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7' }}>
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Aplicar dieta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}