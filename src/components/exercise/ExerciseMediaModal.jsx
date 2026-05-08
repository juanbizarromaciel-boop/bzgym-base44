import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Upload, Link, Sparkles, Image, Film, FileVideo, Loader2,
  CheckCircle, Trash2, Youtube, Pencil
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

// Tabs de FOTO (salvam em image_url)
const PHOTO_TABS = [
  { id: "upload_image", label: "Imagem", icon: Image },
  { id: "upload_gif", label: "GIF", icon: FileVideo },
  { id: "link_image", label: "Link externo", icon: Link },
  { id: "ai", label: "Gerar com IA", icon: Sparkles },
  { id: "default", label: "Padrão", icon: Image },
];

// Tabs de VÍDEO (salvam em video_url)
const VIDEO_TABS = [
  { id: "upload_video", label: "Upload vídeo", icon: Film },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "link_video", label: "Link externo", icon: Link },
];

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

function getYouTubeEmbed(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
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

function SaveButton({ onClick, loading, label = "Salvar" }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
      style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.4)', color: '#e9d5ff', boxShadow: '0 0 12px rgba(168,85,247,0.1)' }}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
      {loading ? "Salvando..." : label}
    </button>
  );
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono-cyber transition-all"
          style={active === t.id
            ? { background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#e9d5ff' }
            : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.5)' }}>
          <t.icon className="w-3 h-3" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function ExerciseMediaModal({ exercise, open, onClose, onSaved }) {
  const [section, setSection] = useState("photo"); // "photo" | "video"
  const [photoTab, setPhotoTab] = useState("upload_image");
  const [videoTab, setVideoTab] = useState("youtube");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPreview, setAiPreview] = useState(null);

  if (!exercise) return null;

  const inputStyle = {
    background: 'rgba(4,2,14,0.85)',
    border: '1px solid rgba(168,85,247,0.25)',
    color: '#f0e6ff',
  };

  // ---- Photo handlers ----
  const handlePhotoUpload = async (e, accept) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Exercise.update(exercise.id, { image_url: file_url });
      toast.success("Imagem adicionada com sucesso.");
      onSaved?.({ ...exercise, image_url: file_url });
      onClose();
    } catch (err) {
      toast.error("Erro ao enviar: " + err.message);
    }
    setUploading(false);
  };

  const handlePhotoLink = async () => {
    if (!urlInput.trim()) { toast.error("Cole uma URL válida."); return; }
    setUploading(true);
    try {
      await base44.entities.Exercise.update(exercise.id, { image_url: urlInput.trim() });
      toast.success("Imagem salva.");
      onSaved?.({ ...exercise, image_url: urlInput.trim() });
      onClose();
    } catch (err) {
      toast.error("Erro: " + err.message);
    }
    setUploading(false);
  };

  const handleDefault = async () => {
    const url = MUSCLE_DEFAULTS[exercise.muscle_group] || MUSCLE_DEFAULTS.outro;
    setUploading(true);
    try {
      await base44.entities.Exercise.update(exercise.id, { image_url: url });
      toast.success("Imagem padrão aplicada.");
      onSaved?.({ ...exercise, image_url: url });
      onClose();
    } catch (err) {
      toast.error("Erro: " + err.message);
    }
    setUploading(false);
  };

  const handleGenerateAI = async (customPrompt) => {
    setGeneratingAI(true);
    setAiPreview(null);
    try {
      const prompt = customPrompt || buildAIPrompt(exercise.name, exercise.muscle_group, exercise.description);
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      setAiPreview({ url: res.url, prompt });
      toast.info("Imagem gerada. Revise antes de aprovar.");
    } catch (err) {
      toast.error("Erro ao gerar: " + err.message);
    }
    setGeneratingAI(false);
  };

  const handleApproveAI = async () => {
    if (!aiPreview?.url) return;
    setUploading(true);
    try {
      await base44.entities.Exercise.update(exercise.id, { image_url: aiPreview.url });
      toast.success("Imagem aprovada e salva!");
      onSaved?.({ ...exercise, image_url: aiPreview.url });
      onClose();
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
    }
    setUploading(false);
  };

  // ---- Video handlers ----
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Exercise.update(exercise.id, { video_url: file_url });
      toast.success("Vídeo adicionado com sucesso.");
      onSaved?.({ ...exercise, video_url: file_url });
      onClose();
    } catch (err) {
      toast.error("Erro ao enviar vídeo: " + err.message);
    }
    setUploading(false);
  };

  const handleVideoLink = async () => {
    if (!urlInput.trim()) { toast.error("Cole uma URL válida."); return; }
    let finalUrl = urlInput.trim();
    if (videoTab === "youtube") {
      const embed = getYouTubeEmbed(finalUrl);
      if (!embed) { toast.error("URL do YouTube inválida."); return; }
      finalUrl = embed;
    }
    setUploading(true);
    try {
      await base44.entities.Exercise.update(exercise.id, { video_url: finalUrl });
      toast.success("Vídeo salvo.");
      onSaved?.({ ...exercise, video_url: finalUrl });
      onClose();
    } catch (err) {
      toast.error("Erro: " + err.message);
    }
    setUploading(false);
  };

  const handleTabChange = (tab, isVideo) => {
    setUrlInput("");
    setAiPreview(null);
    if (isVideo) setVideoTab(tab);
    else setPhotoTab(tab);
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

        {/* Section selector: Foto | Vídeo */}
        <div className="flex gap-2 mt-1 mb-4">
          <button onClick={() => setSection("photo")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={section === "photo"
              ? { background: 'rgba(168,85,247,0.22)', border: '1px solid rgba(168,85,247,0.5)', color: '#e9d5ff' }
              : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(192,132,252,0.5)' }}>
            <Image className="w-3.5 h-3.5" /> Foto / GIF / IA
          </button>
          <button onClick={() => setSection("video")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={section === "video"
              ? { background: 'rgba(6,182,212,0.18)', border: '1px solid rgba(6,182,212,0.45)', color: '#67e8f9' }
              : { background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.12)', color: 'rgba(103,232,249,0.4)' }}>
            <Film className="w-3.5 h-3.5" /> Vídeo
          </button>
        </div>

        {/* ===== PHOTO SECTION ===== */}
        {section === "photo" && (
          <div className="space-y-4">
            <TabBar tabs={PHOTO_TABS} active={photoTab} onSelect={t => handleTabChange(t, false)} />

            {photoTab === "upload_image" && (
              <UploadArea accept={ACCEPT_IMAGE} label="Selecionar imagem (PNG, JPG, WEBP)"
                uploading={uploading} onChange={e => handlePhotoUpload(e, ACCEPT_IMAGE)} />
            )}

            {photoTab === "upload_gif" && (
              <UploadArea accept={ACCEPT_GIF} label="Selecionar GIF"
                uploading={uploading} onChange={e => handlePhotoUpload(e, ACCEPT_GIF)} />
            )}

            {photoTab === "link_image" && (
              <div>
                <p className="text-[10px] font-mono-cyber mb-2" style={{ color: 'rgba(192,132,252,0.5)' }}>Cole o link da imagem ou GIF externo</p>
                <Input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://..." style={inputStyle} className="mb-3" />
                <SaveButton onClick={handlePhotoLink} loading={uploading} label="Salvar imagem" />
              </div>
            )}

            {photoTab === "default" && (
              <div>
                <p className="text-[10px] font-mono-cyber mb-3" style={{ color: 'rgba(192,132,252,0.5)' }}>
                  Imagem padrão para: <span className="text-purple-300">{exercise.muscle_group}</span>
                </p>
                <div className="rounded-xl overflow-hidden mb-3 border border-purple-900/20">
                  <img src={MUSCLE_DEFAULTS[exercise.muscle_group] || MUSCLE_DEFAULTS.outro}
                    alt="padrão" className="w-full object-cover" style={{ maxHeight: 200 }}
                    onError={e => e.target.style.display = 'none'} />
                </div>
                <SaveButton label="Usar esta imagem" onClick={handleDefault} loading={uploading} />
              </div>
            )}

            {photoTab === "ai" && (
              <div>
                {!aiPreview ? (
                  <>
                    <p className="text-[10px] font-mono-cyber mb-2" style={{ color: 'rgba(192,132,252,0.5)' }}>
                      Prompt automático para: <span className="text-purple-300">{exercise.name}</span>
                    </p>
                    <textarea
                      value={aiPrompt || buildAIPrompt(exercise.name, exercise.muscle_group, exercise.description)}
                      onChange={e => setAiPrompt(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl p-3 text-xs resize-none mb-3"
                      style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(168,85,247,0.25)', color: '#e9d5ff' }}
                    />
                    <button onClick={() => handleGenerateAI(aiPrompt || null)} disabled={generatingAI}
                      className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                      style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#e9d5ff' }}>
                      {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {generatingAI ? "Gerando imagem..." : "Gerar imagem com IA"}
                    </button>
                  </>
                ) : (
                  <div>
                    <div className="rounded-xl overflow-hidden border border-purple-500/30 mb-3">
                      <img src={aiPreview.url} alt="gerada" className="w-full object-contain" style={{ maxHeight: 240 }} />
                    </div>
                    <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Pencil className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-mono-cyber text-cyan-400/80">Editar prompt e regerar</span>
                      </div>
                      <textarea
                        value={aiPrompt || aiPreview.prompt || ""}
                        onChange={e => setAiPrompt(e.target.value)}
                        rows={4}
                        placeholder="Descreva ajustes..."
                        className="w-full rounded-lg p-2.5 text-xs resize-none mb-2"
                        style={{ background: 'rgba(2,1,8,0.98)', border: '1px solid rgba(6,182,212,0.2)', color: '#e9d5ff' }}
                      />
                      <button onClick={() => handleGenerateAI(aiPrompt || aiPreview.prompt)} disabled={generatingAI}
                        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                        style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', color: '#67e8f9' }}>
                        {generatingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {generatingAI ? "Gerando..." : "Gerar com prompt editado"}
                      </button>
                    </div>
                    <p className="text-[10px] font-mono-cyber text-amber-400/70 mb-2 text-center">⚠ Revise antes de aprovar.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleApproveAI} disabled={uploading}
                        className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7' }}>
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Aprovar e salvar
                      </button>
                      <button onClick={() => setAiPreview(null)}
                        className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        <Trash2 className="w-3.5 h-3.5" /> Descartar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== VIDEO SECTION ===== */}
        {section === "video" && (
          <div className="space-y-4">
            <TabBar tabs={VIDEO_TABS} active={videoTab} onSelect={t => handleTabChange(t, true)} />

            {videoTab === "upload_video" && (
              <UploadArea accept={ACCEPT_VIDEO} label="Selecionar vídeo (MP4, WEBM)"
                uploading={uploading} onChange={handleVideoUpload} />
            )}

            {videoTab === "youtube" && (
              <div>
                <p className="text-[10px] font-mono-cyber mb-2" style={{ color: 'rgba(103,232,249,0.5)' }}>Cole o link do YouTube</p>
                <Input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} className="mb-3" />
                {urlInput && getYouTubeEmbed(urlInput) && (
                  <div className="rounded-xl overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
                    <iframe src={getYouTubeEmbed(urlInput)} className="w-full h-full" allowFullScreen title="preview" />
                  </div>
                )}
                <button onClick={handleVideoLink} disabled={uploading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{ background: 'rgba(6,182,212,0.18)', border: '1px solid rgba(6,182,212,0.4)', color: '#67e8f9' }}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {uploading ? "Salvando..." : "Salvar vídeo"}
                </button>
              </div>
            )}

            {videoTab === "link_video" && (
              <div>
                <p className="text-[10px] font-mono-cyber mb-2" style={{ color: 'rgba(103,232,249,0.5)' }}>Cole o link do vídeo externo (MP4 ou WEBM)</p>
                <Input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://..." style={inputStyle} className="mb-3" />
                <button onClick={handleVideoLink} disabled={uploading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{ background: 'rgba(6,182,212,0.18)', border: '1px solid rgba(6,182,212,0.4)', color: '#67e8f9' }}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {uploading ? "Salvando..." : "Salvar vídeo"}
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}