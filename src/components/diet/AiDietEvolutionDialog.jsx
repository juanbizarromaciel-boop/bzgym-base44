import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, Download, FileText, Loader2, MessageCircle, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import DietEvolutionReportPreview, { Tag } from "./DietEvolutionReportPreview";
import { analyzeDietAdherence, buildDietPlainReport, buildDietReport, buildDietWhatsAppReport, exportDietReportPdf, normalizeAiDiet, openPrintableDietReport, recalcDietTotals, sumMeal } from "./dietEvolutionReportUtils";

const steps = ["Base", "Análise", "Preferências", "Geração", "Comparação", "Relatório"];
const modeLabels = {
  dieta_completa: "Evoluir dieta completa",
  refeicao_especifica: "Evoluir refeição específica",
  troca_alimentos: "Trocar alimentos específicos",
  ajuste_macros: "Ajustar macros",
  melhorar_adesao: "Melhorar adesão",
};
const options = {
  manter: ["manter calorias atuais", "manter macros atuais", "manter quantidade de refeições", "manter horários", "manter alimentos com boa adesão", "manter refeições com boa adesão", "manter café da manhã", "manter almoço", "manter jantar", "manter lanches", "manter alimentos preferidos", "manter alimentos baratos/práticos", "manter estrutura da dieta atual", "manter proteína parecida", "manter carboidrato parecido", "manter gordura parecida"],
  trocar: ["trocar alimentos com baixa adesão", "trocar alimentos repetitivos", "trocar alimentos caros", "trocar alimentos difíceis de preparar", "trocar alimentos que o usuário não gosta", "trocar alimentos com desconforto relatado", "trocar refeição específica", "trocar todos os lanches", "trocar apenas carboidratos", "trocar apenas proteínas", "trocar apenas gorduras", "trocar alimentos industrializados", "trocar alimentos sem registro de consumo"],
  ajustar: ["aumentar calorias", "reduzir calorias de forma moderada", "aumentar proteína", "reduzir proteína", "aumentar carboidrato", "reduzir carboidrato", "aumentar gordura", "reduzir gordura", "melhorar distribuição dos macros", "deixar dieta mais simples", "deixar dieta mais variada", "deixar dieta mais barata", "deixar dieta mais prática", "deixar dieta com menos preparo", "melhorar saciedade", "melhorar energia no treino", "ajustar refeições pré-treino", "ajustar refeições pós-treino"],
  restricoes: ["evitar alimento específico", "evitar grupo alimentar específico", "respeitar restrições informadas", "respeitar intolerâncias informadas", "respeitar preferências do usuário", "respeitar rotina", "respeitar horários disponíveis", "respeitar alimentos cadastrados no banco", "não sugerir medicamento", "não sugerir substância controlada", "não sugerir dieta extrema"],
};

function canManage(currentUser, owner, plan, selfMode) {
  if (!currentUser) return false;
  if (currentUser.role === "admin") return true;
  if (currentUser.role === "personal") return owner?.personal_id === currentUser.email || plan?.personal_id === currentUser.email || plan?.personalId === currentUser.email;
  if (currentUser.role === "assinante") return selfMode && (plan?.usuarioId === currentUser.email || plan?.assinanteId === currentUser.email || owner?.email === currentUser.email);
  return false;
}

