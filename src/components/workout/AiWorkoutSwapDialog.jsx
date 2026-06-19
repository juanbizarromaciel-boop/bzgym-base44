import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, CheckCircle2, Download, FileText, Loader2, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

const dayLabels = { segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado", domingo: "Domingo" };
const steps = ["Base", "Análise", "Preferências", "Geração", "Comparação", "Relatório"];

const options = {
  manter: ["manter divisão atual", "manter quantidade de dias", "manter exercícios que tiveram boa progressão", "manter exercícios principais", "manter exercícios que o aluno gosta", "manter exercícios sem dor/desconforto", "manter ordem dos grupos musculares", "manter cadência", "manter descanso", "manter técnicas avançadas", "manter volume total parecido", "manter foco do treino atual", "manter última carga usada quando o exercício for o mesmo"],
  trocar: ["trocar exercícios sem progressão", "trocar exercícios com baixa adesão", "trocar exercícios com desconforto relatado", "trocar exercícios muito repetitivos", "trocar exercícios sem registro de carga", "trocar exercícios isoladores", "trocar exercícios compostos", "trocar apenas exercícios de um grupo muscular específico", "trocar apenas treino A", "trocar apenas treino B", "trocar apenas treino C", "trocar apenas treino D", "trocar todos os dias"],
  ajustar: ["aumentar volume", "reduzir volume", "aumentar intensidade", "reduzir intensidade", "aumentar frequência semanal", "reduzir frequência semanal", "deixar mais iniciante", "deixar mais avançado", "priorizar hipertrofia", "priorizar força", "priorizar estética", "priorizar funcionalidade", "priorizar emagrecimento/condicionamento sem criar dieta", "priorizar recuperação", "reduzir técnicas avançadas", "adicionar técnicas avançadas com moderação"],
  restricoes: ["evitar exercício específico", "evitar equipamento específico", "respeitar restrições do aluno", "respeitar lesões ou desconfortos informados", "respeitar dias disponíveis", "respeitar tempo máximo por treino", "respeitar academia/equipamentos disponíveis"],
};

function allSets(logs) {
  return logs.flatMap(l => (l.sets_completed || []).map(s => ({ ...s, date: l.date })));
}

function analyzePlan(plan, logs, prs) {
  const exercises = plan?.exercises || [];
  return exercises.map(ex => {
    const exLogs = logs.filter(l => (l.exercise_id && l.exercise_id === ex.exercise_id) || l.exercise_name === ex.exercise_name);
    const sets = allSets(exLogs).filter(s => Number(s.load_kg) || Number(s.reps_done));
    const first = sets.slice(0, Math.max(1, Math.ceil(sets.length / 3)));
    const recent = sets.slice(-Math.max(1, Math.ceil(sets.length / 3)));
    const avg = arr => arr.length ? arr.reduce((a, s) => a + Number(s.load_kg || 0), 0) / arr.length : 0;
    const repsAvg = arr => arr.length ? arr.reduce((a, s) => a + Number(s.reps_done || 0), 0) / arr.length : 0;
    const avgLoad = avg(sets);
    const recentLoad = avg(recent);
    const firstLoad = avg(first);
    const bestLoad = Math.max(0, ...sets.map(s => Number(s.load_kg || 0)), ...prs.filter(p => p.exercise_name === ex.exercise_name).map(p => Number(p.load_kg || 0)));
    const lastLoad = [...sets].reverse().find(s => Number(s.load_kg))?.load_kg || 0;
    const lastReps = [...sets].reverse().find(s => Number(s.reps_done))?.reps_done || 0;
    const bestReps = Math.max(0, ...sets.map(s => Number(s.reps_done || 0)));
    let status = "sem_dados";
    if (sets.length >= 3 && recentLoad > firstLoad * 1.05) status = "evoluiu";
    else if (sets.length >= 3 && recentLoad < firstLoad * 0.93) status = "regrediu";
    else if (sets.length > 0) status = "manteve";
    const adesao = Math.min(100, Math.round((exLogs.length / 8) * 100));
    const recomendacao = status === "evoluiu" ? "manter" : status === "sem_dados" ? "observar" : "trocar";
    return {
      exercicioId: ex.exercise_id || "",
      nome: ex.exercise_name,
      execucoes: exLogs.length,
      ultimaCarga: Number(lastLoad || 0),
      melhorCarga: Number(bestLoad || 0),
      cargaMedia: Number(avgLoad.toFixed(1)),
      ultimasRepeticoes: Number(lastReps || 0),
      melhorRepeticao: Number(bestReps || 0),
      evolucaoReps: Number((repsAvg(recent) - repsAvg(first)).toFixed(1)),
      rirMedio: 0,
      statusProgressao: status,
      adesao,
      recomendacao,
      justificativa: status === "evoluiu" ? "Boa evolução de carga/repetições no histórico recente." : status === "sem_dados" ? "Poucos registros para análise confiável." : "Sem progressão clara no período analisado.",
    };
  });
}

function buildReport(student, plan, analysis, generated, requestText) {
  const generatedList = generated?.exercises || [];
  const kept = generatedList.filter(e => e.acao === "manter");
  const changed = generatedList.filter(e => e.acao !== "manter");
  const lines = [
    `RELATÓRIO DE TROCA DE TREINO COM IA`,
    `Aluno: ${student?.name || "—"}`,
    `Objetivo: ${student?.goal || generated?.objetivo || "—"}`,
    `Personal: ${plan?.personal_id || "—"}`,
    `Treino analisado: ${plan?.name || "—"}`,
    `Período analisado: histórico registrado no app até ${new Date().toLocaleDateString("pt-BR")}`,
    ``,
    `RESUMO EXECUTIVO`,
    generated?.resumoExecutivo || "A IA gerou uma sugestão conservadora com base no treino atual e histórico registrado.",
    ``,
    `ANÁLISE DE PROGRESSÃO POR EXERCÍCIO`,
    ...analysis.map(a => `- ${a.nome}: ${a.execucoes} execuções | última ${a.ultimaCarga || "—"}kg | melhor ${a.melhorCarga || "—"}kg | média ${a.cargaMedia || "—"}kg | status ${a.statusProgressao} | recomendação ${a.recomendacao}. ${a.justificativa}`),
    ``,
    `EXERCÍCIOS MANTIDOS`,
    ...(kept.length ? kept.map(e => `- ${e.exercise_name}: ${e.motivo || "boa resposta no histórico"} | carga sugerida ${e.cargaSugerida || "—"}kg`) : ["- Nenhum exercício marcado como mantido."]),
    ``,
    `EXERCÍCIOS SUBSTITUÍDOS / NOVOS`,
    ...(changed.length ? changed.map(e => `- ${e.exercicioAntigoRelacionado || "novo"} → ${e.exercise_name}: ${e.motivo || "ajuste estratégico"} | carga ${e.cargaSugerida || "—"}kg | confiança ${e.confiancaCarga || "baixa"}`) : ["- Nenhuma substituição sugerida."]),
    ``,
    `ESTRATÉGIA DO NOVO TREINO`,
    generated?.estrategiaNovoTreino || "Monitorar RIR real nas primeiras sessões e ajustar cargas manualmente.",
    ``,
    `ALERTAS`,
    ...((generated?.alertas?.length ? generated.alertas : ["Cargas são estimativas. Confirmar na execução.", "A IA gera sugestões. Revise antes de aplicar."]).map(a => `- ${a}`)),
    ``,
    `PRÓXIMOS PASSOS`,
    ...((generated?.proximosPassos?.length ? generated.proximosPassos : ["Acompanhar primeiras sessões", "Ajustar carga conforme RIR real", "Revisar após 3 a 6 semanas"]).map(a => `- ${a}`)),
    ``,
    `PEDIDO ESPECÍFICO`,
    requestText || "—",
  ];
  return lines.join("\n");
}

export default function AiWorkoutSwapDialog({ open, onOpenChange, plan, student, allPlans, currentUser, onApplied }) {
  const [step, setStep] = useState(0);
  const [baseMode, setBaseMode] = useState("current");
  const [basePlanId, setBasePlanId] = useState(plan?.id || "");
  const [selected, setSelected] = useState({ manter: [], trocar: [], ajustar: [], restricoes: [] });
  const [requestText, setRequestText] = useState("");
  const [generated, setGenerated] = useState(null);
  const [generatedExercises, setGeneratedExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStep(0); setBaseMode("current"); setBasePlanId(plan?.id || ""); setGenerated(null); setGeneratedExercises([]); setApplied(false); setError("");
    }
  }, [open, plan?.id]);

  const { data: logs = [] } = useQuery({ queryKey: ["ai-workout-logs"], queryFn: () => base44.entities.WorkoutLog.list(), enabled: open });
  const { data: prs = [] } = useQuery({ queryKey: ["ai-prs"], queryFn: () => base44.entities.PRRecord.list(), enabled: open });
  const { data: checkins = [] } = useQuery({ queryKey: ["ai-checkins"], queryFn: () => base44.entities.CheckIn.list(), enabled: open });
  const { data: medidas = [] } = useQuery({ queryKey: ["ai-medidas"], queryFn: () => base44.entities.MedidasCorporais.list(), enabled: open });
  const { data: bios = [] } = useQuery({ queryKey: ["ai-bio"], queryFn: () => base44.entities.Bioimpedancia.list(), enabled: open });
  const { data: fotos = [] } = useQuery({ queryKey: ["ai-fotos"], queryFn: () => base44.entities.FotoProgresso.list(), enabled: open });

  const canUse = currentUser?.role === "admin" || currentUser?.role === "personal";
  const studentPlans = (allPlans || []).filter(p => p.student_id === student?.id);
  const basePlan = baseMode === "current" ? plan : studentPlans.find(p => p.id === basePlanId) || plan;
  const studentLogs = logs.filter(l => l.student_id === student?.id && (!basePlan?.id || l.workout_plan_id === basePlan.id || (basePlan.exercises || []).some(e => e.exercise_name === l.exercise_name)));
  const studentPrs = prs.filter(p => p.student_id === student?.id);
  const studentCheckins = checkins.filter(c => c.student_id === student?.id);
  const analysis = useMemo(() => analyzePlan(basePlan, studentLogs, studentPrs), [basePlan, studentLogs, studentPrs]);
  const reportText = useMemo(() => generated ? buildReport(student, basePlan, analysis, { ...generated, exercises: generatedExercises }, requestText) : "", [student, basePlan, analysis, generated, generatedExercises, requestText]);

  const totalExercises = basePlan?.exercises?.length || 0;
  const lastExecution = studentLogs.map(l => l.date).sort().pop();
  const adherence = studentCheckins.length ? Math.round(studentCheckins.reduce((a, c) => a + Number(c.workout_adherence || 0), 0) / studentCheckins.length * 20) : Math.min(100, studentLogs.length * 10);
  const progressGood = analysis.filter(a => a.statusProgressao === "evoluiu").length;
  const progressGeneral = totalExercises ? Math.round(progressGood / totalExercises * 100) : 0;

  const toggleOption = (group, item) => setSelected(prev => ({
    ...prev,
    [group]: prev[group].includes(item) ? prev[group].filter(i => i !== item) : [...prev[group], item]
  }));

  const normalizeExercise = (item, idx) => {
    const old = (basePlan?.exercises || []).find(e => e.exercise_name === item.exercicioAntigoRelacionado || e.exercise_name === item.exercise_name) || {};
    const stats = analysis.find(a => a.nome === old.exercise_name || a.nome === item.exercise_name);
    const same = old.exercise_name && old.exercise_name === item.exercise_name;
    const suggested = same && stats?.ultimaCarga ? stats.ultimaCarga : Number(item.cargaSugerida || 0);
    const rawConfidence = String(same && stats?.execucoes >= 3 ? "alta" : item.confiancaCarga || (suggested ? "media" : "baixa")).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const confidence = ["alta", "media", "baixa"].includes(rawConfidence) ? rawConfidence : "baixa";
    const rawAction = String(item.acao || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const action = ["manter", "substituir", "adicionar", "remover"].includes(rawAction) ? rawAction : (same ? "manter" : "substituir");
    const rawTechnique = String(item.tecnicaAvancada || old.technique || "normal").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
    const technique = ["normal", "cluster", "rest_pause", "drop_set", "super_set", "giant_set", "piramidal", "fst7", "myo_reps", "tempo_controlado"].includes(rawTechnique) ? rawTechnique : "normal";
    return {
      order: idx,
      diaTreino: item.diaTreino || basePlan?.day_of_week || "segunda",
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
  };

  const generate = async () => {
    setLoading(true); setError(""); setStep(3);
    const payload = {
      aluno: { nome: student?.name, objetivo: student?.goal, observacoes: student?.notes },
      treinoBase: basePlan,
      historico: { analiseExercicios: analysis, prs: studentPrs.slice(-20), checkins: studentCheckins.slice(-12), medidas: medidas.filter(m => m.student_id === student?.id).slice(-6), bioimpedancia: bios.filter(b => b.student_id === student?.id).slice(-6), fotosReferencia: fotos.filter(f => f.student_id === student?.id).length },
      preferencias: selected,
      pedidoIA: requestText,
    };
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em periodização de musculação. Gere uma nova versão de treino SEM apagar o treino antigo. Use estimativas conservadoras de carga, nunca finja precisão absoluta e explique o motivo de cada troca. Retorne JSON válido. Dados: ${JSON.stringify(payload)}`,
        response_json_schema: {
          type: "object",
          properties: {
            nomeNovoTreino: { type: "string" }, objetivo: { type: "string" }, divisao: { type: "string" }, resumoExecutivo: { type: "string" }, estrategiaNovoTreino: { type: "string" },
            alertas: { type: "array", items: { type: "string" } }, proximosPassos: { type: "array", items: { type: "string" } },
            exercicios: { type: "array", items: { type: "object", properties: { diaTreino: { type: "string" }, exercise_name: { type: "string" }, series: { type: "number" }, repeticoes: { type: "string" }, descanso: { type: "number" }, rir: { type: "string" }, cadencia: { type: "string" }, tecnicaAvancada: { type: "string" }, acao: { type: "string" }, motivo: { type: "string" }, exercicioAntigoRelacionado: { type: "string" }, cargaSugerida: { type: "number" }, confiancaCarga: { type: "string" }, baseEstimativaCarga: { type: "string" }, observacoes: { type: "string" } } } }
          }
        }
      });
      const out = res?.data || res;
      const exercises = (out.exercicios || []).map(normalizeExercise);
      setGenerated(out);
      setGeneratedExercises(exercises.length ? exercises : (basePlan?.exercises || []).map((e, i) => normalizeExercise({ ...e, exercise_name: e.exercise_name, acao: "manter", motivo: "Mantido por segurança; revisar manualmente." }, i)));
      setStep(4);
    } catch (err) {
      setError("Não foi possível gerar agora. Revise os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const updateGenerated = (idx, field, value) => setGeneratedExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  const removeGenerated = idx => setGeneratedExercises(prev => prev.filter((_, i) => i !== idx));
  const addGenerated = () => setGeneratedExercises(prev => [...prev, normalizeExercise({ exercise_name: "Novo exercício", acao: "adicionar" }, prev.length)]);

  const saveSuggestion = async (status = "em_revisao") => {
    const suggestion = await base44.entities.SugestaoNovoTreinoIA.create({
      alunoId: student.id, personalId: currentUser.email, treinoBaseId: basePlan.id,
      nomeSugestao: generated?.nomeNovoTreino || `${basePlan.name} IA`, objetivo: generated?.objetivo || student?.goal || "", divisao: generated?.divisao || basePlan.day_of_week || "",
      pedidoIA: requestText, configuracoesSelecionadas: selected, status, dataCriacao: new Date().toISOString(), criadoPor: currentUser.email,
    });
    await Promise.all(generatedExercises.map((ex, idx) => base44.entities.SugestaoExercicioTreinoIA.create({
      sugestaoNovoTreinoId: suggestion.id, diaTreino: ex.diaTreino, ordem: idx, exercicioAntigoId: ex.exercicioAntigoId, exercicioNovoId: ex.exercise_id, acao: ex.acao,
      motivo: ex.motivo, series: Number(ex.sets || 0), repeticoes: ex.reps, descanso: Number(ex.rest_seconds || 0), rir: ex.rir, cadencia: ex.cadencia,
      tecnicaAvancada: ex.technique, cargaAnterior: Number(ex.cargaAnterior || 0), cargaSugerida: Number(ex.cargaSugerida || 0), faixaCargaMin: Number(ex.faixaCargaMin || 0), faixaCargaMax: Number(ex.faixaCargaMax || 0), confiancaCarga: ex.confiancaCarga, baseEstimativaCarga: ex.baseEstimativaCarga, observacoes: ex.notes,
    })));
    return suggestion;
  };

  const saveDraft = async () => {
    setSaving(true);
    await saveSuggestion("em_revisao");
    setSaving(false);
    toast.success("Rascunho da troca salvo.");
  };

  const applyNewWorkout = async () => {
    if (!window.confirm("Confirmar aplicação? O treino antigo será preservado e arquivado, e uma nova versão será criada.")) return;
    setSaving(true);
    const suggestion = await saveSuggestion("aplicado");
    const newPlan = await base44.entities.WorkoutPlan.create({
      student_id: student.id,
      personal_id: currentUser.email,
      name: generated?.nomeNovoTreino || `${basePlan.name} · versão IA`,
      day_of_week: basePlan.day_of_week,
      exercises: generatedExercises.map((e, idx) => ({ exercise_id: e.exercise_id, exercise_name: e.exercise_name, sets: Number(e.sets || 0), reps: e.reps, load_kg: Number(e.cargaSugerida || 0), rest_seconds: Number(e.rest_seconds || 0), technique: e.technique || "normal", technique_details: e.technique_details || e.motivo, order: idx, notes: e.notes })),
      active: true,
      versao: Number(basePlan.versao || 1) + 1,
      treinoAnteriorId: basePlan.id,
      statusVersao: "atual",
      dataAplicacao: new Date().toISOString(),
      motivoAtualizacao: requestText || "Troca gerada com IA",
    });
    await base44.entities.WorkoutPlan.update(basePlan.id, { ...basePlan, active: false, statusVersao: "substituido", motivoAtualizacao: "Substituído por nova versão com IA" });
    await Promise.all(analysis.map(a => base44.entities.AnaliseProgressaoTreino.create({
      alunoId: student.id, personalId: currentUser.email, treinoId: basePlan.id, exercicioId: a.exercicioId, periodoInicio: "histórico", periodoFim: new Date().toISOString(), execucoes: a.execucoes, ultimaCarga: a.ultimaCarga, melhorCarga: a.melhorCarga, cargaMedia: a.cargaMedia, ultimasRepeticoes: a.ultimasRepeticoes, melhorRepeticao: a.melhorRepeticao, rirMedio: a.rirMedio, statusProgressao: a.statusProgressao, adesao: a.adesao, recomendacao: a.recomendacao, justificativa: a.justificativa,
    })));
    const history = await base44.entities.HistoricoTrocaTreino.create({ alunoId: student.id, personalId: currentUser.email, treinoAntigoId: basePlan.id, treinoNovoId: newPlan.id, dataTroca: new Date().toISOString(), motivoTroca: generated?.resumoExecutivo || "Troca gerada com IA", pedidoIA: requestText, resumoAnalise: generated?.resumoExecutivo || "", status: "aplicado", criadoPor: currentUser.email, aprovadoPor: currentUser.email, relatorioTexto: reportText });
    await base44.entities.RelatorioTrocaTreino.create({ alunoId: student.id, personalId: currentUser.email, treinoAntigoId: basePlan.id, treinoNovoId: newPlan.id, historicoTrocaTreinoId: history.id, titulo: `Relatório IA · ${student.name}`, periodoAnalisado: "histórico registrado", resumoExecutivo: generated?.resumoExecutivo || "", analisePorExercicio: analysis, analisePorGrupoMuscular: [], exerciciosMantidos: generatedExercises.filter(e => e.acao === "manter"), exerciciosSubstituidos: generatedExercises.filter(e => e.acao !== "manter"), estrategiaNovoTreino: generated?.estrategiaNovoTreino || "", alertas: generated?.alertas || [], proximosPassos: generated?.proximosPassos || [], textoCompleto: reportText, dataCriacao: new Date().toISOString() });
    if (student.email) await base44.entities.Notificacao.create({ usuario_id: student.email, titulo: "Treino atualizado", mensagem: "Seu treino foi atualizado pelo seu personal.", tipo: "treino_novo", lida: false, link_destino: "/MyWorkout", icone: "Dumbbell" });
    setApplied(true); setSaving(false); onApplied?.(); toast.success("Novo treino aplicado com segurança.");
  };

  const exportText = () => {
    navigator.clipboard.writeText(reportText);
    toast.success("Relatório copiado em texto limpo.");
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(reportText, 180);
    let y = 15;
    lines.forEach(line => { if (y > 280) { doc.addPage(); y = 15; } doc.text(line, 15, y); y += 6; });
    doc.save(`relatorio_troca_treino_${student?.name || "aluno"}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-white border border-purple-900/40 max-w-6xl max-h-[92vh] overflow-y-auto" style={{ background: "#04040e" }}>
        <DialogHeader>
          <DialogTitle className="font-cyber tracking-widest text-purple-200 flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-300" /> TROCAR TREINO COM IA</DialogTitle>
        </DialogHeader>

        {!canUse ? (
          <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-200">Seu perfil não tem permissão para gerar troca de treino com IA.</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {steps.map((s, i) => <button key={s} onClick={() => i <= step && setStep(i)} className={`rounded-xl px-3 py-2 text-xs border ${i === step ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-purple-900/30 bg-purple-500/5 text-purple-300/60"}`}>{i + 1}. {s}</button>)}
            </div>

            <div className="rounded-xl border border-purple-900/30 bg-purple-500/5 p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div><p className="text-xs text-purple-400/60 font-mono-cyber">ALUNO</p><h3 className="text-lg font-bold">{student?.name}</h3></div>
              <div><p className="text-xs text-purple-400/60 font-mono-cyber">TREINO ATUAL</p><h3 className="text-lg font-bold">{basePlan?.name}</h3></div>
              <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">Treino antigo será preservado</Badge>
            </div>

            {step === 0 && <div className="grid md:grid-cols-3 gap-3">
              {[{ label: "usar o treino atual como base", value: "current" }, { label: "escolher outro treino do aluno", value: "other" }, { label: "criar com histórico completo", value: "history" }].map(o => <button key={o.value} onClick={() => setBaseMode(o.value)} className={`p-4 rounded-xl border text-left ${baseMode === o.value ? "border-cyan-400/50 bg-cyan-400/10" : "border-purple-900/30 bg-purple-500/5"}`}>{o.label}</button>)}
              {baseMode === "other" && <div className="md:col-span-3"><Select value={basePlanId} onValueChange={setBasePlanId}><SelectTrigger className="cyber-input"><SelectValue /></SelectTrigger><SelectContent style={{ background: "#04040e" }}>{studentPlans.map(p => <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>)}</SelectContent></Select></div>}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-6 gap-3 mt-2">
                {[ ["Divisão", dayLabels[basePlan?.day_of_week] || "—"], ["Criação", basePlan?.created_date ? new Date(basePlan.created_date).toLocaleDateString("pt-BR") : "—"], ["Dias", studentPlans.length], ["Exercícios", totalExercises], ["Última execução", lastExecution ? new Date(lastExecution).toLocaleDateString("pt-BR") : "—"], ["Adesão", `${adherence || 0}%`], ["Progresso", `${progressGeneral || 0}%`] ].map(([k, v]) => <div key={k} className="rounded-xl border border-purple-900/20 bg-black/20 p-3"><p className="text-[10px] text-purple-400/50 font-mono-cyber">{k}</p><p className="font-bold">{v}</p></div>)}
              </div>
              <Button onClick={() => setStep(1)} className="md:col-span-3 btn-neon-cyan">CONTINUAR</Button>
            </div>}

            {step === 1 && <div className="space-y-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-sm text-cyan-100">A análise usa treinos executados, séries registradas, PRs, check-ins, medidas, bioimpedância e fotos apenas como referência documental.</p></div>
              <div className="grid md:grid-cols-2 gap-3">{analysis.map(a => <div key={a.nome} className="rounded-xl border border-purple-900/25 bg-black/20 p-4"><div className="flex items-center justify-between gap-2"><h4 className="font-semibold">{a.nome}</h4><Badge className="bg-purple-500/10 text-purple-200 border border-purple-500/20">{a.statusProgressao}</Badge></div><p className="text-xs text-purple-300/60 mt-2">{a.execucoes} execuções · última {a.ultimaCarga || "—"}kg · melhor {a.melhorCarga || "—"}kg · média {a.cargaMedia || "—"}kg · adesão {a.adesao}%</p><p className="text-xs text-purple-200/70 mt-2">{a.justificativa}</p></div>)}</div>
              {analysis.length === 0 && <p className="text-center text-amber-300/70 py-8">Sem dados suficientes. Ainda é possível gerar uma sugestão conservadora.</p>}
              <Button onClick={() => setStep(2)} className="w-full btn-neon-cyan">DEFINIR PREFERÊNCIAS</Button>
            </div>}

            {step === 2 && <div className="space-y-4">
              {Object.entries(options).map(([group, items]) => <div key={group}><h4 className="font-cyber text-sm tracking-widest text-cyan-200 uppercase mb-2">{group}</h4><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{items.map(item => <label key={item} className="flex items-center gap-2 rounded-xl border border-purple-900/25 bg-purple-500/5 p-3 text-sm"><input type="checkbox" checked={selected[group].includes(item)} onChange={() => toggleOption(group, item)} className="w-4 h-4 accent-purple-500" />{item}</label>)}</div></div>)}
              <div><p className="text-xs text-purple-400/60 mb-1">Pedido específico para a IA</p><Textarea value={requestText} onChange={e => setRequestText(e.target.value)} className="cyber-input min-h-28" placeholder="Ex: Troque exercícios sem progressão nas últimas 4 semanas, mantendo supino reto..." /></div>
              <Button onClick={generate} disabled={loading} className="w-full btn-neon-purple py-3"><Brain className="w-4 h-4 mr-2" /> ANALISAR E GERAR NOVO TREINO</Button>
            </div>}

            {step === 3 && <div className="text-center py-14">{loading ? <><Loader2 className="w-10 h-10 mx-auto animate-spin text-cyan-300" /><p className="mt-4 text-cyan-200">Gerando nova versão do treino...</p></> : error ? <p className="text-pink-300">{error}</p> : null}</div>}

            {step === 4 && <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100">A IA gera sugestões. Revise e edite antes de aplicar. Cargas são estimativas baseadas apenas no histórico deste aluno.</div>
              <div className="grid lg:grid-cols-2 gap-4">
                <div><h4 className="font-cyber text-sm text-purple-200 mb-2">TREINO ANTIGO</h4>{(basePlan?.exercises || []).map((ex, idx) => { const a = analysis.find(x => x.nome === ex.exercise_name); return <div key={idx} className="rounded-xl border border-purple-900/25 bg-black/20 p-3 mb-2"><p className="font-semibold">{ex.exercise_name}</p><p className="text-xs text-purple-300/60">{ex.sets} séries · {ex.reps} reps · {ex.rest_seconds || 60}s · carga anterior {a?.ultimaCarga || ex.load_kg || "—"}kg</p><Badge className="mt-2 bg-purple-500/10 text-purple-200 border border-purple-500/20">{a?.statusProgressao || "sem dados"}</Badge></div>})}</div>
                <div><div className="flex items-center justify-between mb-2"><h4 className="font-cyber text-sm text-cyan-200">TREINO NOVO</h4><Button size="sm" variant="outline" onClick={addGenerated}>Adicionar</Button></div>{generatedExercises.map((ex, idx) => <div key={idx} className="rounded-xl border border-cyan-900/30 bg-cyan-500/5 p-3 mb-2 space-y-2"><div className="flex gap-2"><Input value={ex.exercise_name} onChange={e => updateGenerated(idx, "exercise_name", e.target.value)} className="cyber-input" /><Button variant="ghost" size="icon" onClick={() => removeGenerated(idx)}><X className="w-4 h-4" /></Button></div><div className="grid grid-cols-3 gap-2"><Input value={ex.sets} onChange={e => updateGenerated(idx, "sets", e.target.value)} className="cyber-input" placeholder="Séries" /><Input value={ex.reps} onChange={e => updateGenerated(idx, "reps", e.target.value)} className="cyber-input" placeholder="Reps" /><Input value={ex.rest_seconds} onChange={e => updateGenerated(idx, "rest_seconds", e.target.value)} className="cyber-input" placeholder="Descanso" /></div><div className="grid grid-cols-3 gap-2"><Input value={ex.cargaSugerida} onChange={e => updateGenerated(idx, "cargaSugerida", e.target.value)} className="cyber-input" placeholder="Carga" /><Input value={ex.rir} onChange={e => updateGenerated(idx, "rir", e.target.value)} className="cyber-input" placeholder="RIR" /><Input value={ex.cadencia} onChange={e => updateGenerated(idx, "cadencia", e.target.value)} className="cyber-input" placeholder="Cadência" /></div><Textarea value={ex.notes} onChange={e => updateGenerated(idx, "notes", e.target.value)} className="cyber-input" /><div className="flex flex-wrap gap-2"><Badge>{ex.acao}</Badge><Badge className="bg-amber-500/10 text-amber-200 border border-amber-500/20">Confiança {ex.confiancaCarga}</Badge><Badge className="bg-cyan-500/10 text-cyan-200 border border-cyan-500/20">{ex.faixaCargaMin}–{ex.faixaCargaMax} kg</Badge></div><p className="text-xs text-purple-300/60">{ex.baseEstimativaCarga}</p></div>)}</div>
              </div>
              <div className="grid sm:grid-cols-4 gap-2"><Button onClick={saveDraft} disabled={saving} variant="outline"><Save className="w-4 h-4 mr-2" />Rascunho</Button><Button onClick={() => setStep(5)} className="btn-neon-cyan"><FileText className="w-4 h-4 mr-2" />Relatório</Button><Button onClick={applyNewWorkout} disabled={saving || applied} className="btn-neon-purple"><CheckCircle2 className="w-4 h-4 mr-2" />Aplicar novo treino</Button><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button></div>
            </div>}

            {step === 5 && <div className="space-y-4"><pre className="whitespace-pre-wrap rounded-xl border border-purple-900/25 bg-black/30 p-4 text-sm text-purple-100 max-h-[55vh] overflow-auto">{reportText}</pre><div className="grid sm:grid-cols-4 gap-2"><Button onClick={exportPdf} className="btn-neon-purple"><Download className="w-4 h-4 mr-2" />Exportar relatório PDF</Button><Button onClick={exportText} variant="outline">Texto/WhatsApp</Button><Button onClick={() => setStep(4)} variant="outline">Editar treino</Button><Button onClick={applyNewWorkout} disabled={saving || applied} className="btn-neon-cyan">Aplicar novo treino</Button></div></div>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}