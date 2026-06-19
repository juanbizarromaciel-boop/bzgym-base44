import jsPDF from "jspdf";

export const dayLabels = { segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado", domingo: "Domingo" };

const words = (name = "") => name.split(/[—-]/).map(p => p.trim()).filter(Boolean);
const pct = (n) => Math.max(0, Math.min(100, Math.round(Number(n || 0))));
const sum = (arr, fn) => arr.reduce((a, x) => a + Number(fn(x) || 0), 0);

export function getCycleName(plans = [], fallback = "Ciclo atual") {
  const firstParts = plans.map(p => words(p.name)[0]).filter(Boolean);
  if (!firstParts.length) return fallback;
  const first = firstParts[0];
  return firstParts.every(p => p === first) ? first : fallback;
}

export function compactPlanName(name = "", cycleName = "") {
  if (!name) return "Treino";
  if (cycleName && name.startsWith(cycleName)) return name.replace(cycleName, "").replace(/^\s*[—-]\s*/, "").trim() || name;
  return name;
}

function shortText(text = "", maxLines = 7) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Análise gerada com base nos registros disponíveis. Revise cargas, execução e RIR antes de aplicar.";
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxLines).join(" ");
}

function inferGroup(exercise = "") {
  const n = exercise.toLowerCase();
  if (/supino|peito|crucifixo|voador|crossover/.test(n)) return "Peito";
  if (/remada|puxada|barra|costas|pulldown/.test(n)) return "Costas";
  if (/agach|leg|extensora|quadr[ií]ceps|hack/.test(n)) return "Quadríceps";
  if (/stiff|mesa|flexora|posterior|terra/.test(n)) return "Posteriores";
  if (/gl[uú]teo|eleva[cç][aã]o p[eé]lvica|abdu/.test(n)) return "Glúteos";
  if (/desenvolvimento|eleva[cç][aã]o lateral|ombro/.test(n)) return "Ombros";
  if (/tr[ií]ceps/.test(n)) return "Tríceps";
  if (/b[ií]ceps|rosca/.test(n)) return "Bíceps";
  if (/panturrilha|gêmeos/.test(n)) return "Panturrilhas";
  if (/abd[oô]men|prancha|abdominal/.test(n)) return "Core";
  return "Outros";
}

function buildVolumeByGroup(selectedPlans = [], generatedPlans = []) {
  const map = new Map();
  const add = (group, key, value) => {
    const current = map.get(group) || { grupoMuscular: group, volumeAnterior: 0, volumeNovo: 0, frequenciaSemanal: 0, status: "sem dados", recomendacao: "Monitorar", observacao: "Dados limitados." };
    current[key] += value;
    map.set(group, current);
  };
  selectedPlans.forEach(p => (p.exercises || []).forEach(e => add(inferGroup(e.exercise_name), "volumeAnterior", Number(e.sets || 0))));
  generatedPlans.forEach(p => (p.exercises || []).forEach(e => add(inferGroup(e.exercise_name), "volumeNovo", Number(e.sets || 0))));
  return Array.from(map.values()).map(g => {
    const diff = g.volumeNovo - g.volumeAnterior;
    return {
      ...g,
      frequenciaSemanal: [g.volumeAnterior, g.volumeNovo].filter(v => v > 0).length,
      status: g.volumeAnterior === 0 && g.volumeNovo === 0 ? "sem dados" : diff > 4 ? "aumentou" : diff < -4 ? "reduziu" : "equilibrado",
      recomendacao: diff > 4 ? "Acompanhar recuperação." : diff < -4 ? "Verificar se o volume segue suficiente." : "Manter e monitorar progressão.",
      observacao: "Volume aproximado calculado por séries registradas no treino.",
    };
  });
}

