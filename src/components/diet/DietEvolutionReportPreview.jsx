import React from "react";
import { Badge } from "@/components/ui/badge";

const labels = {
  adesaoMedia: "Adesão média",
  refeicoesAnalisadas: "Refeições",
  alimentosMantidos: "Mantidos",
  alimentosSubstituidos: "Substituídos",
  alimentosAdicionados: "Adicionados",
  alimentosRemovidos: "Removidos",
  diferencaCalorica: "Dif. kcal",
  confiancaGeral: "Confiança",
};

function MiniBar({ value, max = 100, color = "bg-emerald-400" }) {
  const width = Math.max(4, Math.min(100, Math.round((Number(value || 0) / max) * 100)));
  return <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${width}%` }} /></div>;
}

function ChartCard({ title, hasData = true, children }) {
  return <div className="rounded-xl border border-emerald-900/25 bg-emerald-500/5 p-4">
    <h4 className="font-cyber text-xs tracking-widest text-emerald-200 mb-3">{title}</h4>
    {hasData ? children : <p className="text-sm text-purple-300/50">Gráfico indisponível por falta de dados.</p>}
  </div>;
}

function Tag({ value }) {
  const color = value === "manter" || value === "alta" ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/25" : value === "substituir" || value === "media" || value === "média" || value === "ajustar_quantidade" ? "bg-amber-500/10 text-amber-200 border-amber-500/25" : "bg-pink-500/10 text-pink-200 border-pink-500/25";
  return <Badge className={`border ${color}`}>{String(value || "—").replace("ajustar_quantidade", "ajustar")}</Badge>;
}

export { Tag };

export default function DietEvolutionReportPreview({ report }) {
  if (!report) return null;
  const status = report.graficos.statusAlimentos;
  const macros = report.graficos.macrosComparativo;
  return <div className="space-y-5">
    <section className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-purple-500/5 p-5">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-200 font-mono-cyber">Evolução de dieta com IA</p>
          <h2 className="text-2xl font-bold text-white mt-1">{report.usuario.nome}</h2>
          <p className="text-sm text-purple-200/65 mt-1">{report.dietaAnterior} → {report.dietaNova}</p>
        </div>
        <div className="text-sm text-purple-200/70 md:text-right">
          <p><b>Período:</b> {report.periodoAnalisado}</p>
          <p><b>Modo:</b> {report.modoEvolucao}</p>
          <p><b>Data:</b> {report.dataAnalise}</p>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Object.entries(report.metricasResumo).map(([k, v]) => <div key={k} className="rounded-xl border border-emerald-900/25 bg-black/25 p-3"><p className="text-[10px] uppercase tracking-widest text-emerald-300/50 font-mono-cyber">{labels[k] || k}</p><p className="text-xl font-bold text-white mt-1">{k === "adesaoMedia" ? `${v}%` : v}</p></div>)}
    </section>

    <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
      <h3 className="font-cyber text-sm tracking-widest text-cyan-200 mb-2">DIAGNÓSTICO GERAL</h3>
      <p className="text-sm leading-relaxed text-purple-100/85 max-w-4xl">{report.resumoExecutivo}</p>
      <p className="text-sm leading-relaxed text-purple-200/65 max-w-4xl mt-3"><b>Estratégia:</b> {report.estrategiaNovaDieta}</p>
    </section>

    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      <ChartCard title="Adesão por refeição" hasData={report.graficos.adesaoRefeicoes?.some(r => r.planejadas > 0)}>
        {report.graficos.adesaoRefeicoes.map(r => <div key={r.refeicao} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{r.refeicao}</span><b>{r.percentualAdesao}%</b></div><MiniBar value={r.percentualAdesao} /></div>)}
      </ChartCard>
      <ChartCard title="Macros antigos vs novos" hasData={macros?.length > 0}>
        {macros.map(m => <div key={m.macro} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{m.macro}</span><span>{m.valorAntigo}g → {m.valorNovo}g</span></div><MiniBar value={m.valorNovo} max={Math.max(...macros.map(x => x.valorNovo), 1)} color="bg-purple-400" /></div>)}
      </ChartCard>
      <ChartCard title="Calorias" hasData={report.macrosNovos.calorias > 0}>
        <div className="flex justify-between text-xs mb-1"><span>Antiga</span><b>{report.macrosAntigos.calorias} kcal</b></div><MiniBar value={report.macrosAntigos.calorias} max={Math.max(report.macrosAntigos.calorias, report.macrosNovos.calorias, 1)} color="bg-orange-400" />
        <div className="flex justify-between text-xs mt-3 mb-1"><span>Nova</span><b>{report.macrosNovos.calorias} kcal</b></div><MiniBar value={report.macrosNovos.calorias} max={Math.max(report.macrosAntigos.calorias, report.macrosNovos.calorias, 1)} color="bg-emerald-400" />
      </ChartCard>
      <ChartCard title="Status dos alimentos" hasData={Object.values(status).some(Boolean)}>
        {Object.entries(status).map(([k, v]) => <div key={k} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{k}</span><b>{v}</b></div><MiniBar value={v} max={Math.max(...Object.values(status), 1)} color="bg-cyan-400" /></div>)}
      </ChartCard>
      <ChartCard title="Status das refeições" hasData={Object.values(report.graficos.refeicoesStatus).some(Boolean)}>
        {Object.entries(report.graficos.refeicoesStatus).map(([k, v]) => <div key={k} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{k}</span><b>{v}</b></div><MiniBar value={v} max={Math.max(...Object.values(report.graficos.refeicoesStatus), 1)} color="bg-amber-400" /></div>)}
      </ChartCard>
      <ChartCard title="Progresso corporal" hasData={report.graficos.progressoCorporal?.length > 0}>
        {report.graficos.progressoCorporal.slice(-4).map((p, i) => <p key={i} className="text-xs text-purple-100/75 mb-1">{p.data ? new Date(p.data).toLocaleDateString("pt-BR") : "—"}: {p.peso || "—"} kg</p>)}
      </ChartCard>
    </section>

    <section className="overflow-x-auto rounded-xl border border-emerald-900/25">
      <table className="w-full text-sm min-w-[900px]"><thead className="bg-emerald-500/15 text-emerald-100"><tr>{["Refeição", "Alimento antigo", "Decisão", "Alimento novo", "Motivo", "Kcal", "Confiança"].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr></thead><tbody>{report.comparativoAntigoNovo.map((r, i) => <tr key={i} className="border-t border-emerald-900/15 odd:bg-black/20"><td className="p-3">{r.refeicao}</td><td className="p-3">{r.alimentoAntigo}</td><td className="p-3"><Tag value={r.decisao} /></td><td className="p-3 text-emerald-100">{r.alimentoNovo}</td><td className="p-3 text-purple-100/70 max-w-xs">{r.motivo}</td><td className="p-3">{r.caloriasAntigas} → {r.caloriasNovas}</td><td className="p-3"><Tag value={r.confianca} /></td></tr>)}</tbody></table>
    </section>
  </div>;
}