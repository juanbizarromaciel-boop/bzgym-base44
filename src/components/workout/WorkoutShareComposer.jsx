import React, { useState } from "react";
import { Camera, Loader2, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorkoutShareTemplatePicker from "@/components/workout/WorkoutShareTemplatePicker";
import { createWorkoutShareImage, downloadWorkoutImage } from "@/lib/workoutShareCanvas";
import { toast } from "sonner";

export default function WorkoutShareComposer({ open, onClose, stats, onImageReady }) {
  const [template, setTemplate] = useState("photo_stats");
  const [photo, setPhoto] = useState(null);
  const [working, setWorking] = useState(false);
  const usesPhoto = template === "photo_stats";
  const createAndShare = async () => {
    if (usesPhoto && !photo) return toast.error("Tire ou escolha uma foto para este modelo.");
    setWorking(true);
    try {
      const blob = await createWorkoutShareImage(stats, template, photo);
      const file = new File([blob], `treino-bz-${Date.now()}.jpg`, { type: "image/jpeg" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ title: "Meu treino no BZ Gym", text: "Treino concluído!", files: [file] }); }
        catch (error) { if (error?.name !== "AbortError") throw error; }
      } else { downloadWorkoutImage(file); toast.info("Imagem salva para você compartilhar."); }
      await onImageReady?.(file);
      onClose();
    } catch { toast.error("Não foi possível compartilhar a imagem."); }
    finally { setWorking(false); }
  };
  return <Dialog open={open} onOpenChange={onClose}><DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border border-cyan-500/30 bg-[#05060d] text-white"><DialogHeader><DialogTitle className="flex items-center gap-2 text-cyan-300"><Share2 className="h-4 w-4" /> Escolha seu modelo</DialogTitle></DialogHeader><div className="space-y-4"><WorkoutShareTemplatePicker value={template} onChange={setTemplate} />{usesPhoto && <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-cyan-500/35 bg-cyan-500/5 p-5 transition-colors hover:bg-cyan-500/10"><Camera className="mb-2 h-6 w-6 text-cyan-300" /><span className="text-xs font-medium">{photo ? photo.name : "Tirar ou escolher foto"}</span><span className="mt-1 text-[10px] text-purple-200/45">A foto será aplicada somente ao modelo Performance</span><input type="file" accept="image/*" capture="environment" className="hidden" onChange={event => setPhoto(event.target.files?.[0] || null)} /></label>}<div className="app-glass-card rounded-xl p-3 text-xs text-purple-100/70"><p className="font-semibold text-white">{stats?.name || "Treino concluído"}</p><p className="mt-1">{stats?.exercises?.length || 0} exercícios · {Math.round(stats?.volumeKg || 0).toLocaleString("pt-BR")} kg de volume</p></div><button onClick={createAndShare} disabled={working} className="btn-neon-cyan flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:opacity-50">{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}{working ? "Preparando..." : "Gerar e compartilhar"}</button></div></DialogContent></Dialog>;
}