export default function AiDietEvolutionDialog({ open, onOpenChange, plan, owner, currentUser, allPlans = [], selfMode = false, onApplied }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("dieta_completa");
  const [basePlanId, setBasePlanId] = useState("");
  const [selected, setSelected] = useState({ manter: [], trocar: [], ajustar: [], restricoes: [] });
  const [requestText, setRequestText] = useState("");
  const [generatedDiet, setGeneratedDiet] = useState(null);
  const [aiMeta, setAiMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportTheme, setReportTheme] = useState("claro");

  const { data: logs = [] } = useQuery({ queryKey: ["diet-evolution-logs"], queryFn: () => base44.entities.DietLog.list(), enabled: open });
  const { data: foods = [] } = useQuery({ queryKey: ["diet-evolution-foods"], queryFn: () => base44.entities.Food.list(), enabled: open });
  const { data: medidas = [] } = useQuery({ queryKey: ["diet-evolution-medidas"], queryFn: () => base44.entities.MedidasCorporais.list(), enabled: open });
  const { data: bios = [] } = useQuery({ queryKey: ["diet-evolution-bio"], queryFn: () => base44.entities.Bioimpedancia.list(), enabled: open });

  const ownerPlans = useMemo(() => allPlans.filter(p => p.student_id === owner?.id || p.alunoId === owner?.id || p.usuarioId === currentUser?.email || p.assinanteId === currentUser?.email), [allPlans, owner?.id, currentUser?.email]);
  const basePlan = useMemo(() => ownerPlans.find(p => p.id === basePlanId) || plan, [ownerPlans, basePlanId, plan]);
  const relevantLogs = logs.filter(l => l.plan_id === basePlan?.id && (!owner?.id || l.student_id === owner.id));
  const adherence = analyzeDietAdherence(basePlan, relevantLogs);
  const report = useMemo(() => buildDietReport({ owner, currentUser, basePlan, newDiet: generatedDiet || basePlan, logs: relevantLogs, medidas: medidas.filter(m => m.student_id === owner?.id), bios: bios.filter(b => b.student_id === owner?.id), selected, requestText, aiMeta, mode }), [owner, currentUser, basePlan, generatedDiet, relevantLogs, medidas, bios, selected, requestText, aiMeta, mode]);
  const whatsReport = useMemo(() => buildDietWhatsAppReport(report), [report]);
  const plainReport = useMemo(() => buildDietPlainReport(report), [report]);
  const allowed = canManage(currentUser, owner, basePlan, selfMode);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setMode("dieta_completa");
    setBasePlanId(plan?.id || "");
    setSelected({ manter: [], trocar: [], ajustar: [], restricoes: [] });
    setRequestText("");
    setGeneratedDiet(null);
    setAiMeta({});
    setReportTheme("claro");
  }, [open, plan?.id]);

  const toggleOption = (group, item) => setSelected(prev => ({ ...prev, [group]: prev[group].includes(item) ? prev[group].filter(i => i !== item) : [...prev[group], item] }));

  const generate = async () => {
    if (!basePlan) { toast.error("Selecione uma dieta base."); return; }
    setLoading(true); setStep(3);
    const payload = {
      modo: mode,
      usuario: { nome: owner?.name || owner?.full_name || owner?.email, objetivo: owner?.goal, preferencias: owner?.preferences, restricoes: owner?.restrictions },
      dietaAtual: basePlan,
      analiseAdesao: adherence,
      historico: { logs: relevantLogs.slice(-30), medidas: medidas.filter(m => m.student_id === owner?.id).slice(-6), bioimpedancia: bios.filter(b => b.student_id === owner?.id).slice(-6) },
      bancoAlimentos: foods.slice(0, 80).map(f => ({ id: f.id, name: f.name, category: f.category, calories_per_100g: f.calories_per_100g, protein_per_100g: f.protein_per_100g, carbs_per_100g: f.carbs_per_100g, fat_per_100g: f.fat_per_100g })),
      preferencias: selected,
      pedidoIA: requestText,
    };
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é nutricionista esportivo assistente do BZ Gym System. Evolua a dieta sem prescrever tratamento, medicamento, substância controlada ou dieta extrema. Use apenas dados do próprio usuário. Preserve o que funcionou, troque baixa adesão por equivalentes comuns/práticos e marque confiança. Retorne JSON válido. Dados: ${JSON.stringify(payload)}`,
        response_json_schema: {
          type: "object",
          properties: {
            nomeNovaDieta: { type: "string" }, objetivo: { type: "string" }, resumoExecutivo: { type: "string" }, estrategiaNovaDieta: { type: "string" }, alertas: { type: "array", items: { type: "string" } },
            meals: { type: "array", items: { type: "object", properties: { name: { type: "string" }, time: { type: "string" }, foods: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "number" }, unit: { type: "string" }, calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, acao: { type: "string" }, motivo: { type: "string" }, alimentoAntigoRelacionado: { type: "string" }, confiancaEquivalencia: { type: "string" }, baseEquivalencia: { type: "string" } } } } } } }
          }
        }
      });
      const out = res?.data || res;
      setAiMeta(out || {});
      setGeneratedDiet(normalizeAiDiet(out, basePlan));
      setStep(4);
      toast.success("Nova dieta gerada. Revise antes de aplicar.");
    } catch (e) {
      toast.error("Não foi possível gerar agora: " + e.message);
    }
    setLoading(false);
  };

  const updateMeal = (mealIdx, field, value) => setGeneratedDiet(prev => {
    const meals = [...(prev.meals || [])];
    meals[mealIdx] = { ...meals[mealIdx], [field]: value };
    return { ...prev, meals, ...recalcDietTotals(meals) };
  });
  const updateItem = (mealIdx, itemIdx, field, value) => setGeneratedDiet(prev => {
    const meals = [...(prev.meals || [])];
    const items = [...(meals[mealIdx].items || [])];
    items[itemIdx] = { ...items[itemIdx], [field]: ["quantity_g", "calories", "protein_g", "carbs_g", "fat_g"].includes(field) ? Number(value || 0) : value };
    const totals = sumMeal({ items });
    meals[mealIdx] = { ...meals[mealIdx], items, calories: totals.calories, foods: items.map(i => `${i.food_name}: ${i.quantity_g}${i.unit || "g"}`).join(", ") };
    return { ...prev, meals, ...recalcDietTotals(meals) };
  });
  const removeItem = (mealIdx, itemIdx) => setGeneratedDiet(prev => {
    const meals = [...(prev.meals || [])];
    const items = meals[mealIdx].items.filter((_, i) => i !== itemIdx);
    const totals = sumMeal({ items });
    meals[mealIdx] = { ...meals[mealIdx], items, calories: totals.calories };
    return { ...prev, meals, ...recalcDietTotals(meals) };
  });
  const addItem = (mealIdx) => setGeneratedDiet(prev => {
    const meals = [...(prev.meals || [])];
    meals[mealIdx] = { ...meals[mealIdx], items: [...(meals[mealIdx].items || []), { food_name: "Novo alimento", quantity_g: 100, unit: "g", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, acao: "adicionar", motivo: "Adicionado manualmente.", confiancaEquivalencia: "baixa" }] };
    return { ...prev, meals, ...recalcDietTotals(meals) };
  });

  const saveSuggestion = async (status = "em_revisao", historyId = "") => {
    const suggestion = await base44.entities.SugestaoNovaDietaIA.create({
      alunoId: owner?.id || "", assinanteId: selfMode ? currentUser?.email : "", usuarioId: currentUser?.email || "", personalId: currentUser?.role === "personal" ? currentUser.email : basePlan?.personal_id || "", dietaBaseId: basePlan.id,
      nomeSugestao: generatedDiet.name, objetivo: generatedDiet.goal, caloriasAlvo: generatedDiet.total_calories, proteinaAlvo: generatedDiet.protein_g, carboAlvo: generatedDiet.carbs_g, gorduraAlvo: generatedDiet.fat_g,
      pedidoIA: requestText, configuracoesSelecionadas: { ...selected, modo: mode, historicoId: historyId }, status, dataCriacao: new Date().toISOString(), criadoPor: currentUser.email,
    });
    await Promise.all(report.comparativoAntigoNovo.map(r => base44.entities.SugestaoTrocaAlimentoIA.create({
      sugestaoNovaDietaId: suggestion.id, acao: r.decisao, motivo: r.motivo, quantidadeAntiga: r.quantidadeAntiga, quantidadeNova: r.quantidadeNova, unidade: r.unidade, caloriasAntigas: r.caloriasAntigas, caloriasNovas: r.caloriasNovas, proteinaAntiga: r.proteinaAntiga, proteinaNova: r.proteinaNova, carboAntigo: r.carboAntigo, carboNovo: r.carboNovo, gorduraAntiga: r.gorduraAntiga, gorduraNova: r.gorduraNova, diferencaCalorias: r.diferencaCalorias, diferencaProteina: r.proteinaNova - r.proteinaAntiga, diferencaCarbo: r.carboNovo - r.carboAntigo, diferencaGordura: r.gorduraNova - r.gorduraAntiga, confiancaEquivalencia: r.confianca, baseEquivalencia: r.baseEquivalencia, observacoes: r.motivo
    })));
  };

  const saveDraft = async () => {
    if (!generatedDiet) return;
    setSaving(true);
    const history = await base44.entities.HistoricoEvolucaoDietaIA.create({ alunoId: owner?.id || "", assinanteId: selfMode ? currentUser?.email : "", usuarioId: currentUser?.email || "", personalId: basePlan?.personal_id || currentUser?.email || "", dietaAntigaId: basePlan.id, dietaNovaId: "", modoEvolucao: mode, dataEvolucao: new Date().toISOString(), motivoEvolucao: "Rascunho de evolução de dieta com IA", pedidoIA: requestText, resumoAnalise: report.resumoExecutivo, status: "rascunho", criadoPor: currentUser.email, relatorioTexto: plainReport });
    await saveSuggestion("em_revisao", history.id);
    setSaving(false); toast.success("Rascunho da dieta salvo.");
  };

  const applyDiet = async () => {
    if (!generatedDiet || !window.confirm("Aplicar nova dieta? A dieta antiga será preservada e marcada como substituída.")) return;
    setSaving(true);
    const history = await base44.entities.HistoricoEvolucaoDietaIA.create({ alunoId: owner?.id || "", assinanteId: selfMode ? currentUser?.email : "", usuarioId: currentUser?.email || "", personalId: basePlan?.personal_id || currentUser?.email || "", dietaAntigaId: basePlan.id, dietaNovaId: "", modoEvolucao: mode, dataEvolucao: new Date().toISOString(), motivoEvolucao: report.resumoExecutivo, pedidoIA: requestText, resumoAnalise: report.resumoExecutivo, status: "aplicado", criadoPor: currentUser.email, aprovadoPor: currentUser.email, relatorioTexto: plainReport });
    const newPlan = await base44.entities.DietPlan.create({
      student_id: basePlan.student_id || owner?.id || "", alunoId: owner?.id || basePlan.alunoId || "", personal_id: basePlan.personal_id || (currentUser?.role === "personal" ? currentUser.email : ""), personalId: basePlan.personal_id || (currentUser?.role === "personal" ? currentUser.email : ""),
      name: generatedDiet.name, goal: generatedDiet.goal, total_calories: generatedDiet.total_calories, protein_g: generatedDiet.protein_g, carbs_g: generatedDiet.carbs_g, fat_g: generatedDiet.fat_g, meals: generatedDiet.meals, notes: generatedDiet.notes, active: true,
      versao: Number(basePlan.versao || 1) + 1, dietaAnteriorId: basePlan.id, statusVersao: "atual", dataAplicacao: new Date().toISOString(), motivoAtualizacao: requestText || "Evolução de dieta com IA", evoluidaPorIA: true, historicoEvolucaoId: history.id,
      tipoDono: selfMode ? "assinante" : "aluno", usuarioId: selfMode ? currentUser.email : basePlan.usuarioId || "", assinanteId: selfMode ? currentUser.email : basePlan.assinanteId || "",
    });
    await base44.entities.DietPlan.update(basePlan.id, { ...basePlan, active: false, statusVersao: "substituida", motivoAtualizacao: "Substituída por evolução de dieta com IA" });
    await base44.entities.HistoricoEvolucaoDietaIA.update(history.id, { dietaNovaId: newPlan.id });
    await saveSuggestion("aplicado", history.id);
    const rel = await base44.entities.RelatorioEvolucaoDieta.create({
      alunoId: owner?.id || "", assinanteId: selfMode ? currentUser.email : "", usuarioId: currentUser.email, personalId: basePlan.personal_id || currentUser.email, dietaAntigaId: basePlan.id, dietaNovaId: newPlan.id, historicoEvolucaoDietaId: history.id,
      titulo: `Relatório de Evolução de Dieta · ${report.usuario.nome}`, periodoAnalisado: report.periodoAnalisado, resumoExecutivo: report.resumoExecutivo, metricasResumoJson: report.metricasResumo, analiseAdesao: report.analiseAdesao, analisePorRefeicao: report.analisePorRefeicao, analisePorAlimento: report.analisePorAlimento,
      comparativoAntigoNovo: report.comparativoAntigoNovo, macrosAntigos: report.macrosAntigos, macrosNovos: report.macrosNovos, alimentosMantidos: report.alimentosMantidos, alimentosSubstituidos: report.alimentosSubstituidos, alimentosAdicionados: report.alimentosAdicionados, alimentosRemovidos: report.alimentosRemovidos,
      estrategiaNovaDieta: report.estrategiaNovaDieta, alertas: report.alertas, conclusao: report.conclusao, proximosPassos: report.proximosPassos, graficosJson: report.graficos, tabelasJson: { comparativo: report.comparativoAntigoNovo }, temaPdf: reportTheme, textoWhatsapp: whatsReport, statusExportacao: "concluido", dataCriacao: new Date().toISOString(), dataExportacao: new Date().toISOString(), geradoPorIA: true, revisadoPorPersonal: currentUser.role !== "assinante", visivelParaAluno: false,
    });
    await Promise.all([
      base44.entities.SecoesRelatorioDieta.create({ relatorioEvolucaoDietaId: rel.id, titulo: "Capa", tipoSecao: "capa", conteudoHtml: `<h1>Relatório de Evolução de Dieta</h1><p>${report.usuario.nome}</p>`, dadosJson: report, ordem: 1, visivelNoPdf: true }),
      base44.entities.SecoesRelatorioDieta.create({ relatorioEvolucaoDietaId: rel.id, titulo: "Resumo Executivo", tipoSecao: "resumo", conteudoHtml: report.resumoExecutivo, dadosJson: report.metricasResumo, ordem: 2, visivelNoPdf: true }),
      base44.entities.GraficosRelatorioDieta.create({ relatorioEvolucaoDietaId: rel.id, tipoGrafico: "adesao_refeicoes", titulo: "Adesão por refeição", descricao: "Percentual de conclusão por refeição", dadosJson: report.graficos.adesaoRefeicoes, ordem: 1 }),
      base44.entities.GraficosRelatorioDieta.create({ relatorioEvolucaoDietaId: rel.id, tipoGrafico: "macros", titulo: "Macros antigos vs novos", descricao: "Comparativo de proteínas, carboidratos e gorduras", dadosJson: report.graficos.macrosComparativo, ordem: 2 }),
      base44.entities.GraficosRelatorioDieta.create({ relatorioEvolucaoDietaId: rel.id, tipoGrafico: "calorias", titulo: "Calorias antigas vs novas", descricao: "Comparativo calórico", dadosJson: report.graficos.caloriasComparativo, ordem: 3 }),
      base44.entities.GraficosRelatorioDieta.create({ relatorioEvolucaoDietaId: rel.id, tipoGrafico: "alimentos_status", titulo: "Status dos alimentos", descricao: "Mantidos, substituídos, adicionados e removidos", dadosJson: report.graficos.statusAlimentos, ordem: 4 }),
      base44.entities.GraficosRelatorioDieta.create({ relatorioEvolucaoDietaId: rel.id, tipoGrafico: "refeicoes_status", titulo: "Status das refeições", descricao: "Boa, média e baixa adesão", dadosJson: report.graficos.refeicoesStatus, ordem: 5 }),
      base44.entities.GraficosRelatorioDieta.create({ relatorioEvolucaoDietaId: rel.id, tipoGrafico: "progresso_corporal", titulo: "Progresso corporal", descricao: "Peso e medidas quando disponíveis", dadosJson: { pontos: report.graficos.progressoCorporal }, ordem: 6 }),
    ]);
    if (owner?.email) await base44.entities.Notificacao.create({ usuario_id: owner.email, titulo: "Sua dieta foi atualizada", mensagem: "Uma nova versão da sua dieta foi aplicada.", tipo: "dieta_nova", lida: false, link_destino: "/MyDiet", icone: "Utensils" });
    setSaving(false); toast.success("Nova dieta aplicada com histórico preservado."); onApplied?.(); onOpenChange(false);
  };

  const exportPdf = (theme = reportTheme) => { exportDietReportPdf(report, theme); toast.success(theme === "escuro" ? "PDF escuro premium exportado." : "PDF claro premium exportado."); };
  const exportHtml = () => { openPrintableDietReport(report, reportTheme); toast.success("HTML imprimível aberto."); };
  const exportWhatsApp = () => { navigator.clipboard.writeText(whatsReport); toast.success("Resumo WhatsApp copiado."); };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="text-white border border-emerald-900/40 max-w-6xl max-h-[92vh] overflow-y-auto" style={{ background: "#04040e" }}>
      <DialogHeader><DialogTitle className="font-cyber tracking-widest text-emerald-200 flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-300" /> EVOLUIR DIETA COM IA</DialogTitle></DialogHeader>
      {!allowed ? <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-200">Seu perfil não tem permissão para evoluir esta dieta.</div> : <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">{steps.map((s, i) => <button key={s} onClick={() => i <= step && setStep(i)} className={`rounded-xl px-3 py-2 text-xs border ${i === step ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-purple-900/30 bg-purple-500/5 text-purple-300/60"}`}>{i + 1}. {s}</button>)}</div>
        <div className="rounded-xl border border-emerald-900/30 bg-emerald-500/5 p-4 grid md:grid-cols-5 gap-3"><div><p className="text-xs text-emerald-400/60 font-mono-cyber">USUÁRIO</p><b>{owner?.name || owner?.full_name || owner?.email}</b></div><div><p className="text-xs text-emerald-400/60 font-mono-cyber">DIETA</p><b>{basePlan?.name}</b></div><div><p className="text-xs text-emerald-400/60 font-mono-cyber">KCAL</p><b>{basePlan?.total_calories || 0}</b></div><div><p className="text-xs text-emerald-400/60 font-mono-cyber">REFEIÇÕES</p><b>{basePlan?.meals?.length || 0}</b></div><div><p className="text-xs text-emerald-400/60 font-mono-cyber">ADESÃO</p><b>{adherence.adesaoMedia}%</b></div></div>

        {step === 0 && <div className="space-y-4"><div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">{Object.entries(modeLabels).map(([key, label]) => <button key={key} onClick={() => setMode(key)} className={`p-4 rounded-xl border text-left ${mode === key ? "border-emerald-400/50 bg-emerald-400/10" : "border-purple-900/30 bg-purple-500/5"}`}><h3 className="font-bold text-sm">{label}</h3><p className="text-xs text-purple-200/60 mt-2">Revisão manual obrigatória antes de aplicar.</p></button>)}</div>{ownerPlans.length > 1 && <select value={basePlanId} onChange={e => setBasePlanId(e.target.value)} className="cyber-input w-full p-3 rounded-xl bg-black"><option value="">Escolher dieta base</option>{ownerPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}<Button onClick={() => setStep(1)} className="w-full btn-neon-cyan">ANALISAR DIETA</Button></div>}

        {step === 1 && <div className="space-y-3"><div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-100">A análise usa dieta, checklist alimentar, substituições registradas, check-ins, medidas e bioimpedância quando disponíveis. Dados insuficientes reduzem a precisão.</div><div className="grid md:grid-cols-2 gap-3">{adherence.refeicoes.map(r => <div key={r.refeicao} className="rounded-xl border border-purple-900/25 bg-black/20 p-4"><div className="flex justify-between"><b>{r.refeicao}</b><Tag value={r.statusAdesao} /></div><p className="text-xs text-purple-300/60 mt-2">{r.concluidas}/{r.planejadas} itens concluídos · {r.percentualAdesao}% · {r.justificativa}</p></div>)}</div><Button onClick={() => setStep(2)} className="w-full btn-neon-cyan">DEFINIR PREFERÊNCIAS</Button></div>}

        {step === 2 && <div className="space-y-4">{Object.entries(options).map(([group, items]) => <div key={group}><h4 className="font-cyber text-sm tracking-widest text-emerald-200 uppercase mb-2">{group}</h4><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{items.map(item => <label key={item} className="flex items-center gap-2 rounded-xl border border-purple-900/25 bg-purple-500/5 p-3 text-sm"><input type="checkbox" checked={selected[group].includes(item)} onChange={() => toggleOption(group, item)} className="w-4 h-4 accent-emerald-500" />{item}</label>)}</div></div>)}<Textarea value={requestText} onChange={e => setRequestText(e.target.value)} className="cyber-input min-h-28" placeholder="Pedido específico para a IA: manter arroz, frango e ovos, trocar baixa adesão, deixar mais prática..." /><Button onClick={generate} disabled={loading} className="w-full btn-neon-purple py-3"><Brain className="w-4 h-4 mr-2" /> ANALISAR E GERAR NOVA DIETA</Button></div>}

        {step === 3 && <div className="text-center py-14">{loading ? <><Loader2 className="w-10 h-10 mx-auto animate-spin text-emerald-300" /><p className="mt-4 text-emerald-200">Gerando nova versão da dieta...</p></> : null}</div>}

        {step === 4 && generatedDiet && <div className="space-y-4"><div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100">A IA gera sugestões. Revise antes de aplicar. As substituições alimentares são estimativas e não substituem acompanhamento profissional individualizado.</div><DietEvolutionReportPreview report={report} />{generatedDiet.meals.map((meal, mi) => <div key={mi} className="rounded-2xl border border-emerald-900/25 bg-black/25 p-4 space-y-3"><div className="grid md:grid-cols-2 gap-2"><Input value={meal.name} onChange={e => updateMeal(mi, "name", e.target.value)} className="cyber-input" /><Input value={meal.time} onChange={e => updateMeal(mi, "time", e.target.value)} className="cyber-input" /></div>{meal.items.map((item, ii) => <div key={ii} className="rounded-xl border border-purple-900/25 bg-purple-500/5 p-3 space-y-2"><div className="flex gap-2"><Input value={item.food_name} onChange={e => updateItem(mi, ii, "food_name", e.target.value)} className="cyber-input" /><Button size="icon" variant="ghost" onClick={() => removeItem(mi, ii)}><X className="w-4 h-4" /></Button></div><div className="grid grid-cols-2 md:grid-cols-5 gap-2"><Input value={item.quantity_g} onChange={e => updateItem(mi, ii, "quantity_g", e.target.value)} className="cyber-input" /><Input value={item.calories} onChange={e => updateItem(mi, ii, "calories", e.target.value)} className="cyber-input" /><Input value={item.protein_g} onChange={e => updateItem(mi, ii, "protein_g", e.target.value)} className="cyber-input" /><Input value={item.carbs_g} onChange={e => updateItem(mi, ii, "carbs_g", e.target.value)} className="cyber-input" /><Input value={item.fat_g} onChange={e => updateItem(mi, ii, "fat_g", e.target.value)} className="cyber-input" /></div><Textarea value={item.motivo} onChange={e => updateItem(mi, ii, "motivo", e.target.value)} className="cyber-input" /><div className="flex gap-2 flex-wrap"><Tag value={item.acao} /><Tag value={item.confiancaEquivalencia} /></div></div>)}<Button size="sm" variant="outline" onClick={() => addItem(mi)}>Adicionar alimento</Button></div>)}<div className="grid sm:grid-cols-5 gap-2"><Button onClick={saveDraft} disabled={saving} variant="outline"><Save className="w-4 h-4 mr-2" />Rascunho</Button><Button onClick={() => setStep(5)} className="btn-neon-cyan"><FileText className="w-4 h-4 mr-2" />Relatório</Button><Button onClick={applyDiet} disabled={saving} className="btn-neon-purple"><CheckCircle2 className="w-4 h-4 mr-2" />Aplicar nova dieta</Button><Button onClick={exportWhatsApp} variant="outline"><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</Button><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button></div></div>}

        {step === 5 && <div className="space-y-4"><div className="flex flex-wrap gap-2"><Button onClick={() => setReportTheme("claro")} variant={reportTheme === "claro" ? "default" : "outline"}>Tema claro</Button><Button onClick={() => setReportTheme("escuro")} variant={reportTheme === "escuro" ? "default" : "outline"}>Tema escuro premium</Button></div><DietEvolutionReportPreview report={report} /><div className="grid sm:grid-cols-5 gap-2"><Button onClick={() => exportPdf("claro")} className="btn-neon-purple"><Download className="w-4 h-4 mr-2" />PDF claro</Button><Button onClick={() => exportPdf("escuro")} className="btn-neon-cyan"><Download className="w-4 h-4 mr-2" />PDF escuro</Button><Button onClick={exportHtml} variant="outline">HTML imprimível</Button><Button onClick={exportWhatsApp} variant="outline"><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</Button><Button onClick={applyDiet} disabled={saving} className="btn-neon-purple">Aplicar</Button></div></div>}
      </div>}
    </DialogContent>
  </Dialog>;
}