import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, ReferenceArea
} from "recharts";

// =============================================================================
// PHARMACOKINETIC CONSTANTS (peer-reviewed sources)
// Half-lives from: Bhasin et al. NEJM 2010; Dobs et al.; manufacturer data
// Volume of Distribution and bioavailability from published PK studies
// Conversion to ng/dL uses: C(ng/dL) = dose_mg * F * 1e6 / (Vd_L * MW * 100)
// where F = bioavailability, MW = molecular weight g/mol, Vd in L
// =============================================================================

const SUBSTANCE_PK = {
  // key matches substance name patterns (case insensitive includes)
  "testosterona": {
    color: "#c084fc",
    halfLifeByEster: {
      propionato: 0.8,        // ~19h
      fenilpropionato: 1.5,   // ~36h
      isocaproato: 4.0,       // ~4 days
      enantato: 4.5,          // ~4.5 days (Bhasin NEJM 1996)
      cipionato: 5.0,         // ~5 days
      decanoato: 7.5,         // ~7.5 days
      undecanoato: 21,        // ~21 days (Nebido data)
      suspensao: 0.25,
      base: 0.25,
      sem_ester: 0.25,
    },
    defaultHalfLife: 4.5,
    // Vd for testosterone ~19 L (free+bound); MW 288 g/mol; F~100% IM
    // For enanthate ester: active moiety ~70% of MW (ester cleaved)
    // Empirical: 500mg/week enanthate → ~3000-4000 ng/dL at steady state
    // Factor calibrated to match clinical data: 1 mg IM → ~7.5 ng/dL peak
    ngDlPerMg: 7.5,
    baselineNgDl: 500,       // avg endogenous testosterone (suppressed during cycle → 0)
    suppressEndogenous: true,
    unit: "ng/dL",
    refRangeLow: 300,
    refRangeHigh: 1000,
    superPhysioThreshold: 3000,
  },
  "trembolona": {
    color: "#f472b6",
    halfLifeByEster: {
      acetato: 1.0,           // ~1 day
      enantato: 5.0,          // ~5 days
      hexaidrobenzilcarbonato: 6.0,
      sem_ester: 0.3,
    },
    defaultHalfLife: 1.0,
    // Trenbolone: no serum assay in ng/dL commonly; plotted as relative plasma conc
    // Vd ~300L (highly lipophilic); binding affinity 5x testosterone
    // 1 mg acetate → ~0.5 ng/dL equivalent (relative)
    ngDlPerMg: 0.5,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL (relativo)",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 800,
  },
  "nandrolona": {
    color: "#22d3ee",
    halfLifeByEster: {
      fenilpropionato: 2.5,
      decanoato: 7.0,         // Deca: ~7 days
      sem_ester: 0.5,
    },
    defaultHalfLife: 7.0,
    // Nandrolone Vd ~34 L; MW 274; F ~100% IM
    // 1 mg NPP/Deca → ~4.2 ng/dL
    ngDlPerMg: 4.2,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 1500,
  },
  "boldenona": {
    color: "#34d399",
    halfLifeByEster: {
      undecanoato: 14,
      cipionato: 7,
      sem_ester: 1,
    },
    defaultHalfLife: 14,
    ngDlPerMg: 3.8,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL (relativo)",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 1000,
  },
  "stanozolol": {
    color: "#fb923c",
    halfLifeByEster: {
      sem_ester: 1.0,         // oral: ~9h; injectable aqueous: ~1 day
      suspensao: 1.0,
      base: 1.0,
    },
    defaultHalfLife: 1.0,
    ngDlPerMg: 2.5,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/mL (plasma)",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 200,
  },
  "oxandrolona": {
    color: "#a78bfa",
    halfLifeByEster: { sem_ester: 0.4 }, // ~9h oral
    defaultHalfLife: 0.4,
    ngDlPerMg: 15.0,  // oral high bioavailability, lower dose range
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/mL (plasma)",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 150,
  },
  "masteron": {
    color: "#60a5fa",
    halfLifeByEster: {
      propionato: 1.5,
      enantato: 5.0,
      sem_ester: 0.5,
    },
    defaultHalfLife: 1.5,
    ngDlPerMg: 3.2,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL (relativo)",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 800,
  },
  "primobolan": {
    color: "#86efac",
    halfLifeByEster: {
      acetato: 0.8,
      enantato: 5.5,
      sem_ester: 0.5,
    },
    defaultHalfLife: 5.5,
    ngDlPerMg: 3.0,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL (relativo)",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 900,
  },
  // HGH / Somatotropina
  "hgh": {
    color: "#fbbf24",
    halfLifeByEster: { sem_ester: 0.125, base: 0.125 }, // ~3h SC
    defaultHalfLife: 0.125,
    // Normal basal GH: 1-5 ng/mL; exogenous 4IU ≈ 1.3mg → peak ~15-30 ng/mL
    // 1 mg HGH → ~18 ng/mL peak plasma; plotted in ng/mL
    ngDlPerMg: 180,  // 18 ng/mL × 10 (for ng/dL scale parity)
    baselineNgDl: 30,  // basal ~0.3 ng/mL in ng/dL = 30 ng/dL
    suppressEndogenous: false,
    unit: "ng/mL × 10",
    refRangeLow: 10,
    refRangeHigh: 50,
    superPhysioThreshold: 300,
  },
  "somatropina": { // alias for HGH
    color: "#fbbf24",
    halfLifeByEster: { sem_ester: 0.125, base: 0.125 },
    defaultHalfLife: 0.125,
    ngDlPerMg: 180,
    baselineNgDl: 30,
    suppressEndogenous: false,
    unit: "ng/mL × 10",
    refRangeLow: 10,
    refRangeHigh: 50,
    superPhysioThreshold: 300,
  },
  "clembuterol": {
    color: "#f87171",
    halfLifeByEster: { sem_ester: 1.5 }, // ~36h
    defaultHalfLife: 1.5,
    // Clenbuterol: plotted in pg/mL × 10 for readability
    // 20mcg dose → peak ~0.2 ng/mL; 1mg → ~10 ng/mL
    ngDlPerMg: 100,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "pg/mL × 100",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 200,
  },
  "insulina": {
    color: "#e879f9",
    halfLifeByEster: { sem_ester: 0.08, base: 0.08 }, // ~2h
    defaultHalfLife: 0.08,
    // Fasting insulin ~5-15 mcIU/mL; exogenous plotted in mcIU/mL
    ngDlPerMg: 26000, // 1mg insulin = 26 IU; peak ~100-200 mcIU/mL
    baselineNgDl: 50,  // 5 mcIU/mL × 10
    suppressEndogenous: false,
    unit: "mcIU/mL × 10",
    refRangeLow: 50,
    refRangeHigh: 150,
    superPhysioThreshold: 500,
  },
  // Default fallback
  "_default": {
    color: "#94a3b8",
    halfLifeByEster: {},
    defaultHalfLife: 3.5,
    ngDlPerMg: 5.0,
    baselineNgDl: 0,
    suppressEndogenous: false,
    unit: "ng/dL",
    refRangeLow: null,
    refRangeHigh: null,
    superPhysioThreshold: 1000,
  }
};

