import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Scale, Flame, Droplets, Bone, Activity, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const FIELDS = [
  { key: "weight_kg", label: "Peso (kg)", icon: Scale, color: "#a855f7" },
  { key: "body_fat_percent", label: "Gordura (%)", icon: Flame, color: "#ec4899" },
  { key: "lean_mass_kg", label: "Massa Magra (kg)", icon: Activity, color: "#06b6d4" },
  { key: "fat_mass_kg", label: "Massa Gorda (kg)", icon: Flame, color: "#f97316" },
  { key: "body_water_percent", label: "Água (%)", icon: Droplets, color: "#22d3ee" },
  { key: "basal_metabolism", label: "Met. Basal (kcal)", icon: Flame, color: "#f59e0b" },
  { key: "visceral_fat", label: "Gordura Visceral", icon: Activity, color: "#ef4444" },
  { key: "bone_mass_kg", label: "Massa Óssea (kg)", icon: Bone, color: "#84cc16" },
];

const EMPTY_FORM = { date: new Date().toISOString().split("T")[0], weight_kg: "", body_fat_percent: "", lean_mass_kg: "", fat_mass_kg: "", body_water_percent: "", basal_metabolism: "", visceral_fat: "", bone_mass_kg: "", notes: "" };

export default function BioimpedanciaPanel({ studentId, personalId }) {
  const { user, isAdmin } = useCurrentUser();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const canEdit = isAdmin || user?.role === "personal";

  const { data: allBio = [], isLoading } = useQuery({
    queryKey: ["bioimpedancia", studentId],
    queryFn: () => base44.entities.Bioimpedancia.list(),
    staleTime: 30000,
  });

  const records = allBio.filter(b => b.student_id === studentId).sort((a, b) => new Date(b.date) - new Date(a.date));

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Bioimpedancia.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bioimpedancia", studentId] }); toast.success("Avaliação registrada"); setDialogOpen(false); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.Bioimpedancia.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bioimpedancia", studentId] }); toast.success("Atualizado"); setDialogOpen(false); setEditing(null); }
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Bioimpedancia.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bioimpedancia", studentId] }); toast.success("Removido"); }
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ date: r.date || EMPTY_FORM.date, weight_kg: r.weight_kg || "", body_fat_percent: r.body_fat_percent || "", lean_mass_kg: r.lean_mass_kg || "", fat_mass_kg: r.fat_mass_kg || "", body_water_percent: r.body_water_percent || "", basal_metabolism: r.basal_metabolism || "", visceral_fat: r.visceral_fat || "", bone_mass_kg: r.bone_mass_kg || "", notes: r.notes || "" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = { student_id: studentId, personal_id: personalId || "", ...form };
    FIELDS.forEach(f => { if (payload[f.key] !== "") payload[f.key] = parseFloat(payload[f.key]) || null; });
    editing ? updateMut.mutate({ id: editing.id, d: payload }) : createMut.mutate(payload);
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} className="space-y-4">

      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em]" style={{ color: 'rgba(6,182,212,0.70)' }}>// bioimpedância</p>
        {canEdit && (
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-cyber"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)', color: '#06b6d4' }}>
            <Plus className="w-3.5 h-3.5" /> Nova avaliação
          </button>
        )}
      </motion.div>

      {records.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-12 rounded-xl border border-purple-900/20">
          <Scale className="w-10 h-10 mx-auto mb-3 text-purple-500/20" />
          <p className="font-mono-cyber text-sm text-purple-500/30">// nenhuma avaliação registrada</p>
          {canEdit && <button onClick={openNew} className="mt-4 btn-neon-cyan px-4 py-2 rounded-lg text-xs flex items-center gap-2 mx-auto"><Plus className="w-3.5 h-3.5" /> Adicionar</button>}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {records.map((r, idx) => (
            <motion.div key={r.id} variants={fadeUp}
              className="p-4 rounded-xl border" style={{ borderColor: idx === 0 ? 'rgba(6,182,212,0.30)' : 'rgba(168,85,247,0.15)', background: 'rgba(4,4,14,0.7)' }}>
              {idx === 0 && <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.7), transparent)' }} />}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {idx === 0 && <span className="text-[9px] font-mono-cyber px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>mais recente</span>}
                  <span className="text-xs font-mono-cyber text-purple-400/60">{new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}</span>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteMut.mutate(r.id)} className="p-1.5 rounded-lg text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FIELDS.map(f => r[f.key] != null ? (
                  <div key={f.key} className="p-2 rounded-lg text-center" style={{ background: `${f.color}08`, border: `1px solid ${f.color}20` }}>
                    <p className="font-cyber text-base font-black" style={{ color: f.color }}>{r[f.key]}</p>
                    <p className="text-[8px] font-mono-cyber uppercase tracking-wider mt-0.5" style={{ color: `${f.color}60` }}>{f.label}</p>
                  </div>
                ) : null)}
              </div>
              {r.notes && <p className="text-xs text-purple-400/40 font-mono-cyber mt-2 italic border-t border-purple-900/20 pt-2">// {r.notes}</p>}
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={() => { setDialogOpen(false); setEditing(null); }}>
        <DialogContent className="border border-cyan-900/40 text-white max-w-md max-h-[90vh] overflow-y-auto" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-cyan-300">{editing ? "EDITAR AVALIAÇÃO" : "NOVA BIOIMPEDÂNCIA"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-cyan-400/60 text-xs tracking-wider">DATA *</Label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <Label className="text-purple-400/60 text-[10px] tracking-wider">{f.label}</Label>
                  <input type="number" step="0.1" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm" placeholder="—" />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="cyber-input mt-1 resize-none" rows={2} />
            </div>
            <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
              className="w-full btn-neon-cyan py-2.5 rounded-xl text-sm font-medium">
              {editing ? "ATUALIZAR" : "SALVAR AVALIAÇÃO"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}