export function normalizeEvolutionReport({ student, currentUser, mode, selectedPlans = [], generatedPlans = [], analyses = [], generatedMeta = {}, requestText = "", adherence = 0, prs = [] }) {
  const cicloAnterior = getCycleName(selectedPlans, mode === "plano_completo" ? "Ciclo anterior" : selectedPlans[0]?.name || "Treino anterior");
  const cicloNovo = generatedMeta?.nomeNovoCiclo || getCycleName(generatedPlans, mode === "plano_completo" ? "Novo ciclo IA" : generatedPlans[0]?.name || "Novo treino IA");
  const allAnalysis = analyses.flatMap(a => a.exerciseAnalysis.map(e => ({ ...e, treinoId: a.plan.id, treino: compactPlanName(a.plan.name, cicloAnterior), dia: dayLabels[a.plan.day_of_week] || a.plan.day_of_week }))); 
  const allGenerated = generatedPlans.flatMap(g => g.exercises.map(e => ({ ...e, treinoId: g.basePlanId, treino: compactPlanName(g.name, cicloNovo), dia: dayLabels[g.day_of_week] || g.day_of_week })));
  const byAction = (acao) => allGenerated.filter(e => e.acao === acao);
  const statusCount = {
    evoluiu: allAnalysis.filter(e => e.statusProgressao === "evoluiu").length,
    manteve: allAnalysis.filter(e => e.statusProgressao === "manteve").length,
    regrediu: allAnalysis.filter(e => e.statusProgressao === "regrediu").length,
    semDados: allAnalysis.filter(e => e.statusProgressao === "sem_dados").length,
  };
  const cargasMantidas = allGenerated.filter(e => e.acao === "manter" && e.cargaSugerida).length;
  const cargasEstimadas = allGenerated.filter(e => e.acao !== "manter" && e.cargaSugerida).length;
  const cargasSemDados = allGenerated.filter(e => !e.cargaSugerida || e.confiancaCarga === "baixa").length;
  const confiancas = allGenerated.map(e => e.confiancaCarga).filter(Boolean);
  const baixa = confiancas.filter(c => c === "baixa").length;
  const media = confiancas.filter(c => c === "media").length;
  const alta = confiancas.filter(c => c === "alta").length;
  const confiancaGeral = baixa > alta && baixa >= media ? "baixa" : alta >= media ? "alta" : "média";

  const analisePorTreino = generatedPlans.map((gp) => {
    const oldPlan = selectedPlans.find(p => p.id === gp.basePlanId) || {};
    const oldAnalysis = analyses.find(a => a.plan.id === gp.basePlanId)?.exerciseAnalysis || [];
    const rows = gp.exercises.map(ex => {
      const old = (oldPlan.exercises || []).find(o => o.exercise_name === ex.exercicioAntigoRelacionado || o.exercise_name === ex.exercise_name) || {};
      const stats = oldAnalysis.find(a => a.nome === old.exercise_name || a.nome === ex.exercicioAntigoRelacionado || a.nome === ex.exercise_name) || {};
      return {
        treino: compactPlanName(gp.name, cicloNovo),
        exercicioAntigo: ex.acao === "adicionar" ? "—" : (old.exercise_name || ex.exercicioAntigoRelacionado || "—"),
        status: stats.statusProgressao || "sem_dados",
        decisao: ex.acao || "manter",
        exercicioNovo: ex.acao === "remover" ? "—" : ex.exercise_name,
        motivo: ex.motivo || ex.notes || "Revisar justificativa.",
        cargaAnterior: ex.cargaAnterior || stats.ultimaCarga || 0,
        cargaSugerida: ex.cargaSugerida || 0,
        faixa: ex.faixaCargaMin && ex.faixaCargaMax ? `${ex.faixaCargaMin}-${ex.faixaCargaMax} kg` : "sem dados suficientes",
        confianca: ex.confiancaCarga || "baixa",
        baseEstimativa: ex.baseEstimativaCarga || "Sem dados suficientes.",
      };
    });
    return {
      id: gp.basePlanId,
      nome: compactPlanName(gp.name, cicloNovo),
      dia: dayLabels[gp.day_of_week] || gp.day_of_week || "—",
      foco: gp.foco || generatedMeta?.objetivo || student?.goal || "—",
      resumo: {
        avaliados: oldAnalysis.length,
        mantidos: rows.filter(r => r.decisao === "manter").length,
        substituidos: rows.filter(r => r.decisao === "substituir").length,
        adicionados: rows.filter(r => r.decisao === "adicionar").length,
        removidos: rows.filter(r => r.decisao === "remover").length,
      },
      rows,
    };
  });

  const metricasResumo = {
    treinosAnalisados: selectedPlans.length,
    exerciciosAvaliados: sum(selectedPlans, p => (p.exercises || []).length),
    exerciciosMantidos: byAction("manter").length,
    exerciciosSubstituidos: byAction("substituir").length,
    exerciciosAdicionados: byAction("adicionar").length,
    exerciciosRemovidos: byAction("remover").length,
    cargasMantidas,
    cargasEstimadas,
    confiancaGeral,
    adesaoMedia: pct(adherence),
  };

  const alteracoes = {
    mantidos: metricasResumo.exerciciosMantidos,
    substituidos: metricasResumo.exerciciosSubstituidos,
    adicionados: metricasResumo.exerciciosAdicionados,
    removidos: metricasResumo.exerciciosRemovidos,
  };

  const graficos = {
    adesaoTreino: { treinosPrevistos: Math.max(selectedPlans.length * 4, 1), treinosConcluidos: Math.round((pct(adherence) / 100) * Math.max(selectedPlans.length * 4, 1)), percentualAdesao: pct(adherence) },
    statusExercicios: statusCount,
    volumeGrupoMuscular: buildVolumeByGroup(selectedPlans, generatedPlans),
    alteracoesExercicios: alteracoes,
    cargas: { cargasMantidas, cargasEstimadas, cargasSemDados },
    prsPeriodo: prs.slice(-10).map(p => ({ exercicio: p.exercise_name || p.exercicio || "PR", carga: p.load_kg || p.carga || 0, repeticoes: p.reps || p.repeticoes || 0, data: p.date || p.created_date })),
  };

  const cargas = allGenerated.map(e => ({
    treino: e.treino,
    exercicio: e.exercise_name,
    ultimaCarga: e.cargaAnterior || 0,
    melhorCarga: e.melhorCarga || e.cargaAnterior || 0,
    mediaRecente: e.cargaMedia || 0,
    cargaSugerida: e.cargaSugerida || 0,
    faixaMin: e.faixaCargaMin || 0,
    faixaMax: e.faixaCargaMax || 0,
    confianca: e.confiancaCarga || "baixa",
    observacao: e.baseEstimativaCarga || "Sem dados suficientes. Confirmar na execução.",
  }));

  const principaisMudancas = [
    metricasResumo.exerciciosMantidos ? `${metricasResumo.exerciciosMantidos} exercícios mantidos por boa resposta ou continuidade técnica.` : null,
    metricasResumo.exerciciosSubstituidos ? `${metricasResumo.exerciciosSubstituidos} exercícios substituídos por estagnação, baixa adesão ou ajuste de foco.` : null,
    metricasResumo.exerciciosAdicionados ? `${metricasResumo.exerciciosAdicionados} exercícios adicionados para complementar o novo ciclo.` : null,
  ].filter(Boolean);

  const alertas = [
    ...(generatedMeta?.alertas || []),
    cargasSemDados ? "Há cargas com baixa confiança ou poucos registros recentes." : null,
    metricasResumo.adesaoMedia < 50 ? "Adesão média baixa: acompanhar frequência nas próximas sessões." : null,
    statusCount.semDados ? "Alguns exercícios não possuem dados suficientes para análise precisa." : null,
  ].filter(Boolean);

  return {
    aluno: { id: student?.id, nome: student?.name || "Aluno", objetivo: student?.goal || "—", nivel: student?.level || "—" },
    personal: { email: currentUser?.email, nome: currentUser?.full_name || currentUser?.email || "—" },
    cicloAnterior,
    cicloNovo,
    periodoAnalisado: "Histórico registrado até " + new Date().toLocaleDateString("pt-BR"),
    modoRelatorio: mode,
    dataAnalise: new Date().toLocaleDateString("pt-BR"),
    resumoExecutivo: shortText(generatedMeta?.resumoExecutivo),
    estrategiaNovoCiclo: shortText(generatedMeta?.estrategiaNovoCiclo || generatedMeta?.estrategiaNovoTreino || "Monitorar técnica, RIR e resposta de carga nas primeiras sessões."),
    metricasResumo,
    treinosAnalisados: selectedPlans.map(p => ({ id: p.id, nome: compactPlanName(p.name, cicloAnterior), dia: dayLabels[p.day_of_week] || p.day_of_week, exercicios: (p.exercises || []).length })),
    analisePorTreino,
    analisePorGrupoMuscular: graficos.volumeGrupoMuscular,
    comparativoAntigoNovo: analisePorTreino.flatMap(t => t.rows.map(r => ({ ...r, treino: t.nome }))),
    cargas,
    graficos,
    principaisMudancas,
    alertas,
    pedidoIA: requestText,
    conclusao: "A nova versão deve ser aplicada somente após revisão profissional, com ajustes finos de carga conforme execução, técnica e RIR real.",
    proximosPassos: ["Executar as primeiras sessões monitorando técnica.", "Ajustar cargas conforme RIR real.", "Revisar resposta do aluno em 3 a 6 semanas.", "Manter registros completos para melhorar próximas recomendações."],
  };
}

