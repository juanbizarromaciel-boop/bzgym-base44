import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import EvolutionAnalysisDashboard from "./EvolutionAnalysisDashboard";
import { buildPlainTextReport, buildWhatsAppReport, exportReportPdf, normalizeEvolutionReport, openPrintableReport } from "./evolutionReportUtils";

const dayLabels = { segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado", domingo: "Domingo" };
const steps = ["Escopo", "Treinos", "Análise", "Preferências", "Geração", "Comparação", "Relatório"];

const options = {
  manter: ["manter divisão atual", "manter quantidade de dias", "manter todos os treinos ativos", "manter apenas treinos com boa progressão", "manter exercícios que tiveram boa progressão", "manter exercícios principais", "manter exercícios que o aluno gosta", "manter exercícios sem dor/desconforto", "manter ordem dos grupos musculares", "manter cadência", "manter descanso", "manter técnicas avançadas", "manter volume total parecido", "manter foco do treino atual", "manter última carga usada quando o exercício for o mesmo", "manter exercícios base do ciclo anterior", "manter estrutura semanal atual"],
  trocar: ["trocar treino completo", "trocar todos os treinos selecionados", "trocar apenas exercícios sem progressão", "trocar exercícios com baixa adesão", "trocar exercícios com desconforto relatado", "trocar exercícios muito repetitivos", "trocar exercícios sem registro de carga", "trocar exercícios isoladores", "trocar exercícios compostos", "trocar apenas exercícios de um grupo muscular específico", "trocar apenas treino A", "trocar apenas treino B", "trocar apenas treino C", "trocar apenas treino D", "trocar todos os dias", "trocar divisão inteira", "trocar ordem semanal dos treinos"],
  ajustar: ["aumentar volume", "reduzir volume", "aumentar intensidade", "reduzir intensidade", "aumentar frequência semanal", "reduzir frequência semanal", "deixar mais iniciante", "deixar mais avançado", "priorizar hipertrofia", "priorizar força", "priorizar estética", "priorizar funcionalidade", "priorizar condicionamento sem criar dieta", "priorizar recuperação", "reduzir técnicas avançadas", "adicionar técnicas avançadas com moderação", "reduzir tempo total de treino", "deixar treino mais objetivo", "melhorar equilíbrio entre grupos musculares"],
  restricoes: ["evitar exercício específico", "evitar equipamento específico", "respeitar restrições do aluno", "respeitar lesões ou desconfortos informados", "respeitar dias disponíveis", "respeitar tempo máximo por treino", "respeitar academia/equipamentos disponíveis"],
};

function getSets(logs) {
  return logs.flatMap(l => (l.sets_completed || []).map(s => ({ ...s, date: l.date })));
}

function getExerciseStats(exercise, logs, prs) {
  const exLogs = logs.filter(l => (exercise.exercise_id && l.exercise_id === exercise.exercise_id) || l.exercise_name === exercise.exercise_name);
  const sets = getSets(exLogs).filter(s => Number(s.load_kg) || Number(s.reps_done));
  const recent = sets.slice(-Math.max(1, Math.ceil(sets.length / 3)));
  const early = sets.slice(0, Math.max(1, Math.ceil(sets.length / 3)));
  const avg = arr => arr.length ? arr.reduce((a, s) => a + Number(s.load_kg || 0), 0) / arr.length : 0;
  const avgReps = arr => arr.length ? arr.reduce((a, s) => a + Number(s.reps_done || 0), 0) / arr.length : 0;
  const recentLoad = avg(recent);
  const earlyLoad = avg(early);
  const cargaMedia = avg(sets);
  const melhorCarga = Math.max(0, ...sets.map(s => Number(s.load_kg || 0)), ...prs.filter(p => p.exercise_name === exercise.exercise_name).map(p => Number(p.load_kg || 0)));
  const ultimaCarga = [...sets].reverse().find(s => Number(s.load_kg))?.load_kg || 0;
  const ultimasRepeticoes = [...sets].reverse().find(s => Number(s.reps_done))?.reps_done || 0;
  const melhorRepeticao = Math.max(0, ...sets.map(s => Number(s.reps_done || 0)));
  let statusProgressao = "sem_dados";
  if (sets.length >= 3 && recentLoad > earlyLoad * 1.05) statusProgressao = "evoluiu";
  else if (sets.length >= 3 && recentLoad < earlyLoad * 0.93) statusProgressao = "regrediu";
  else if (sets.length > 0) statusProgressao = "manteve";
  const adesao = Math.min(100, Math.round((exLogs.length / 8) * 100));
  const recomendacao = statusProgressao === "evoluiu" ? "manter" : statusProgressao === "sem_dados" ? "observar" : "trocar";
  return {
    exercicioId: exercise.exercise_id || "",
    nome: exercise.exercise_name,
    execucoes: exLogs.length,
    ultimaCarga: Number(ultimaCarga || 0),
    melhorCarga: Number(melhorCarga || 0),
    cargaMedia: Number(cargaMedia.toFixed(1)),
    ultimasRepeticoes: Number(ultimasRepeticoes || 0),
    melhorRepeticao: Number(melhorRepeticao || 0),
    evolucaoReps: Number((avgReps(recent) - avgReps(early)).toFixed(1)),
    rirMedio: 0,
    statusProgressao,
    adesao,
    recomendacao,
    justificativa: statusProgressao === "evoluiu" ? "Boa evolução no histórico recente." : statusProgressao === "sem_dados" ? "Poucos registros para uma análise confiável." : "Sem progressão clara no período analisado.",
  };
}

function analyzePlans(plans, logs, prs) {
  return plans.map(plan => {
    const exerciseAnalysis = (plan.exercises || []).map(ex => getExerciseStats(ex, logs.filter(l => l.workout_plan_id === plan.id || l.student_id === plan.student_id), prs));
    const progressed = exerciseAnalysis.filter(a => a.statusProgressao === "evoluiu").length;
    const noData = exerciseAnalysis.filter(a => a.statusProgressao === "sem_dados").length;
    const avgAdherence = exerciseAnalysis.length ? Math.round(exerciseAnalysis.reduce((a, e) => a + e.adesao, 0) / exerciseAnalysis.length) : 0;
    const lastExecution = logs.filter(l => l.workout_plan_id === plan.id || (plan.exercises || []).some(e => e.exercise_name === l.exercise_name)).map(l => l.date).sort().pop();
    let status = "sem dados";
    if (avgAdherence < 30 && exerciseAnalysis.length) status = "baixa adesão";
    else if (progressed >= Math.max(1, Math.ceil(exerciseAnalysis.length * 0.35))) status = "evoluiu";
    else if (noData === exerciseAnalysis.length) status = "sem dados";
    else status = "estagnou";
    return { plan, exerciseAnalysis, status, avgAdherence, lastExecution };
  });
}

function normalizeEnum(value, allowed, fallback) {
  const v = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  return allowed.includes(v) ? v : fallback;
}

function normalizeExercise(item, oldPlan, analysis, idx) {
  const old = (oldPlan.exercises || []).find(e => e.exercise_name === item.exercicioAntigoRelacionado || e.exercise_name === item.exercise_name) || {};
  const stats = analysis.find(a => a.nome === old.exercise_name || a.nome === item.exercise_name);
  const same = old.exercise_name && old.exercise_name === item.exercise_name;
  const suggested = same && stats?.ultimaCarga ? Number(stats.ultimaCarga) : Number(item.cargaSugerida || old.load_kg || 0);
  const confidence = normalizeEnum(same && stats?.execucoes >= 3 ? "alta" : item.confiancaCarga || (suggested ? "media" : "baixa"), ["alta", "media", "baixa"], "baixa");
  const action = normalizeEnum(item.acao || (same ? "manter" : "substituir"), ["manter", "substituir", "adicionar", "remover"], same ? "manter" : "substituir");
  const technique = normalizeEnum(item.tecnicaAvancada || old.technique || "normal", ["normal", "cluster", "rest_pause", "drop_set", "super_set", "giant_set", "piramidal", "fst7", "myo_reps", "tempo_controlado"], "normal");
  return {
    order: idx,
    exercise_id: same ? old.exercise_id : item.exercise_id || "",
    exercise_name: item.exercise_name || item.nome || old.exercise_name || "Novo exercício",
    sets: Number(item.series || item.sets || old.sets || 3),
    reps: String(item.repeticoes || item.reps || old.reps || "8-12"),
    rest_seconds: Number(item.descanso || old.rest_seconds || 60),
    rir: item.rir || "1-3",
    cadencia: item.cadencia || "",
    technique,
    technique_details: item.observacoes || item.motivo || old.technique_details || "",
    notes: item.observacoes || item.motivo || "Carga estimada. Confirmar na execução.",
    acao: action,
    motivo: item.motivo || "Ajuste sugerido pela IA com base no histórico.",
    exercicioAntigoRelacionado: old.exercise_name || item.exercicioAntigoRelacionado || "",
    exercicioAntigoId: old.exercise_id || "",
    cargaAnterior: Number(stats?.ultimaCarga || old.load_kg || 0),
    cargaSugerida: suggested,
    faixaCargaMin: suggested ? Math.max(0, Math.round(suggested * 0.9)) : 0,
    faixaCargaMax: suggested ? Math.round(suggested * 1.1) : 0,
    confiancaCarga: confidence,
    baseEstimativaCarga: same ? `Histórico do próprio exercício: última ${stats?.ultimaCarga || 0}kg, melhor ${stats?.melhorCarga || 0}kg, média ${stats?.cargaMedia || 0}kg.` : (item.baseEstimativaCarga || "Estimativa conservadora com baixa confiança. Confirmar na execução."),
  };
}

export default function AiWorkoutEvolutionDialog({ open, onOpenChange, initialPlan, initialMode = "treino_especifico", student, allPlans = [], currentUser, onApplied }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(initialMode);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [selected, setSelected] = useState({ manter: [], trocar: [], ajustar: [], restricoes: [] });
  const [requestText, setRequestText] = useState("");
  const [generatedMeta, setGeneratedMeta] = useState(null);
  const [generatedPlans, setGeneratedPlans] = useState([]);
  const [activeTab, setActiveTab] = useState("geral");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [appliedResult, setAppliedResult] = useState(null);

  const { data: logs = [] } = useQuery({ queryKey: ["evolution-logs"], queryFn: () => base44.entities.WorkoutLog.list(), enabled: open });
  const { data: prs = [] } = useQuery({ queryKey: ["evolution-prs"], queryFn: () => base44.entities.PRRecord.list(), enabled: open });
  const { data: checkins = [] } = useQuery({ queryKey: ["evolution-checkins"], queryFn: () => base44.entities.CheckIn.list(), enabled: open });
  const { data: medidas = [] } = useQuery({ queryKey: ["evolution-medidas"], queryFn: () => base44.entities.MedidasCorporais.list(), enabled: open });
  const { data: bios = [] } = useQuery({ queryKey: ["evolution-bio"], queryFn: () => base44.entities.Bioimpedancia.list(), enabled: open });
  const { data: fotos = [] } = useQuery({ queryKey: ["evolution-fotos"], queryFn: () => base44.entities.FotoProgresso.list(), enabled: open });

  const canUse = currentUser?.role === "admin" || currentUser?.role === "personal" || currentUser?.role === "assinante" || currentUser?.role === "user";
  const ownerIds = [student?.id, student?.email, currentUser?.email].filter(Boolean);
  const activePlans = useMemo(() => allPlans.filter(p => (ownerIds.includes(p.student_id) || p.usuarioId === currentUser?.email || p.assinanteId === currentUser?.email) && p.active !== false && p.statusVersao !== "substituido"), [allPlans, student?.id, student?.email, currentUser?.email]);
  const selectedPlans = useMemo(() => activePlans.filter(p => selectedPlanIds.includes(p.id)), [activePlans, selectedPlanIds]);
  const studentLogs = logs.filter(l => ownerIds.includes(l.student_id));
  const studentPrs = prs.filter(p => ownerIds.includes(p.student_id));
  const totalExercises = activePlans.reduce((a, p) => a + (p.exercises?.length || 0), 0);
  const lastExecution = studentLogs.map(l => l.date).sort().pop();
  const adherence = checkins.filter(c => c.student_id === student?.id).length ? Math.round(checkins.filter(c => c.student_id === student?.id).reduce((a, c) => a + Number(c.workout_adherence || 0), 0) / checkins.filter(c => c.student_id === student?.id).length * 20) : Math.min(100, studentLogs.length * 5);
  const analyses = useMemo(() => analyzePlans(selectedPlans, studentLogs, studentPrs), [selectedPlans, studentLogs, studentPrs]);
  const normalizedReport = useMemo(() => normalizeEvolutionReport({ student, currentUser, mode, selectedPlans, generatedPlans, analyses, generatedMeta, requestText, adherence, prs: studentPrs }), [student, currentUser, mode, selectedPlans, generatedPlans, analyses, generatedMeta, requestText, adherence, studentPrs]);
  const fullReport = useMemo(() => buildPlainTextReport(normalizedReport), [normalizedReport]);
  const whatsReport = useMemo(() => buildWhatsAppReport(normalizedReport), [normalizedReport]);

  useEffect(() => {
    if (!open) return;
    const nextMode = initialMode || "treino_especifico";
    setMode(nextMode);
    setStep(0);
    setError("");
    setGeneratedMeta(null);
    setGeneratedPlans([]);
    setAppliedResult(null);
    setActiveTab("visao");
    setRequestText("");
    setSelected({ manter: [], trocar: [], ajustar: [], restricoes: [] });
    setSelectedPlanIds(nextMode === "plano_completo" ? activePlans.map(p => p.id) : [initialPlan?.id].filter(Boolean));
  }, [open, initialMode, initialPlan?.id, activePlans.length]);

  const toggleOption = (group, item) => setSelected(prev => ({ ...prev, [group]: prev[group].includes(item) ? prev[group].filter(i => i !== item) : [...prev[group], item] }));
  const togglePlan = id => setSelectedPlanIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectByStatus = status => setSelectedPlanIds(analyses.filter(a => a.status === status || (status === "estagnou" && a.status === "estagnou") || (status === "baixa adesão" && a.avgAdherence < 40)).map(a => a.plan.id));

  const generate = async () => {
    if (selectedPlans.length === 0) { toast.error("Selecione pelo menos um treino."); return; }
    setLoading(true); setStep(4); setError("");
    const payload = {
      modo: mode,
      aluno: { nome: student?.name, objetivo: student?.goal, nivel: student?.level, observacoes: student?.notes },
      treinosSelecionados: selectedPlans,
      analises: analyses,
      historico: {
        prs: studentPrs.slice(-30),
        checkins: checkins.filter(c => c.student_id === student?.id).slice(-12),
        medidas: medidas.filter(m => m.student_id === student?.id).slice(-6),
        bioimpedancia: bios.filter(b => b.student_id === student?.id).slice(-6),
        fotosReferencia: fotos.filter(f => f.student_id === student?.id).length,
      },
      preferencias: selected,
      pedidoIA: requestText,
    };
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é especialista em periodização, hipertrofia e progressão de cargas. Gere ${mode === "plano_completo" ? "um novo ciclo completo com todos os treinos selecionados" : "uma nova versão para o treino selecionado"}. Nunca use dados de outro aluno. Preserve cargas quando o exercício for o mesmo. Para exercício novo, estime carga de forma conservadora e informe confiança. Retorne JSON válido. Dados: ${JSON.stringify(payload)}`,
        response_json_schema: {
          type: "object",
          properties: {
            nomeNovoCiclo: { type: "string" }, objetivo: { type: "string" }, divisao: { type: "string" }, resumoExecutivo: { type: "string" }, estrategiaNovoCiclo: { type: "string" }, alertas: { type: "array", items: { type: "string" } },
            treinos: { type: "array", items: { type: "object", properties: { treinoBaseId: { type: "string" }, nomeNovoTreino: { type: "string" }, day_of_week: { type: "string" }, foco: { type: "string" }, exercicios: { type: "array", items: { type: "object", properties: { exercise_name: { type: "string" }, series: { type: "number" }, repeticoes: { type: "string" }, descanso: { type: "number" }, rir: { type: "string" }, cadencia: { type: "string" }, tecnicaAvancada: { type: "string" }, acao: { type: "string" }, motivo: { type: "string" }, exercicioAntigoRelacionado: { type: "string" }, cargaSugerida: { type: "number" }, confiancaCarga: { type: "string" }, baseEstimativaCarga: { type: "string" }, observacoes: { type: "string" } } } } } } }
          }
        }
      });
      const out = res?.data || res;
      const plansFromAi = out.treinos || [];
      const normalized = selectedPlans.map((oldPlan, idx) => {
        const p = plansFromAi.find(candidate => candidate.treinoBaseId === oldPlan.id) || plansFromAi[idx];
        const planAnalysis = analyses.find(a => a.plan.id === oldPlan.id)?.exerciseAnalysis || [];
        return {
          basePlanId: oldPlan.id,
          name: p?.nomeNovoTreino || `${oldPlan.name} v${Number(oldPlan.versao || 1) + 1} IA`,
          day_of_week: p?.day_of_week || oldPlan.day_of_week,
          foco: p?.foco || "",
          exercises: (p?.exercicios || oldPlan.exercises || []).map((ex, exIdx) => normalizeExercise(ex, oldPlan, planAnalysis, exIdx)),
        };
      });
      setGeneratedMeta(out);
      setGeneratedPlans(normalized);
      setActiveTab("visao");
      setStep(5);
    } catch (err) {
      setError("Não foi possível gerar agora. Revise os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const updateGeneratedPlan = (planIdx, field, value) => setGeneratedPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, [field]: value } : p));
  const updateGeneratedExercise = (planIdx, exIdx, field, value) => setGeneratedPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, exercises: p.exercises.map((e, j) => j === exIdx ? { ...e, [field]: value } : e) } : p));
  const removeGeneratedExercise = (planIdx, exIdx) => setGeneratedPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, exercises: p.exercises.filter((_, j) => j !== exIdx) } : p));
  const addGeneratedExercise = (planIdx) => setGeneratedPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, exercises: [...p.exercises, normalizeExercise({ exercise_name: "Novo exercício", acao: "adicionar" }, selectedPlans.find(sp => sp.id === p.basePlanId) || {}, [], p.exercises.length)] } : p));

  const saveSuggestion = async (status = "em_revisao", historicoId = "") => {
    const suggestions = [];
    for (const gp of generatedPlans) {
      const suggestion = await base44.entities.SugestaoNovoTreinoIA.create({
        alunoId: student.id, personalId: currentUser.email, usuarioId: currentUser.email, assinanteId: currentUser.email, treinoBaseId: gp.basePlanId, evolucaoCompletaId: historicoId,
        nomeSugestao: gp.name, objetivo: generatedMeta?.objetivo || student?.goal || "", divisao: generatedMeta?.divisao || gp.day_of_week || "",
        pedidoIA: requestText, configuracoesSelecionadas: { ...selected, modo: mode, treinosSelecionados: selectedPlanIds }, status, dataCriacao: new Date().toISOString(), criadoPor: currentUser.email,
      });
      suggestions.push(suggestion);
      await Promise.all(gp.exercises.map((ex, idx) => base44.entities.SugestaoExercicioTreinoIA.create({
        sugestaoNovoTreinoId: suggestion.id, usuarioId: currentUser.email, assinanteId: currentUser.email, diaTreino: gp.day_of_week, ordem: idx, exercicioAntigoId: ex.exercicioAntigoId, exercicioNovoId: ex.exercise_id, acao: ex.acao,
        motivo: ex.motivo, series: Number(ex.sets || 0), repeticoes: ex.reps, descanso: Number(ex.rest_seconds || 0), rir: ex.rir, cadencia: ex.cadencia,
        tecnicaAvancada: ex.technique, cargaAnterior: Number(ex.cargaAnterior || 0), cargaSugerida: Number(ex.cargaSugerida || 0), faixaCargaMin: Number(ex.faixaCargaMin || 0), faixaCargaMax: Number(ex.faixaCargaMax || 0), confiancaCarga: ex.confiancaCarga, baseEstimativaCarga: ex.baseEstimativaCarga, observacoes: ex.notes,
      })));
    }
    return suggestions;
  };

  const saveDraft = async () => {
    setSaving(true);
    const history = await base44.entities.HistoricoEvolucaoTreinoIA.create({ alunoId: student.id, personalId: currentUser.email, usuarioId: currentUser.email, assinanteId: currentUser.email, modoEvolucao: mode, treinosAntigosIds: selectedPlanIds, treinosNovosIds: [], dataEvolucao: new Date().toISOString(), motivoEvolucao: "Rascunho de evolução com IA", pedidoIA: requestText, resumoAnalise: generatedMeta?.resumoExecutivo || "", status: "rascunho", criadoPor: currentUser.email, relatorioTexto: fullReport });
    await saveSuggestion("em_revisao", history.id);
    setSaving(false);
    toast.success("Rascunho da evolução salvo.");
  };

  const applyEvolution = async () => {
    if (!window.confirm(mode === "plano_completo" ? "Confirmar aplicação do novo ciclo completo? Os treinos antigos serão preservados e arquivados." : "Confirmar aplicação do novo treino? O treino antigo será preservado e arquivado.")) return;
    setSaving(true);
    const cycle = mode === "plano_completo" ? await base44.entities.CiclosTreino.create({ alunoId: student.id, personalId: currentUser.email, usuarioId: currentUser.email, assinanteId: currentUser.email, nomeCiclo: generatedMeta?.nomeNovoCiclo || `Novo ciclo IA · ${student.name}`, objetivo: generatedMeta?.objetivo || student?.goal || "", divisao: generatedMeta?.divisao || `${generatedPlans.length} treinos`, dataInicio: new Date().toISOString().split("T")[0], status: "atual", criadoPorIA: true, observacoes: requestText || "Ciclo evoluído com IA" }) : null;
    const newIds = [];
    for (const gp of generatedPlans) {
      const oldPlan = selectedPlans.find(p => p.id === gp.basePlanId);
      const newPlan = await base44.entities.WorkoutPlan.create({
        student_id: student.id,
        personal_id: currentUser.email,
        name: gp.name,
        day_of_week: gp.day_of_week,
        exercises: gp.exercises.filter(e => e.acao !== "remover").map((e, idx) => ({ exercise_id: e.exercise_id, exercise_name: e.exercise_name, sets: Number(e.sets || 0), reps: e.reps, load_kg: Number(e.cargaSugerida || 0), rest_seconds: Number(e.rest_seconds || 0), technique: e.technique || "normal", technique_details: e.technique_details || e.motivo, order: idx, notes: e.notes })),
        active: true,
        usuarioId: currentUser.email,
        assinanteId: currentUser.email,
        tipoDono: currentUser.role === "assinante" || currentUser.role === "user" ? "assinante" : "aluno",
        versao: Number(oldPlan?.versao || 1) + 1,
        treinoAnteriorId: oldPlan?.id,
        cicloId: cycle?.id || oldPlan?.cicloId || "",
        statusVersao: "atual",
        dataAplicacao: new Date().toISOString(),
        motivoAtualizacao: requestText || "Evolução gerada com IA",
        evoluidoPorIA: true,
      });
      newIds.push(newPlan.id);
      if (oldPlan) await base44.entities.WorkoutPlan.update(oldPlan.id, { ...oldPlan, active: false, statusVersao: "substituido", motivoAtualizacao: "Substituído por evolução com IA" });
    }
    const history = await base44.entities.HistoricoEvolucaoTreinoIA.create({ alunoId: student.id, personalId: currentUser.email, usuarioId: currentUser.email, assinanteId: currentUser.email, modoEvolucao: mode, treinosAntigosIds: selectedPlanIds, treinosNovosIds: newIds, dataEvolucao: new Date().toISOString(), motivoEvolucao: generatedMeta?.resumoExecutivo || "Evolução gerada com IA", pedidoIA: requestText, resumoAnalise: generatedMeta?.resumoExecutivo || "", status: "aplicado", criadoPor: currentUser.email, aprovadoPor: currentUser.email, relatorioTexto: fullReport });
    await saveSuggestion("aplicado", history.id);
    for (const a of analyses.flatMap(x => x.exerciseAnalysis.map(e => ({ ...e, treinoId: x.plan.id })))) {
      await base44.entities.AnaliseProgressaoTreino.create({ alunoId: student.id, personalId: currentUser.email, usuarioId: currentUser.email, assinanteId: currentUser.email, treinoId: a.treinoId, exercicioId: a.exercicioId, periodoInicio: "histórico", periodoFim: new Date().toISOString(), execucoes: a.execucoes, ultimaCarga: a.ultimaCarga, melhorCarga: a.melhorCarga, cargaMedia: a.cargaMedia, ultimasRepeticoes: a.ultimasRepeticoes, melhorRepeticao: a.melhorRepeticao, rirMedio: a.rirMedio, statusProgressao: a.statusProgressao, adesao: a.adesao, recomendacao: a.recomendacao, justificativa: a.justificativa });
    }
    const allGeneratedExercises = generatedPlans.flatMap(p => p.exercises.map(e => ({ ...e, treino: p.name })));
    const report = await base44.entities.RelatorioEvolucaoTreino.create({
      alunoId: student.id, personalId: currentUser.email, usuarioId: currentUser.email, assinanteId: currentUser.email, modoRelatorio: mode, treinoAntigoId: selectedPlanIds[0] || "", treinoNovoId: newIds[0] || "", treinosAntigosIds: selectedPlanIds, treinosNovosIds: newIds, cicloAnteriorId: selectedPlans[0]?.cicloId || "", cicloNovoId: cycle?.id || "", historicoEvolucaoTreinoId: history.id,
      titulo: mode === "plano_completo" ? `Relatório Master · ${student.name}` : `Relatório de Evolução · ${student.name}`,
      periodoAnalisado: normalizedReport.periodoAnalisado,
      resumoExecutivo: normalizedReport.resumoExecutivo,
      metricasResumoJson: normalizedReport.metricasResumo,
      analisePlanoCompleto: { modo: mode, cicloAnterior: normalizedReport.cicloAnterior, cicloNovo: normalizedReport.cicloNovo, treinos: selectedPlans.length, novosTreinos: newIds.length },
      analisePorTreinoJson: normalizedReport.analisePorTreino,
      analisePorExercicio: analyses.flatMap(a => a.exerciseAnalysis),
      analisePorGrupoMuscular: normalizedReport.analisePorGrupoMuscular,
      comparativoAntigoNovo: normalizedReport.comparativoAntigoNovo,
      cargasSugeridas: normalizedReport.cargas,
      exerciciosMantidos: allGeneratedExercises.filter(e => e.acao === "manter"),
      exerciciosSubstituidos: allGeneratedExercises.filter(e => e.acao === "substituir"),
      exerciciosAdicionados: allGeneratedExercises.filter(e => e.acao === "adicionar"),
      exerciciosRemovidos: allGeneratedExercises.filter(e => e.acao === "remover"),
      estrategiaNovoCiclo: normalizedReport.estrategiaNovoCiclo,
      alertas: normalizedReport.alertas,
      conclusao: normalizedReport.conclusao,
      layoutTemplate: "premium_bz_report_v2",
      graficosJson: normalizedReport.graficos,
      tabelasJson: { comparativo: normalizedReport.comparativoAntigoNovo, cargas: normalizedReport.cargas },
      temaPdf: "claro",
      textoWhatsapp: whatsReport,
      statusExportacao: "concluido",
      dataCriacao: new Date().toISOString(),
      dataExportacao: new Date().toISOString(),
      geradoPorIA: true,
      revisadoPorPersonal: true,
      visivelParaAluno: false,
    });
    await Promise.all([
      base44.entities.SecoesRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, titulo: "Capa", tipoSecao: "capa", conteudoHtml: `<h1>Relatório de Evolução de Treino</h1><p>${student.name}</p>`, dadosJson: normalizedReport, ordem: 1, visivelNoPdf: true }),
      base44.entities.SecoesRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, titulo: "Resumo Executivo", tipoSecao: "resumo", conteudoHtml: normalizedReport.resumoExecutivo, dadosJson: normalizedReport.metricasResumo, ordem: 2, visivelNoPdf: true }),
      base44.entities.SecoesRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, titulo: "Comparativo", tipoSecao: "comparativo", conteudoHtml: "Comparativo antigo vs novo", dadosJson: { rows: normalizedReport.comparativoAntigoNovo }, ordem: 3, visivelNoPdf: true }),
      base44.entities.GraficosRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, tipoGrafico: "adesao", titulo: "Adesão ao treino", descricao: "Treinos previstos vs concluídos", dadosJson: normalizedReport.graficos.adesaoTreino, ordem: 1 }),
      base44.entities.GraficosRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, tipoGrafico: "status_exercicios", titulo: "Status dos exercícios", descricao: "Evoluiu, manteve, regrediu e sem dados", dadosJson: normalizedReport.graficos.statusExercicios, ordem: 2 }),
      base44.entities.GraficosRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, tipoGrafico: "volume_grupo", titulo: "Volume por grupo muscular", descricao: "Volume anterior vs novo", dadosJson: normalizedReport.graficos.volumeGrupoMuscular, ordem: 3 }),
      base44.entities.GraficosRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, tipoGrafico: "comparativo_volume", titulo: "Alterações de exercícios", descricao: "Mantidos, substituídos, adicionados e removidos", dadosJson: normalizedReport.graficos.alteracoesExercicios, ordem: 4 }),
      base44.entities.GraficosRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, tipoGrafico: "progressao_carga", titulo: "Cargas", descricao: "Cargas mantidas, estimadas e sem dados", dadosJson: normalizedReport.graficos.cargas, ordem: 5 }),
      base44.entities.GraficosRelatorioTreino.create({ relatorioEvolucaoTreinoId: report.id, tipoGrafico: "prs", titulo: "PRs no período", descricao: "PRs disponíveis no período analisado", dadosJson: normalizedReport.graficos.prsPeriodo, ordem: 6 }),
    ]);
    for (const newId of newIds) await base44.entities.WorkoutPlan.update(newId, { historicoEvolucaoId: history.id });
    if (student.email && currentUser?.role !== "assinante") await base44.entities.Notificacao.create({ usuario_id: student.email, titulo: mode === "plano_completo" ? "Plano completo atualizado" : "Treino atualizado", mensagem: mode === "plano_completo" ? "Seu plano de treino completo foi atualizado pelo seu personal." : "Seu treino foi atualizado pelo seu personal.", tipo: "treino_novo", lida: false, link_destino: "/MyWorkout", icone: "Dumbbell" });
    setAppliedResult({ newIds, names: generatedPlans.map(p => p.name) });
    setSaving(false); onApplied?.(); toast.success(mode === "plano_completo" ? "Plano completo aplicado como novo ciclo." : "Novo treino aplicado com segurança.");
  };

  const exportPremiumPdf = (theme = "claro") => {
    exportReportPdf(normalizedReport, theme);
    toast.success(theme === "escuro" ? "PDF escuro premium exportado." : "PDF claro premium exportado.");
  };

  const exportWhatsApp = () => { navigator.clipboard.writeText(whatsReport); toast.success("Resumo WhatsApp copiado."); };
  const exportHtml = (theme = "claro") => {
    openPrintableReport(normalizedReport, theme);
    toast.success("Prévia HTML imprimível aberta.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-white border border-purple-900/40 w-[96vw] sm:max-w-5xl max-h-[88dvh] overflow-y-auto p-3 sm:p-6" style={{ background: "#04040e" }}>
        <DialogHeader><DialogTitle className="font-cyber tracking-widest text-purple-200 flex items-center gap-2 text-sm sm:text-base"><Sparkles className="w-5 h-5 text-cyan-300" /> EVOLUIR TREINO COM IA</DialogTitle></DialogHeader>
        {appliedResult ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-300" />
          <h2 className="font-cyber text-xl text-white tracking-widest">TREINO TROCADO COM SUCESSO</h2>
          <p className="text-emerald-100/80">O novo treino foi aplicado, o treino antigo foi arquivado como substituído e o histórico foi preservado.</p>
          <div className="rounded-xl bg-black/25 border border-emerald-500/20 p-3 text-left text-sm">{appliedResult.names.map(n => <p key={n}>• {n}</p>)}</div>
          {student?.email && <p className="text-sm text-purple-100/65">O aluno recebeu uma notificação em “Meu Treino”.</p>}
          <div className="grid sm:grid-cols-3 gap-2"><Button onClick={() => exportPremiumPdf("claro")} className="btn-neon-purple">Exportar PDF</Button><Button onClick={exportWhatsApp} variant="outline">Copiar WhatsApp</Button><Button onClick={() => onOpenChange(false)} className="btn-neon-cyan">Fechar</Button></div>
        </div> : !canUse ? <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-200">Seu perfil não tem permissão para evoluir treinos com IA.</div> : <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 sm:gap-2">{steps.map((s, i) => <button key={s} onClick={() => i <= step && setStep(i)} className={`rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 text-[10px] sm:text-xs border ${i === step ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-purple-900/30 bg-purple-500/5 text-purple-300/60"}`}>{i + 1}. {s}</button>)}</div>
          <div className="rounded-xl border border-purple-900/30 bg-purple-500/5 p-4 grid md:grid-cols-4 gap-3"><div><p className="text-xs text-purple-400/60 font-mono-cyber">ALUNO</p><b>{student?.name}</b></div><div><p className="text-xs text-purple-400/60 font-mono-cyber">PERSONAL</p><b>{currentUser?.full_name || currentUser?.email}</b></div><div><p className="text-xs text-purple-400/60 font-mono-cyber">OBJETIVO</p><b>{student?.goal || "—"}</b></div><div><p className="text-xs text-purple-400/60 font-mono-cyber">TREINOS ATIVOS</p><b>{activePlans.length}</b></div></div>

          {step === 0 && <div className="space-y-4"><div className="grid md:grid-cols-2 gap-3"><button onClick={() => { setMode("treino_especifico"); setSelectedPlanIds([initialPlan?.id || activePlans[0]?.id].filter(Boolean)); }} className={`p-5 rounded-xl border text-left ${mode === "treino_especifico" ? "border-cyan-400/50 bg-cyan-400/10" : "border-purple-900/30 bg-purple-500/5"}`}><h3 className="font-bold">Evoluir treino específico</h3><p className="text-sm text-purple-200/60 mt-2">Atualize apenas este treino, mantendo os outros planos do aluno sem alteração.</p></button><button onClick={() => { setMode("plano_completo"); setSelectedPlanIds(activePlans.map(p => p.id)); }} className={`p-5 rounded-xl border text-left ${mode === "plano_completo" ? "border-cyan-400/50 bg-cyan-400/10" : "border-purple-900/30 bg-purple-500/5"}`}><h3 className="font-bold">Evoluir plano completo</h3><p className="text-sm text-purple-200/60 mt-2">Analise e atualize todos os treinos ativos do aluno de uma vez, criando um novo ciclo completo.</p></button></div><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[["Exercícios", totalExercises], ["Última execução", lastExecution ? new Date(lastExecution).toLocaleDateString("pt-BR") : "—"], ["Adesão geral", `${adherence || 0}%`], ["Período", "Histórico"], ["Nível", student?.level || "—"]].map(([k,v]) => <div key={k} className="rounded-xl border border-purple-900/20 bg-black/20 p-3"><p className="text-[10px] text-purple-400/50">{k}</p><p className="font-bold">{v}</p></div>)}</div><Button onClick={() => setStep(1)} className="w-full btn-neon-cyan">CONTINUAR</Button></div>}

          {step === 1 && <div className="space-y-3"><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setSelectedPlanIds(activePlans.map(p => p.id))}>Selecionar todos</Button><Button variant="outline" onClick={() => setSelectedPlanIds([])}>Desmarcar todos</Button><Button variant="outline" onClick={() => selectByStatus("estagnou")}>Estagnados</Button><Button variant="outline" onClick={() => selectByStatus("baixa adesão")}>Baixa adesão</Button><Button variant="outline" onClick={() => selectByStatus("sem dados")}>Sem execução recente</Button></div><div className="grid md:grid-cols-2 gap-3">{activePlans.map(p => { const a = analyses.find(x => x.plan.id === p.id) || analyzePlans([p], studentLogs, studentPrs)[0]; return <label key={p.id} className="rounded-xl border border-purple-900/25 bg-black/20 p-4 flex gap-3"><Checkbox checked={selectedPlanIds.includes(p.id)} onCheckedChange={() => togglePlan(p.id)} /><div className="flex-1"><div className="flex items-center justify-between gap-2"><b>{p.name}</b><Badge>{a?.status || "sem dados"}</Badge></div><p className="text-xs text-purple-300/60 mt-1">{dayLabels[p.day_of_week] || p.day_of_week} · {p.exercises?.length || 0} exercícios · adesão {a?.avgAdherence || 0}%</p><p className="text-xs text-purple-300/40 mt-1">Última execução: {a?.lastExecution ? new Date(a.lastExecution).toLocaleDateString("pt-BR") : "sem registro"}</p></div></label>})}</div><Button onClick={() => setStep(2)} disabled={selectedPlanIds.length === 0} className="w-full btn-neon-cyan">ANALISAR TREINOS SELECIONADOS</Button></div>}

          {step === 2 && <div className="space-y-3"><div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-100">A análise usa treinos, registros de séries, PRs, check-ins, medidas, bioimpedância e fotos apenas como referência documental.</div>{analyses.map(a => <div key={a.plan.id} className="rounded-xl border border-purple-900/25 bg-black/20 p-4"><div className="flex items-center justify-between"><h3 className="font-bold">{a.plan.name}</h3><Badge>{a.status}</Badge></div><div className="grid md:grid-cols-2 gap-2 mt-3">{a.exerciseAnalysis.map(ex => <div key={ex.nome} className="rounded-lg border border-purple-900/20 p-3"><b className="text-sm">{ex.nome}</b><p className="text-xs text-purple-300/60">{ex.execucoes} exec. · última {ex.ultimaCarga || "—"}kg · melhor {ex.melhorCarga || "—"}kg · {ex.statusProgressao}</p></div>)}</div></div>)}<Button onClick={() => setStep(3)} className="w-full btn-neon-cyan">DEFINIR PREFERÊNCIAS</Button></div>}

          {step === 3 && <div className="space-y-4">{Object.entries(options).map(([group, items]) => <div key={group}><h4 className="font-cyber text-sm tracking-widest text-cyan-200 uppercase mb-2">{group}</h4><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{items.map(item => <label key={item} className="flex items-center gap-2 rounded-xl border border-purple-900/25 bg-purple-500/5 p-3 text-sm"><input type="checkbox" checked={selected[group].includes(item)} onChange={() => toggleOption(group, item)} className="w-4 h-4 accent-purple-500" />{item}</label>)}</div></div>)}<div><p className="text-xs text-purple-400/60 mb-1">Pedido específico para a IA</p><Textarea value={requestText} onChange={e => setRequestText(e.target.value)} className="cyber-input min-h-28" placeholder={mode === "plano_completo" ? "Analise todos os treinos ativos e crie um novo ciclo ABCD..." : "Troque este treino mantendo exercícios base e evoluindo cargas..."} /></div><Button onClick={generate} disabled={loading} className="w-full btn-neon-purple py-3"><Brain className="w-4 h-4 mr-2" /> ANALISAR E GERAR EVOLUÇÃO</Button></div>}

          {step === 4 && <div className="text-center py-14">{loading ? <><Loader2 className="w-10 h-10 mx-auto animate-spin text-cyan-300" /><p className="mt-4 text-cyan-200">{mode === "plano_completo" ? "Gerando novo ciclo completo..." : "Gerando nova versão do treino..."}</p></> : error ? <p className="text-pink-300">{error}</p> : null}</div>}

          {step === 5 && <EvolutionAnalysisDashboard
            report={normalizedReport}
            generatedPlans={generatedPlans}
            selectedPlans={selectedPlans}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            updateGeneratedPlan={updateGeneratedPlan}
            updateGeneratedExercise={updateGeneratedExercise}
            removeGeneratedExercise={removeGeneratedExercise}
            addGeneratedExercise={addGeneratedExercise}
            onSaveDraft={saveDraft}
            onPreview={() => setActiveTab("relatorio")}
            onApply={applyEvolution}
            onExportPdf={exportPremiumPdf}
            onExportHtml={() => exportHtml("claro")}
            onExportWhatsApp={exportWhatsApp}
            saving={saving}
            onCancel={() => onOpenChange(false)}
          />}

          {step === 6 && <EvolutionAnalysisDashboard
            report={normalizedReport}
            generatedPlans={generatedPlans}
            selectedPlans={selectedPlans}
            activeTab="relatorio"
            setActiveTab={setActiveTab}
            updateGeneratedPlan={updateGeneratedPlan}
            updateGeneratedExercise={updateGeneratedExercise}
            removeGeneratedExercise={removeGeneratedExercise}
            addGeneratedExercise={addGeneratedExercise}
            onSaveDraft={saveDraft}
            onPreview={() => setActiveTab("relatorio")}
            onApply={applyEvolution}
            onExportPdf={exportPremiumPdf}
            onExportHtml={() => exportHtml("claro")}
            onExportWhatsApp={exportWhatsApp}
            saving={saving}
            onCancel={() => onOpenChange(false)}
          />}
        </div>}
      </DialogContent>
    </Dialog>
  );
}