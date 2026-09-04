import React, { useState } from "react";
import { Camera, Image, Loader2, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createWorkoutShareImage, downloadWorkoutImage } from "@/lib/workoutShareCanvas";
import { toast } from "sonner";

const modes = [
  { value: "overlay", label: "Foto + estatísticas", icon: Camera },
  { value: "photo", label: "Somente foto", icon: Image },
  { value: "card", label: "Card do treino", icon: Share2 },
];

export default function WorkoutShareComposer({ open, onClose, stats, onImageReady }) {
  const [mode, setMode] = useState("overlay");
  const [photo, setPhoto] = useState(null);
  const [working, setWorking] = useState(false);
  const createAndShare = async () => {
    if (mode !== "card" && !photo) return toast.error("Tire ou escolha uma foto primeiro.");
    setWorking(true);
    try {
      const blob = await createWorkoutShareImage(stats, mode, photo);
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
  return <Dialog open={open} onOpenChange={onClose}><DialogContent className="max-w-md border border-cyan-500/30 bg-[#05060d] text-white"><DialogHeader><DialogTitle className="flex items-center gap-2 text-cyan-300"><Share2 className="h-4 w-4" /> Compartilhar treino</DialogTitle></DialogHeader><div className="space-y-4"><div className="grid grid-cols-3 gap-2">{modes.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setMode(value)} className={`rounded-xl border p-3 text-center text-[10px] transition-all ${mode === value ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-purple-500/20 text-purple-200/50"}`}><Icon className="mx-auto mb-2 h-5 w-5" />{label}</button>)}</div>{mode !== "card" && <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 p-5"><Camera className="mb-2 h-6 w-6 text-purple-300" /><span className="text-xs">{photo ? photo.name : "Tirar ou escolher foto"}</span><input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setPhoto(e.target.files?.[0] || null)} /></label>}<div className="app-glass-card rounded-xl p-3 text-xs text-purple-100/70"><p className="font-semibold text-white">{stats?.name || "Treino concluído"}</p><p className="mt-1">{stats?.exercises?.length || 0} exercícios · {Math.round(stats?.volumeKg || 0).toLocaleString("pt-BR")} kg de volume</p></div><button onClick={createAndShare} disabled={working} className="btn-neon-cyan flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:opacity-50">{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}{working ? "Preparando..." : "Gerar e compartilhar"}</button></div></DialogContent></Dialog>;
}