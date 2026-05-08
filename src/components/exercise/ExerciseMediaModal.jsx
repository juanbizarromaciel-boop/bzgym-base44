import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Upload, Link, Sparkles, Image, Film, FileVideo, X, Loader2,
  CheckCircle, RotateCcw, Pencil, Trash2, Youtube
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MUSCLE_DEFAULTS = {
  peito: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
  costas: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&q=80",
  ombros: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
  biceps: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
  triceps: "https://images.unsplash.com/photo-1530822847156-5df684ec5105?w=400&q=80",
  pernas: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&q=80",
  gluteos: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  abdomen: "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400&q=80",
  panturrilha: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&q=80",
  cardio: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80",
  outro: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
};

const ACCEPT_IMAGE = "image/png,image/jpeg,image/jpg,image/webp";
const ACCEPT_VIDEO = "video/mp4,video/webm";
const ACCEPT_GIF = "image/gif";

const TABS = [
  { id: "upload_image", label: "Imagem", icon: Image },
  { id: "upload_video", label: "Vídeo", icon: Film },
  { id: "upload_gif", label: "GIF", icon: FileVideo },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "link", label: "Link externo", icon: Link },
  { id: "ai", label: "Gerar com IA", icon: Sparkles },
  { id: "default", label: "Padrão", icon: Image },
];

// Build AI prompt for exercise image
function buildAIPrompt(exerciseName, muscleGroup, description) {
  return `Ultra realistic fitness image of a person performing the "${exerciseName}" exercise. ` +
    `Primary muscle group: ${muscleGroup}. ` +
    (description ? `Exercise notes: ${description}. ` : "") +
    `Setting: modern gym, dark background, cinematic lighting, premium aesthetic, subtle neon purple #a855f7 accent details, ` +
    `clean composition, full focus on the exercise, proportional body, realistic anatomy, correct equipment clearly visible, ` +
    `movement easy to interpret, no text, no logos, no extra limbs, no anatomical deformations, no cluttered background. ` +
    `Biomechanically correct: show clear starting or ending position, proper joint alignment, primary muscle engaged. ` +
    `The image must look like official material from a professional workout app, not a stock photo. ` +
    `Prioritize didactic clarity over exaggerated aesthetics.`;
}