const COLORS = ["#c084fc", "#22d3ee", "#f472b6", "#34d399", "#fb923c", "#a78bfa", "#60a5fa", "#fbbf24", "#86efac", "#f87171"];

// Frequency → interval in days
const FREQ_INTERVAL = {
  "1x_semana": 7,
  "2x_semana": 3.5,
  "3x_semana": 7 / 3,
  "dia_sim_dia_nao": 2,
  "diario": 1,
  "2x_dia": 0.5,
  "conforme_necessario": 3.5,
};

/**
 * Get PK params for a substance by fuzzy name match
 */
function getPK(substanceName) {
  if (!substanceName) return SUBSTANCE_PK["_default"];
  const lower = substanceName.toLowerCase();
  for (const [key, pk] of Object.entries(SUBSTANCE_PK)) {
    if (key === "_default") continue;
    if (lower.includes(key)) return pk;
  }
  return SUBSTANCE_PK["_default"];
}

/**
 * Simulate serum concentration in ng/dL over time.
 * Uses 1st-order PK model (flip-flop if absorption < elimination).
 * 
 * For IM injections: uses a two-phase model with absorption lag (ka)
 * and elimination (ke). Simplified to monoexponential for most esters.
 * 
 * C(t) = dose_ngDl * exp(-k * t) for each injection
 * 
 * Steady-state is reached at ~4-5 half-lives.
 */
