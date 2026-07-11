import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Activity, Edit, Trash2, Syringe, ChevronDown, ChevronUp,
  ArrowLeft, FlaskConical, Calendar, Clock, TrendingUp, Zap, Shield,
  BarChart3, Info, AlertTriangle, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import CycleConcentrationChart from "../components/cycles/CycleConcentrationChart";
import WeeklyApplicationCalendar from "../components/cycles/WeeklyApplicationCalendar";
import SubstanceFormFields, { ESTER_OPTIONS, CATEGORY_LABELS } from "../components/cycles/SubstanceFormFields";

const ESTER_LABELS = Object.fromEntries(ESTER_OPTIONS.map(e => [e.value, e.label]));

const FREQ_LABELS = {
  "1x_semana": "1×/sem",
  "2x_semana": "2×/sem",
  "3x_semana": "3×/sem",
  "dia_sim_dia_nao": "Dia sim/não",
  "diario": "Diário",
  "2x_dia": "2×/dia",
  "conforme_necessario": "Conforme necessário",
};

const CATEGORY_COLORS = {
  anabolizante: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-300", glow: "rgba(168,85,247,0.5)" },
  peptideo: { border: "border-cyan-500/40", bg: "bg-cyan-500/10", text: "text-cyan-300", glow: "rgba(6,182,212,0.5)" },
  farmaco: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-300", glow: "rgba(245,158,11,0.5)" },
  hormonio: { border: "border-pink-500/40", bg: "bg-pink-500/10", text: "text-pink-300", glow: "rgba(236,72,153,0.5)" },
  outro: { border: "border-slate-500/40", bg: "bg-slate-500/10", text: "text-slate-300", glow: "rgba(100,116,139,0.5)" },
};

