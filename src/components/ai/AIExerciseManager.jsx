import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell, Sparkles, Search, Plus, Pencil, Trash2, Image,
  FileText, Wand2, CheckCircle, X, Loader2, ChevronDown, ChevronUp, Video
} from "lucide-react";
import { toast } from "sonner";
import ExerciseMediaModal from "@/components/exercise/ExerciseMediaModal";
import ExerciseMediaDisplay from "@/components/exercise/ExerciseMediaDisplay";

const MUSCLE_LABELS = {
  peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
  triceps: "Tríceps", pernas: "Pernas", gluteos: "Glúteos",
  abdomen: "Abdômen", panturrilha: "Panturrilha", antebraco: "Antebraço",
  cardio: "Cardio", outro: "Outro"
};

const MUSCLE_COLORS = {
  peito: "#ec4899", costas: "#06b6d4", ombros: "#a855f7", biceps: "#c084fc",
  triceps: "#818cf8", pernas: "#f472b6", gluteos: "#fb7185",
  abdomen: "#22d3ee", panturrilha: "#67e8f9", antebraco: "#d8b4fe",
  cardio: "#ef4444", outro: "#6b7280"
};

const MUSCLE_OPTIONS = Object.entries(MUSCLE_LABELS);

// ── AI Chat Command Panel ────────────────────────────────────────────────────

const SCOPE_OPTIONS = [
  { key: "ai_specified", label: "Especificados na IA", icon: "✦" },
  { key: "all", label: "Todos", icon: "◈" },
  { key: "no_desc", label: "Sem descrição", icon: "∅" },
  { key: "no_media", label: "Sem foto e vídeo", icon: "⊘" },
  { key: "no_photo", label: "Só sem foto", icon: "⬚" },
  { key: "no_video", label: "Só sem vídeo", icon: "▷" },
];

const EDIT_MODE_OPTIONS = [
  { key: "all", label: "Tudo", icon: "◈" },
  { key: "desc_only", label: "Só descrição", icon: "≡" },
  { key: "photo_only", label: "Só foto", icon: "⬚" },
  { key: "video_only", label: "Só vídeo", icon: "▷" },
  { key: "media_only", label: "Foto + Vídeo", icon: "⊞" },
];

function ChipSelect({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className="px-2.5 py-1 rounded-lg text-[10px] font-mono-cyber transition-all"
          style={value === opt.key
            ? { background: 'rgba(168,85,247,0.22)', border: '1px solid rgba(168,85,247,0.55)', color: '#e9d5ff' }
            : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(192,132,252,0.45)' }}>
          <span className="mr-1 opacity-70">{opt.icon}</span>{opt.label}
        </button>
      ))}
    </div>
  );
}

