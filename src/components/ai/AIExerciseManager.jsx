import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell, Sparkles, Search, Plus, Pencil, Trash2, Image,
  FileText, Wand2, CheckCircle, X, Loader2, ChevronDown, ChevronUp, Globe
} from "lucide-react";
import { toast } from "sonner";

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
function BulkCommandPanel({ exercises, onRefresh }) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [preview, setPreview] = useState(null);
  const qc = useQueryClient();

  const emptyCount = exercises.filter(e => !e.description).length;
  const baseTargets = filter === "all" ? exercises : exercises.filter(e => e.muscle_group === filter);
  const targets = onlyEmpty ? baseTargets.filter(e => !e.description) : baseTargets;

  const runCommand = async () => {
    if (!command.trim() || targets.length === 0) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("aiCoach", {
        type: "exercise_bulk",
        prompt: command,
        context: JSON.stringify(targets.map(e => ({ id: e.id, name: e.name, muscle_group: e.muscle_group, description: e.description || "" })))
      });
      // The API wraps: res.data.data.exercises or res.data.data.response.exercises
      const d = res.data?.data;
      const exercises = d?.exercises || d?.response?.exercises || [];
      if (exercises.length === 0) throw new Error("IA não retornou exercícios. Tente novamente.");
      setPreview(exercises);
    } catch (e) {
      toast.error("Erro ao executar comando: " + e.message);
    }
    setLoading(false);
  };

  const applyPreview = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await Promise.all(preview.map(ex => base44.entities.Exercise.update(ex.id, { description: ex.description, video_url: ex.video_url })));
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

  const QUICK_COMMANDS = [
    "Adicione uma descrição técnica explicando a execução de cada exercício",
    "Adicione dicas de segurança e postura para cada exercício",
    "Descreva quais músculos secundários cada exercício trabalha",
    "Reescreva as descrições de forma mais motivacional e objetiva",
  ];

  return (
    <div className="cyber-card rounded-xl border border-purple-900/25 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <Wand2 className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Comando em Massa</p>
          <p className="text-[10px] font-mono-cyber text-purple-500/50">Aplique ações via IA em vários exercícios de uma vez</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-3">
        <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-2">Alvo dos exercícios</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className="px-3 py-1 rounded-full text-xs font-mono-cyber transition-all"
            style={filter === "all" ? { background: 'rgba(168,85,247,0.25)', border: '1px solid rgba(168,85,247,0.5)', color: '#e9d5ff' } : { background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(192,132,252,0.5)' }}
          >
            Todos ({exercises.length})
          </button>
          {MUSCLE_OPTIONS.map(([key, label]) => {
            const count = exercises.filter(e => e.muscle_group === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1 rounded-full text-xs font-mono-cyber transition-all"
                style={filter === key
                  ? { background: `${MUSCLE_COLORS[key]}22`, border: `1px solid ${MUSCLE_COLORS[key]}88`, color: MUSCLE_COLORS[key] }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(200,180,240,0.45)' }
                }
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
        {/* Only empty toggle */}
        {emptyCount > 0 && (
          <button
            onClick={() => setOnlyEmpty(v => !v)}
            className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono-cyber transition-all"
            style={onlyEmpty
              ? { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24' }
              : { background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(192,132,252,0.5)' }
            }
          >
            <span className="w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0"
              style={{ borderColor: onlyEmpty ? '#fbbf24' : 'rgba(168,85,247,0.3)', background: onlyEmpty ? '#fbbf24' : 'transparent' }}>
              {onlyEmpty && <span className="text-black text-[8px] font-bold">✓</span>}
            </span>
            Apenas sem descrição ({emptyCount})
          </button>
        )}
        <p className="text-[10px] font-mono-cyber mt-2" style={{ color: 'rgba(192,132,252,0.4)' }}>
          {targets.length} exercício{targets.length !== 1 ? "s" : ""} selecionado{targets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Command input */}
      <textarea
        value={command}
        onChange={e => setCommand(e.target.value)}
        placeholder="Ex: Adicione uma descrição técnica para cada exercício explicando a execução correta..."
        rows={3}
        className="w-full cyber-input rounded-xl p-3 text-sm resize-none mb-3"
        style={{ background: 'rgba(4,3,14,0.9)', border: '1px solid rgba(168,85,247,0.25)', color: '#e9d5ff' }}
      />

      {/* Quick commands */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_COMMANDS.map((q, i) => (
          <button key={i} onClick={() => setCommand(q)}
            className="text-[10px] font-mono-cyber px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)', color: 'rgba(192,132,252,0.7)' }}>
            {q.slice(0, 45)}…
          </button>
        ))}
      </div>

      <button
        onClick={runCommand}
        disabled={loading || !command.trim() || targets.length === 0}
        className="btn-neon-purple w-full py-3 rounded-xl text-sm font-medium tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        EXECUTAR EM {targets.length} EXERCÍCIO{targets.length !== 1 ? "S" : ""}
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
                <p className="text-[11px] text-purple-300/60">{ex.description}</p>
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
  const [generatingImg, setGeneratingImg] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const handleSave = async () => {
    await onSave(exercise.id, form);
    setEditing(false);
  };

  const generateImage = async () => {
    setGeneratingImg(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Professional fitness photo of person performing ${form.name} exercise, gym setting, clean white background, anatomical demonstration, high quality`
      });
      setForm(f => ({ ...f, video_url: res.url }));
      toast.success("Imagem gerada!");
    } catch (e) {
      toast.error("Erro ao gerar imagem");
    }
    setGeneratingImg(false);
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

  const fetchHipertrofiaGif = async (urlToProxy = null) => {
    if (!urlToProxy && !form.name) { toast.error("Digite o nome do exercício primeiro"); return; }
    setGeneratingImg(true);
    try {
      const payload = urlToProxy
        ? { direct_url: urlToProxy }
        : { exercise_name: form.name };
      const res = await base44.functions.invoke("fetchExerciseGif", payload);
      if (res.data?.gif_url) {
        setForm(f => ({ ...f, video_url: res.data.gif_url }));
        toast.success("GIF carregado via proxy!");
      } else {
        toast.error("GIF não encontrado para este exercício");
      }
    } catch (e) {
      toast.error("Erro ao buscar GIF");
    }
    setGeneratingImg(false);
  };

  const handleVideoUrlChange = (url) => {
    setForm(f => ({ ...f, video_url: url }));
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
          {exercise.video_url
            ? <img src={exercise.video_url} alt={exercise.name} className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            : null}
          <div className="w-full h-full items-center justify-center" style={{ display: exercise.video_url ? 'none' : 'flex' }}>
            <Dumbbell className="w-4 h-4 text-purple-600/40" />
          </div>
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
            {exercise.video_url && (
              <span className="text-[9px] text-cyan-500/40 font-mono-cyber flex items-center gap-1">
                <Image className="w-2.5 h-2.5" /> foto
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
                    className="cyber-input w-full rounded-md px-3 py-2 text-sm">
                    {MUSCLE_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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

              {/* Image / GIF */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono-cyber text-purple-500/50 uppercase tracking-widest">GIF / Foto / Vídeo</label>
                  <div className="flex gap-1.5">
                    <button onClick={fetchHipertrofiaGif} disabled={generatingImg}
                      className="text-[10px] font-mono-cyber flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}>
                      {generatingImg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                      HIPERTROFIA.ORG
                    </button>
                    <button onClick={generateImage} disabled={generatingImg}
                      className="text-[10px] font-mono-cyber flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}>
                      {generatingImg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
                      GERAR IA
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input value={form.video_url || ""} onChange={e => handleVideoUrlChange(e.target.value)}
                    placeholder="https://... (URL de GIF, imagem ou vídeo)" className="cyber-input text-sm flex-1" />
                  {form.video_url && form.video_url.includes('hipertrofia.org') && !form.video_url.startsWith('https://cdn.') && !form.video_url.includes('base44') && (
                    <button
                      onClick={() => fetchHipertrofiaGif(form.video_url)}
                      disabled={generatingImg}
                      title="Carregar via proxy para evitar bloqueio"
                      className="px-2 py-1 rounded-lg text-[10px] font-mono-cyber flex items-center gap-1 flex-shrink-0"
                      style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                      {generatingImg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                      PROXY
                    </button>
                  )}
                </div>
                {form.video_url && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-purple-900/25 bg-black/30" style={{ maxHeight: 200 }}>
                    {form.video_url.match(/\.(mp4|webm|ogg)(\?|$)/i) ? (
                      <video src={form.video_url} controls className="w-full" style={{ maxHeight: 200 }} />
                    ) : (
                      <img src={form.video_url} alt="preview" className="w-full object-contain" style={{ maxHeight: 200 }}
                        onError={e => {
                          e.target.style.display='none';
                          e.target.nextSibling.style.display='flex';
                        }} />
                    )}
                    <div className="hidden items-center justify-center py-4 text-[10px] font-mono-cyber text-purple-500/40 flex-col gap-1">
                      <span>⚠ Preview bloqueado pelo site externo</span>
                      <span style={{color:'rgba(168,85,247,0.3)'}}>Use o botão HIPERTROFIA.ORG para buscar via proxy</span>
                    </div>
                  </div>
                )}
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
              {exercise.description && (
                <p className="text-xs text-purple-300/60 leading-relaxed border-l-2 border-purple-500/20 pl-3">{exercise.description}</p>
              )}
              {exercise.video_url && (
                <div className="rounded-xl overflow-hidden border border-purple-900/20 bg-black/30" style={{ maxHeight: 200 }}>
                  {exercise.video_url.match(/\.(mp4|webm|ogg)(\?|$)/i) ? (
                    <video src={exercise.video_url} controls className="w-full" style={{ maxHeight: 200 }} />
                  ) : (
                    <img src={exercise.video_url} alt={exercise.name} className="w-full object-contain" style={{ maxHeight: 200 }} onError={e => e.target.style.display = 'none'} />
                  )}
                </div>
              )}
              {!exercise.description && !exercise.video_url && (
                <p className="text-xs text-purple-500/30 font-mono-cyber">// sem descrição ou gif — clique em editar para adicionar</p>
              )}
            </>
          )}
        </div>
      )}
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
              className="cyber-input w-full rounded-md px-3 py-2 text-sm">
              {MUSCLE_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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