export function buildWhatsAppReport(report) {
  const m = report.metricasResumo;
  return [
    `Relatório de evolução de treino — ${report.aluno.nome}`,
    "",
    `Ciclo analisado: ${report.cicloAnterior}`,
    `Novo ciclo: ${report.cicloNovo}`,
    "",
    "Resumo:",
    `• ${m.treinosAnalisados} treino(s) analisado(s)`,
    `• ${m.exerciciosMantidos} exercício(s) mantido(s)`,
    `• ${m.exerciciosSubstituidos} exercício(s) substituído(s)`,
    `• ${m.cargasMantidas} carga(s) preservada(s)`,
    `• ${m.cargasEstimadas} carga(s) estimada(s)`,
    "",
    "Principais mudanças:",
    ...(report.principaisMudancas.slice(0, 3).map(x => `• ${x}`)),
    ...(report.principaisMudancas.length ? [] : ["• Ajustes revisados no app pelo personal."]),
    "",
    "Pontos de atenção:",
    ...(report.alertas.slice(0, 2).map(x => `• ${x}`)),
    ...(report.alertas.length ? [] : ["• Monitorar técnica, carga e RIR real."]),
    "",
    "Próximo passo:",
    "Executar as primeiras sessões monitorando técnica, carga e RIR real."
  ].join("\n");
}

