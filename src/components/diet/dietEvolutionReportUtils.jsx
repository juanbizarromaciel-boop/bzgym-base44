import jsPDF from "jspdf";

const pct = (n) => Math.max(0, Math.min(100, Math.round(Number(n || 0))));
const n = (v) => Number(v || 0);
const round1 = (v) => Number(n(v).toFixed(1));

export function sumMeal(meal = {}) {
  const items = meal.items || [];
  return {
    calories: Math.round(items.reduce((s, i) => s + n(i.calories), 0) || n(meal.calories)),
    protein: round1(items.reduce((s, i) => s + n(i.protein_g), 0)),
    carbs: round1(items.reduce((s, i) => s + n(i.carbs_g), 0)),
    fat: round1(items.reduce((s, i) => s + n(i.fat_g), 0)),
  };
}

export function recalcDietTotals(meals = []) {
  const mealTotals = meals.map(sumMeal);
  return {
    total_calories: Math.round(mealTotals.reduce((s, m) => s + m.calories, 0)),
    protein_g: round1(mealTotals.reduce((s, m) => s + m.protein, 0)),
    carbs_g: round1(mealTotals.reduce((s, m) => s + m.carbs, 0)),
    fat_g: round1(mealTotals.reduce((s, m) => s + m.fat, 0)),
  };
}

export function analyzeDietAdherence(plan, logs = []) {
  const planLogs = logs.filter(l => l.plan_id === plan?.id);
  const totalDays = planLogs.length;
  const meals = (plan?.meals || []).map((meal, mi) => {
    const itemCount = (meal.items || []).length;
    const planned = Math.max(totalDays * itemCount, 0);
    const done = planLogs.reduce((acc, log) => acc + (meal.items || []).filter((_, ii) => log.checked_items?.[`${mi}_${ii}`]).length, 0);
    const percent = planned ? pct((done / planned) * 100) : 0;
    return {
      refeicao: meal.name || `Refeição ${mi + 1}`,
      horario: meal.time || "—",
      planejadas: planned,
      concluidas: done,
      percentualAdesao: percent,
      statusAdesao: planned === 0 ? "sem_dados" : percent >= 75 ? "alta" : percent >= 45 ? "media" : "baixa",
      recomendacao: planned === 0 ? "observar" : percent >= 75 ? "manter" : percent >= 45 ? "ajustar" : "trocar",
      justificativa: planned === 0 ? "Sem registros suficientes." : percent >= 75 ? "Boa adesão registrada." : "Adesão abaixo do ideal no período.",
    };
  });
  const avg = meals.length ? pct(meals.reduce((s, m) => s + m.percentualAdesao, 0) / meals.length) : 0;
  return { totalDias: totalDays, adesaoMedia: avg, refeicoes: meals };
}

function normalizeAction(value, fallback = "manter") {
  const v = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "_");
  return ["manter", "substituir", "adicionar", "remover", "ajustar_quantidade"].includes(v) ? v : fallback;
}

function normalizeConfidence(value) {
  const v = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return ["alta", "media", "baixa"].includes(v) ? v : "baixa";
}

