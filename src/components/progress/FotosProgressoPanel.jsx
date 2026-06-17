import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Camera, Loader2, Trash2, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const PHOTO_TYPES = [
  { key: "frente_url", label: "Frente", emoji: "🏋️" },
  { key: "lado_url", label: "Lado", emoji: "👤" },
  { key: "costas_url", label: "Costas", emoji: "🔙" },
];

export default function FotosProgressoPanel({ studentId, personalId }) {
  const { user, isAdmin } = useCurrentUser();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], notes: "", visibility: "personal" });
  const [uploading, setUploading] = useState({});
  const [urls, setUrls] = useState({ frente_url: "", lado_url: "", costas_url: "" });
  const [lightbox, setLightbox] = useState(null); // { photos, idx }
  const canEdit = isAdmin || user?.role === "personal" || user?.role === "user";

  const { data: allFotos = [], isLoading } = useQuery({
    queryKey: ["fotosProgresso", studentId],
    queryFn: () => base44.entities.FotoProgresso.list(),
    staleTime: 30000,
  });

  const fotos = allFotos
    .filter(f => f.student_id === studentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.FotoProgresso.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fotosProgresso", studentId] }); toast.success("Fotos salvas!"); setDialogOpen(false); resetForm(); }
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.FotoProgresso.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fotosProgresso", studentId] }); toast.success("Removido"); }
  });

  const resetForm = () => {
    setForm({ date: new Date().toISOString().split("T")[0], notes: "", visibility: "personal" });
    setUrls({ frente_url: "", lado_url: "", costas_url: "" });
  };

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading(p => ({ ...p, [key]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrls(p => ({ ...p, [key]: file_url }));
    setUploading(p => ({ ...p, [key]: false }));
    toast.success("Foto enviada!");
  };

  const handleSubmit = () => {
    if (!urls.frente_url && !urls.lado_url && !urls.costas_url) {
      toast.error("Envie pelo menos uma foto");
      return;
    }
    createMut.mutate({
      student_id: studentId,
      personal_id: personalId || "",
      date: form.date,
      notes: form.notes,
      visibility: form.visibility,
      frente_url: urls.frente_url || null,
      lado_url: urls.lado_url || null,
      costas_url: urls.costas_url || null,
    });
  };

  const openLightbox = (record, startIdx = 0) => {
    const photos = PHOTO_TYPES.map(t => record[t.key]).filter(Boolean);
    if (photos.length === 0) return;
    const adjustedIdx = Math.min(startIdx, photos.length - 1);
    setLightbox({ photos, idx: adjustedIdx });
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">

      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em]" style={{ color: 'rgba(236,72,153,0.70)' }}>// fotos de progresso</p>
        {canEdit && (
          <button onClick={() => { resetForm(); setDialogOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-cyber"
            style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.35)', color: '#ec4899' }}>
            <Plus className="w-3.5 h-3.5" /> Adicionar fotos
          </button>
        )}
      </motion.div>

      {fotos.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-12 rounded-xl border border-purple-900/20">
          <Camera className="w-10 h-10 mx-auto mb-3 text-pink-500/20" />
          <p className="font-mono-cyber text-sm text-purple-500/30">// nenhuma foto registrada</p>
          {canEdit && <button onClick={() => { resetForm(); setDialogOpen(true); }} className="mt-4 btn-neon-pink px-4 py-2 rounded-lg text-xs flex items-center gap-2 mx-auto"><Plus className="w-3.5 h-3.5" /> Adicionar fotos</button>}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {fotos.map((record, idx) => {
            const photosInRecord = PHOTO_TYPES.filter(t => record[t.key]);
            return (
              <motion.div key={record.id} variants={fadeUp}
                className="p-4 rounded-xl border" style={{ borderColor: idx === 0 ? 'rgba(236,72,153,0.30)' : 'rgba(168,85,247,0.15)', background: 'rgba(4,4,14,0.7)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-[9px] font-mono-cyber px-2 py-0.5 rounded" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>mais recente</span>}
                    <span className="text-xs font-mono-cyber text-purple-400/60">{new Date(record.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}</span>
                  </div>
                  {(isAdmin || user?.role === "personal") && (
                    <button onClick={() => deleteMut.mutate(record.id)} className="p-1.5 rounded-lg text-purple-400/30 hover:text-pink-400 hover:bg-pink-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PHOTO_TYPES.map((t, i) => record[t.key] ? (
                    <div key={t.key} className="relative group cursor-pointer rounded-xl overflow-hidden aspect-[3/4]"
                      onClick={() => openLightbox(record, photosInRecord.indexOf(record[t.key]))}>
                      <img src={record[t.key]} alt={t.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={e => { e.target.style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-[9px] font-mono-cyber" style={{ background: 'rgba(0,0,0,0.6)', color: '#ec4899' }}>{t.label}</div>
                    </div>
                  ) : (
                    <div key={t.key} className="rounded-xl aspect-[3/4] flex flex-col items-center justify-center" style={{ background: 'rgba(168,85,247,0.04)', border: '1px dashed rgba(168,85,247,0.15)' }}>
                      <Camera className="w-5 h-5 text-purple-500/20 mb-1" />
                      <p className="text-[9px] font-mono-cyber text-purple-500/20">{t.label}</p>
                    </div>
                  ))}
                </div>
                {record.notes && <p className="text-xs text-purple-400/40 font-mono-cyber mt-2 italic border-t border-purple-900/20 pt-2">// {record.notes}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => { setDialogOpen(false); resetForm(); }}>
        <DialogContent className="border border-pink-900/40 text-white max-w-md max-h-[90vh] overflow-y-auto" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-pink-300 flex items-center gap-2">
              <Camera className="w-4 h-4" /> ADICIONAR FOTOS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-pink-400/60 text-xs tracking-wider">DATA *</Label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" />
            </div>
            {PHOTO_TYPES.map(t => (
              <div key={t.key}>
                <Label className="text-purple-400/60 text-[10px] tracking-wider">{t.emoji} {t.label}</Label>
                <div className="mt-1">
                  {urls[t.key] ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video">
                      <img src={urls[t.key]} alt={t.label} className="w-full h-full object-cover" />
                      <button onClick={() => setUrls(p => ({ ...p, [t.key]: "" }))}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-pink-400 hover:bg-pink-500/20 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed cursor-pointer hover:border-pink-500/40 transition-all"
                      style={{ borderColor: 'rgba(236,72,153,0.20)', background: 'rgba(236,72,153,0.04)' }}>
                      {uploading[t.key] ? (
                        <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-pink-400/40 mb-2" />
                          <p className="text-[10px] font-mono-cyber text-pink-400/40">Clique para enviar</p>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(t.key, e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>
            ))}
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm resize-none" rows={2} />
            </div>
            <button onClick={handleSubmit} disabled={createMut.isPending || Object.values(uploading).some(Boolean)}
              className="w-full btn-neon-pink py-2.5 rounded-xl text-sm font-medium">
              {createMut.isPending ? "SALVANDO..." : "SALVAR FOTOS"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.95)' }}
            onClick={() => setLightbox(null)}>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white" onClick={() => setLightbox(null)}>
              <X className="w-5 h-5" />
            </button>
            {lightbox.photos.length > 1 && (
              <>
                <button className="absolute left-4 p-2 rounded-full bg-white/10 text-white" onClick={e => { e.stopPropagation(); setLightbox(p => ({ ...p, idx: (p.idx - 1 + p.photos.length) % p.photos.length })); }}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="absolute right-4 p-2 rounded-full bg-white/10 text-white" onClick={e => { e.stopPropagation(); setLightbox(p => ({ ...p, idx: (p.idx + 1) % p.photos.length })); }}>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <img src={lightbox.photos[lightbox.idx]} alt="progresso" className="max-h-[85vh] max-w-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
            <div className="absolute bottom-4 text-xs font-mono-cyber text-white/40">{lightbox.idx + 1} / {lightbox.photos.length}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}