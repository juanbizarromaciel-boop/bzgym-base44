import React from "react";
import { Badge } from "@/components/ui/badge";

const labelMap = {
  treinosAnalisados: "Treinos",
  exerciciosAvaliados: "Exercícios avaliados",
  exerciciosMantidos: "Mantidos",
  exerciciosSubstituidos: "Substituídos",
  exerciciosAdicionados: "Adicionados",
  exerciciosRemovidos: "Removidos",
  cargasMantidas: "Cargas mantidas",
  cargasEstimadas: "Cargas estimadas",
  confiancaGeral: "Confiança geral",
  adesaoMedia: "Adesão média",
};

function MetricCard({ label, value }) {
  return <div className="rounded-xl border border-purple-900/25 bg-black/25 p-3">
    <p className="text-[10px] uppercase tracking-widest text-purple-300/50 font-mono-cyber">{label}</p>
    <p className="text-xl font-bold text-white mt-1">{typeof value === "number" && label.includes("Adesão") ? `${value}%` : value}</p>
  </div>;
}

function Tag({ value }) {
  const color = value === "manter" || value === "alta" || value === "evoluiu" ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/25" : value === "substituir" || value === "media" || value === "média" || value === "manteve" ? "bg-amber-500/10 text-amber-200 border-amber-500/25" : "bg-pink-500/10 text-pink-200 border-pink-500/25";
  return <Badge className={`border ${color}`}>{String(value || "—").replace("sem_dados", "sem dados")}</Badge>;
}

function MiniBar({ value, max = 100, color = "bg-cyan-400" }) {
  const w = Math.max(4, Math.min(100, Math.round((Number(value || 0) / max) * 100)));
  return <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${w}%` }} /></div>;
}

function ChartCard({ title, children, hasData = true }) {
  return <div className="rounded-xl border border-purple-900/25 bg-purple-500/5 p-4">
    <h4 className="font-cyber text-xs tracking-widest text-cyan-200 mb-3">{title}</h4>
    {hasData ? children : <p className="text-sm text-purple-300/50">Dados insuficientes para gerar este gráfico.</p>}
  </div>;
}

export default function RelatorioEvolucaoTreinoPreview({ report }) {
  if (!report) return null;
  const status = report.graficos.statusExercicios;
  const alteracoes = report.graficos.alteracoesExercicios;
  const cargas = report.graficos.cargas;

  return <div className="space-y-5">
    <section className="rounded-2xl border border-purple-900/35 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 p-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-200 font-mono-cyber">Relatório normalizado</p>
          <h2 className="text-2xl font-bold text-white mt-1">{report.aluno.nome}</h2>
          <p className="text-sm text-purple-200/65 mt-1">{report.aluno.objetivo} · {report.modoRelatorio === "plano_completo" ? "Plano completo" : "Treino específico"}</p>
        </div>
        <div className="text-sm text-purple-200/70 md:text-right">
          <p><b>Ciclo analisado:</b> {report.cicloAnterior}</p>
          <p><b>Novo ciclo:</b> {report.cicloNovo}</p>
          <p>{report.periodoAnalisado}</p>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {Object.entries(report.metricasResumo).map(([key, value]) => <MetricCard key={key} label={labelMap[key] || key} value={value} />)}
    </section>

    <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
      <h3 className="font-cyber text-sm tracking-widest text-cyan-200 mb-2">DIAGNÓSTICO GERAL</h3>
      <p className="text-sm leading-relaxed text-purple-100/85 max-w-4xl">{report.resumoExecutivo}</p>
      <p className="text-sm leading-relaxed text-purple-200/65 max-w-4xl mt-3"><b>Estratégia:</b> {report.estrategiaNovoCiclo}</p>
    </section>

    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      <ChartCard title="Adesão ao treino" hasData={report.graficos.adesaoTreino.percentualAdesao > 0}>
        <div className="flex items-center justify-between text-sm mb-2"><span>{report.graficos.adesaoTreino.treinosConcluidos}/{report.graficos.adesaoTreino.treinosPrevistos} sessões</span><b>{report.graficos.adesaoTreino.percentualAdesao}%</b></div><MiniBar value={report.graficos.adesaoTreino.percentualAdesao} />
      </ChartCard>
      <ChartCard title="Status dos exercícios" hasData={Object.values(status).some(Boolean)}>
        {Object.entries(status).map(([k, v]) => <div key={k} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{k}</span><b>{v}</b></div><MiniBar value={v} max={Math.max(...Object.values(status), 1)} color="bg-purple-400" /></div>)}
      </ChartCard>
      <ChartCard title="Alterações" hasData={Object.values(alteracoes).some(Boolean)}>
        {Object.entries(alteracoes).map(([k, v]) => <div key={k} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{k}</span><b>{v}</b></div><MiniBar value={v} max={Math.max(...Object.values(alteracoes), 1)} color="bg-cyan-400" /></div>)}
      </ChartCard>
      <ChartCard title="Cargas" hasData={Object.values(cargas).some(Boolean)}>
        {Object.entries(cargas).map(([k, v]) => <div key={k} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{k}</span><b>{v}</b></div><MiniBar value={v} max={Math.max(...Object.values(cargas), 1)} color="bg-amber-400" /></div>)}
      </ChartCard>
      <ChartCard title="Volume por grupo" hasData={report.graficos.volumeGrupoMuscular.length > 0}>
        {report.graficos.volumeGrupoMuscular.slice(0, 5).map(g => <div key={g.grupoMuscular} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{g.grupoMuscular}</span><span>{g.volumeAnterior} → {g.volumeNovo}</span></div><MiniBar value={g.volumeNovo} max={Math.max(...report.graficos.volumeGrupoMuscular.map(x => x.volumeNovo), 1)} color="bg-emerald-400" /></div>)}
      </ChartCard>
      <ChartCard title="PRs no período" hasData={report.graficos.prsPeriodo.length > 0}>
        {report.graficos.prsPeriodo.slice(0, 4).map((p, i) => <p key={i} className="text-xs text-purple-100/75 mb-1">{p.exercicio}: {p.carga || "—"}kg · {p.repeticoes || "—"} reps</p>)}
      </ChartCard>
    </section>
  </div>;
}