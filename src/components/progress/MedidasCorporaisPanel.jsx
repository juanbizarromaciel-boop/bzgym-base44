import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Ruler, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const FIELDS = [
  { key: "waist_cm", label: "Cintura (cm)", color: "#a855f7" },
  { key: "abdomen_cm", label: "Abdômen (cm)", color: "#ec4899" },
  { key: "hip_cm", label: "Quadril (cm)", color: "#06b6d4" },
  { key: "chest_cm", label: "Peito (cm)", color: "#f59e0b" },
  { key: "right_arm_cm", label: "Braço Dir. (cm)", color: "#10b981" },
  { key: "left_arm_cm", label: "Braço Esq. (cm)", color: "#84cc16" },
  { key: "right_thigh_cm", label: "Coxa Dir. (cm)", color: "#f97316" },
  { key: "left_thigh_cm", label: "Coxa Esq. (cm)", color: "#e879f9" },
  { key: "right_calf_cm", label: "Panturrilha Dir. (cm)", color: "#22d3ee" },
  { key: "left_calf_cm", label: "Panturrilha Esq. (cm)", color: "#a3e635" },
  { key: "neck_cm", label: "Pescoço (cm)", color: "#fb7185" },
];

const EMPTY_FORM = { date: new Date().toISOString().split("T")[0], waist_cm: "", abdomen_cm: "", hip_cm: "", chest_cm: "", right_arm_cm: "", left_arm_cm: "", right_thigh_cm: "", left_thigh_cm: "", right_calf_cm: "", left_calf_cm: "", neck_cm: "", notes: "" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border rounded-xl px-3 py-2 shadow-xl" style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.4)' }}>
      <p className="text-[10px] font-mono-cyber text-purple-400/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <p className="text-xs font-mono-cyber" style={{ color: p.color }}>{p.name}: {p.value}cm</p>
        </div>
      ))}
    </div>
  );
};

export default function MedidasCorporaisPanel({ studentId, personalId }) {
  const { user, isAdmin } = useCurrentUser();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [chartFields, setChartFields] = useState(["waist_cm", "right_arm_cm"]);
  const canEdit = isAdmin || user?.role === "personal" || user?.role === "user";

  const { data: allMedidas = [], isLoading } = useQuery({
    queryKey: ["medidasCorporais", studentId],
    queryFn: () => base44.entities.MedidasCorporais.list(),
    staleTime: 30000,
  });

  const records = allMedidas
    .filter(m => m.student_id === studentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const chronological = [...records].reverse();

  const chartData = chronological.map(r => ({
    label: new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    ...Object.fromEntries(FIELDS.map(f => [f.key, r[f.key] || null])),
  }));

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.MedidasCorporais.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["medidasCorporais", studentId] }); toast.success("Medidas salvas!"); setDialogOpen(false); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.MedidasCorporais.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["medidasCorporais", studentId] }); toast.success("Atualizado!"); setDialogOpen(false); setEditing(null); }
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.MedidasCorporais.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["medidasCorporais", studentId] }); toast.success("Removido"); }
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    const f = { date: r.date || EMPTY_FORM.date, notes: r.notes || "" };
    FIELDS.forEach(field => { f[field.key] = r[field.key] || ""; });
    setForm(f);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = { student_id: studentId, personal_id: personalId || "", ...form };
    FIELDS.forEach(f => { if (payload[f.key] !== "" && payload[f.key] != null) payload[f.key] = parseFloat(payload[f.key]) || null; else payload[f.key] = null; });
    editing ? updateMut.mutate({ id: editing.id, d: payload }) : createMut.mutate(payload);
  };

  const toggleChartField = (key) => {
    setChartFields(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key].slice(-4));
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">

      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em]" style={{ color: 'rgba(168,85,247,0.70)' }}>// medidas corporais</p>
        {canEdit && (
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-cyber"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)', color: '#a855f7' }}>
            <Plus className="w-3.5 h-3.5" /> Nova medida
          </button>
        )}
      </motion.div>

      {records.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-12 rounded-xl border border-purple-900/20">
          <Ruler className="w-10 h-10 mx-auto mb-3 text-purple-500/20" />
          <p className="font-mono-cyber text-sm text-purple-500/30">// nenhuma medida registrada</p>
          {canEdit && <button onClick={openNew} className="mt-4 btn-neon-purple px-4 py-2 rounded-lg text-xs flex items-center gap-2 mx-auto"><Plus className="w-3.5 h-3.5" /> Adicionar</button>}
        </motion.div>
      ) : (
        <>
          {/* Chart selector */}
          {chartData.length >= 2 && (
            <motion.div variants={fadeUp} className="p-4 rounded-xl border border-purple-900/20" style={{ background: 'rgba(4,4,14,0.8)' }}>
              <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(168,85,247,0.60)' }}>// selecione até 4 medidas para o gráfico</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {FIELDS.map(f => (
                  <button key={f.key} onClick={() => toggleChartField(f.key)}
                    className="text-[9px] font-mono-cyber px-2 py-1 rounded transition-all"
                    style={{
                      background: chartFields.includes(f.key) ? `${f.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${chartFields.includes(f.key) ? f.color : 'rgba(255,255,255,0.10)'}`,
                      color: chartFields.includes(f.key) ? f.color : 'rgba(255,255,255,0.3)',
                    }}>
                    {f.label.replace(" (cm)", "")}
                  </button>
                ))}
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.15)" />
                    <XAxis dataKey="label" stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                    <YAxis stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 9, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    {chartFields.map(key => {
                      const field = FIELDS.find(f => f.key === key);
                      return field ? (
                        <Line key={key} type="monotone" dataKey={key} name={field.label.replace(" (cm)", "")} stroke={field.color} strokeWidth={2} dot={{ r: 3, fill: field.color }} connectNulls />
                      ) : null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Records */}
          <div className="space-y-3">
            {records.map((r, idx) => (
              <motion.div key={r.id} variants={fadeUp}
                className="p-4 rounded-xl border" style={{ borderColor: idx === 0 ? 'rgba(168,85,247,0.30)' : 'rgba(168,85,247,0.12)', background: 'rgba(4,4,14,0.7)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-[9px] font-mono-cyber px-2 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>mais recente</span>}
                    <span className="text-xs font-mono-cyber text-purple-400/60">{new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}</span>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMut.mutate(r.id)} className="p-1.5 rounded-lg text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {FIELDS.map(f => r[f.key] != null ? (
                    <div key={f.key} className="p-2 rounded-lg text-center" style={{ background: `${f.color}08`, border: `1px solid ${f.color}20` }}>
                      <p className="font-cyber text-base font-black" style={{ color: f.color }}>{r[f.key]}</p>
                      <p className="text-[7px] font-mono-cyber uppercase tracking-wider mt-0.5" style={{ color: `${f.color}60` }}>{f.label.replace(" (cm)", "")}</p>
                    </div>
                  ) : null)}
                </div>
                {r.notes && <p className="text-xs text-purple-400/40 font-mono-cyber mt-2 italic border-t border-purple-900/20 pt-2">// {r.notes}</p>}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => { setDialogOpen(false); setEditing(null); }}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md max-h-[90vh] overflow-y-auto" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">{editing ? "EDITAR MEDIDAS" : "NOVAS MEDIDAS"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">DATA *</Label>
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
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="cyber-input w-full px-3 py-2 rounded-lg mt-1 text-white text-sm resize-none" rows={2} />
            </div>
            <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
              className="w-full btn-neon-purple py-2.5 rounded-xl text-sm font-medium">
              {editing ? "ATUALIZAR" : "SALVAR MEDIDAS"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}