export function buildPlainTextReport(report) {
  return [
    "RELATÓRIO DE EVOLUÇÃO DE TREINO",
    `Aluno: ${report.aluno.nome}`,
    `Personal: ${report.personal.nome}`,
    `Ciclo analisado: ${report.cicloAnterior}`,
    `Novo ciclo: ${report.cicloNovo}`,
    `Período: ${report.periodoAnalisado}`,
    "",
    "SUMÁRIO EXECUTIVO",
    report.resumoExecutivo,
    "",
    "MÉTRICAS",
    Object.entries(report.metricasResumo).map(([k, v]) => `- ${k}: ${v}`).join("\n"),
    "",
    "ANÁLISE POR TREINO",
    ...report.analisePorTreino.map(t => [`${t.nome} — ${t.dia}`, ...t.rows.map(r => `- ${r.exercicioAntigo} → ${r.exercicioNovo} | ${r.decisao} | ${r.motivo} | ${r.cargaSugerida || "—"}kg | ${r.confianca}`)].join("\n")),
    "",
    "CARGAS",
    ...report.cargas.map(c => `- ${c.treino} / ${c.exercicio}: última ${c.ultimaCarga || "—"}kg, sugerida ${c.cargaSugerida || "—"}kg, faixa ${c.faixaMin || "—"}-${c.faixaMax || "—"}kg, confiança ${c.confianca}.`),
    "",
    "ALERTAS",
    ...(report.alertas.length ? report.alertas.map(a => `- ${a}`) : ["- Sem alertas críticos."]),
    "",
    "CONCLUSÃO",
    report.conclusao,
    "",
    "Relatório gerado pelo BZ Gym System com base nos registros do aluno, análise de IA e revisão profissional."
  ].join("\n");
}

function tagColor(value) {
  if (["manter", "evoluiu", "alta"].includes(value)) return [16, 185, 129];
  if (["substituir", "média", "media", "manteve"].includes(value)) return [245, 158, 11];
  if (["remover", "regrediu", "baixa"].includes(value)) return [244, 63, 94];
  return [99, 102, 241];
}

function addFooter(doc, report, theme, page) {
  const dark = theme === "escuro";
  doc.setFontSize(8);
  doc.setTextColor(dark ? 190 : 90, dark ? 190 : 90, dark ? 200 : 90);
  doc.text(`BZ Gym System · ${report.aluno.nome}`, 14, 287);
  doc.text(`Página ${page}`, 184, 287);
}

function addPage(doc, report, theme, pageRef) {
  doc.addPage();
  pageRef.current += 1;
  if (theme === "escuro") { doc.setFillColor(18, 18, 30); doc.rect(0, 0, 210, 297, "F"); doc.setTextColor(245, 245, 255); }
  else { doc.setFillColor(255, 255, 255); doc.rect(0, 0, 210, 297, "F"); doc.setTextColor(25, 25, 35); }
  addFooter(doc, report, theme, pageRef.current);
}

