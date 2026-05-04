import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from "recharts";

// Half-lives in days (based on published pharmacokinetic data)
const ESTER_HALF_LIFE = {
  propionato: 0.8,
  fenilpropionato: 1.5,
  isocaproato: 4,
  enantato: 4.5,
  cipionato: 5,
  decanoato: 7.5,
  undecanoato: 21,
  acetato: 0.5,
  sem_ester: 0.25,
};

const ESTER_LABELS = {
  propionato: "Propionato",
  fenilpropionato: "Fenilpropionato",
  isocaproato: "Isocaproato",
  enantato: "Enantato",
  cipionato: "Cipionato",
  decanoato: "Decanoato",
  undecanoato: "Undecanoato",
  acetato: "Acetato",
  sem_ester: "Sem Éster",
};

const COLORS = ["#c084fc", "#22d3ee", "#f472b6", "#34d399", "#fb923c", "#a78bfa", "#60a5fa"];

// Frequency → interval in days
const FREQ_INTERVAL = {
  "1x_semana": 7,
  "2x_semana": 3.5,
  "3x_semana": 7 / 3,
  "dia_sim_dia_nao": 2,
  "diario": 1,
};

function simulateConcentration(dose, halfLifeDays, intervalDays, totalDays) {
  const k = Math.LN2 / halfLifeDays; // elimination rate constant
  const points = new Array(totalDays).fill(0);

  // Generate all injection times
  const injections = [];
  let t = 0;
  while (t < totalDays) {
    injections.push(t);
    t += intervalDays;
  }

  // For each day, sum contribution of all past injections
  for (let day = 0; day < totalDays; day++) {
    let conc = 0;
    for (const injDay of injections) {
      if (injDay <= day) {
        const elapsed = day - injDay;
        conc += dose * Math.exp(-k * elapsed);
      }
    }
    points[day] = Math.round(conc * 10) / 10;
  }
  return points;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d22] border border-purple-500/30 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-purple-300 font-bold mb-2">Dia {label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="mb-1">
          {entry.name}: <span className="font-bold">{entry.value} mg</span>
        </p>
      ))}
    </div>
  );
};

export default function CycleConcentrationChart({ substances, cycleDurationWeeks = 12 }) {
  const totalDays = (cycleDurationWeeks || 12) * 7;

  const chartData = useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => ({ day: i + 1 }));

    substances.forEach((sub, idx) => {
      const halfLife = ESTER_HALF_LIFE[sub.ester] || 4.5;
      const interval = FREQ_INTERVAL[sub.application_frequency] || 3.5;
      const dose = sub.dosage_mg_per_application || sub.dosage_mg_per_week / (7 / interval);
      const points = simulateConcentration(dose, halfLife, interval, totalDays);
      points.forEach((val, i) => {
        days[i][`${sub.substance}${sub.ester ? ` (${ESTER_LABELS[sub.ester]})` : ""}`] = val;
      });
    });

    return days;
  }, [substances, totalDays]);

  // Injection day markers (first substance reference)
  const injectionDays = useMemo(() => {
    if (!substances.length) return [];
    const interval = FREQ_INTERVAL[substances[0].application_frequency] || 3.5;
    const days = [];
    let t = 0;
    while (t < totalDays) {
      days.push(Math.round(t) + 1);
      t += interval;
    }
    return days.slice(0, 20); // limit reference lines
  }, [substances, totalDays]);

  const lineKeys = substances.map((sub) =>
    `${sub.substance}${sub.ester ? ` (${ESTER_LABELS[sub.ester]})` : ""}`
  );

  if (!substances.length) return null;

  return (
    <div className="bg-black/30 border border-purple-500/15 rounded-xl p-4">
      <p className="text-purple-300 text-xs font-cyber tracking-widest uppercase mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
        Curva de Concentração Plasmática
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.08)" />
          <XAxis
            dataKey="day"
            stroke="rgba(168,85,247,0.3)"
            tick={{ fill: "rgba(192,132,252,0.5)", fontSize: 10 }}
            label={{ value: "Dias", position: "insideBottom", offset: -2, fill: "rgba(192,132,252,0.4)", fontSize: 10 }}
          />
          <YAxis
            stroke="rgba(168,85,247,0.3)"
            tick={{ fill: "rgba(192,132,252,0.5)", fontSize: 10 }}
            label={{ value: "mg", angle: -90, position: "insideLeft", fill: "rgba(192,132,252,0.4)", fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "10px", color: "rgba(192,132,252,0.7)", paddingTop: 8 }}
          />
          {injectionDays.map((d) => (
            <ReferenceLine key={d} x={d} stroke="rgba(34,211,238,0.12)" strokeDasharray="2 4" />
          ))}
          {lineKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: COLORS[i % COLORS.length] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-purple-400/30 text-[9px] text-center mt-2">
        Modelo farmacocinético simplificado — valores estimados, não substituem orientação médica
      </p>
    </div>
  );
}