export function normalizeAiDiet(aiDiet, basePlan) {
  const baseMeals = basePlan?.meals || [];
  const mealsFromAi = aiDiet?.meals || aiDiet?.refeicoes || baseMeals;
  const meals = mealsFromAi.map((meal, mi) => {
    const oldMeal = baseMeals[mi] || {};
    const foods = meal.foods || meal.alimentos || meal.items || oldMeal.items || [];
    const items = foods.map((food, ii) => {
      const old = (oldMeal.items || [])[ii] || {};
      const qty = n(food.quantity || food.quantidade || food.quantity_g || old.quantity_g || 100);
      const item = {
        food_id: food.food_id || old.food_id || "",
        food_name: food.name || food.food_name || food.alimento || old.food_name || "Alimento",
        quantity_g: qty,
        unit: food.unit || food.unidade || "g",
        calories: Math.round(n(food.calories || food.calorias || old.calories)),
        protein_g: round1(food.protein ?? food.proteina ?? food.protein_g ?? old.protein_g),
        carbs_g: round1(food.carbs ?? food.carbo ?? food.carbs_g ?? old.carbs_g),
        fat_g: round1(food.fat ?? food.gordura ?? food.fat_g ?? old.fat_g),
        acao: normalizeAction(food.acao || food.action, old.food_name ? "manter" : "adicionar"),
        motivo: food.motivo || food.reason || "Ajuste sugerido pela IA para melhorar adesão e estratégia nutricional.",
        alimentoAntigoRelacionado: food.alimentoAntigoRelacionado || food.old_food_name || old.food_name || "",
        confiancaEquivalencia: normalizeConfidence(food.confiancaEquivalencia || food.confidence),
        baseEquivalencia: food.baseEquivalencia || "Comparação aproximada de macros. Revisar manualmente.",
      };
      return item;
    });
    const totals = sumMeal({ items });
    return {
      name: meal.name || meal.nome || oldMeal.name || `Refeição ${mi + 1}`,
      time: meal.time || meal.horario || oldMeal.time || "",
      calories: totals.calories,
      foods: items.map(i => `${i.food_name}: ${i.quantity_g}${i.unit || "g"}`).join(", "),
      items,
    };
  });
  const totals = recalcDietTotals(meals);
  return {
    name: aiDiet?.dietName || aiDiet?.nomeNovaDieta || aiDiet?.name || `${basePlan?.name || "Dieta"} v${Number(basePlan?.versao || 1) + 1} IA`,
    goal: String(aiDiet?.goal || aiDiet?.objetivo || basePlan?.goal || "manutencao").toLowerCase().includes("cut") ? "cutting" : String(aiDiet?.goal || aiDiet?.objetivo || basePlan?.goal || "").toLowerCase().includes("bulk") ? "bulking" : "manutencao",
    meals,
    notes: aiDiet?.observacoes || aiDiet?.notes || "Evoluída com IA. Revisar equivalências antes de aplicar.",
    ...totals,
  };
}