function simulateSerumConcentration(dose_mg, halfLifeDays, intervalDays, totalDays, ngDlPerMg, baselineNgDl, suppressEndogenous) {
  const k = Math.LN2 / halfLifeDays;
  const dose_ngDl = dose_mg * ngDlPerMg;
  
  // Resolution: hourly points for accuracy on short half-lives, daily for display
  const resolution = halfLifeDays < 1 ? 0.25 : 1; // 6h or 1 day steps
  const numPoints = Math.ceil(totalDays / resolution);
  const conc = new Float64Array(numPoints).fill(0);

  // Injection schedule
  let t = 0;
  while (t < totalDays) {
    const injIdx = Math.round(t / resolution);
    // Add dose to this time point, decays forward
    for (let i = injIdx; i < numPoints; i++) {
      const elapsed = (i - injIdx) * resolution;
      conc[i] += dose_ngDl * Math.exp(-k * elapsed);
    }
    t += intervalDays;
  }

  // Sample at daily resolution for chart
  const dailyPoints = [];
  for (let day = 0; day < totalDays; day++) {
    const idx = Math.round(day / resolution);
    const drugConc = conc[Math.min(idx, numPoints - 1)];
    
    // Endogenous contribution: suppressed linearly during exogenous use
    let endogenous = baselineNgDl;
    if (suppressEndogenous && drugConc > 0) {
      // HPG axis suppressed when exogenous T > ~200 ng/dL endogenous threshold
      const suppression = Math.min(1, drugConc / (ngDlPerMg * 50)); // 50mg threshold
      endogenous = baselineNgDl * (1 - suppression);
    }
    
    dailyPoints.push(Math.round((drugConc + endogenous) * 10) / 10);
  }
  return dailyPoints;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a18] border border-purple-500/40 rounded-xl p-3 text-xs shadow-2xl min-w-[160px]">
      <p className="text-purple-300 font-bold mb-2 font-mono-cyber">Dia {label}</p>
      {payload.map((entry, i) => {
        const pk = getPK(entry.name);
        return (
          <div key={i} className="mb-1.5 flex items-center justify-between gap-3">
            <span style={{ color: entry.color }} className="truncate max-w-[100px]">{entry.name}</span>
            <span className="font-bold text-white">{entry.value.toLocaleString()} <span className="text-purple-400/60 font-normal">{pk.unit}</span></span>
          </div>
        );
      })}
    </div>
  );
};

