import React, { useMemo, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, ReferenceArea
} from "recharts";
import { Info, TrendingUp, Activity, Zap, FlaskConical } from "lucide-react";

// =============================================================================
// PHARMACOKINETIC DATABASE — Fontes:
// • Handelsman DJ. Asian J Androl 2018 (testosterone preparations, half-lives)
// • Bhasin S et al. NEJM 1996, 2001 (testosterone PK after IM)
// • Nandrolone decanoate: PMC7696474 (t½ = 7–12d, usamos 8d)
// • NPP: Wikipedia / Nandrolone phenylpropionate (t½ IM = 2.7d)
// • Trenbolone acetate: t½ ~1d; enanthate ~5–7d; HBC ~7d (literature)
// • Testosterone propionate: t½ = 0.8d (Steroidplot / clinical data)
// • Testosterone enanthate: t½ = 4.5–7d (Handelsman; usamos 5.5d)
// • Testosterone cypionate: t½ = 7–8d (Flukka / Instagram clinical refs)
// • Testosterone decanoate: t½ = 5.6d (Analytical Science Journals 2015)
// • Testosterone undecanoate IM: t½ = 21d (AVEED® package insert)
// • Boldenone undecylenate: t½ ≈ 14d (widely cited in sports medicine)
// • Masteron propionate: t½ ≈ 1.5–2.5d; enanthate ≈ 5–7d
// • Primobolan (metenolone enanthate): t½ ≈ 5–7d
// • Oxandrolone (oral): t½ ≈ 9–13h ≈ 0.45d
// • Stanozolol (IM): t½ ≈ 24h; oral ≈ 9h
// =============================================================================