export function buildDietReport({ owner, currentUser, basePlan, newDiet, logs = [], medidas = [], bios = [], selected = {}, requestText = "", aiMeta = {}, mode = "dieta_completa" }) {
  const adherence = analyzeDietAdherence(basePlan, logs);
  const oldMacros = { calorias: n(basePlan?.total_calories), proteina: n(basePlan?.protein_g), carbo: n(basePlan?.carbs_g), gordura: n(basePlan?.fat_g) };
  const newMacros = { calorias: n(newDiet?.total_calories), proteina: n(newDiet?.protein_g), carbo: n(newDiet?.carbs_g), gordura: n(newDiet?.fat_g) };
  const rows = (newDiet?.meals || []).flatMap((meal, mi) => (meal.items || []).map((item, ii) => {
    const oldMeal = (basePlan?.meals || [])[mi] || {};
    const oldItem = (oldMeal.items || [])[ii] || {};
    return {
      refeicao: meal.name,
      alimentoAntigo: item.acao === "adicionar" ? "—" : (oldItem.food_name || item.alimentoAntigoRelacionado || "—"),
      decisao: item.acao || "manter",
      alimentoNovo: item.acao === "remover" ? "—" : item.food_name,
      motivo: item.motivo,
      caloriasAntigas: n(oldItem.calories),
      caloriasNovas: n(item.calories),
      diferencaCalorias: Math.round(n(item.calories) - n(oldItem.calories)),
      proteinaAntiga: round1(oldItem.protein_g),
      proteinaNova: round1(item.protein_g),
      carboAntigo: round1(oldItem.carbs_g),
      carboNovo: round1(item.carbs_g),
      gorduraAntiga: round1(oldItem.fat_g),
      gorduraNova: round1(item.fat_g),
      quantidadeAntiga: n(oldItem.quantity_g),
      quantidadeNova: n(item.quantity_g),
      unidade: item.unit || "g",
      confianca: item.confiancaEquivalencia || "baixa",
      baseEquivalencia: item.baseEquivalencia || "Equivalência aproximada. Revisar manualmente.",
    };
  }));
  const by = (acao) => rows.filter(r => r.decisao === acao);
  const baixa = rows.filter(r => r.confianca === "baixa").length;
  const media = rows.filter(r => r.confianca === "media").length;
  const alta = rows.filter(r => r.confianca === "alta").length;
  const confiancaGeral = baixa > alta && baixa >= media ? "baixa" : alta >= media ? "alta" : "média";
  const metricasResumo = {
    adesaoMedia: adherence.adesaoMedia,
    refeicoesAnalisadas: (basePlan?.meals || []).length,
    alimentosMantidos: by("manter").length,
    alimentosSubstituidos: by("substituir").length,
    alimentosAdicionados: by("adicionar").length,
    alimentosRemovidos: by("remover").length,
    diferencaCalorica: Math.round(newMacros.calorias - oldMacros.calorias),
    confiancaGeral,
  };
  const progressoCorporal = [...(medidas || []), ...(bios || [])].slice(-8).map(x => ({ data: x.date || x.data || x.created_date, peso: x.weight || x.peso || x.peso_kg || 0, medidas: x.medidas || x.cintura || x.body_fat || 0 }));
  const alertas = [
    ...(aiMeta?.alertas || []),
    adherence.totalDias === 0 ? "Sem histórico alimentar suficiente; confiança reduzida." : null,
    baixa ? "Existem equivalências com baixa confiança que exigem revisão manual." : null,
    adherence.refeicoes.some(r => r.statusAdesao === "baixa") ? "Há refeições com baixa adesão no período analisado." : null,
  ].filter(Boolean);
  const principaisMudancas = [
    metricasResumo.alimentosMantidos ? `${metricasResumo.alimentosMantidos} alimento(s) mantido(s) por continuidade ou boa adesão.` : null,
    metricasResumo.alimentosSubstituidos ? `${metricasResumo.alimentosSubstituidos} alimento(s) substituído(s) para melhorar adesão/praticidade.` : null,
    metricasResumo.diferencaCalorica ? `Ajuste calórico de ${metricasResumo.diferencaCalorica > 0 ? "+" : ""}${metricasResumo.diferencaCalorica} kcal.` : null,
  ].filter(Boolean);
  return {
    usuario: { id: owner?.id, nome: owner?.name || owner?.full_name || owner?.email || "Usuário", objetivo: owner?.goal || basePlan?.goal || "—" },
    personal: { nome: currentUser?.full_name || currentUser?.email || "—", email: currentUser?.email || "" },
    dietaAnterior: basePlan?.name || "Dieta anterior",
    dietaNova: newDiet?.name || "Nova dieta IA",
    modoEvolucao: mode,
    periodoAnalisado: `Histórico registrado até ${new Date().toLocaleDateString("pt-BR")}`,
    dataAnalise: new Date().toLocaleDateString("pt-BR"),
    resumoExecutivo: aiMeta?.resumoExecutivo || "A dieta foi analisada com base nos registros disponíveis, adesão por refeição, macros e estrutura alimentar. A nova versão prioriza adesão, praticidade, segurança e revisão manual.",
    estrategiaNovaDieta: aiMeta?.estrategiaNovaDieta || aiMeta?.estrategia || "Manter itens com boa adesão, trocar pontos problemáticos e monitorar fome, energia e constância nos próximos dias.",
    metricasResumo,
    analiseAdesao: adherence,
    analisePorRefeicao: (newDiet?.meals || []).map((m, i) => ({ refeicao: m.name, horario: m.time, total: sumMeal(m), adesao: adherence.refeicoes[i], alimentos: m.items || [] })),
    analisePorAlimento: rows,
    comparativoAntigoNovo: rows,
    macrosAntigos: oldMacros,
    macrosNovos: newMacros,
    alimentosMantidos: by("manter"),
    alimentosSubstituidos: by("substituir"),
    alimentosAdicionados: by("adicionar"),
    alimentosRemovidos: by("remover"),
    graficos: {
      adesaoRefeicoes: adherence.refeicoes,
      macrosComparativo: [
        { macro: "Proteína", valorAntigo: oldMacros.proteina, valorNovo: newMacros.proteina },
        { macro: "Carboidrato", valorAntigo: oldMacros.carbo, valorNovo: newMacros.carbo },
        { macro: "Gordura", valorAntigo: oldMacros.gordura, valorNovo: newMacros.gordura },
      ],
      caloriasComparativo: { caloriasAntigas: oldMacros.calorias, caloriasNovas: newMacros.calorias },
      statusAlimentos: { mantidos: by("manter").length, substituidos: by("substituir").length, adicionados: by("adicionar").length, removidos: by("remover").length },
      progressoCorporal,
      refeicoesStatus: {
        boaAdesao: adherence.refeicoes.filter(r => r.statusAdesao === "alta").length,
        mediaAdesao: adherence.refeicoes.filter(r => r.statusAdesao === "media").length,
        baixaAdesao: adherence.refeicoes.filter(r => r.statusAdesao === "baixa").length,
        semDados: adherence.refeicoes.filter(r => r.statusAdesao === "sem_dados").length,
      },
    },
    principaisMudancas,
    alertas,
    conclusao: "A nova dieta deve ser aplicada após revisão das equivalências, quantidades e rotina do usuário.",
    proximosPassos: ["Seguir a nova dieta monitorando adesão.", "Registrar fome, energia, treino e observações diárias.", "Revisar equivalências de baixa confiança.", "Reavaliar em 2 a 4 semanas."],
    pedidoIA: requestText,
  };
}