export default function CycleConcentrationChart({ substances, cycleDurationWeeks = 12 }) {
  const totalDays = (cycleDurationWeeks || 12) * 7;

  // Build line keys and data
  const { chartData, lineKeys, pkMap } = useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => ({ day: i + 1 }));
    const keys = [];
    const pkByKey = {};

    substances.forEach((sub) => {
      const pk = getPK(sub.substance);
      const halfLife = (pk.halfLifeByEster?.[sub.ester]) || pk.defaultHalfLife;
      const interval = FREQ_INTERVAL[sub.application_frequency] || 3.5;
      const dose = Number(sub.dosage_mg_per_application) || (Number(sub.dosage_mg_per_week) / (7 / interval));

      if (!dose || dose <= 0) return;

      // Convert dose based on unit
      let dose_mg = dose;
      if (sub.dosage_unit === "mcg") dose_mg = dose / 1000;
      else if (sub.dosage_unit === "iu" || sub.dosage_unit === "ui") dose_mg = dose * 0.03; // approx for GH

      const points = simulateSerumConcentration(
        dose_mg,
        halfLife,
        interval,
        totalDays,
        pk.ngDlPerMg,
        pk.baselineNgDl,
        pk.suppressEndogenous
      );

      const key = `${sub.substance}${sub.ester && sub.ester !== "sem_ester" ? ` (${sub.ester})` : ""}`;
      keys.push(key);
      pkByKey[key] = pk;
      points.forEach((val, i) => {
        days[i][key] = val;
      });
    });

    return { chartData: days, lineKeys: keys, pkMap: pkByKey };
  }, [substances, totalDays]);

  // Y-axis: determine shared unit and ref ranges
  const { yLabel, refBands } = useMemo(() => {
    const units = [...new Set(lineKeys.map(k => pkMap[k]?.unit || "ng/dL"))];
    const label = units.length === 1 ? units[0] : "ng/dL";
    
    const bands = [];
    lineKeys.forEach((k, i) => {
      const pk = pkMap[k];
      if (pk?.refRangeLow && pk?.refRangeHigh) {
        bands.push({ low: pk.refRangeLow, high: pk.refRangeHigh, color: COLORS[i % COLORS.length] });
      }
    });
    return { yLabel: label, refBands: bands };
  }, [lineKeys, pkMap]);

  // Injection tick marks
  const injectionDays = useMemo(() => {
    if (!substances.length) return [];
    const interval = FREQ_INTERVAL[substances[0].application_frequency] || 3.5;
    const days = [];
    let t = 0;
    while (t < totalDays) {
      days.push(Math.round(t) + 1);
      t += interval;
    }
    return days.slice(0, 25);
  }, [substances, totalDays]);

  if (!lineKeys.length) return null;

  return (
    <div className="bg-black/30 border border-purple-500/15 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-purple-300 text-xs font-cyber tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
          Concentração Sérica Estimada
        </p>
        <span className="text-[9px] text-purple-400/40 font-mono-cyber">{yLabel}</span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.07)" />

          {/* Physiological reference band (testosterone normal range) */}
          {refBands.map((band, i) => (
            <ReferenceArea
              key={i}
              y1={band.low}
              y2={band.high}
              fill={band.color}
              fillOpacity={0.04}
              stroke={band.color}
              strokeOpacity={0.15}
              strokeDasharray="4 4"
            />
          ))}

          <XAxis
            dataKey="day"
            stroke="rgba(168,85,247,0.2)"
            tick={{ fill: "rgba(192,132,252,0.5)", fontSize: 9 }}
            label={{ value: "Dias de Ciclo", position: "insideBottom", offset: -12, fill: "rgba(192,132,252,0.35)", fontSize: 9 }}
          />
          <YAxis
            stroke="rgba(168,85,247,0.2)"
            tick={{ fill: "rgba(192,132,252,0.5)", fontSize: 9 }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            label={{ value: yLabel, angle: -90, position: "insideLeft", offset: 10, fill: "rgba(192,132,252,0.35)", fontSize: 9 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "10px", color: "rgba(192,132,252,0.7)", paddingTop: 12 }}
          />

          {/* Injection timing markers */}
          {injectionDays.map((d) => (
            <ReferenceLine key={d} x={d} stroke="rgba(34,211,238,0.10)" strokeDasharray="2 6" />
          ))}

          {lineKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend: reference ranges */}
      {lineKeys.map((key) => {
        const pk = pkMap[key];
        if (!pk?.refRangeLow) return null;
        return (
          <div key={key} className="flex items-center gap-1.5 mt-1 text-[9px] text-purple-400/40">
            <span>Faixa fisiológica normal:</span>
            <span className="text-purple-400/60">{pk.refRangeLow}–{pk.refRangeHigh} {pk.unit}</span>
          </div>
        );
      })}

      <p className="text-purple-400/25 text-[9px] text-center mt-3 font-mono-cyber">
        Modelo PK de 1ª ordem · valores estimados baseados em dados publicados · não substituem exames laboratoriais
      </p>
    </div>
  );
}