const SUBSTANCE_PK = {
  "testosterona": {
    color: "#c084fc",
    gradientColor: "rgba(192,132,252,0.15)",
    halfLifeByEster: {
      propionato: 0.8,         // 0.8d — literatura consensual (Handelsman 2018, Steroidplot)
      fenilpropionato: 1.5,    // 1.5d (estimativa intermediária)
      isocaproato: 4.0,        // 4d (componente do Sustanon)
      enantato: 5.5,           // 5.5d (Handelsman 2018 — faixa 4.5–7d)
      cipionato: 8.0,          // 8d (Flukka / múltiplas fontes clínicas)
      decanoato: 5.6,          // 5.6d (Analytical Science Journals 2015)
      undecanoato: 21,         // 21d (AVEED® IM package insert)
      suspensao: 0.25,
      base: 0.25,
      sem_ester: 0.25,
    },
    defaultHalfLife: 5.5,
    ngDlPerMg: 7.5,
    baselineNgDl: 500,
    suppressEndogenous: true,
    unit: "ng/dL",
    refRangeLow: 300,
    refRangeHigh: 1000,
    superPhysioThreshold: 3000,
    peakTimeDays: { propionato: 1, enantato: 3, cipionato: 3, decanoato: 4, undecanoato: 7, fenilpropionato: 1.5, isocaproato: 3, suspensao: 0.5, base: 0.5, sem_ester: 0.5 },
    description: "Testosterona Sérica",
    detectWindowDays: { propionato: 3, enantato: 21, cipionato: 21, decanoato: 21, undecanoato: 90, sem_ester: 1 },
    showAvgLine: true,
  },
  "trembolona": {
    color: "#f472b6",
    gradientColor: "rgba(244,114,182,0.15)",
    halfLifeByEster: {
      acetato: 1.0,             // 1d (Steroidplot; consenso geral)
      enantato: 5.5,            // 5–7d (estimativa baseada em comprimento da cadeia)
      hexaidrobenzilcarbonato: 7.0, // ~7d (Parabolan — literatura esportiva)
      sem_ester: 0.3,
    },
    defaultHalfLife: 1.0,
    ngDlPerMg: 0.5,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 800,
    peakTimeDays: { acetato: 0.5, enantato: 3, hexaidrobenzilcarbonato: 4 },
    description: "Trenbolona Plasmática",
    detectWindowDays: { acetato: 5, enantato: 30 },
    showAvgLine: false,
  },
  "nandrolona": {
    color: "#22d3ee",
    gradientColor: "rgba(34,211,238,0.15)",
    halfLifeByEster: {
      fenilpropionato: 2.7,   // 2.7d (Wikipedia NPP — intramuscular)
      decanoato: 8.0,         // 7–12d (PMC7696474) — usamos média 8d
      sem_ester: 0.5,
    },
    defaultHalfLife: 8.0,
    ngDlPerMg: 4.2,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 1500,
    peakTimeDays: { fenilpropionato: 2, decanoato: 4 },
    description: "Nandrolona Sérica",
    detectWindowDays: { fenilpropionato: 10, decanoato: 18 },
    showAvgLine: false,
  },
  "boldenona": {
    color: "#34d399",
    gradientColor: "rgba(52,211,153,0.15)",
    halfLifeByEster: {
      undecanoato: 14,   // ~14d (éster muito longo — ampla citação em medicina esportiva)
      cipionato: 7,
      sem_ester: 1,
    },
    defaultHalfLife: 14,
    ngDlPerMg: 3.8,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 1000,
    peakTimeDays: { undecanoato: 5, cipionato: 3 },
    description: "Boldenona Plasmática",
    detectWindowDays: { undecanoato: 40 },
    showAvgLine: false,
  },
  "stanozolol": {
    color: "#fb923c",
    gradientColor: "rgba(251,146,60,0.15)",
    halfLifeByEster: { sem_ester: 1.0, suspensao: 1.0, base: 1.0 },
    defaultHalfLife: 1.0,
    ngDlPerMg: 2.5,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/mL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 200,
    peakTimeDays: { sem_ester: 0.5 },
    description: "Stanozolol Plasmático",
    detectWindowDays: { sem_ester: 3 },
    showAvgLine: false,
  },
  "oxandrolona": {
    color: "#a78bfa",
    gradientColor: "rgba(167,139,250,0.15)",
    halfLifeByEster: { sem_ester: 0.45 }, // 9–13h ≈ 0.45d
    defaultHalfLife: 0.45,
    ngDlPerMg: 15.0,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/mL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 150,
    peakTimeDays: { sem_ester: 0.5 },
    description: "Oxandrolona Plasmática",
    detectWindowDays: { sem_ester: 3 },
    showAvgLine: false,
  },
  "masteron": {
    color: "#60a5fa",
    gradientColor: "rgba(96,165,250,0.15)",
    halfLifeByEster: { propionato: 2.0, enantato: 5.5, sem_ester: 0.5 }, // propionato ~2d; enantato ~5–7d
    defaultHalfLife: 2.0,
    ngDlPerMg: 3.2,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 800,
    peakTimeDays: { propionato: 1, enantato: 3 },
    description: "Drostanolona Plasmática",
    detectWindowDays: { propionato: 7, enantato: 28 },
    showAvgLine: false,
  },
  "drostanolona": {
    color: "#60a5fa",
    gradientColor: "rgba(96,165,250,0.15)",
    halfLifeByEster: { propionato: 2.0, enantato: 5.5, sem_ester: 0.5 },
    defaultHalfLife: 2.0,
    ngDlPerMg: 3.2,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 800,
    peakTimeDays: { propionato: 1, enantato: 3 },
    description: "Drostanolona Plasmática",
    detectWindowDays: { propionato: 7, enantato: 28 },
    showAvgLine: false,
  },
  "primobolan": {
    color: "#86efac",
    gradientColor: "rgba(134,239,172,0.15)",
    halfLifeByEster: { acetato: 0.8, enantato: 5.5, sem_ester: 0.5 },
    defaultHalfLife: 5.5,
    ngDlPerMg: 3.0,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 900,
    peakTimeDays: { acetato: 0.5, enantato: 3 },
    description: "Metenolona Plasmática",
    detectWindowDays: { acetato: 4, enantato: 35 },
    showAvgLine: false,
  },
  "metenolona": {
    color: "#86efac",
    gradientColor: "rgba(134,239,172,0.15)",
    halfLifeByEster: { acetato: 0.8, enantato: 5.5, sem_ester: 0.5 },
    defaultHalfLife: 5.5,
    ngDlPerMg: 3.0,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 900,
    peakTimeDays: { acetato: 0.5, enantato: 3 },
    description: "Metenolona Plasmática",
    detectWindowDays: { acetato: 4, enantato: 35 },
    showAvgLine: false,
  },
  "hgh": {
    color: "#fbbf24",
    gradientColor: "rgba(251,191,36,0.15)",
    halfLifeByEster: { sem_ester: 0.125, base: 0.125 },
    defaultHalfLife: 0.125,
    ngDlPerMg: 180,
    baselineNgDl: 30,
    suppressEndogenous: false,
    unit: "ng/mL ×10",
    refRangeLow: 10,
    refRangeHigh: 50,
    superPhysioThreshold: 300,
    peakTimeDays: { sem_ester: 0.2 },
    description: "GH Sérico",
    detectWindowDays: { sem_ester: 1 },
    showAvgLine: false,
  },
  "somatropina": {
    color: "#fbbf24",
    gradientColor: "rgba(251,191,36,0.15)",
    halfLifeByEster: { sem_ester: 0.125, base: 0.125 },
    defaultHalfLife: 0.125,
    ngDlPerMg: 180,
    baselineNgDl: 30,
    suppressEndogenous: false,
    unit: "ng/mL ×10",
    refRangeLow: 10,
    refRangeHigh: 50,
    superPhysioThreshold: 300,
    peakTimeDays: { sem_ester: 0.2 },
    description: "GH Sérico",
    detectWindowDays: { sem_ester: 1 },
    showAvgLine: false,
  },
  "clembuterol": {
    color: "#f87171",
    gradientColor: "rgba(248,113,113,0.15)",
    halfLifeByEster: { sem_ester: 1.5 },
    defaultHalfLife: 1.5,
    ngDlPerMg: 100,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "pg/mL ×100",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 200,
    peakTimeDays: { sem_ester: 0.1 },
    description: "Clembuterol Plasmático",
    detectWindowDays: { sem_ester: 7 },
    showAvgLine: false,
  },
  "insulina": {
    color: "#e879f9",
    gradientColor: "rgba(232,121,249,0.15)",
    halfLifeByEster: { sem_ester: 0.08, base: 0.08 },
    defaultHalfLife: 0.08,
    ngDlPerMg: 26000,
    baselineNgDl: 50,
    suppressEndogenous: false,
    unit: "mcIU/mL ×10",
    refRangeLow: 50,
    refRangeHigh: 150,
    superPhysioThreshold: 500,
    peakTimeDays: { sem_ester: 0.08 },
    description: "Insulinemia",
    detectWindowDays: {},
    showAvgLine: false,
  },
  "sustanon": {
    color: "#c084fc",
    gradientColor: "rgba(192,132,252,0.15)",
    halfLifeByEster: { sem_ester: 3.5 },
    defaultHalfLife: 3.5, // blend: prop(0.8) + fen(1.5) + isocap(4) + deca(5.6)
    ngDlPerMg: 6.5,
    baselineNgDl: 500,
    suppressEndogenous: true,
    unit: "ng/dL",
    refRangeLow: 300,
    refRangeHigh: 1000,
    superPhysioThreshold: 3000,
    peakTimeDays: { sem_ester: 1.5 },
    description: "Testosterona (Sustanon)",
    detectWindowDays: { sem_ester: 21 },
    showAvgLine: true,
  },
  "_default": {
    color: "#94a3b8",
    gradientColor: "rgba(148,163,184,0.1)",
    halfLifeByEster: {},
    defaultHalfLife: 3.5,
    ngDlPerMg: 5.0,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 1000,
    peakTimeDays: {},
    description: "Concentração Plasmática",
    detectWindowDays: {},
    showAvgLine: false,
  },
};