function BulkCommandPanel({ exercises, onRefresh }) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [scope, setScope] = useState("ai_specified");
  const [editMode, setEditMode] = useState("all");
  const qc = useQueryClient();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runCommand();
  };

  // Filter exercises based on scope
  const getScopedExercises = () => {
    switch (scope) {
      case "all": return exercises;
      case "no_desc": return exercises.filter(e => !e.description);
      case "no_media": return exercises.filter(e => !e.image_url && !e.video_url);
      case "no_photo": return exercises.filter(e => !e.image_url);
      case "no_video": return exercises.filter(e => !e.video_url);
      default: return exercises; // ai_specified: send all, let AI decide from prompt
    }
  };

  // Build prompt suffix based on editMode
  const getEditModeInstruction = () => {
    switch (editMode) {
      case "desc_only": return "\n\nIMPORTANTE: Edite APENAS a descrição. Não altere image_url nem video_url.";
      case "photo_only": return "\n\nIMPORTANTE: Edite APENAS o campo image_url. Não altere description nem video_url.";
      case "video_only": return "\n\nIMPORTANTE: Edite APENAS o campo video_url. Não altere description nem image_url.";
      case "media_only": return "\n\nIMPORTANTE: Edite APENAS image_url e video_url. Não altere a description.";
      default: return "";
    }
  };

  const runCommand = async () => {
    if (!command.trim()) return;
    setLoading(true);
    try {
      const scopedExercises = getScopedExercises();
      const fullPrompt = command + getEditModeInstruction();

      // For ai_specified, send exercise index so AI can match by name; for others send full list (capped at 80)
      const exercisesToSend = scope === "ai_specified"
        ? exercises.map(e => ({ id: e.id, name: e.name, muscle_group: e.muscle_group }))
        : scopedExercises.slice(0, 80).map(e => ({
            id: e.id,
            name: e.name,
            muscle_group: e.muscle_group,
            description: e.description || "",
            image_url: e.image_url || "",
            video_url: e.video_url || ""
          }));

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 120000)
      );
      const invokePromise = base44.functions.invoke("aiCoach", {
        type: "exercise_bulk",
        prompt: fullPrompt,
        context: JSON.stringify(exercisesToSend)
      });

      const res = await Promise.race([invokePromise, timeoutPromise]);

      const d = res.data?.data;
      const result = d?.exercises || d?.response?.exercises || [];
      if (result.length === 0) throw new Error("IA não retornou exercícios. Tente reformular o comando.");
      setPreview(result);
    } catch (e) {
      if (e.message === "TIMEOUT") {
        toast.error("Tempo limite excedido. Tente com menos exercícios ou um comando mais simples.");
      } else {
        toast.error("Erro: " + (e.response?.data?.error || e.message || "Falha na IA"));
      }
    }
    setLoading(false);
  };

  const applyPreview = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await Promise.all(preview.map(ex => {
        const upd = {};
        if (editMode === "all" || editMode === "desc_only") {
          if (ex.description !== undefined) upd.description = ex.description;
        }
        if (editMode === "all" || editMode === "photo_only" || editMode === "media_only") {
          if (ex.image_url !== undefined) upd.image_url = ex.image_url;
        }
        if (editMode === "all" || editMode === "video_only" || editMode === "media_only") {
          if (ex.video_url !== undefined) upd.video_url = ex.video_url;
        }
        return base44.entities.Exercise.update(ex.id, upd);
      }));
      toast.success(`${preview.length} exercício(s) atualizado(s)!`);
      setPreview(null);
      setCommand("");
      qc.invalidateQueries({ queryKey: ["exercises"] });
      onRefresh?.();
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setLoading(false);
  };

  const scopedCount = scope === "ai_specified" ? null : getScopedExercises().length;

  return (
    <div className="cyber-card rounded-xl border border-purple-900/25 p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <Wand2 className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Editar Exercícios com IA</p>
          <p className="text-[10px] font-mono-cyber text-purple-500/50">
            Configure o escopo e o que editar, depois descreva o comando
          </p>
        </div>
      </div>

      {/* Scope selector */}
      <div className="mb-3">
        <p className="text-[9px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-2">
          Exercícios alvo
          {scopedCount !== null && <span className="ml-2 text-purple-400/60">· {scopedCount} selecionados</span>}
        </p>
        <ChipSelect options={SCOPE_OPTIONS} value={scope} onChange={setScope} />
      </div>

      {/* Edit mode selector */}
      <div className="mb-4">
        <p className="text-[9px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-2">O que editar</p>
        <ChipSelect options={EDIT_MODE_OPTIONS} value={editMode} onChange={setEditMode} />
      </div>

      {/* Textarea */}
      <div className="relative mb-3">
        <textarea
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={scope === "ai_specified"
            ? "Ex: Busque no YouTube um vídeo em português para cada exercício e preencha o video_url. Para a foto, busque um GIF de execução."
            : editMode === "photo_only" || editMode === "media_only" || editMode === "video_only"
              ? "Ex: Busque no YouTube vídeos em português de boa execução técnica para cada exercício e preencha o video_url. Para fotos, busque GIFs de execução."
              : "Ex: Gere descrições técnicas em português para todos os exercícios selecionados"}
          rows={5}
          className="w-full cyber-input rounded-xl p-3 text-sm resize-none"
          style={{ background: 'rgba(4,3,14,0.9)', border: '1px solid rgba(168,85,247,0.25)', color: '#e9d5ff' }}
        />
        <span className="absolute bottom-2 right-3 text-[9px] font-mono-cyber text-purple-600/40">Ctrl+Enter para enviar</span>
      </div>

      {/* Execute */}
      <button
        onClick={runCommand}
        disabled={loading || !command.trim()}
        className="btn-neon-purple w-full py-3 rounded-xl text-sm font-medium tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "PROCESSANDO..." : "ENVIAR PARA IA"}
      </button>

      {/* Preview */}
      {preview && (
        <div className="mt-4 border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900/20"
            style={{ background: 'rgba(168,85,247,0.06)' }}>
            <p className="text-xs font-semibold text-purple-300">Prévia — {preview.length} exercício(s)</p>
            <button onClick={() => setPreview(null)} className="text-purple-500/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-purple-900/10">
            {preview.map(ex => (
              <div key={ex.id} className="px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-white">{ex.name}</p>
                {ex.description && (editMode === "all" || editMode === "desc_only") && (
                  <p className="text-[11px] text-purple-300/60 leading-relaxed">{ex.description}</p>
                )}
                {ex.image_url && (editMode === "all" || editMode === "photo_only" || editMode === "media_only") && (
                  <div className="flex items-center gap-1.5">
                    <Image className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <p className="text-[10px] text-cyan-400/70 font-mono-cyber truncate">{ex.image_url}</p>
                  </div>
                )}
                {ex.video_url && (editMode === "all" || editMode === "video_only" || editMode === "media_only") && (
                  <div className="flex items-center gap-1.5">
                    <Video className="w-3 h-3 text-pink-400 flex-shrink-0" />
                    <p className="text-[10px] text-pink-400/70 font-mono-cyber truncate">{ex.video_url}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-purple-900/20">
            <button onClick={() => setPreview(null)}
              className="flex-1 py-2 rounded-lg text-xs font-mono-cyber text-purple-500/50 border border-purple-900/20 hover:border-purple-500/20 transition-all">
              CANCELAR
            </button>
            <button onClick={applyPreview} disabled={loading}
              className="flex-1 btn-neon-purple py-2 rounded-lg text-xs font-medium tracking-wider flex items-center justify-center gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              APLICAR TUDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Exercise Row ─────────────────────────────────────────────────────────────
function ExerciseRow({ exercise, onSave, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...exercise });
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [mediaModal, setMediaModal] = useState(false);
  const [localExercise, setLocalExercise] = useState(exercise);

  const handleSave = async () => {
    await onSave(exercise.id, form);
    setEditing(false);
  };

  const generateDescription = async () => {
    if (!form.name) { toast.error("Digite o nome do exercício primeiro"); return; }
    setGeneratingDesc(true);
    try {
      const res = await base44.functions.invoke("aiCoach", {
        type: "exercise_desc",
        prompt: `Escreva uma descrição técnica e motivacional para o exercício: ${form.name}. Grupo muscular: ${MUSCLE_LABELS[form.muscle_group] || form.muscle_group}. Máximo 2 frases, direto ao ponto em português.`,
      });
      const d = res.data?.data;
      const desc = d?.description || d?.response?.description || d?.text || "";
      if (!desc) throw new Error("Resposta vazia da IA");
      setForm(f => ({ ...f, description: desc }));
      toast.success("Descrição gerada!");
    } catch (e) {
      toast.error("Erro ao gerar descrição: " + e.message);
    }
    setGeneratingDesc(false);
  };

  const muscleColor = MUSCLE_COLORS[exercise.muscle_group] || "#6b7280";

  return (
    <div className="border border-purple-900/20 rounded-xl overflow-hidden transition-all"
      style={{ background: 'rgba(8,5,20,0.8)' }}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-purple-500/3 transition-all"
        onClick={() => setExpanded(e => !e)}>
        {/* Image thumbnail */}
        <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border border-purple-900/25"
          style={{ background: 'rgba(168,85,247,0.06)' }}>
          {localExercise.video_url
            ? <img src={localExercise.video_url} alt={localExercise.name} className="w-full h-full object-cover"
                onError={e => e.target.style.display = 'none'} />
            : <div className="w-full h-full flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-purple-600/40" />
              </div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{exercise.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-mono-cyber px-2 py-0.5 rounded-full"
              style={{ background: `${muscleColor}15`, border: `1px solid ${muscleColor}35`, color: muscleColor }}>
              {MUSCLE_LABELS[exercise.muscle_group] || exercise.muscle_group}
            </span>
            {exercise.description && (
              <span className="text-[9px] text-purple-500/40 font-mono-cyber flex items-center gap-1">
                <FileText className="w-2.5 h-2.5" /> desc.
              </span>
            )}
            {localExercise.video_url && (
              <span className="text-[9px] text-cyan-500/40 font-mono-cyber flex items-center gap-1">
                <Image className="w-2.5 h-2.5" /> mídia
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={e => { e.stopPropagation(); setEditing(true); setExpanded(true); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10 transition-all">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(exercise.id); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400/30 hover:text-pink-400 hover:bg-pink-500/10 transition-all">
            <Trash2 className="w-3 h-3" />
          </button>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-purple-500/30" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-500/30" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-purple-900/15 pt-4 space-y-3">
          {editing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono-cyber text-purple-500/50 uppercase tracking-widest block mb-1">Nome</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="cyber-input text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-mono-cyber text-purple-500/50 uppercase tracking-widest block mb-1">Grupo Muscular</label>
                  <select value={form.muscle_group} onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))}
                    className="w-full rounded-md px-3 py-2 text-sm"
                    style={{ background: 'rgba(4,3,14,0.95)', border: '1px solid rgba(168,85,247,0.35)', color: '#edd9ff' }}>
                    {MUSCLE_OPTIONS.map(([k, v]) => <option key={k} value={k} style={{ background: '#09060f', color: '#edd9ff' }}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono-cyber text-purple-500/50 uppercase tracking-widest">Descrição / Instruções</label>
                  <button onClick={generateDescription} disabled={generatingDesc}
                    className="text-[10px] font-mono-cyber flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}>
                    {generatingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    GERAR COM IA
                  </button>
                </div>
                <textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Descreva a execução correta do exercício..."
                  className="w-full cyber-input rounded-xl p-3 text-sm resize-none"
                  style={{ background: 'rgba(4,3,14,0.9)', border: '1px solid rgba(168,85,247,0.2)', color: '#e9d5ff' }} />
              </div>

              {/* Media */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono-cyber text-purple-500/50 uppercase tracking-widest">Mídia do exercício</label>
                  <button onClick={() => setMediaModal(true)}
                    className="text-[10px] font-mono-cyber flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
                    <Image className="w-3 h-3" /> ADICIONAR MÍDIA
                  </button>
                </div>
                <ExerciseMediaDisplay exercise={localExercise} maxHeight={180} />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setEditing(false); setForm({ ...exercise }); }}
                  className="flex-1 py-2 rounded-lg text-xs font-mono-cyber text-purple-500/50 border border-purple-900/20 hover:border-purple-500/20 transition-all">
                  CANCELAR
                </button>
                <button onClick={handleSave}
                  className="flex-1 btn-neon-purple py-2 rounded-lg text-xs font-medium tracking-wider flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> SALVAR
                </button>
              </div>
            </>
          ) : (
            <>
              {localExercise.description && (
                <p className="text-xs text-purple-300/60 leading-relaxed border-l-2 border-purple-500/20 pl-3">{localExercise.description}</p>
              )}
              <ExerciseMediaDisplay exercise={localExercise} maxHeight={200} />
              <button onClick={() => setMediaModal(true)}
                className="w-full py-2 rounded-lg text-[10px] font-mono-cyber flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.18)', color: 'rgba(192,132,252,0.6)' }}>
                <Image className="w-3 h-3" /> Adicionar / trocar mídia
              </button>
            </>
          )}
        </div>
      )}

      <ExerciseMediaModal
        exercise={localExercise}
        open={mediaModal}
        onClose={() => setMediaModal(false)}
        onSaved={(updated) => setLocalExercise(updated)}
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AIExerciseManager({ settings }) {
  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", muscle_group: "peito", description: "", video_url: "" });
  const [addingNew, setAddingNew] = useState(false);
  const qc = useQueryClient();

  const { data: exercises = [], refetch } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => base44.entities.Exercise.list()
  });

  const saveMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Exercise.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises"] }); toast.success("Exercício atualizado!"); }
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.Exercise.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises"] }); toast.success("Exercício removido."); }
  });

  const createMut = useMutation({
    mutationFn: data => base44.entities.Exercise.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Exercício criado!");
      setNewForm({ name: "", muscle_group: "peito", description: "", video_url: "" });
      setShowAdd(false);
    }
  });

  const filtered = exercises.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = filterMuscle === "all" || e.muscle_group === filterMuscle;
    return matchSearch && matchMuscle;
  });

  const handleSave = (id, data) => saveMut.mutateAsync({ id, data });
  const handleDelete = (id) => { if (confirm("Remover exercício?")) deleteMut.mutate(id); };

  return (
    <div>
      <BulkCommandPanel exercises={exercises} onRefresh={refetch} />

      {/* Header + Add */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-white">{exercises.length} exercícios cadastrados</p>
          <p className="text-[10px] font-mono-cyber text-purple-500/40 mt-0.5">Gerencie, edite e enriqueça com IA</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="btn-neon-purple px-4 py-2 rounded-xl text-xs font-medium tracking-wider flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> NOVO
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="cyber-card rounded-xl border border-cyan-500/20 p-5 mb-4"
          style={{ background: 'rgba(6,182,212,0.03)' }}>
          <p className="text-xs font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Novo Exercício
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome do exercício" className="cyber-input text-sm" />
            <select value={newForm.muscle_group} onChange={e => setNewForm(f => ({ ...f, muscle_group: e.target.value }))}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: 'rgba(4,3,14,0.95)', border: '1px solid rgba(168,85,247,0.35)', color: '#edd9ff' }}>
              {MUSCLE_OPTIONS.map(([k, v]) => <option key={k} value={k} style={{ background: '#09060f', color: '#edd9ff' }}>{v}</option>)}
            </select>
          </div>
          <textarea value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrição (opcional)" rows={2}
            className="w-full cyber-input rounded-xl p-3 text-sm resize-none mb-3"
            style={{ background: 'rgba(4,3,14,0.9)', border: '1px solid rgba(168,85,247,0.2)', color: '#e9d5ff' }} />
          <Input value={newForm.video_url || ""} onChange={e => setNewForm(f => ({ ...f, video_url: e.target.value }))}
            placeholder="URL de GIF/foto (opcional)" className="cyber-input text-sm mb-3" />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)}
              className="flex-1 py-2 rounded-lg text-xs font-mono-cyber text-purple-500/50 border border-purple-900/20">
              CANCELAR
            </button>
            <button onClick={() => createMut.mutate(newForm)} disabled={!newForm.name || createMut.isPending}
              className="flex-1 btn-neon-cyan py-2 rounded-xl text-xs font-medium tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40">
              {createMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              CRIAR
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-500/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar exercício..." className="cyber-input pl-9 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterMuscle("all")}
            className="px-3 py-1 rounded-full text-xs font-mono-cyber transition-all"
            style={filterMuscle === "all" ? { background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#e9d5ff' } : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.45)' }}>
            Todos
          </button>
          {MUSCLE_OPTIONS.map(([key, label]) => {
            const count = exercises.filter(e => e.muscle_group === key).length;
            if (count === 0) return null;
            return (
              <button key={key} onClick={() => setFilterMuscle(key)}
                className="px-3 py-1 rounded-full text-xs font-mono-cyber transition-all"
                style={filterMuscle === key
                  ? { background: `${MUSCLE_COLORS[key]}20`, border: `1px solid ${MUSCLE_COLORS[key]}60`, color: MUSCLE_COLORS[key] }
                  : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(200,180,240,0.4)' }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(ex => (
          <ExerciseRow key={ex.id} exercise={ex} onSave={handleSave} onDelete={handleDelete} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-purple-500/30">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-mono-cyber text-sm">// nenhum exercício encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}