export function buildDietWhatsAppReport(report) {
  const m = report.metricasResumo;
  return [
    `Relatório de evolução de dieta — ${report.usuario.nome}`,
    "",
    `Dieta analisada: ${report.dietaAnterior}`,
    `Nova dieta: ${report.dietaNova}`,
    "",
    "Resumo:",
    `• ${m.refeicoesAnalisadas} refeição(ões) analisada(s)`,
    `• ${m.alimentosMantidos} alimento(s) mantido(s)`,
    `• ${m.alimentosSubstituidos} alimento(s) substituído(s)`,
    `• ${m.alimentosAdicionados} alimento(s) adicionado(s)`,
    `• ${m.alimentosRemovidos} alimento(s) removido(s)`,
    "",
    "Principais mudanças:",
    ...(report.principaisMudancas.slice(0, 3).map(x => `• ${x}`)),
    ...(report.principaisMudancas.length ? [] : ["• Ajustes revisados no app."]),
    "",
    "Pontos de atenção:",
    ...(report.alertas.slice(0, 2).map(x => `• ${x}`)),
    ...(report.alertas.length ? [] : ["• Monitorar adesão, fome e energia."]),
    "",
    "Próximo passo:",
    "Seguir a nova dieta monitorando adesão, fome, energia, treino e observações diárias."
  ].join("\n");
}

export function buildDietPlainReport(report) {
  return [
    "RELATÓRIO DE EVOLUÇÃO DE DIETA",
    `Usuário: ${report.usuario.nome}`,
    `Dieta anterior: ${report.dietaAnterior}`,
    `Nova dieta: ${report.dietaNova}`,
    `Período: ${report.periodoAnalisado}`,
    "",
    "SUMÁRIO EXECUTIVO",
    report.resumoExecutivo,
    "",
    "MACROS",
    `Calorias: ${report.macrosAntigos.calorias} → ${report.macrosNovos.calorias}`,
    `Proteína: ${report.macrosAntigos.proteina}g → ${report.macrosNovos.proteina}g`,
    `Carboidrato: ${report.macrosAntigos.carbo}g → ${report.macrosNovos.carbo}g`,
    `Gordura: ${report.macrosAntigos.gordura}g → ${report.macrosNovos.gordura}g`,
    "",
    "COMPARAÇÃO",
    ...report.comparativoAntigoNovo.map(r => `- ${r.refeicao}: ${r.alimentoAntigo} → ${r.alimentoNovo} | ${r.decisao} | ${r.motivo}`),
    "",
    "ALERTAS",
    ...(report.alertas.length ? report.alertas.map(a => `- ${a}`) : ["- Sem alertas críticos."]),
    "",
    "Relatório gerado pelo BZ Gym System com base nos registros disponíveis, análise de IA e revisão profissional quando aplicável."
  ].join("\n");
}

function tagColor(value) {
  if (["manter", "alta"].includes(value)) return [16, 185, 129];
  if (["substituir", "ajustar_quantidade", "media", "média"].includes(value)) return [245, 158, 11];
  if (["remover", "baixa"].includes(value)) return [244, 63, 94];
  return [14, 165, 233];
}

