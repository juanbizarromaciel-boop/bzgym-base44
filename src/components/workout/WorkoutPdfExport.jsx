import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileDown, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";

const TECHNIQUE_LABELS = {
  normal: "", cluster: "Cluster", rest_pause: "Rest Pause", drop_set: "Drop Set",
  super_set: "Super Set", giant_set: "Giant Set", piramidal: "Piramidal",
  fst7: "FST-7", myo_reps: "Myo Reps", tempo_controlado: "Tempo Controlado",
};

const DAY_LABELS = {
  segunda: "Segunda", terca: "Terça", quarta: "Quarta",
  quinta: "Quinta", sexta: "Sexta", sabado: "Sábado", domingo: "Domingo",
};

function calcExerciseStats(exerciseName, logs) {
  const exerciseLogs = logs.filter(l => l.exercise_name === exerciseName && l.sets_completed?.length > 0);
  if (!exerciseLogs.length) return null;

  // Average reps and load across all sets in all sessions
  const allSets = exerciseLogs.flatMap(l => l.sets_completed || []);
  const avgReps = allSets.length > 0
    ? Math.round(allSets.reduce((a, s) => a + (s.reps_done || 0), 0) / allSets.length)
    : 0;
  const avgLoad = allSets.length > 0
    ? (allSets.reduce((a, s) => a + (s.load_kg || 0), 0) / allSets.length).toFixed(1)
    : 0;
  const maxLoad = Math.max(...exerciseLogs.map(l => l.max_load_kg || 0));
  const totalSessions = exerciseLogs.length;

  return { avgReps, avgLoad: parseFloat(avgLoad), maxLoad, totalSessions };
}

