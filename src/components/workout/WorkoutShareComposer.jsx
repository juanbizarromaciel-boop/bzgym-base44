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
  const createAndShare = async () => {
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
  return <Dialog open={open} onOpenChange={onClose}><DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border border-app-primary/25 bg-app-bg text-app-text"><DialogHeader><DialogTitle className="flex items-center gap-2 text-app-text"><Share2 className="h-4 w-4 text-app-primary" /> Escolha seu modelo</DialogTitle></DialogHeader><div className="space-y-4"><WorkoutShareTemplatePicker value={template} onChange={setTemplate} /><label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-app-primary/35 bg-app-primary/5 p-5 transition-colors hover:bg-app-primary/10"><Camera className="mb-2 h-6 w-6 text-app-primary" /><span className="text-xs font-medium">{photo ? photo.name : "Tirar ou escolher foto"}</span><span className="mt-1 text-[10px] text-app-muted">A foto funciona em todos os modelos</span><input type="file" accept="image/*" capture="environment" className="hidden" onChange={event => setPhoto(event.target.files?.[0] || null)} /></label><div className="app-glass-card rounded-xl p-3 text-xs text-app-muted"><p className="font-semibold text-app-text">{stats?.name || "Treino concluído"}</p><p className="mt-1">{stats?.durationMinutes || 0} min · {Math.round(stats?.volumeKg || 0).toLocaleString("pt-BR")} kg · {stats?.seriesCount || 0} séries</p></div><button onClick={createAndShare} disabled={working} className="app-button-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:opacity-50">{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}{working ? "Preparando..." : "Gerar e compartilhar"}</button></div></DialogContent></Dialog>;
}