const FREQ_INTERVAL = {
  "1x_semana": 7, "2x_semana": 3.5, "3x_semana": 7 / 3,
  "dia_sim_dia_nao": 2, "diario": 1, "2x_dia": 0.5, "conforme_necessario": 3.5,
};

function getPK(substanceName) {
  if (!substanceName) return SUBSTANCE_PK["_default"];
  const lower = substanceName.toLowerCase();
  for (const [key, pk] of Object.entries(SUBSTANCE_PK)) {
    if (key === "_default") continue;
    if (lower.includes(key)) return pk;
  }
  return SUBSTANCE_PK["_default"];
}

function simulateConcentration(dose_mg, halfLifeDays, intervalDays, totalDays, ngDlPerMg, baselineNgDl, suppressEndogenous) {
  const k = Math.LN2 / halfLifeDays;
  const dose_ngDl = dose_mg * ngDlPerMg;
  const resolution = halfLifeDays < 1 ? 0.25 : 1;
  const numPoints = Math.ceil(totalDays / resolution);
  const conc = new Float64Array(numPoints).fill(0);

  let t = 0;
  while (t < totalDays) {
    const injIdx = Math.round(t / resolution);
    for (let i = injIdx; i < numPoints; i++) {
      conc[i] += dose_ngDl * Math.exp(-k * (i - injIdx) * resolution);
    }
    t += intervalDays;
  }

  return Array.from({ length: totalDays }, (_, day) => {
    const idx = Math.min(Math.round(day / resolution), numPoints - 1);
    const drug = conc[idx];
    let endo = baselineNgDl;
    if (suppressEndogenous && drug > 0) {
      const sup = Math.min(1, drug / (ngDlPerMg * 50));
      endo = baselineNgDl * (1 - sup);
    }
    return Math.round((drug + endo) * 10) / 10;
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const week = Math.ceil(label / 7);
  return (
    <div className="bg-[#06040f] border border-purple-500/40 rounded-xl p-3 shadow-2xl" style={{ minWidth: 180 }}>
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-purple-900/30">
        <span className="text-[10px] text-purple-400/60 font-mono-cyber">Dia {label}</span>
        <span className="text-[10px] text-purple-400/40 font-mono-cyber">Semana {week}</span>
      </div>
      {payload.filter(e => e.dataKey !== "__avg__").map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color, boxShadow: `0 0 4px ${entry.color}` }} />
            <span style={{ color: entry.color }} className="text-[10px] truncate max-w-[110px]">{entry.name?.split(" ")[0]}</span>
          </div>
          <span className="font-bold text-white text-xs">{entry.value?.toLocaleString("pt-BR")}</span>
        </div>
      ))}
    </div>
  );
};