function title(doc, text, y, theme) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(139, 92, 246); doc.text(text, 14, y); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(theme === "escuro" ? 235 : 35, theme === "escuro" ? 235 : 35, theme === "escuro" ? 245 : 35); return y + 8;
}

function metricCards(doc, metrics, y, theme) {
  const entries = Object.entries(metrics).slice(0, 6);
  entries.forEach(([k, v], i) => {
    const x = 14 + (i % 3) * 62;
    const yy = y + Math.floor(i / 3) * 24;
    doc.setFillColor(theme === "escuro" ? 32 : 248, theme === "escuro" ? 26 : 248, theme === "escuro" ? 46 : 252);
    doc.roundedRect(x, yy, 56, 18, 3, 3, "F");
    doc.setFontSize(7); doc.setTextColor(139, 92, 246); doc.text(k.replace(/([A-Z])/g, " $1").toUpperCase(), x + 3, yy + 6);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(theme === "escuro" ? 255 : 20, theme === "escuro" ? 255 : 20, theme === "escuro" ? 255 : 30); doc.text(String(v), x + 3, yy + 14); doc.setFont("helvetica", "normal");
  });
  return y + 54;
}

function tableRows(doc, rows, columns, y, theme, pageRef, report) {
  const rowH = 9;
  doc.setFontSize(7);
  doc.setFillColor(139, 92, 246);
  doc.setTextColor(255, 255, 255);
  doc.rect(14, y, 182, 8, "F");
  let x = 16;
  columns.forEach(c => { doc.text(c.label, x, y + 5); x += c.w; });
  y += 9;
  rows.forEach((row, idx) => {
    if (y > 272) { addPage(doc, report, theme, pageRef); y = title(doc, "Continuação", 18, theme); }
    doc.setFillColor(theme === "escuro" ? (idx % 2 ? 25 : 31) : (idx % 2 ? 248 : 255), theme === "escuro" ? (idx % 2 ? 25 : 31) : (idx % 2 ? 248 : 255), theme === "escuro" ? (idx % 2 ? 38 : 46) : (idx % 2 ? 252 : 255));
    doc.rect(14, y - 1, 182, rowH, "F");
    x = 16;
    columns.forEach(c => {
      const text = String(row[c.key] ?? "—");
      if (c.tag) { const [r,g,b] = tagColor(text); doc.setFillColor(r,g,b); doc.roundedRect(x, y + 1, Math.min(c.w - 2, 20), 5, 2, 2, "F"); doc.setTextColor(255,255,255); doc.text(text.slice(0, 10), x + 1.5, y + 4.5); }
      else { doc.setTextColor(theme === "escuro" ? 230 : 35, theme === "escuro" ? 230 : 35, theme === "escuro" ? 240 : 35); doc.text(doc.splitTextToSize(text, c.w - 2).slice(0, 2), x, y + 4); }
      x += c.w;
    });
    y += rowH;
  });
  return y;
}

