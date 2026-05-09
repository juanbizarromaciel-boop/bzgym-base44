import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell, Sparkles, Search, Plus, Pencil, Trash2, Image,
  FileText, Wand2, CheckCircle, X, Loader2, ChevronDown, ChevronUp,
  Video, Link2, Brain, ListChecks
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

// ── Bulk Command Panel ──────────────────────────────────────────────────────
const EDIT_TYPES = [
  { key: "description", label: "Descrição", icon: FileText, color: "#c084fc" },
  { key: "photo", label: "Foto", icon: Image, color: "#22d3ee" },
  { key: "video", label: "Vídeo", icon: Video, color: "#f472b6" },
  { key: "media_both", label: "Foto + Vídeo", icon: Link2, color: "#fb923c" },
];

function BulkCommandPanel({ exercises, onRefresh }) {
  const [editType, setEditType] = useState("description");
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  // Selection mode: "ai" = IA decide quais, "manual" = usuário escolhe
  const [selectionMode, setSelectionMode] = useState("ai");
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterMuscle, setFilterMuscle] = useState("all");
  // Media links (para foto/vídeo)
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const qc = useQueryClient();

  const filteredExercises = filterMuscle === "all" ? exercises : exercises.filter(e => e.muscle_group === filterMuscle);

  const toggleSelect = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const selectAll = () => setSelectedIds(filteredExercises.map(e => e.id));
  const clearAll = () => setSelectedIds([]);

  const isMediaEdit = editType === "photo" || editType === "video" || editType === "media_both";

  const runCommand = async () => {
    if (!command.trim()) return;
    if (selectionMode === "manual" && selectedIds.length === 0) {
      toast.error("Selecione ao menos um exercício");
      return;
    }
    if (isMediaEdit && selectionMode === "manual" && selectedIds.length === 0) {
      toast.error("Selecione os exercícios para adicionar a mídia");
      return;
    }

    setLoading(true);
    try {
      if (isMediaEdit && selectionMode === "manual") {
        // Aplicar links diretamente nos selecionados
        const targets = exercises.filter(e => selectedIds.includes(e.id));
        const updateData = {};
        if (editType === "photo" || editType === "media_both") updateData.image_url = photoUrl;
        if (editType === "video" || editType === "media_both") updateData.video_url = videoUrl;
        await Promise.all(targets.map(ex => base44.entities.Exercise.update(ex.id, updateData)));
        toast.success(`${targets.length} exercício(s) atualizado(s)!`);
        qc.invalidateQueries({ queryKey: ["exercises"] });
        onRefresh?.();
        setPhotoUrl("");
        setVideoUrl("");
        setSelectedIds([]);
      } else {
        // IA processa
        const context = selectionMode === "manual"
          ? exercises.filter(e => selectedIds.includes(e.id))
          : exercises;

        let fullPrompt = command;
        if (isMediaEdit) {
          fullPrompt += `\n\nLinks fornecidos:`;
          if (photoUrl) fullPrompt += `\nFoto/GIF: ${photoUrl}`;
          if (videoUrl) fullPrompt += `\nVídeo: ${videoUrl}`;
          fullPrompt += `\n\nRetorne apenas os exercícios que devem receber esses links, com os campos image_url e/ou video_url preenchidos.`;
        }

        const res = await base44.functions.invoke("aiCoach", {
          type: "exercise_bulk",
          prompt: fullPrompt,
          edit_type: editType,
          context: JSON.stringify(context.map(e => ({ id: e.id, name: e.name, muscle_group: e.muscle_group, description: e.description || "", image_url: e.image_url || "", video_url: e.video_url || "" })))
        });
        const d = res.data?.data;
        const result = d?.exercises || d?.response?.exercises || [];
        if (result.length === 0) throw new Error("IA não retornou exercícios. Tente novamente.");
        setPreview(result);
      }
    } catch (e) {
      toast.error("Erro: " + e.message);
    }
    setLoading(false);
  };

  const applyPreview = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await Promise.all(preview.map(ex => {
        const upd = {};
        if (editType === "description") upd.description = ex.description;
        if (editType === "photo" || editType === "media_both") upd.image_url = ex.image_url;
        if (editType === "video" || editType === "media_both") upd.video_url = ex.video_url;
        return base44.entities.Exercise.update(ex.id, upd);
      }));
      toast.success(`${preview.length} exercícios atualizados!`);
      setPreview(null);
      setCommand("");
      qc.invalidateQueries({ queryKey: ["exercises"] });
      onRefresh?.();
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setLoading(false);
  };

  const QUICK_COMMANDS = editType === "description" ? [
    "Adicione uma descrição técnica explicando a execução de cada exercício",
    "Adicione dicas de segurança e postura para cada exercício",
    "Descreva quais músculos secundários cada exercício trabalha",
  ] : [
    "Adicione o link de foto/vídeo apenas nos exercícios mencionados abaixo",
    "Atualize a mídia dos exercícios conforme os links fornecidos",
  ];

  return (
    <div className="cyber-card rounded-xl border border-purple-900/25 p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <Wand2 className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Edição em Massa com IA</p>
          <p className="text-[10px] font-mono-cyber text-purple-500/50">Configure o que editar, quais exercícios e execute</p>
        </div>
      </div>

      {/* Step 1: O que editar */}
      <div className="mb-5">
        <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-2">
          1 · O que deseja editar?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EDIT_TYPES.map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => setEditType(key)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono-cyber transition-all"
              style={editType === key
                ? { background: `${color}18`, border: `1px solid ${color}60`, color }
                : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.45)' }
              }>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Seleção de exercícios */}
      <div className="mb-5">
        <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-2">
          2 · Quais exercícios?
        </p>
        <div className="flex gap-2 mb-3">
          <button onClick={() => { setSelectionMode("ai"); setSelectedIds([]); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono-cyber transition-all flex-1"
            style={selectionMode === "ai"
              ? { background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: '#e9d5ff' }
              : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.4)' }}>
            <Brain className="w-3.5 h-3.5" /> Conforme a IA
          </button>
          <button onClick={() => setSelectionMode("manual")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono-cyber transition-all flex-1"
            style={selectionMode === "manual"
              ? { background: 'rgba(6,182,212,0.18)', border: '1px solid rgba(6,182,212,0.45)', color: '#22d3ee' }
              : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.4)' }}>
            <ListChecks className="w-3.5 h-3.5" /> Selecionar manualmente
          </button>
        </div>

        {selectionMode === "ai" && (
          <p className="text-[10px] text-purple-400/40 font-mono-cyber px-1">
            A IA vai decidir quais exercícios editar com base no seu comando.
          </p>
        )}

        {selectionMode === "manual" && (
          <div>
            {/* Filtro por músculo */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button onClick={() => setFilterMuscle("all")}
                className="px-2.5 py-1 rounded-full text-[10px] font-mono-cyber transition-all"
                style={filterMuscle === "all" ? { background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#e9d5ff' } : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.4)' }}>
                Todos
              </button>
              {MUSCLE_OPTIONS.map(([key, label]) => {
                const count = exercises.filter(e => e.muscle_group === key).length;
                if (count === 0) return null;
                return (
                  <button key={key} onClick={() => setFilterMuscle(key)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono-cyber transition-all"
                    style={filterMuscle === key
                      ? { background: `${MUSCLE_COLORS[key]}20`, border: `1px solid ${MUSCLE_COLORS[key]}55`, color: MUSCLE_COLORS[key] }
                      : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(200,180,240,0.4)' }}>
                    {label} ({count})
                  </button>
                );
              })}
            </div>
            {/* Selecionar todos / limpar */}
            <div className="flex gap-2 mb-2">
              <button onClick={selectAll} className="text-[10px] font-mono-cyber px-2.5 py-1 rounded-lg transition-all"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)', color: '#c084fc' }}>
                Selecionar tudo
              </button>
              <button onClick={clearAll} className="text-[10px] font-mono-cyber px-2.5 py-1 rounded-lg transition-all"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5' }}>
                Limpar
              </button>
              <span className="text-[10px] font-mono-cyber self-center" style={{ color: 'rgba(192,132,252,0.45)' }}>
                {selectedIds.length} selecionado{selectedIds.length !== 1 ? "s" : ""}
              </span>
            </div>
            {/* Lista de exercícios para selecionar */}
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-purple-900/20 p-2"
              style={{ background: 'rgba(4,3,14,0.6)' }}>
              {filteredExercises.map(ex => {
                const isSelected = selectedIds.includes(ex.id);
                const color = MUSCLE_COLORS[ex.muscle_group] || "#6b7280";
                return (
                  <button key={ex.id} onClick={() => toggleSelect(ex.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all"
                    style={isSelected
                      ? { background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)' }
                      : { background: 'transparent', border: '1px solid transparent' }}>
                    <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: isSelected ? 'rgba(168,85,247,0.8)' : 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)' }}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </span>
                    <span className="text-xs text-white flex-1 truncate">{ex.name}</span>
                    <span className="text-[9px] font-mono-cyber px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                      {MUSCLE_LABELS[ex.muscle_group] || ex.muscle_group}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Links de mídia (se foto/vídeo) */}
      {isMediaEdit && (
        <div className="mb-5">
          <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-2">
            3 · Links de mídia
          </p>
          <div className="space-y-2">
            {(editType === "photo" || editType === "media_both") && (
              <div className="flex items-center gap-2">
                <Image className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <Input
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="URL da foto ou GIF..."
                  className="cyber-input text-sm flex-1"
                />
              </div>
            )}
            {(editType === "video" || editType === "media_both") && (
              <div className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                <Input
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="URL do vídeo (YouTube, MP4)..."
                  className="cyber-input text-sm flex-1"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Comando / instrução */}
      <div className="mb-4">
        <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-2">
          {isMediaEdit ? "4 · Instrução (ex: quais exercícios recebem esse link)" : "3 · Instrução para a IA"}
        </p>
        <textarea
          value={command}
          onChange={e => setCommand(e.target.value)}
          placeholder={isMediaEdit
            ? "Ex: Adicione essa foto no Supino Reto e no Crucifixo..."
            : "Ex: Adicione uma descrição técnica explicando a execução correta..."}
          rows={3}
          className="w-full cyber-input rounded-xl p-3 text-sm resize-none mb-2"
          style={{ background: 'rgba(4,3,14,0.9)', border: '1px solid rgba(168,85,247,0.25)', color: '#e9d5ff' }}
        />
        <div className="flex flex-wrap gap-2">
          {QUICK_COMMANDS.map((q, i) => (
            <button key={i} onClick={() => setCommand(q)}
              className="text-[10px] font-mono-cyber px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)', color: 'rgba(192,132,252,0.7)' }}>
              {q.slice(0, 50)}…
            </button>
          ))}
        </div>
      </div>

      {/* Execute button */}
      <button
        onClick={runCommand}
        disabled={loading || !command.trim() || (selectionMode === "manual" && selectedIds.length === 0)}
        className="btn-neon-purple w-full py-3 rounded-xl text-sm font-medium tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        {selectionMode === "manual"
          ? `APLICAR EM ${selectedIds.length} EXERCÍCIO${selectedIds.length !== 1 ? "S" : ""}`
          : "EXECUTAR VIA IA"
        }
      </button>

      {/* Preview */}
      {preview && (
        <div className="mt-4 border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900/20"
            style={{ background: 'rgba(168,85,247,0.06)' }}>
            <p className="text-xs font-semibold text-purple-300">Prévia das alterações ({preview.length})</p>
            <button onClick={() => setPreview(null)} className="text-purple-500/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-purple-900/10">
            {preview.map(ex => (
              <div key={ex.id} className="px-4 py-3">
                <p className="text-xs font-semibold text-white mb-1">{ex.name}</p>
                {ex.description && <p className="text-[11px] text-purple-300/60 mb-1">{ex.description}</p>}
                {ex.image_url && <p className="text-[10px] text-cyan-400/60 font-mono-cyber truncate">📷 {ex.image_url}</p>}
                {ex.video_url && <p className="text-[10px] text-pink-400/60 font-mono-cyber truncate">🎬 {ex.video_url}</p>}
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