export default function WorkoutPdfExport({ studentId, studentName, planId, compact }) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(planId || "all");
  const [generating, setGenerating] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => base44.entities.WorkoutPlan.list(),
    enabled: open,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.WorkoutLog.list(),
    enabled: open,
  });

  const studentPlans = plans.filter(p => p.student_id === studentId);
  const studentLogs = logs.filter(l => l.student_id === studentId);

  const plansToExport = selectedPlanId === "all"
    ? studentPlans
    : studentPlans.filter(p => p.id === selectedPlanId);

  const generatePDF = () => {
    setGenerating(true);
    setTimeout(() => {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const margin = 18;
      const contentW = W - margin * 2;
      let y = 0;

      const addPage = () => {
        doc.addPage();
        y = 20;
      };

      const checkPageBreak = (needed = 10) => {
        if (y + needed > 272) addPage();
      };

      // ── COVER ──────────────────────────────────────────────────
      doc.setFillColor(4, 4, 14);
      doc.rect(0, 0, W, 297, "F");

      // Purple gradient bar top
      doc.setFillColor(168, 85, 247);
      doc.rect(0, 0, W, 1.5, "F");

      // BZ logo area
      doc.setFont("helvetica", "bold");
      doc.setFontSize(48);
      doc.setTextColor(168, 85, 247);
      doc.text("BZ", margin, 38);

      doc.setFontSize(9);
      doc.setTextColor(100, 60, 140);
      doc.text("GYM SYSTEM", margin, 44);

      // Divider line
      doc.setDrawColor(168, 85, 247);
      doc.setLineWidth(0.3);
      doc.line(margin, 52, W - margin, 52);

      // Student name
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(studentName?.toUpperCase() || "ALUNO", margin, 68);

      doc.setFontSize(10);
      doc.setTextColor(168, 85, 247);
      doc.setFont("helvetica", "normal");
      doc.text("PLANO DE TREINO", margin, 76);

      doc.setFontSize(8);
      doc.setTextColor(80, 50, 110);
      doc.text(new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase(), margin, 82);

      // Stats summary
      const totalExercises = plansToExport.reduce((a, p) => a + (p.exercises?.length || 0), 0);
      const totalSeries = plansToExport.reduce((a, p) => a + (p.exercises?.reduce((b, e) => b + (e.sets || 0), 0) || 0), 0);

      const stats = [
        { label: "TREINOS", value: plansToExport.length },
        { label: "EXERCÍCIOS", value: totalExercises },
        { label: "SÉRIES TOTAIS", value: totalSeries },
      ];

      let sx = margin;
      stats.forEach(({ label, value }) => {
        doc.setFillColor(20, 10, 35);
        doc.roundedRect(sx, 95, 52, 24, 3, 3, "F");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(String(value), sx + 8, 106);
        doc.setFontSize(7);
        doc.setTextColor(100, 60, 140);
        doc.setFont("helvetica", "normal");
        doc.text(label, sx + 8, 113);
        sx += 58;
      });

      // Bottom bar cover
      doc.setFillColor(168, 85, 247);
      doc.rect(0, 295.5, W, 1.5, "F");

      // ── WORKOUT PAGES ──────────────────────────────────────────
      plansToExport.forEach((plan, planIdx) => {
        doc.addPage();
        // Page background
        doc.setFillColor(4, 4, 14);
        doc.rect(0, 0, W, 297, "F");
        doc.setFillColor(168, 85, 247);
        doc.rect(0, 0, W, 1.5, "F");

        y = 20;

        // Plan header
        doc.setFillColor(20, 10, 35);
        doc.roundedRect(margin, y, contentW, 18, 3, 3, "F");

        // Purple left accent
        doc.setFillColor(168, 85, 247);
        doc.roundedRect(margin, y, 3, 18, 1.5, 1.5, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text(plan.name.toUpperCase(), margin + 8, y + 7);

        if (plan.day_of_week) {
          doc.setFontSize(8);
          doc.setTextColor(168, 85, 247);
          doc.text(DAY_LABELS[plan.day_of_week]?.toUpperCase() || plan.day_of_week.toUpperCase(), margin + 8, y + 13);
        }

        // Stats on right
        const exCount = plan.exercises?.length || 0;
        const seriesCount = plan.exercises?.reduce((a, e) => a + (e.sets || 0), 0) || 0;
        doc.setFontSize(8);
        doc.setTextColor(100, 60, 140);
        doc.text(`${exCount} exercícios  ·  ${seriesCount} séries`, W - margin - 2, y + 7, { align: "right" });

        y += 24;

        // Column headers
        doc.setFontSize(7);
        doc.setTextColor(80, 50, 110);
        doc.setFont("helvetica", "normal");
        doc.text("EXERCÍCIO", margin + 2, y);
        doc.text("SÉRIES", margin + 88, y, { align: "center" });
        doc.text("REPS MÉDIAS", margin + 112, y, { align: "center" });
        doc.text("CARGA MÉDIA", margin + 140, y, { align: "center" });
        doc.text("CARGA MÁX", margin + 168, y, { align: "center" });

        y += 2;
        doc.setDrawColor(40, 20, 60);
        doc.setLineWidth(0.3);
        doc.line(margin, y, W - margin, y);
        y += 5;

        // Exercises
        (plan.exercises || []).forEach((ex, idx) => {
          checkPageBreak(14);

          const stats = calcExerciseStats(ex.exercise_name, studentLogs);
          const rowBg = idx % 2 === 0;

          if (rowBg) {
            doc.setFillColor(12, 6, 22);
            doc.rect(margin, y - 4, contentW, 12, "F");
          }

          // Index badge
          doc.setFillColor(168, 85, 247);
          doc.setFont("helvetica", "bold");
          doc.circle(margin + 4, y + 2, 3, "F");
          doc.setFontSize(6);
          doc.setTextColor(255, 255, 255);
          doc.text(String(idx + 1), margin + 4, y + 2.5, { align: "center" });

          // Exercise name
          doc.setFontSize(9);
          doc.setTextColor(230, 220, 255);
          doc.setFont("helvetica", "bold");
          const exName = ex.exercise_name?.length > 28
            ? ex.exercise_name.substring(0, 26) + "..."
            : ex.exercise_name;
          doc.text(exName, margin + 9, y + 2);

          // Technique badge
          if (ex.technique && ex.technique !== "normal") {
            doc.setFontSize(6);
            doc.setTextColor(236, 72, 153);
            doc.text(TECHNIQUE_LABELS[ex.technique] || ex.technique, margin + 9, y + 7);
          }

          // Sets (from plan)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(168, 85, 247);
          doc.text(String(ex.sets || "—"), margin + 88, y + 3, { align: "center" });

          // Avg reps (from logs or plan target)
          const repsDisplay = stats?.avgReps ? `${stats.avgReps}` : (ex.reps || "—");
          doc.setTextColor(6, 182, 212);
          doc.text(String(repsDisplay), margin + 112, y + 3, { align: "center" });

          // Avg load
          const avgLoadDisplay = stats?.avgLoad ? `${stats.avgLoad} kg` : "—";
          doc.setTextColor(255, 255, 255);
          doc.text(avgLoadDisplay, margin + 140, y + 3, { align: "center" });

          // Max load
          const maxLoadDisplay = stats?.maxLoad ? `${stats.maxLoad} kg` : "—";
          doc.setTextColor(234, 179, 8);
          doc.text(maxLoadDisplay, margin + 168, y + 3, { align: "center" });

          y += 12;
        });

        // Footer
        doc.setFillColor(168, 85, 247);
        doc.rect(0, 295.5, W, 1.5, "F");
        doc.setFontSize(7);
        doc.setTextColor(60, 30, 90);
        doc.setFont("helvetica", "normal");
        doc.text(`BZ GYM SYSTEM  ·  ${studentName}  ·  ${plan.name}`, W / 2, 291, { align: "center" });
      });

      doc.save(`treino_${studentName?.replace(/\s+/g, "_").toLowerCase() || "aluno"}.pdf`);
      setGenerating(false);
      setOpen(false);
    }, 100);
  };

  return (
    <>
      {compact ? (
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          className="text-purple-400/40 hover:text-purple-300 transition-colors"
          title="Exportar PDF"
        >
          <FileDown className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium tracking-wider flex items-center gap-2"
          title="Exportar treino para PDF"
        >
          <FileDown className="w-4 h-4" />
          EXPORTAR PDF
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border border-purple-900/40 text-white max-w-sm" style={{ background: '#04040e' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cyber tracking-widest text-purple-300 text-sm">EXPORTAR TREINO</h2>
            <button onClick={() => setOpen(false)} className="text-purple-500/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-purple-400/50 font-mono-cyber mb-2 tracking-wider">ALUNO</p>
              <div className="px-3 py-2 rounded-lg border border-purple-900/30 bg-purple-500/5">
                <p className="text-sm text-white font-medium">{studentName}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-purple-400/50 font-mono-cyber mb-2 tracking-wider">TREINO</p>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="cyber-input">
                  <SelectValue placeholder="Selecione o treino" />
                </SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  <SelectItem value="all" className="text-white">Todos os treinos</SelectItem>
                  {studentPlans.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-purple-900/20 bg-purple-500/5 p-3">
              <p className="text-xs text-purple-400/50 font-mono-cyber leading-relaxed">
                // O PDF mostrará séries, repetições médias e cargas usadas com base nos treinos realizados.
              </p>
            </div>

            <button
              onClick={generatePDF}
              disabled={generating || studentPlans.length === 0}
              className="w-full btn-neon-purple py-3 rounded-lg text-sm font-medium tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> GERANDO...</>
              ) : (
                <><FileDown className="w-4 h-4" /> GERAR PDF</>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}