export function exportReportPdf(report, theme = "claro") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageRef = { current: 1 };
  const dark = theme === "escuro";
  if (dark) { doc.setFillColor(8, 8, 18); doc.rect(0, 0, 210, 297, "F"); doc.setTextColor(255,255,255); }
  doc.setFont("helvetica", "bold"); doc.setFontSize(34); doc.setTextColor(139, 92, 246); doc.text("BZ", 14, 34);
  doc.setFontSize(21); doc.setTextColor(dark ? 255 : 20, dark ? 255 : 20, dark ? 255 : 30); doc.text("Relatório de Evolução de Treino", 14, 58);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  [`Aluno: ${report.aluno.nome}`, `Personal: ${report.personal.nome}`, `Objetivo: ${report.aluno.objetivo}`, `Ciclo analisado: ${report.cicloAnterior}`, `Novo ciclo: ${report.cicloNovo}`, `Período: ${report.periodoAnalisado}`, `Data: ${report.dataAnalise}`].forEach((line, i) => doc.text(line, 14, 78 + i * 8));
  doc.setFillColor(14, 165, 233); doc.roundedRect(14, 145, 76, 9, 4, 4, "F"); doc.setTextColor(255,255,255); doc.setFontSize(8); doc.text("Gerado com IA + Revisão Profissional", 18, 151);
  addFooter(doc, report, theme, 1);

  addPage(doc, report, theme, pageRef); let y = title(doc, "Sumário Executivo", 18, theme); doc.text(doc.splitTextToSize(report.resumoExecutivo, 178), 14, y); y += 28; y = metricCards(doc, report.metricasResumo, y, theme); y = title(doc, "Principais mudanças", y + 4, theme); doc.text(doc.splitTextToSize((report.principaisMudancas.length ? report.principaisMudancas : ["Mudanças disponíveis na comparação detalhada."]).join("\n"), 178), 14, y);

  addPage(doc, report, theme, pageRef); y = title(doc, "Indicadores e Gráficos", 18, theme); y = metricCards(doc, { adesaoMedia: report.metricasResumo.adesaoMedia + "%", evoluiu: report.graficos.statusExercicios.evoluiu, manteve: report.graficos.statusExercicios.manteve, semDados: report.graficos.statusExercicios.semDados, cargasMantidas: report.graficos.cargas.cargasMantidas, cargasEstimadas: report.graficos.cargas.cargasEstimadas }, y, theme); doc.text("Gráficos avançados são renderizados como indicadores quando não há dados suficientes para curvas precisas.", 14, y + 2);

  addPage(doc, report, theme, pageRef); y = title(doc, "Análise do Ciclo Completo", 18, theme); doc.text(doc.splitTextToSize(`Divisão anterior: ${report.cicloAnterior}\nNova divisão: ${report.cicloNovo}\nTreinos analisados: ${report.metricasResumo.treinosAnalisados}\nEquilíbrio semanal e volume devem ser monitorados nas primeiras sessões.`, 178), 14, y);

  addPage(doc, report, theme, pageRef); y = title(doc, "Análise por Grupo Muscular", 18, theme); y = tableRows(doc, report.analisePorGrupoMuscular, [{ key: "grupoMuscular", label: "Grupo", w: 35 }, { key: "volumeAnterior", label: "Vol. ant.", w: 25 }, { key: "volumeNovo", label: "Vol. novo", w: 25 }, { key: "status", label: "Status", w: 28, tag: true }, { key: "recomendacao", label: "Recomendação", w: 65 }], y, theme, pageRef, report);

  report.analisePorTreino.forEach(t => { addPage(doc, report, theme, pageRef); y = title(doc, t.nome + " — " + t.dia, 18, theme); y = metricCards(doc, t.resumo, y, theme); y = tableRows(doc, t.rows, [{ key: "exercicioAntigo", label: "Antigo", w: 32 }, { key: "status", label: "Status", w: 24, tag: true }, { key: "decisao", label: "Decisão", w: 25, tag: true }, { key: "exercicioNovo", label: "Novo", w: 32 }, { key: "motivo", label: "Motivo", w: 45 }, { key: "cargaSugerida", label: "Carga", w: 16 }, { key: "confianca", label: "Conf.", w: 15, tag: true }], y, theme, pageRef, report); });

  addPage(doc, report, theme, pageRef); y = title(doc, "Comparação Antigo vs Novo", 18, theme); y = tableRows(doc, report.comparativoAntigoNovo, [{ key: "treino", label: "Treino", w: 25 }, { key: "exercicioAntigo", label: "Antigo", w: 32 }, { key: "decisao", label: "Decisão", w: 24, tag: true }, { key: "exercicioNovo", label: "Novo", w: 32 }, { key: "motivo", label: "Motivo", w: 47 }, { key: "cargaSugerida", label: "Carga", w: 16 }, { key: "confianca", label: "Conf.", w: 14, tag: true }], y, theme, pageRef, report);

  addPage(doc, report, theme, pageRef); y = title(doc, "Cargas Sugeridas", 18, theme); y = tableRows(doc, report.cargas, [{ key: "treino", label: "Treino", w: 25 }, { key: "exercicio", label: "Exercício", w: 35 }, { key: "ultimaCarga", label: "Última", w: 18 }, { key: "melhorCarga", label: "Melhor", w: 18 }, { key: "mediaRecente", label: "Média", w: 18 }, { key: "cargaSugerida", label: "Sug.", w: 18 }, { key: "confianca", label: "Conf.", w: 20, tag: true }, { key: "observacao", label: "Observação", w: 50 }], y, theme, pageRef, report); doc.text(doc.splitTextToSize("As cargas são estimativas baseadas nos registros disponíveis. Ajustar na prática conforme técnica, execução e RIR real.", 178), 14, Math.min(y + 8, 282));

  addPage(doc, report, theme, pageRef); y = title(doc, "Alertas", 18, theme); doc.text(doc.splitTextToSize((report.alertas.length ? report.alertas : ["Sem alertas críticos."]).map(a => `• ${a}`).join("\n"), 178), 14, y);
  addPage(doc, report, theme, pageRef); y = title(doc, "Conclusão", 18, theme); doc.text(doc.splitTextToSize(`${report.conclusao}\n\nPróximos passos:\n${report.proximosPassos.map(p => `• ${p}`).join("\n")}\n\nRelatório gerado pelo BZ Gym System com base nos registros do aluno, análise de IA e revisão profissional.`, 178), 14, y);

  doc.save(`relatorio_evolucao_${report.aluno.nome}_${theme}.pdf`);
}