function addFooter(doc, report, page, theme) {
  const dark = theme === "escuro";
  doc.setFontSize(8);
  doc.setTextColor(dark ? 190 : 90, dark ? 190 : 90, dark ? 200 : 90);
  doc.text(`BZ Gym System · ${report.usuario.nome}`, 14, 287);
  doc.text(`Página ${page}`, 184, 287);
}

function addPage(doc, report, pageRef, theme) {
  doc.addPage(); pageRef.current += 1;
  if (theme === "escuro") { doc.setFillColor(16, 16, 28); doc.rect(0, 0, 210, 297, "F"); }
  addFooter(doc, report, pageRef.current, theme);
}

function title(doc, text, y, theme) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(16, 185, 129); doc.text(text, 14, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(theme === "escuro" ? 240 : 30, theme === "escuro" ? 240 : 30, theme === "escuro" ? 245 : 35);
  return y + 8;
}

function metricCards(doc, metrics, y, theme) {
  Object.entries(metrics).slice(0, 8).forEach(([k, v], i) => {
    const x = 14 + (i % 4) * 45;
    const yy = y + Math.floor(i / 4) * 23;
    doc.setFillColor(theme === "escuro" ? 25 : 248, theme === "escuro" ? 35 : 252, theme === "escuro" ? 32 : 250);
    doc.roundedRect(x, yy, 40, 17, 3, 3, "F");
    doc.setFontSize(6.5); doc.setTextColor(16, 185, 129); doc.text(k.replace(/([A-Z])/g, " $1").toUpperCase().slice(0, 18), x + 2, yy + 5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(theme === "escuro" ? 255 : 20, theme === "escuro" ? 255 : 20, theme === "escuro" ? 255 : 25); doc.text(String(v), x + 2, yy + 13); doc.setFont("helvetica", "normal");
  });
  return y + 50;
}

function table(doc, rows, cols, y, report, pageRef, theme) {
  doc.setFontSize(7);
  doc.setFillColor(16, 185, 129); doc.rect(14, y, 182, 8, "F"); doc.setTextColor(255,255,255);
  let x = 16; cols.forEach(c => { doc.text(c.label, x, y + 5); x += c.w; }); y += 9;
  rows.forEach((row, idx) => {
    if (y > 272) { addPage(doc, report, pageRef, theme); y = title(doc, "Continuação", 18, theme); }
    doc.setFillColor(theme === "escuro" ? (idx % 2 ? 24 : 30) : (idx % 2 ? 248 : 255), theme === "escuro" ? (idx % 2 ? 24 : 30) : (idx % 2 ? 252 : 255), theme === "escuro" ? (idx % 2 ? 36 : 44) : 255);
    doc.rect(14, y - 1, 182, 9, "F"); x = 16;
    cols.forEach(c => {
      const text = String(row[c.key] ?? "—");
      if (c.tag) { const [r,g,b] = tagColor(text); doc.setFillColor(r,g,b); doc.roundedRect(x, y + 1, Math.min(c.w - 2, 22), 5, 2, 2, "F"); doc.setTextColor(255,255,255); doc.text(text.slice(0, 12), x + 1.5, y + 4.5); }
      else { doc.setTextColor(theme === "escuro" ? 235 : 35, theme === "escuro" ? 235 : 35, theme === "escuro" ? 245 : 35); doc.text(doc.splitTextToSize(text, c.w - 2).slice(0, 2), x, y + 4); }
      x += c.w;
    });
    y += 9;
  });
  return y;
}

export function exportDietReportPdf(report, theme = "claro") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageRef = { current: 1 };
  const dark = theme === "escuro";
  if (dark) { doc.setFillColor(8, 12, 18); doc.rect(0, 0, 210, 297, "F"); }
  doc.setFont("helvetica", "bold"); doc.setFontSize(34); doc.setTextColor(16,185,129); doc.text("BZ", 14, 34);
  doc.setFontSize(21); doc.setTextColor(dark ? 255 : 20, dark ? 255 : 20, dark ? 255 : 30); doc.text("Relatório de Evolução de Dieta", 14, 58);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  [`Usuário: ${report.usuario.nome}`, `Personal: ${report.personal.nome}`, `Objetivo: ${report.usuario.objetivo}`, `Dieta anterior: ${report.dietaAnterior}`, `Nova dieta: ${report.dietaNova}`, `Período: ${report.periodoAnalisado}`, `Data: ${report.dataAnalise}`].forEach((line, i) => doc.text(line, 14, 78 + i * 8));
  doc.setFillColor(139, 92, 246); doc.roundedRect(14, 145, 76, 9, 4, 4, "F"); doc.setTextColor(255,255,255); doc.setFontSize(8); doc.text("Gerado com IA + Revisão Profissional", 18, 151);
  addFooter(doc, report, 1, theme);

  addPage(doc, report, pageRef, theme); let y = title(doc, "Sumário Executivo", 18, theme); doc.text(doc.splitTextToSize(report.resumoExecutivo, 178), 14, y); y += 26; y = metricCards(doc, report.metricasResumo, y, theme); y = title(doc, "Principais mudanças", y, theme); doc.text(doc.splitTextToSize((report.principaisMudancas.length ? report.principaisMudancas : ["Mudanças disponíveis na comparação detalhada."]).join("\n"), 178), 14, y);
  addPage(doc, report, pageRef, theme); y = title(doc, "Indicadores e Gráficos", 18, theme); y = metricCards(doc, { adesaoMedia: report.metricasResumo.adesaoMedia + "%", caloriasAntigas: report.macrosAntigos.calorias, caloriasNovas: report.macrosNovos.calorias, mantidos: report.graficos.statusAlimentos.mantidos, substituidos: report.graficos.statusAlimentos.substituidos, adicionados: report.graficos.statusAlimentos.adicionados, removidos: report.graficos.statusAlimentos.removidos, baixaAdesao: report.graficos.refeicoesStatus.baixaAdesao }, y, theme); doc.text("Quando não há dados suficientes, os gráficos são exibidos como indicadores consolidados.", 14, y + 2);
  addPage(doc, report, pageRef, theme); y = title(doc, "Análise da Dieta Completa", 18, theme); doc.text(doc.splitTextToSize(`Estrutura anterior: ${(report.analisePorRefeicao || []).length} refeições\nCalorias: ${report.macrosAntigos.calorias} → ${report.macrosNovos.calorias}\nProteína: ${report.macrosAntigos.proteina}g → ${report.macrosNovos.proteina}g\nCarboidratos: ${report.macrosAntigos.carbo}g → ${report.macrosNovos.carbo}g\nGorduras: ${report.macrosAntigos.gordura}g → ${report.macrosNovos.gordura}g\n\n${report.estrategiaNovaDieta}`, 178), 14, y);
  addPage(doc, report, pageRef, theme); y = title(doc, "Análise por Refeição", 18, theme); report.analisePorRefeicao.forEach(r => { if (y > 255) { addPage(doc, report, pageRef, theme); y = title(doc, "Análise por Refeição", 18, theme); } doc.setFont("helvetica", "bold"); doc.text(`${r.refeicao} · ${r.horario || "—"}`, 14, y); doc.setFont("helvetica", "normal"); y += 6; doc.text(doc.splitTextToSize(`${r.total.calories} kcal · P ${r.total.protein}g · C ${r.total.carbs}g · G ${r.total.fat}g · Adesão ${r.adesao?.percentualAdesao || 0}%`, 178), 14, y); y += 10; });
  addPage(doc, report, pageRef, theme); y = title(doc, "Comparação Antiga vs Nova", 18, theme); y = table(doc, report.comparativoAntigoNovo, [{key:"refeicao",label:"Refeição",w:25},{key:"alimentoAntigo",label:"Antigo",w:30},{key:"decisao",label:"Decisão",w:24,tag:true},{key:"alimentoNovo",label:"Novo",w:30},{key:"motivo",label:"Motivo",w:43},{key:"caloriasAntigas",label:"Kcal ant.",w:16},{key:"caloriasNovas",label:"Kcal nova",w:18}], y, report, pageRef, theme);
  addPage(doc, report, pageRef, theme); y = title(doc, "Macros", 18, theme); y = metricCards(doc, { caloriasAntigas: report.macrosAntigos.calorias, caloriasNovas: report.macrosNovos.calorias, proteinaAntiga: report.macrosAntigos.proteina, proteinaNova: report.macrosNovos.proteina, carboAntigo: report.macrosAntigos.carbo, carboNovo: report.macrosNovos.carbo, gorduraAntiga: report.macrosAntigos.gordura, gorduraNova: report.macrosNovos.gordura }, y, theme);
  addPage(doc, report, pageRef, theme); y = title(doc, "Alimentos Substituídos", 18, theme); y = table(doc, report.alimentosSubstituidos, [{key:"refeicao",label:"Refeição",w:28},{key:"alimentoAntigo",label:"Antigo",w:36},{key:"alimentoNovo",label:"Novo",w:36},{key:"motivo",label:"Motivo",w:54},{key:"diferencaCalorias",label:"Δ kcal",w:18},{key:"confianca",label:"Conf.",w:20,tag:true}], y, report, pageRef, theme);
  addPage(doc, report, pageRef, theme); y = title(doc, "Alertas", 18, theme); doc.text(doc.splitTextToSize((report.alertas.length ? report.alertas : ["Sem alertas críticos."]).map(a => `• ${a}`).join("\n"), 178), 14, y);
  addPage(doc, report, pageRef, theme); y = title(doc, "Conclusão", 18, theme); doc.text(doc.splitTextToSize(`${report.conclusao}\n\nPróximos passos:\n${report.proximosPassos.map(p => `• ${p}`).join("\n")}\n\nRelatório gerado pelo BZ Gym System com base nos registros disponíveis, análise de IA e revisão profissional quando aplicável.`, 178), 14, y);
  doc.save(`relatorio_evolucao_dieta_${report.usuario.nome}_${theme}.pdf`);
}

