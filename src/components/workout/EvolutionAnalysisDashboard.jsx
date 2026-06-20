import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, FileText, MessageCircle, Save, X } from "lucide-react";
import RelatorioEvolucaoTreinoPreview from "./RelatorioEvolucaoTreinoPreview";

function Tag({ value }) {
  const color = value === "manter" || value === "alta" || value === "evoluiu" ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/25" : value === "substituir" || value === "media" || value === "média" || value === "manteve" ? "bg-amber-500/10 text-amber-200 border-amber-500/25" : "bg-pink-500/10 text-pink-200 border-pink-500/25";
  return <Badge className={`border ${color}`}>{String(value || "—").replace("sem_dados", "sem dados")}</Badge>;
}

function CompactTable({ rows }) {
  return <div className="overflow-x-auto rounded-xl border border-purple-900/25">
    <table className="w-full text-sm min-w-[880px]">
      <thead className="bg-purple-500/15 text-purple-100"><tr>{["Exercício antigo", "Status", "Decisão", "Exercício novo", "Motivo", "Carga", "Confiança"].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-purple-900/15 odd:bg-black/20"><td className="p-3">{r.exercicioAntigo}</td><td className="p-3"><Tag value={r.status} /></td><td className="p-3"><Tag value={r.decisao} /></td><td className="p-3 text-cyan-100">{r.exercicioNovo}</td><td className="p-3 text-purple-100/70 max-w-xs">{r.motivo}</td><td className="p-3">{r.cargaSugerida || "—"} kg</td><td className="p-3"><Tag value={r.confianca} /></td></tr>)}</tbody>
    </table>
  </div>;
}

function EditPlan({ gp, planIdx, selectedPlans, updateGeneratedPlan, updateGeneratedExercise, removeGeneratedExercise, addGeneratedExercise }) {
  return <div className="space-y-3">
    <div className="grid md:grid-cols-2 gap-2"><Input value={gp.name} onChange={e => updateGeneratedPlan(planIdx, "name", e.target.value)} className="cyber-input" /><Input value={gp.day_of_week} onChange={e => updateGeneratedPlan(planIdx, "day_of_week", e.target.value)} className="cyber-input" /></div>
    <div className="grid lg:grid-cols-2 gap-4">
      <div><h4 className="font-cyber text-sm text-purple-200 mb-2">TREINO ANTIGO</h4>{(selectedPlans.find(p => p.id === gp.basePlanId)?.exercises || []).map((ex, idx) => <div key={idx} className="rounded-xl border border-purple-900/25 bg-black/20 p-3 mb-2"><b>{ex.exercise_name}</b><p className="text-xs text-purple-300/60">{ex.sets} séries · {ex.reps} reps · {ex.rest_seconds || 60}s</p></div>)}</div>
      <div><div className="flex justify-between mb-2"><h4 className="font-cyber text-sm text-cyan-200">TREINO NOVO EDITÁVEL</h4><Button size="sm" variant="outline" onClick={() => addGeneratedExercise(planIdx)}>Adicionar</Button></div>{gp.exercises.map((ex, exIdx) => <div key={exIdx} className="rounded-xl border border-cyan-900/30 bg-cyan-500/5 p-3 mb-2 space-y-2"><div className="flex gap-2"><Input value={ex.exercise_name} onChange={e => updateGeneratedExercise(planIdx, exIdx, "exercise_name", e.target.value)} className="cyber-input" /><Button variant="ghost" size="icon" onClick={() => removeGeneratedExercise(planIdx, exIdx)}><X className="w-4 h-4" /></Button></div><div className="grid grid-cols-3 gap-2"><Input value={ex.sets} onChange={e => updateGeneratedExercise(planIdx, exIdx, "sets", e.target.value)} className="cyber-input" /><Input value={ex.reps} onChange={e => updateGeneratedExercise(planIdx, exIdx, "reps", e.target.value)} className="cyber-input" /><Input value={ex.rest_seconds} onChange={e => updateGeneratedExercise(planIdx, exIdx, "rest_seconds", e.target.value)} className="cyber-input" /></div><div className="grid grid-cols-3 gap-2"><Input value={ex.cargaSugerida} onChange={e => updateGeneratedExercise(planIdx, exIdx, "cargaSugerida", e.target.value)} className="cyber-input" /><Input value={ex.rir} onChange={e => updateGeneratedExercise(planIdx, exIdx, "rir", e.target.value)} className="cyber-input" /><Input value={ex.cadencia} onChange={e => updateGeneratedExercise(planIdx, exIdx, "cadencia", e.target.value)} className="cyber-input" /></div><Textarea value={ex.notes} onChange={e => updateGeneratedExercise(planIdx, exIdx, "notes", e.target.value)} className="cyber-input" /><div className="flex flex-wrap gap-2"><Tag value={ex.acao} /><Tag value={ex.confiancaCarga} /><Badge className="bg-cyan-500/10 text-cyan-200 border border-cyan-500/20">{ex.faixaCargaMin}–{ex.faixaCargaMax} kg</Badge></div></div>)}</div>
    </div>
  </div>;
}

export default function EvolutionAnalysisDashboard({ report, generatedPlans, selectedPlans, activeTab, setActiveTab, updateGeneratedPlan, updateGeneratedExercise, removeGeneratedExercise, addGeneratedExercise, onSaveDraft, onPreview, onApply, onExportPdf, onExportHtml, onExportWhatsApp, saving, onCancel }) {
  const tabs = ["visao", ...report.analisePorTreino.map((t, i) => String(i)), "cargas", "relatorio", "revisao"];
  const labels = { visao: "Visão Geral", cargas: "Cargas", relatorio: "Relatório", revisao: "Revisão Final" };
  return <div className="space-y-4">
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100">A IA gera sugestões. Revise antes de aplicar. Cargas são estimativas baseadas apenas no histórico deste aluno.</div>
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">{tabs.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-2.5 sm:px-3 py-2 rounded-lg text-[10px] sm:text-xs border whitespace-nowrap ${activeTab === t ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100" : "border-purple-900/30 text-purple-200/60"}`}>{labels[t] || report.analisePorTreino[Number(t)]?.nome || `Treino ${Number(t) + 1}`}</button>)}</div>

    {activeTab === "visao" && <RelatorioEvolucaoTreinoPreview report={report} />}

    {report.analisePorTreino.map((t, i) => activeTab === String(i) && <div key={t.id} className="space-y-4">
      <section className="rounded-2xl border border-purple-900/25 bg-black/25 p-4"><div className="flex flex-col md:flex-row md:items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest text-cyan-300 font-mono-cyber">{t.dia}</p><h3 className="text-xl font-bold text-white">{t.nome}</h3><p className="text-sm text-purple-200/55">Foco: {t.foco}</p></div><div className="grid grid-cols-5 gap-2 text-center">{Object.entries(t.resumo).map(([k,v]) => <div key={k} className="rounded-lg bg-purple-500/10 p-2"><b>{v}</b><p className="text-[9px] text-purple-300/50">{k}</p></div>)}</div></div></section>
      <CompactTable rows={t.rows} />
      <EditPlan gp={generatedPlans[i]} planIdx={i} selectedPlans={selectedPlans} updateGeneratedPlan={updateGeneratedPlan} updateGeneratedExercise={updateGeneratedExercise} removeGeneratedExercise={removeGeneratedExercise} addGeneratedExercise={addGeneratedExercise} />
    </div>)}

    {activeTab === "cargas" && <div className="overflow-x-auto rounded-xl border border-purple-900/25"><table className="w-full min-w-[920px] text-sm"><thead className="bg-purple-500/15"><tr>{["Treino", "Exercício", "Última", "Melhor", "Média", "Sugerida", "Faixa", "Confiança", "Base"].map(h => <th key={h} className="text-left p-3">{h}</th>)}</tr></thead><tbody>{report.cargas.map((c, i) => <tr key={i} className="border-t border-purple-900/15 odd:bg-black/20"><td className="p-3">{c.treino}</td><td className="p-3 text-cyan-100">{c.exercicio}</td><td className="p-3">{c.ultimaCarga || "—"}</td><td className="p-3">{c.melhorCarga || "—"}</td><td className="p-3">{c.mediaRecente || "—"}</td><td className="p-3">{c.cargaSugerida || "—"}</td><td className="p-3">{c.faixaMin || "—"}-{c.faixaMax || "—"}</td><td className="p-3"><Tag value={c.confianca} /></td><td className="p-3 text-purple-100/65 max-w-sm">{c.observacao}</td></tr>)}</tbody></table></div>}

    {activeTab === "relatorio" && <div className="space-y-3"><RelatorioEvolucaoTreinoPreview report={report} /><div className="grid sm:grid-cols-4 gap-2"><Button onClick={() => onExportPdf("claro")} className="btn-neon-purple"><Download className="w-4 h-4 mr-2" />PDF claro</Button><Button onClick={() => onExportPdf("escuro")} className="btn-neon-cyan"><Download className="w-4 h-4 mr-2" />PDF escuro</Button><Button onClick={onExportHtml} variant="outline"><FileText className="w-4 h-4 mr-2" />HTML imprimível</Button><Button onClick={onExportWhatsApp} variant="outline"><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</Button></div></div>}

    {activeTab === "revisao" && <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 space-y-4"><h3 className="font-cyber text-cyan-200 tracking-widest">REVISÃO FINAL</h3><div className="grid md:grid-cols-2 gap-4"><div><p className="text-sm text-purple-200/65 mb-2">Treinos antigos que serão arquivados:</p>{report.treinosAnalisados.map(t => <p key={t.id} className="text-sm">• {t.nome} — {t.exercicios} exercícios</p>)}</div><div><p className="text-sm text-purple-200/65 mb-2">Novos treinos que serão criados:</p>{report.analisePorTreino.map(t => <p key={t.id} className="text-sm">• {t.nome} — {t.rows.filter(r => r.decisao !== "remover").length} exercícios</p>)}</div></div><p className="text-sm text-emerald-200">Nada será apagado. Os treinos antigos serão preservados como histórico/substituídos.</p></div>}

    <div className="sticky bottom-0 z-10 grid grid-cols-1 sm:grid-cols-5 gap-2 pt-3 pb-1 bg-[#04040e]/95 backdrop-blur-md"><Button onClick={onSaveDraft} disabled={saving} variant="outline"><Save className="w-4 h-4 mr-2" />Salvar rascunho</Button><Button onClick={() => onExportPdf("claro")} className="btn-neon-purple"><Download className="w-4 h-4 mr-2" />PDF Premium</Button><Button onClick={() => setActiveTab("relatorio")} className="btn-neon-cyan"><FileText className="w-4 h-4 mr-2" />Ver prévia</Button><Button onClick={onApply} disabled={saving} className="btn-neon-purple"><CheckCircle2 className="w-4 h-4 mr-2" />Aplicar</Button><Button variant="outline" onClick={onCancel}>Cancelar</Button></div>
  </div>;
}