const SUBSTANCE_ACCENT_COLORS = [
  "#c084fc", "#22d3ee", "#f472b6", "#34d399", "#fb923c", "#a78bfa", "#60a5fa", "#fbbf24"
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export default function CH() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [substanceDialogOpen, setSubstanceDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [editingSubstance, setEditingSubstance] = useState(null);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [detailCycle, setDetailCycle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const qc = useQueryClient();

  const [cycleFormData, setCycleFormData] = useState({
    student_id: "", name: "", cycle_start_date: "", cycle_duration_weeks: "", notes: ""
  });
  const [substanceFormData, setSubstanceFormData] = useState({
    category: "", substance: "", ester: "", dosage_unit: "mg",
    dosage_mg_per_week: "", dosage_mg_per_application: "",
    application_frequency: "2x_semana", application_days: [],
    application_route: "", application_site: "", notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== "admin" && u.role !== "personal") {
        base44.entities.Student.list().then(all => {
          setStudent(all.find(s => s.email?.toLowerCase() === u.email?.toLowerCase()) || null);
        });
      }
    });
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    enabled: user?.role === "admin"
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ["cycles"],
    queryFn: () => base44.entities.Cycle.list("-created_date", 100),
    enabled: !!user
  });

  const { data: substances = [] } = useQuery({
    queryKey: ["substances"],
    queryFn: () => base44.entities.CycleSubstance.list("-created_date", 200),
    enabled: !!user
  });

  const createCycleMut = useMutation({
    mutationFn: (d) => base44.entities.Cycle.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cycles"] }); toast.success("Ciclo criado"); setCycleDialogOpen(false); setEditingCycle(null); }
  });
  const updateCycleMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cycle.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cycles"] }); toast.success("Ciclo atualizado"); setCycleDialogOpen(false); setEditingCycle(null); }
  });
  const deleteCycleMut = useMutation({
    mutationFn: (id) => base44.entities.Cycle.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cycles"] }); qc.invalidateQueries({ queryKey: ["substances"] }); toast.success("Ciclo excluído"); setDeleteConfirm(null); if (detailCycle?.id === deleteConfirm?.id) setDetailCycle(null); }
  });
  const createSubstanceMut = useMutation({
    mutationFn: (d) => base44.entities.CycleSubstance.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["substances"] }); toast.success("Substância adicionada"); setSubstanceDialogOpen(false); setEditingSubstance(null); }
  });
  const updateSubstanceMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CycleSubstance.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["substances"] }); toast.success("Substância atualizada"); setSubstanceDialogOpen(false); setEditingSubstance(null); }
  });
  const deleteSubstanceMut = useMutation({
    mutationFn: (id) => base44.entities.CycleSubstance.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["substances"] }); toast.success("Substância removida"); }
  });

  const openCycleDialog = (cycle = null) => {
    if (cycle) {
      setEditingCycle(cycle);
      setCycleFormData({ student_id: cycle.student_id || "", name: cycle.name || "", cycle_start_date: cycle.cycle_start_date || "", cycle_duration_weeks: cycle.cycle_duration_weeks || "", notes: cycle.notes || "" });
    } else {
      setEditingCycle(null);
      setCycleFormData({ student_id: "", name: "", cycle_start_date: new Date().toISOString().split('T')[0], cycle_duration_weeks: "", notes: "" });
    }
    setCycleDialogOpen(true);
  };

  const openSubstanceDialog = (cycleId, substance = null) => {
    setSelectedCycleId(cycleId);
    if (substance) {
      setEditingSubstance(substance);
      setSubstanceFormData({ category: substance.category || "", substance: substance.substance || "", ester: substance.ester || "", dosage_unit: substance.dosage_unit || "mg", dosage_mg_per_week: substance.dosage_mg_per_week || "", dosage_mg_per_application: substance.dosage_mg_per_application || "", application_frequency: substance.application_frequency || "2x_semana", application_days: substance.application_days || [], application_route: substance.application_route || "", application_site: substance.application_site || "", notes: substance.notes || "" });
    } else {
      setEditingSubstance(null);
      setSubstanceFormData({ category: "", substance: "", ester: "", dosage_unit: "mg", dosage_mg_per_week: "", dosage_mg_per_application: "", application_frequency: "2x_semana", application_days: [], application_route: "", application_site: "", notes: "" });
    }
    setSubstanceDialogOpen(true);
  };

  const handleSubmitCycle = () => {
    if (!cycleFormData.student_id || !cycleFormData.name) { toast.error("Preencha os campos obrigatórios"); return; }
    const data = { ...cycleFormData, cycle_duration_weeks: cycleFormData.cycle_duration_weeks ? parseInt(cycleFormData.cycle_duration_weeks) : null };
    editingCycle ? updateCycleMut.mutate({ id: editingCycle.id, data }) : createCycleMut.mutate(data);
  };

  const handleSubmitSubstance = () => {
    if (!substanceFormData.substance) { toast.error("Digite o nome da substância"); return; }
    const data = { ...substanceFormData, cycle_id: selectedCycleId, dosage_mg_per_week: parseFloat(substanceFormData.dosage_mg_per_week) || 0, dosage_mg_per_application: parseFloat(substanceFormData.dosage_mg_per_application) || 0 };
    editingSubstance ? updateSubstanceMut.mutate({ id: editingSubstance.id, data }) : createSubstanceMut.mutate(data);
  };

  const toggleDay = (day) => setSubstanceFormData(prev => ({ ...prev, application_days: (prev.application_days || []).includes(day) ? prev.application_days.filter(d => d !== day) : [...(prev.application_days || []), day].sort((a, b) => a - b) }));

  const filteredCycles = cycles.filter(c => {
    if (!c.active) return false;
    if (user?.role === "admin" || user?.role === "personal") return true;
    if (user?.role === "user" && student) return c.student_id === student.id || c.student_id === student.email;
    if (user?.role === "user" && !student) return true; // RLS já filtra pelo servidor
    return false;
  });

  const getStudentName = (id) => students.find(s => s.id === id || s.email === id)?.name || student?.name || "Aluno";

  const isAdmin = user?.role === "admin";

  // ── DETAIL VIEW ─────────────────────────────────────────────
  if (detailCycle) {
    const cycleSubstances = substances.filter(s => s.cycle_id === detailCycle.id);
    const totalWeeklyDose = cycleSubstances.reduce((s, sub) => s + (Number(sub.dosage_mg_per_week) || 0), 0);
    const startDate = detailCycle.cycle_start_date ? new Date(detailCycle.cycle_start_date + "T12:00:00") : null;
    const endDate = startDate && detailCycle.cycle_duration_weeks ? new Date(startDate.getTime() + detailCycle.cycle_duration_weeks * 7 * 86400000) : null;

    return (
      <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
        {/* Back + header */}
        <motion.div variants={fadeUp} className="flex items-center gap-4">
          <button onClick={() => setDetailCycle(null)} className="flex items-center gap-2 text-purple-400/60 hover:text-purple-300 transition-colors text-sm font-mono-cyber">
            <ArrowLeft className="w-4 h-4" /> VOLTAR
          </button>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.3), transparent)' }} />
        </motion.div>

        {/* Cycle hero card */}
        <motion.div variants={fadeUp} className="cyber-card rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(10,4,30,0.98), rgba(4,2,14,0.99))' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #a855f7, #22d3ee, #ec4899)' }} />
          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.7))' }} />
                  <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.3em] uppercase">Ciclo Hormonal</p>
                </div>
                <h1 className="font-cyber text-2xl text-white tracking-wider" style={{ textShadow: '0 0 20px rgba(168,85,247,0.4)' }}>{detailCycle.name}</h1>
                {isAdmin && <p className="text-purple-400/50 text-xs mt-1 font-mono-cyber">{getStudentName(detailCycle.student_id)}</p>}
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => openSubstanceDialog(detailCycle.id)} className="btn-neon-cyan px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> SUBSTÂNCIA
                  </button>
                  <button onClick={() => openCycleDialog(detailCycle)} className="p-2 rounded-xl border border-purple-900/30 text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10 transition-all">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { icon: Calendar, label: "INÍCIO", val: startDate ? startDate.toLocaleDateString("pt-BR") : "—", color: "text-purple-300" },
                { icon: Clock, label: "DURAÇÃO", val: detailCycle.cycle_duration_weeks ? `${detailCycle.cycle_duration_weeks} sem` : "—", color: "text-cyan-300" },
                { icon: Syringe, label: "SUBSTÂNCIAS", val: cycleSubstances.length, color: "text-pink-300" },
                { icon: TrendingUp, label: "DOSE/SEM", val: totalWeeklyDose > 0 ? `${totalWeeklyDose}mg` : "—", color: "text-amber-300" },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl border border-purple-900/20 bg-black/30 p-3 text-center">
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <p className={`font-cyber text-sm ${stat.color}`}>{stat.val}</p>
                  <p className="text-[9px] font-mono-cyber text-purple-500/30 tracking-widest mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {endDate && (
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, Math.max(0, ((Date.now() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100))}%`,
                    background: 'linear-gradient(90deg, #a855f7, #22d3ee)'
                  }} />
                </div>
                <span className="text-[9px] font-mono-cyber text-purple-500/40">
                  {endDate.toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}

            {detailCycle.notes && (
              <p className="text-xs text-purple-300/50 font-mono-cyber mt-3 italic border-t border-purple-900/20 pt-3">// {detailCycle.notes}</p>
            )}
          </div>
        </motion.div>

        {/* Substances grid */}
        {cycleSubstances.length === 0 ? (
          <motion.div variants={fadeUp} className="cyber-card rounded-2xl p-12 text-center border border-purple-900/20">
            <Syringe className="w-10 h-10 mx-auto mb-4 text-purple-500/20" />
            <p className="text-purple-400/40 text-sm font-mono-cyber">// nenhuma substância adicionada</p>
            {isAdmin && (
              <button onClick={() => openSubstanceDialog(detailCycle.id)} className="btn-neon-purple px-5 py-2.5 rounded-xl text-sm mt-4 flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> ADICIONAR SUBSTÂNCIA
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div variants={stagger}>
            <motion.p variants={fadeUp} className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.3em] uppercase mb-3">Substâncias do Ciclo</motion.p>
            <div className="grid md:grid-cols-2 gap-3">
              {cycleSubstances.map((sub, idx) => {
                const color = SUBSTANCE_ACCENT_COLORS[idx % SUBSTANCE_ACCENT_COLORS.length];
                const catC = CATEGORY_COLORS[sub.category] || CATEGORY_COLORS.outro;
                return (
                  <motion.div key={sub.id} variants={fadeUp}
                    className="cyber-card rounded-xl overflow-hidden border border-purple-900/20 hover:border-purple-500/30 transition-all">
                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}18`, border: `1px solid ${color}35`, boxShadow: `0 0 12px ${color}20` }}>
                            <Syringe className="w-5 h-5" style={{ color, filter: `drop-shadow(0 0 5px ${color})` }} />
                          </div>
                          <div>
                            <p className="text-white font-semibold leading-tight">{sub.substance}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sub.category && (
                                <span className={`text-[9px] font-mono-cyber px-1.5 py-0.5 rounded border ${catC.border} ${catC.bg} ${catC.text}`}>
                                  {CATEGORY_LABELS[sub.category] || sub.category}
                                </span>
                              )}
                              {sub.ester && (
                                <span className="text-[9px] font-mono-cyber px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300">
                                  {ESTER_LABELS[sub.ester] || sub.ester}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => openSubstanceDialog(detailCycle.id, sub)}
                              className="p-1.5 rounded-lg text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10 transition-all">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteSubstanceMut.mutate(sub.id)}
                              className="p-1.5 rounded-lg text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[
                          { label: "SEMANAL", val: `${sub.dosage_mg_per_week}${sub.dosage_unit || "mg"}` },
                          { label: "APLIC.", val: `${sub.dosage_mg_per_application}${sub.dosage_unit || "mg"}` },
                          { label: "FREQ.", val: FREQ_LABELS[sub.application_frequency] || "—" },
                        ].map(m => (
                          <div key={m.label} className="rounded-lg bg-black/30 border border-purple-900/15 p-2 text-center">
                            <p className="text-white text-xs font-bold">{m.val}</p>
                            <p className="text-[8px] font-mono-cyber text-purple-500/35 tracking-widest mt-0.5">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      {(sub.application_site || sub.application_route) && (
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-purple-400/40 font-mono-cyber">
                          {sub.application_route && <span>{sub.application_route}</span>}
                          {sub.application_site && <span>• {sub.application_site}</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Weekly calendar */}
        {cycleSubstances.length > 0 && (
          <motion.div variants={fadeUp}>
            <WeeklyApplicationCalendar substances={cycleSubstances} />
          </motion.div>
        )}

        {/* Concentration chart */}
        {cycleSubstances.some(s => s.ester) && (
          <motion.div variants={fadeUp}>
            <CycleConcentrationChart
              substances={cycleSubstances.filter(s => s.ester)}
              cycleDurationWeeks={detailCycle.cycle_duration_weeks || 12}
            />
          </motion.div>
        )}

        {/* Disclaimer */}
        <motion.div variants={fadeUp} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400/60 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-400/50 font-mono-cyber leading-relaxed">
            Os dados farmacocinéticos são estimativas baseadas em modelos matemáticos e literatura publicada. Valores reais variam conforme metabolismo individual, composição corporal e via de administração. Não substituem acompanhamento médico ou exames laboratoriais.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────
  const cyclesByStudent = filteredCycles.reduce((acc, cycle) => {
    const key = cycle.student_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cycle);
    return acc;
  }, {});

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      {/* Custom Cyber Header */}
      <div className="mb-8 relative">
        {/* Top decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(132,204,22,0.8), transparent)' }} />
        
        {/* Main header content */}
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, #84cc16, #a855f7)', borderRadius: '2px', boxShadow: '0 0 12px rgba(132,204,22,0.6)' }} />
              <h1 className="text-3xl font-black font-cyber tracking-wider" style={{ color: '#ffffff', textShadow: '0 0 20px rgba(132,204,22,0.5), 0 0 40px rgba(168,85,247,0.3)' }}>
                CICLOS HORMONAIS
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ paddingLeft: '14px' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#84cc16', boxShadow: '0 0 8px #84cc16, 0 0 16px rgba(132,204,22,0.6)' }} />
              <p className="text-sm font-mono-cyber tracking-wide" style={{ color: 'rgba(132,204,22,0.8)', textShadow: '0 0 10px rgba(132,204,22,0.5)' }}>
                Planejamento e acompanhamento de ciclos
              </p>
            </div>
          </div>

          {isAdmin && (
            <button onClick={() => openCycleDialog()} className="btn-neon-purple relative px-5 py-3 rounded-xl font-medium tracking-wider flex items-center gap-2 overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.25))' }} />
              <Plus className="w-5 h-5 relative z-10" style={{ color: '#a855f7', filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' }} />
              <span className="text-sm font-bold relative z-10" style={{ color: '#ffffff', textShadow: '0 0 8px rgba(168,85,247,0.5)' }}>NOVO CICLO</span>
            </button>
          )}
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(132,204,22,0.6), rgba(168,85,247,0.8), rgba(132,204,22,0.6), transparent)' }} />
      </div>

      {filteredCycles.length === 0 ? (
        <motion.div variants={fadeUp} className="cyber-card rounded-2xl p-16 text-center border border-purple-900/20">
          <div className="w-20 h-20 rounded-full bg-purple-500/5 border border-purple-500/10 flex items-center justify-center mx-auto mb-5">
            <FlaskConical className="w-10 h-10 text-purple-500/25" />
          </div>
          <p className="font-cyber text-sm text-purple-500/30 tracking-widest">// NENHUM CICLO ENCONTRADO</p>
          {isAdmin && (
            <button onClick={() => openCycleDialog()} className="btn-neon-purple px-6 py-2.5 rounded-xl text-sm mt-6 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> CRIAR PRIMEIRO CICLO
            </button>
          )}
        </motion.div>
      ) : (
        Object.entries(cyclesByStudent).map(([studentId, studentCycles]) => (
          <motion.div key={studentId} variants={fadeUp} className="space-y-3">
            {isAdmin && (
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/25 flex items-center justify-center">
                  <span className="text-white font-cyber text-xs">{getStudentName(studentId).substring(0,2).toUpperCase()}</span>
                </div>
                <h3 className="font-cyber text-base text-white tracking-wider">{getStudentName(studentId)}</h3>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.2), transparent)' }} />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              {studentCycles.map((cycle, cIdx) => {
                const cycleSubstances = substances.filter(s => s.cycle_id === cycle.id);
                const totalDose = cycleSubstances.reduce((s, sub) => s + (Number(sub.dosage_mg_per_week) || 0), 0);
                const accent = SUBSTANCE_ACCENT_COLORS[cIdx % SUBSTANCE_ACCENT_COLORS.length];

                return (
                  <motion.div key={cycle.id} whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}
                    className="cyber-card rounded-xl overflow-hidden cursor-pointer border border-purple-900/20 hover:border-purple-500/30 transition-all"
                    onClick={() => setDetailCycle(cycle)}>
                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, rgba(6,182,212,0.5), transparent)` }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-white font-semibold hover:text-purple-300 transition-colors">{cycle.name}</h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {cycle.cycle_start_date && (
                              <span className="text-[10px] text-purple-400/40 font-mono-cyber flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(cycle.cycle_start_date + "T12:00:00").toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            {cycle.cycle_duration_weeks && (
                              <span className="text-[10px] text-cyan-400/40 font-mono-cyber flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {cycle.cycle_duration_weeks} sem
                              </span>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openSubstanceDialog(cycle.id)}
                              className="p-1.5 rounded-lg text-cyan-400/40 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openCycleDialog(cycle)}
                              className="p-1.5 rounded-lg text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10 transition-all">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirm(cycle)}
                              className="p-1.5 rounded-lg text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Substance pills */}
                      {cycleSubstances.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {cycleSubstances.map((sub, si) => (
                            <span key={sub.id} className="text-[9px] font-mono-cyber px-2 py-1 rounded-full border"
                              style={{ borderColor: `${SUBSTANCE_ACCENT_COLORS[si % SUBSTANCE_ACCENT_COLORS.length]}40`, color: SUBSTANCE_ACCENT_COLORS[si % SUBSTANCE_ACCENT_COLORS.length], background: `${SUBSTANCE_ACCENT_COLORS[si % SUBSTANCE_ACCENT_COLORS.length]}10` }}>
                              {sub.substance.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-900/15">
                        <span className="text-[9px] font-mono-cyber text-purple-500/30">
                          {cycleSubstances.length} substância{cycleSubstances.length !== 1 ? "s" : ""}
                          {totalDose > 0 && ` • ${totalDose}mg/sem`}
                        </span>
                        <span className="text-[9px] font-mono-cyber text-purple-400/40 flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> ver gráfico →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="border border-pink-900/40 text-white max-w-sm" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-pink-400">EXCLUIR CICLO</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-purple-300/70 py-2">Excluir <span className="text-white font-semibold">"{deleteConfirm?.name}"</span>? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-purple-900/40 text-purple-400/60">Cancelar</Button>
            <button onClick={() => deleteCycleMut.mutate(deleteConfirm.id)} className="btn-neon-pink px-4 py-2 rounded-lg text-sm">EXCLUIR</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cycle dialog */}
      <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">{editingCycle ? "EDITAR CICLO" : "NOVO CICLO"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">ALUNO *</Label>
              <Select value={cycleFormData.student_id} onValueChange={(v) => setCycleFormData({ ...cycleFormData, student_id: v })}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  {students.filter(s => s.active).map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">NOME DO CICLO *</Label>
              <Input value={cycleFormData.name} onChange={e => setCycleFormData({ ...cycleFormData, name: e.target.value })} className="cyber-input mt-1" placeholder="Ex: Cruise · Test E" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">INÍCIO</Label>
                <Input type="date" value={cycleFormData.cycle_start_date} onChange={e => setCycleFormData({ ...cycleFormData, cycle_start_date: e.target.value })} className="cyber-input mt-1" />
              </div>
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">DURAÇÃO (SEMANAS)</Label>
                <Input type="number" value={cycleFormData.cycle_duration_weeks} onChange={e => setCycleFormData({ ...cycleFormData, cycle_duration_weeks: e.target.value })} className="cyber-input mt-1" placeholder="12" />
              </div>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
              <Textarea value={cycleFormData.notes} onChange={e => setCycleFormData({ ...cycleFormData, notes: e.target.value })} className="cyber-input mt-1" rows={2} />
            </div>
            <button onClick={handleSubmitCycle} disabled={createCycleMut.isPending || updateCycleMut.isPending} className="w-full btn-neon-purple py-2.5 rounded-xl text-sm font-medium">
              {editingCycle ? "ATUALIZAR CICLO" : "CRIAR CICLO"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Substance dialog */}
      <Dialog open={substanceDialogOpen} onOpenChange={setSubstanceDialogOpen}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md max-h-[90vh] overflow-y-auto" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">{editingSubstance ? "EDITAR SUBSTÂNCIA" : "NOVA SUBSTÂNCIA"}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <SubstanceFormFields form={substanceFormData} onChange={(f, v) => setSubstanceFormData(prev => ({ ...prev, [f]: v }))} onToggleDay={toggleDay} />
            <button onClick={handleSubmitSubstance} disabled={createSubstanceMut.isPending || updateSubstanceMut.isPending} className="w-full btn-neon-purple py-2.5 rounded-xl text-sm font-medium mt-4">
              {editingSubstance ? "ATUALIZAR SUBSTÂNCIA" : "ADICIONAR SUBSTÂNCIA"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}