// ─── PKInfoCard — exibe specs detalhadas por substância ─────────────────
function PKInfoCard({ info }) {
  const { key, halfLife, ssDays, ssValue, peakValue, troughValue, avgValue, pk, unit, ester, freq, dosePerApp } = info;

  const peakTimeDays = pk.peakTimeDays?.[ester] ?? (halfLife * 1.5);
  const detectDays = pk.detectWindowDays?.[ester] ?? null;

  const rows = [
    { label: "T½ ÉSTER", val: halfLife < 1 ? `${(halfLife * 24).toFixed(0)}h` : `${halfLife}d`, hint: "Meia-vida de eliminação" },
    { label: "PICO EM", val: peakTimeDays < 1 ? `${(peakTimeDays * 24).toFixed(0)}h` : `~${peakTimeDays.toFixed(0)}d`, hint: "Tempo até Cmax após injeção" },
    { label: "STEADY STATE", val: `~dia ${ssDays}`, hint: "Atingido em ~4–5 × T½" },
    { label: "Cmax (PICO)", val: peakValue >= 1000 ? `${(peakValue / 1000).toFixed(1)}k` : peakValue?.toFixed(0), hint: `Concentração máxima estimada (${unit})` },
    { label: "Cmin (VALLEY)", val: troughValue >= 1000 ? `${(troughValue / 1000).toFixed(1)}k` : troughValue?.toFixed(0), hint: `Menor nível pré-injeção (${unit})` },
    ...(avgValue != null ? [{ label: "MÉDIA SÉRICA", val: avgValue >= 1000 ? `${(avgValue / 1000).toFixed(2)}k` : avgValue?.toFixed(0), hint: `Média total no ciclo (${unit})`, highlight: true }] : []),
    ...(detectDays ? [{ label: "DETECÇÃO", val: `~${detectDays}d`, hint: "Janela de detecção antidoping (estimada)" }] : []),
  ];

  return (
    <div className="rounded-xl border border-purple-900/20 bg-black/30 overflow-hidden">
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${pk.color}, transparent)` }} />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: pk.color, boxShadow: `0 0 6px ${pk.color}` }} />
          <span className="text-xs font-semibold text-white">{key}</span>
          <span className="ml-auto text-[8px] font-mono-cyber text-purple-500/30">{unit}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {rows.map(r => (
            <div key={r.label} className={`rounded-lg px-2 py-1.5 border ${r.highlight ? "border-purple-500/30 bg-purple-500/10" : "bg-black/30 border-purple-900/15"}`} title={r.hint}>
              <p className={`text-xs font-bold ${r.highlight ? "text-purple-300" : "text-white"}`} style={!r.highlight ? { color: pk.color } : {}}>
                {r.val ?? "—"}
              </p>
              <p className="text-[7px] font-mono-cyber text-purple-500/35 tracking-widest mt-0.5">{r.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CycleConcentrationChart({ substances, cycleDurationWeeks = 12 }) {
  const [chartType, setChartType] = useState("area");
  const totalDays = (cycleDurationWeeks || 12) * 7;

  const { chartData, lineKeys, pkMap, steadyStateInfo, showAvgLine } = useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => ({ day: i + 1 }));
    const keys = [];
    const pkByKey = {};
    const ssInfo = [];
    let hasAvg = false;
    const avgValues = new Float64Array(totalDays).fill(0);

    substances.forEach((sub) => {
      const pk = getPK(sub.substance);
      const halfLife = pk.halfLifeByEster?.[sub.ester] || pk.defaultHalfLife;
      const interval = FREQ_INTERVAL[sub.application_frequency] || 3.5;
      const dose = Number(sub.dosage_mg_per_application) || (Number(sub.dosage_mg_per_week) / (7 / interval));
      if (!dose || dose <= 0) return;

      let dose_mg = dose;
      if (sub.dosage_unit === "mcg") dose_mg = dose / 1000;
      else if (sub.dosage_unit === "iu" || sub.dosage_unit === "ui") dose_mg = dose * 0.03;

      const points = simulateConcentration(dose_mg, halfLife, interval, totalDays, pk.ngDlPerMg, pk.baselineNgDl, pk.suppressEndogenous);
      const key = `${sub.substance.split(" ")[0]}${sub.ester && sub.ester !== "sem_ester" ? ` (${sub.ester.slice(0,3)})` : ""}`;
      keys.push(key);
      pkByKey[key] = pk;

      // Steady state
      const ssDays = Math.round(4.5 * halfLife);
      const ssStart = Math.min(ssDays, points.length - 1);
      const ssSlice = points.slice(ssStart);
      const ssValue = points[ssStart];
      const peakValue = Math.max(...points);
      const troughValue = Math.min(...points.slice(ssStart));
      const avgValue = ssSlice.length ? ssSlice.reduce((a, b) => a + b, 0) / ssSlice.length : null;

      ssInfo.push({ key, halfLife, ssDays, ssValue, peakValue, troughValue, avgValue: Math.round(avgValue), pk, unit: pk.unit, ester: sub.ester, freq: sub.application_frequency, dosePerApp: dose_mg });

      points.forEach((val, i) => { days[i][key] = val; });

      // Accumulate for avg line if this is a testosterone substance
      if (pk.showAvgLine) {
        hasAvg = true;
        points.forEach((val, i) => { avgValues[i] += val; });
      }
    });

    // Compute rolling average (7-day) for testosterone
    if (hasAvg) {
      const windowSize = 7;
      days.forEach((d, i) => {
        const start = Math.max(0, i - windowSize + 1);
        let sum = 0;
        for (let j = start; j <= i; j++) sum += avgValues[j];
        d.__avg__ = Math.round((sum / (i - start + 1)) * 10) / 10;
      });
    }

    return { chartData: days, lineKeys: keys, pkMap: pkByKey, steadyStateInfo: ssInfo, showAvgLine: hasAvg };
  }, [substances, totalDays]);

  const refBands = useMemo(() => {
    const bands = [];
    lineKeys.forEach((k) => {
      const pk = pkMap[k];
      if (pk?.refRangeLow && pk?.refRangeHigh) bands.push({ low: pk.refRangeLow, high: pk.refRangeHigh, color: pk.color });
    });
    return bands;
  }, [lineKeys, pkMap]);

  const xTicks = useMemo(() => {
    const ticks = [];
    for (let d = 7; d <= totalDays; d += 7) ticks.push(d);
    return ticks;
  }, [totalDays]);

  if (!lineKeys.length) return null;

  const units = [...new Set(lineKeys.map(k => pkMap[k]?.unit || "ng/dL"))];
  const yLabel = units.length === 1 ? units[0] : "Conc.";

  const ChartComponent = chartType === "area" ? AreaChart : LineChart;

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="cyber-card rounded-2xl overflow-hidden border border-purple-900/20">
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #a855f7, #22d3ee, #ec4899, transparent)' }} />
        <div className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <TrendingUp className="w-4 h-4 text-purple-400" style={{ filter: 'drop-shadow(0 0 5px rgba(168,85,247,0.7))' }} />
                <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.3em] uppercase">Modelo Farmacocinético</p>
              </div>
              <h3 className="font-cyber text-base text-white tracking-wider">Concentração Sérica Estimada</h3>
              <p className="text-[9px] font-mono-cyber text-purple-500/30 mt-0.5">Cinética de 1ª ordem · {yLabel} · {totalDays} dias de ciclo</p>
            </div>
            <div className="flex gap-1 p-0.5 rounded-lg bg-black/40 border border-purple-900/20">
              {[{ id: "area", label: "ÁREA" }, { id: "line", label: "LINHA" }].map(t => (
                <button key={t.id} onClick={() => setChartType(t.id)}
                  className={`px-3 py-1.5 rounded-md text-[9px] font-mono-cyber tracking-wider transition-all ${
                    chartType === t.id ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-purple-500/40 hover:text-purple-300"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <ChartComponent data={chartData} margin={{ top: 5, right: 16, left: 10, bottom: 24 }}>
              <defs>
                {lineKeys.map((key) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={pkMap[key]?.color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={pkMap[key]?.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
                {showAvgLine && (
                  <linearGradient id="grad-avg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.01} />
                  </linearGradient>
                )}
              </defs>

              <CartesianGrid strokeDasharray="3 4" stroke="rgba(168,85,247,0.06)" />

              {/* Faixa fisiológica */}
              {refBands.map((band, i) => (
                <ReferenceArea key={i} y1={band.low} y2={band.high}
                  fill={band.color} fillOpacity={0.05}
                  stroke={band.color} strokeOpacity={0.2} strokeDasharray="4 6" />
              ))}

              {/* Separadores de semana */}
              {xTicks.map(d => (
                <ReferenceLine key={d} x={d} stroke="rgba(168,85,247,0.07)" strokeDasharray="2 8" />
              ))}

              <XAxis
                dataKey="day"
                ticks={xTicks}
                stroke="rgba(168,85,247,0.15)"
                tick={{ fill: "rgba(192,132,252,0.45)", fontSize: 9, fontFamily: "Share Tech Mono, monospace" }}
                tickFormatter={d => `S${Math.round(d / 7)}`}
                label={{ value: "Semanas de Ciclo", position: "insideBottom", offset: -14, fill: "rgba(192,132,252,0.3)", fontSize: 9 }}
              />
              <YAxis
                stroke="rgba(168,85,247,0.15)"
                tick={{ fill: "rgba(192,132,252,0.45)", fontSize: 9, fontFamily: "Share Tech Mono, monospace" }}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} />

              {lineKeys.map((key) => (
                chartType === "area" ? (
                  <Area key={key} type="monotone" dataKey={key}
                    stroke={pkMap[key]?.color} strokeWidth={2}
                    fill={`url(#grad-${key})`} dot={false}
                    activeDot={{ r: 5, fill: pkMap[key]?.color, stroke: '#06040f', strokeWidth: 2 }}
                  />
                ) : (
                  <Line key={key} type="monotone" dataKey={key}
                    stroke={pkMap[key]?.color} strokeWidth={2.5} dot={false}
                    activeDot={{ r: 5, fill: pkMap[key]?.color, stroke: '#06040f', strokeWidth: 2 }}
                  />
                )
              ))}

              {/* Linha de média sérica (média móvel 7d) */}
              {showAvgLine && (
                chartType === "area" ? (
                  <Area type="monotone" dataKey="__avg__"
                    stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5 4"
                    fill="url(#grad-avg)" dot={false} name="Média Sérica (7d)"
                    activeDot={{ r: 4, fill: "#fbbf24", stroke: '#06040f', strokeWidth: 2 }}
                  />
                ) : (
                  <Line type="monotone" dataKey="__avg__"
                    stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5 4"
                    dot={false} name="Média Sérica (7d)"
                    activeDot={{ r: 4, fill: "#fbbf24", stroke: '#06040f', strokeWidth: 2 }}
                  />
                )
              )}
            </ChartComponent>
          </ResponsiveContainer>

          {/* Legends */}
          <div className="flex flex-wrap gap-3 mt-3">
            {refBands.map((band, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono-cyber">
                <div className="w-8 h-1 rounded-full opacity-60" style={{ background: band.color }} />
                <span className="text-purple-400/40">Faixa fisiológica: {band.low}–{band.high} ng/dL</span>
              </div>
            ))}
            {showAvgLine && (
              <div className="flex items-center gap-1.5 text-[9px] font-mono-cyber">
                <div className="w-8 h-0.5 rounded-full opacity-80" style={{ background: "#fbbf24", borderTop: "1px dashed #fbbf24" }} />
                <span className="text-amber-400/60">Média sérica (média móvel 7d)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PK Info Cards */}
      {steadyStateInfo.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {steadyStateInfo.map((info) => (
            <PKInfoCard key={info.key} info={info} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[9px] text-purple-400/25 text-center font-mono-cyber flex items-center justify-center gap-1.5">
        <Info className="w-3 h-3 flex-shrink-0" />
        Modelo PK de 1ª ordem · meias-vidas: Handelsman 2018, Bhasin 2001, PMC7696474 e literatura esportiva · não substituem exames laboratoriais
      </p>
    </div>
  );
}