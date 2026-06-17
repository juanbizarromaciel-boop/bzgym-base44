import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart3, TrendingUp, Loader2, Download, RefreshCw,
  CheckCircle2, Target, Utensils, Dumbbell, Activity
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export default function Relatorios() {
  const [user, setUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [periodo, setPeriodo] = useState("semanal");
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== "admin" && u.role !== "personal") navigate("/AccessDenied");
    }).catch(() => {});
  }, [navigate]);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    enabled: !!user,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkInsAll"],
    queryFn: () => base44.entities.CheckIn.list("-date", 100),
    enabled: !!selectedStudent,
  });
  const { data: workoutLogs = [] } = useQuery({
    queryKey: ["workoutLogsAll"],
    queryFn: () => base44.entities.WorkoutLog.list("-date", 200),
    enabled: !!selectedStudent,
  });
  const { data: medidas = [] } = useQuery({
    queryKey: ["medidasAll"],
    queryFn: () => base44.entities.MedidasCorporais.list("-date", 50),
    enabled: !!selectedStudent,
  });
  const { data: bioimpedancias = [] } = useQuery({
    queryKey: ["bioimpAll"],
    queryFn: () => base44.entities.Bioimpedancia.list("-date", 50),
    enabled: !!selectedStudent,
  });

  const myStudents = user?.role === "admin" ? students : students.filter(s => s.personal_id === user?.email);
  const student = myStudents.find(s => s.id === selectedStudent);

  const getDaysBack = () => ({ semanal: 7, quinzenal: 15, mensal: 30 })[periodo] || 7;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - getDaysBack());
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const studentCheckIns = checkIns.filter(c => c.student_id === selectedStudent && c.date >= cutoffStr);
  const studentLogs = workoutLogs.filter(l => l.student_id === selectedStudent && l.date >= cutoffStr);
  const latestMedidas = medidas.filter(m => m.student_id === selectedStudent).sort((a, b) => b.date?.localeCompare(a.date));
  const latestBio = bioimpedancias.filter(b => b.student_id === selectedStudent).sort((a, b) => b.date?.localeCompare(a.date));

  const avgSleep = studentCheckIns.length ? (studentCheckIns.reduce((s, c) => s + (c.sleep_score || 0), 0) / studentCheckIns.length).toFixed(1) : "—";
  const avgEnergy = studentCheckIns.length ? (studentCheckIns.reduce((s, c) => s + (c.energy_score || 0), 0) / studentCheckIns.length).toFixed(1) : "—";
  const avgDietAdh = studentCheckIns.length ? (studentCheckIns.reduce((s, c) => s + (c.diet_adherence || 0), 0) / studentCheckIns.length).toFixed(1) : "—";
  const avgWorkoutAdh = studentCheckIns.length ? (studentCheckIns.reduce((s, c) => s + (c.workout_adherence || 0), 0) / studentCheckIns.length).toFixed(1) : "—";
  const avgWeight = studentCheckIns.length ? (studentCheckIns.filter(c => c.weight_kg).reduce((s, c) => s + c.weight_kg, 0) / studentCheckIns.filter(c => c.weight_kg).length).toFixed(1) : "—";

  const generateAIReport = async () => {
    if (!selectedStudent || !student) { toast.error("Selecione um aluno"); return; }
    setGenerating(true);
    setReport(null);
    try {
      const prompt = `Gere um relatório ${periodo} de evolução para o aluno "${student.name}" com objetivo "${student.goal || "não informado"}".

Dados do período (${getDaysBack()} dias):
- Check-ins registrados: ${studentCheckIns.length}
- Média de sono: ${avgSleep}/5
- Média de energia: ${avgEnergy}/5
- Adesão à dieta: ${avgDietAdh}/5
- Adesão ao treino: ${avgWorkoutAdh}/5
- Média de peso: ${avgWeight} kg
- Sessões de treino registradas: ${studentLogs.length}
${latestBio[0] ? `- Última bioimpedância: ${latestBio[0].body_fat_percent}% gordura, ${latestBio[0].lean_mass_kg}kg massa magra` : ""}
${latestMedidas[0] ? `- Última medida cintura: ${latestMedidas[0].waist_cm}cm` : ""}

Gere um relatório em português com:
1. Resumo geral do período
2. Pontos positivos
3. Pontos de atenção
4. Adesão ao treino e dieta
5. Evolução corporal (se houver dados)
6. Recomendações para o próximo período

Use linguagem profissional e motivadora. Seja específico com os dados fornecidos. Não faça prescrições médicas.`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "gemini_3_flash" });
      setReport(result);
    } catch (e) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "personal")) return null;

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-4xl space-y-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="relative">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent)' }} />
        <div className="py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-8 rounded" style={{ background: 'linear-gradient(to bottom, #06b6d4, #a855f7)', boxShadow: '0 0 12px rgba(6,182,212,0.6)' }} />
            <h1 className="font-cyber text-3xl font-black tracking-wider text-white" style={{ textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>RELATÓRIOS</h1>
          </div>
          <p className="text-xs font-mono-cyber text-cyan-400/50 pl-4">// análise e evolução dos alunos</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), rgba(168,85,247,0.4), transparent)' }} />
      </motion.div>

      {/* Selectors */}
      <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-mono-cyber text-cyan-400/60 mb-1 tracking-wider">ALUNO</p>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="cyber-input w-full"><SelectValue placeholder="Selecionar aluno" /></SelectTrigger>
            <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
              {myStudents.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs font-mono-cyber text-cyan-400/60 mb-1 tracking-wider">PERÍODO</p>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="cyber-input w-full"><SelectValue /></SelectTrigger>
            <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
              <SelectItem value="semanal" className="text-white">Últimos 7 dias</SelectItem>
              <SelectItem value="quinzenal" className="text-white">Últimos 15 dias</SelectItem>
              <SelectItem value="mensal" className="text-white">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats cards */}
      {selectedStudent && (
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Check-ins", value: studentCheckIns.length, icon: CheckCircle2, color: "#10b981" },
              { label: "Sessões Treino", value: studentLogs.length, icon: Dumbbell, color: "#a855f7" },
              { label: "Sono Médio", value: `${avgSleep}/5`, icon: Activity, color: "#06b6d4" },
              { label: "Ades. Dieta", value: `${avgDietAdh}/5`, icon: Utensils, color: "#f59e0b" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border p-4 text-center"
                style={{ borderColor: `${s.color}25`, background: `${s.color}08` }}>
                <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                <p className="font-cyber text-2xl text-white" style={{ textShadow: `0 0 12px ${s.color}` }}>{s.value}</p>
                <p className="text-[10px] font-mono-cyber mt-1" style={{ color: `${s.color}80` }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Latest body metrics */}
          {(latestBio[0] || latestMedidas[0]) && (
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {latestBio[0] && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/05 p-4">
                  <p className="text-xs font-mono-cyber text-cyan-400/60 mb-2">ÚLTIMA BIOIMPEDÂNCIA · {latestBio[0].date}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Peso", val: `${latestBio[0].weight_kg}kg` },
                      { label: "% Gordura", val: `${latestBio[0].body_fat_percent}%` },
                      { label: "Massa Magra", val: `${latestBio[0].lean_mass_kg}kg` },
                      { label: "Água", val: `${latestBio[0].body_water_percent}%` },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <p className="text-sm font-bold text-white">{m.val || "—"}</p>
                        <p className="text-[9px] font-mono-cyber text-cyan-400/40">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {latestMedidas[0] && (
                <div className="rounded-xl border border-pink-500/20 bg-pink-500/05 p-4">
                  <p className="text-xs font-mono-cyber text-pink-400/60 mb-2">ÚLTIMAS MEDIDAS · {latestMedidas[0].date}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Cintura", val: latestMedidas[0].waist_cm ? `${latestMedidas[0].waist_cm}cm` : "—" },
                      { label: "Quadril", val: latestMedidas[0].hip_cm ? `${latestMedidas[0].hip_cm}cm` : "—" },
                      { label: "Braço D", val: latestMedidas[0].right_arm_cm ? `${latestMedidas[0].right_arm_cm}cm` : "—" },
                      { label: "Coxa D", val: latestMedidas[0].right_thigh_cm ? `${latestMedidas[0].right_thigh_cm}cm` : "—" },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <p className="text-sm font-bold text-white">{m.val}</p>
                        <p className="text-[9px] font-mono-cyber text-pink-400/40">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Generate AI report */}
      <motion.div variants={fadeUp}>
        <div className="rounded-2xl border border-purple-900/30 p-5" style={{ background: 'rgba(4,4,14,0.85)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="font-cyber text-base text-white tracking-wider">RELATÓRIO IA</h3>
            </div>
            <button onClick={generateAIReport} disabled={!selectedStudent || generating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.40)', color: '#c084fc' }}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {generating ? "Gerando..." : "Gerar Relatório"}
            </button>
          </div>

          {!selectedStudent && (
            <div className="text-center py-8">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-purple-500/15" />
              <p className="text-sm font-mono-cyber text-purple-500/30">// selecione um aluno para gerar o relatório</p>
            </div>
          )}

          {generating && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-mono-cyber text-purple-400/50">analisando dados e gerando relatório...</p>
            </div>
          )}

          {report && (
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' }} />
              <pre className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-body pt-3">{report}</pre>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}