export function openPrintableReport(report, theme = "claro") {
  const dark = theme === "escuro";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório BZ</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,sans-serif;background:${dark ? "#10101c" : "#fff"};color:${dark ? "#f4f1ff" : "#181824"};line-height:1.45}.page{page-break-after:always;min-height:260mm}.brand{color:#8b5cf6;font-weight:900;font-size:34px}.tag{display:inline-block;padding:4px 9px;border-radius:999px;background:#8b5cf6;color:white;font-size:11px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{border:1px solid ${dark ? "#322653" : "#e5e7eb"};border-radius:14px;padding:12px;background:${dark ? "#171729" : "#fafafa"}}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#8b5cf6;color:white;text-align:left}td,th{padding:7px;border-bottom:1px solid ${dark ? "#302a4a" : "#e5e7eb"};vertical-align:top}h1,h2{color:${dark ? "#c4b5fd" : "#5b21b6"}}.footer{position:fixed;bottom:6mm;font-size:10px;color:#777}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Salvar / imprimir PDF</button><section class="page"><div class="brand">BZ</div><h1>Relatório de Evolução de Treino</h1><p><b>Aluno:</b> ${report.aluno.nome}</p><p><b>Personal:</b> ${report.personal.nome}</p><p><b>Ciclo analisado:</b> ${report.cicloAnterior}</p><p><b>Novo ciclo:</b> ${report.cicloNovo}</p><span class="tag">Gerado com IA + Revisão Profissional</span></section><section class="page"><h2>Sumário Executivo</h2><p>${report.resumoExecutivo}</p><div class="grid">${Object.entries(report.metricasResumo).map(([k,v])=>`<div class="card"><small>${k}</small><h2>${v}</h2></div>`).join("")}</div></section><section class="page"><h2>Análise por Treino</h2>${report.analisePorTreino.map(t=>`<h3>${t.nome} — ${t.dia}</h3><table><thead><tr><th>Antigo</th><th>Decisão</th><th>Novo</th><th>Motivo</th><th>Carga</th><th>Confiança</th></tr></thead><tbody>${t.rows.map(r=>`<tr><td>${r.exercicioAntigo}</td><td>${r.decisao}</td><td>${r.exercicioNovo}</td><td>${r.motivo}</td><td>${r.cargaSugerida || "—"}</td><td>${r.confianca}</td></tr>`).join("")}</tbody></table>`).join("")}</section><section class="page"><h2>Cargas</h2><table><thead><tr><th>Treino</th><th>Exercício</th><th>Última</th><th>Melhor</th><th>Sugerida</th><th>Faixa</th><th>Confiança</th></tr></thead><tbody>${report.cargas.map(c=>`<tr><td>${c.treino}</td><td>${c.exercicio}</td><td>${c.ultimaCarga || "—"}</td><td>${c.melhorCarga || "—"}</td><td>${c.cargaSugerida || "—"}</td><td>${c.faixaMin || "—"}-${c.faixaMax || "—"}</td><td>${c.confianca}</td></tr>`).join("")}</tbody></table><p>As cargas são estimativas baseadas nos registros disponíveis. Ajustar na prática conforme técnica, execução e RIR real.</p></section><section><h2>Alertas e Conclusão</h2><ul>${report.alertas.map(a=>`<li>${a}</li>`).join("")}</ul><p>${report.conclusao}</p></section></body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}