// Extract YouTube embed URL
function getYouTubeEmbed(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function ExerciseMediaModal({ exercise, open, onClose, onSaved }) {
  const [tab, setTab] = useState("upload_image");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPreview, setAiPreview] = useState(null); // { url }
  const [editingPrompt, setEditingPrompt] = useState(false);

  if (!exercise) return null;

  const handleFileUpload = async (e, accept) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate format
    const allowed = accept.split(",");
    if (!allowed.some(a => file.type === a || file.name.toLowerCase().endsWith(a.replace("image/", ".").replace("video/", ".")))) {
      toast.error("Formato de arquivo não suportado.");
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Exercise.update(exercise.id, { video_url: file_url });
      toast.success("Mídia adicionada com sucesso.");
      onSaved?.({ ...exercise, video_url: file_url });
      onClose();
    } catch (err) {
      toast.error("Erro ao enviar arquivo: " + err.message);
    }
    setUploading(false);
  };

  const handleSaveUrl = async () => {
    if (!urlInput.trim()) { toast.error("Cole uma URL válida."); return; }
    let finalUrl = urlInput.trim();
    if (tab === "youtube") {
      const embed = getYouTubeEmbed(finalUrl);
      if (!embed) { toast.error("URL do YouTube inválida."); return; }
      finalUrl = embed;
    }
    setUploading(true);
    try {
      await base44.entities.Exercise.update(exercise.id, { video_url: finalUrl });
      toast.success("Mídia adicionada com sucesso.");
      onSaved?.({ ...exercise, video_url: finalUrl });
      onClose();
    } catch (err) {
      toast.error("Erro ao salvar URL: " + err.message);
    }
    setUploading(false);
  };

  const handleDefault = async () => {
    const url = MUSCLE_DEFAULTS[exercise.muscle_group] || MUSCLE_DEFAULTS.outro;
    setUploading(true);
    try {
      await base44.entities.Exercise.update(exercise.id, { video_url: url });
      toast.success("Imagem padrão aplicada.");
      onSaved?.({ ...exercise, video_url: url });
      onClose();
    } catch (err) {
      toast.error("Erro: " + err.message);
    }
    setUploading(false);
  };

  const handleGenerateAI = async (customPrompt) => {
    setGeneratingAI(true);
    setAiPreview(null);
    setEditingPrompt(false);
    try {
      const prompt = customPrompt ||
        buildAIPrompt(exercise.name, exercise.muscle_group, exercise.description);
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      setAiPreview({ url: res.url, prompt });
      toast.info("Imagem gerada. Revise antes de aprovar.");
    } catch (err) {
      toast.error("Erro ao gerar imagem: " + err.message);
    }
    setGeneratingAI(false);
  };

  const handleApproveAI = async () => {
    if (!aiPreview?.url) return;
    setUploading(true);
    try {
      await base44.entities.Exercise.update(exercise.id, { video_url: aiPreview.url });
      toast.success("Imagem aprovada e salva!");
      onSaved?.({ ...exercise, video_url: aiPreview.url });
      onClose();
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
    }
    setUploading(false);
  };

  const inputStyle = {
    background: 'rgba(4,2,14,0.85)',
    border: '1px solid rgba(168,85,247,0.25)',
    color: '#f0e6ff',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'rgba(8,5,22,0.99)', border: '1px solid rgba(168,85,247,0.3)', color: '#f0e6ff' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-200 text-sm">
            <Image className="w-4 h-4 text-purple-400" />
            Mídia do exercício — <span className="text-purple-400 font-mono-cyber">{exercise.name}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tab nav */}
        <div className="flex flex-wrap gap-1.5 mt-1 mb-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setAiPreview(null); setUrlInput(""); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono-cyber transition-all"
              style={tab === t.id
                ? { background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#e9d5ff' }
                : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.5)' }}>
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-4">

          {/* Upload image */}
          {tab === "upload_image" && (
            <UploadArea accept={ACCEPT_IMAGE} label="Selecionar imagem (PNG, JPG, WEBP)"
              uploading={uploading} onChange={e => handleFileUpload(e, ACCEPT_IMAGE)} />
          )}

          {/* Upload video */}
          {tab === "upload_video" && (
            <UploadArea accept={ACCEPT_VIDEO} label="Selecionar vídeo (MP4, WEBM)"
              uploading={uploading} onChange={e => handleFileUpload(e, ACCEPT_VIDEO)} />
          )}

          {/* Upload gif */}
          {tab === "upload_gif" && (
            <UploadArea accept={ACCEPT_GIF} label="Selecionar GIF"
              uploading={uploading} onChange={e => handleFileUpload(e, ACCEPT_GIF)} />
          )}

          {/* YouTube */}
          {tab === "youtube" && (
            <div>
              <p className="text-[10px] font-mono-cyber mb-2" style={{ color: 'rgba(192,132,252,0.5)' }}>Cole o link do YouTube</p>
              <Input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} className="mb-3" />
              {urlInput && getYouTubeEmbed(urlInput) && (
                <div className="rounded-xl overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
                  <iframe src={getYouTubeEmbed(urlInput)} className="w-full h-full" allowFullScreen title="preview" />
                </div>
              )}
              <SaveButton onClick={handleSaveUrl} loading={uploading} />
            </div>
          )}

          {/* External link */}
          {tab === "link" && (
            <div>
              <p className="text-[10px] font-mono-cyber mb-2" style={{ color: 'rgba(192,132,252,0.5)' }}>Cole o link externo do vídeo ou imagem</p>
              <Input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="https://..." style={inputStyle} className="mb-3" />
              <SaveButton onClick={handleSaveUrl} loading={uploading} />
            </div>
          )}

          {/* Default muscle image */}
          {tab === "default" && (
            <div>
              <p className="text-[10px] font-mono-cyber mb-3" style={{ color: 'rgba(192,132,252,0.5)' }}>
                Imagem padrão para o grupo muscular: <span className="text-purple-300">{exercise.muscle_group}</span>
              </p>
              <div className="rounded-xl overflow-hidden mb-3 border border-purple-900/20">
                <img src={MUSCLE_DEFAULTS[exercise.muscle_group] || MUSCLE_DEFAULTS.outro}
                  alt="padrão" className="w-full object-cover" style={{ maxHeight: 200 }}
                  onError={e => e.target.style.display = 'none'} />
              </div>
              <SaveButton label="Usar esta imagem" onClick={handleDefault} loading={uploading} />
            </div>
          )}

          {/* Generate with AI */}
          {tab === "ai" && (
            <div>
              {!aiPreview ? (
                <>
                  <p className="text-[10px] font-mono-cyber mb-2" style={{ color: 'rgba(192,132,252,0.5)' }}>
                    Prompt automático gerado para: <span className="text-purple-300">{exercise.name}</span>
                  </p>
                  <textarea
                    value={aiPrompt || buildAIPrompt(exercise.name, exercise.muscle_group, exercise.description)}
                    onChange={e => setAiPrompt(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl p-3 text-xs resize-none mb-3"
                    style={{ background: 'rgba(4,2,14,0.85)', border: '1px solid rgba(168,85,247,0.2)', color: '#e9d5ff' }}
                  />
                  <button onClick={() => handleGenerateAI(aiPrompt || null)} disabled={generatingAI}
                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#e9d5ff', boxShadow: '0 0 16px rgba(168,85,247,0.15)' }}>
                    {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generatingAI ? "Gerando imagem..." : "Gerar imagem com IA"}
                  </button>
                </>
              ) : (
                /* Review panel */
                <div>
                  <div className="rounded-xl overflow-hidden border border-purple-500/30 mb-4">
                    <img src={aiPreview.url} alt="gerada" className="w-full object-contain" style={{ maxHeight: 260 }} />
                  </div>
                  <p className="text-[10px] font-mono-cyber text-amber-400/70 mb-3 text-center">
                    ⚠ Imagem gerada. Revise antes de aprovar.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleApproveAI} disabled={uploading}
                      className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7' }}>
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Aprovar
                    </button>
                    <button onClick={() => handleGenerateAI(aiPrompt || null)} disabled={generatingAI}
                      className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
                      {generatingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Gerar novamente
                    </button>
                    <button onClick={() => setEditingPrompt(v => !v)}
                      className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#22d3ee' }}>
                      <Pencil className="w-3.5 h-3.5" /> Editar prompt
                    </button>
                    <button onClick={() => setAiPreview(null)}
                      className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                      <Trash2 className="w-3.5 h-3.5" /> Descartar
                    </button>
                  </div>
                  {editingPrompt && (
                    <div className="mt-3">
                      <textarea
                        value={aiPrompt || aiPreview.prompt || ""}
                        onChange={e => setAiPrompt(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl p-3 text-xs resize-none mb-2"
                        style={{ background: 'rgba(4,2,14,0.85)', border: '1px solid rgba(168,85,247,0.2)', color: '#e9d5ff' }}
                      />
                      <button onClick={() => handleGenerateAI(aiPrompt)}
                        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                        style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#e9d5ff' }}>
                        <Sparkles className="w-3.5 h-3.5" /> Gerar com novo prompt
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadArea({ accept, label, uploading, onChange }) {
  return (
    <label className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-purple-500/50"
      style={{ borderColor: 'rgba(168,85,247,0.25)', background: 'rgba(168,85,247,0.03)' }}>
      {uploading
        ? <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        : <Upload className="w-8 h-8 text-purple-500/40" />}
      <span className="text-xs font-mono-cyber" style={{ color: 'rgba(192,132,252,0.6)' }}>{uploading ? "Enviando..." : label}</span>
      <input type="file" accept={accept} onChange={onChange} className="hidden" disabled={uploading} />
    </label>
  );
}

function SaveButton({ onClick, loading, label = "Salvar mídia" }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
      style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.4)', color: '#e9d5ff', boxShadow: '0 0 12px rgba(168,85,247,0.1)' }}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
      {loading ? "Salvando..." : label}
    </button>
  );
}