export function openPrintableDietReport(report, theme = "claro") {
  const dark = theme === "escuro";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório Dieta BZ</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,sans-serif;background:${dark ? "#101820" : "#fff"};color:${dark ? "#f1fff8" : "#162018"};line-height:1.45}.page{page-break-after:always;min-height:260mm}.brand{color:#10b981;font-weight:900;font-size:34px}.tag{display:inline-block;padding:4px 9px;border-radius:999px;background:#8b5cf6;color:white;font-size:11px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.card{border:1px solid ${dark ? "#254236" : "#e5e7eb"};border-radius:14px;padding:12px;background:${dark ? "#17241f" : "#fafafa"}}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#10b981;color:white;text-align:left}td,th{padding:7px;border-bottom:1px solid ${dark ? "#284238" : "#e5e7eb"};vertical-align:top}h1,h2{color:${dark ? "#6ee7b7" : "#047857"}}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Salvar / imprimir PDF</button><section class="page"><div class="brand">BZ</div><h1>Relatório de Evolução de Dieta</h1><p><b>Usuário:</b> ${report.usuario.nome}</p><p><b>Dieta analisada:</b> ${report.dietaAnterior}</p><p><b>Nova dieta:</b> ${report.dietaNova}</p><span class="tag">Gerado com IA + Revisão Profissional</span></section><section class="page"><h2>Sumário Executivo</h2><p>${report.resumoExecutivo}</p><div class="grid">${Object.entries(report.metricasResumo).map(([k,v])=>`<div class="card"><small>${k}</small><h2>${v}</h2></div>`).join("")}</div></section><section class="page"><h2>Comparação</h2><table><thead><tr><th>Refeição</th><th>Antigo</th><th>Decisão</th><th>Novo</th><th>Motivo</th><th>Kcal</th><th>Confiança</th></tr></thead><tbody>${report.comparativoAntigoNovo.map(r=>`<tr><td>${r.refeicao}</td><td>${r.alimentoAntigo}</td><td>${r.decisao}</td><td>${r.alimentoNovo}</td><td>${r.motivo}</td><td>${r.caloriasAntigas} → ${r.caloriasNovas}</td><td>${r.confianca}</td></tr>`).join("")}</tbody></table></section><section><h2>Alertas e Conclusão</h2><ul>${report.alertas.map(a=>`<li>${a}</li>`).join("")}</ul><p>${report.conclusao}</p></section></body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}