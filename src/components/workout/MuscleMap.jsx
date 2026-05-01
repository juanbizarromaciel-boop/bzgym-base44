import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const calculateMuscleIntensity = (exercises = []) => {
  const muscleGroups = {
    peito: 0, costas: 0, ombros: 0, biceps: 0, triceps: 0,
    pernas: 0, gluteos: 0, abdomen: 0, panturrilha: 0, antebraco: 0
  };
  exercises.forEach(ex => {
    const group = ex.muscle_group || "outro";
    if (muscleGroups[group] !== undefined) {
      muscleGroups[group] += (ex.sets || 3);
    }
  });
  return muscleGroups;
};

const LABELS = {
  peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
  triceps: "Tríceps", pernas: "Pernas", gluteos: "Glúteos",
  abdomen: "Abdômen", panturrilha: "Panturrilha", antebraco: "Antebraço"
};

const COLORS = {
  peito:      "#ec4899",
  costas:     "#06b6d4",
  ombros:     "#a855f7",
  biceps:     "#c084fc",
  triceps:    "#818cf8",
  pernas:     "#f472b6",
  gluteos:    "#fb7185",
  abdomen:    "#22d3ee",
  panturrilha:"#67e8f9",
  antebraco:  "#d8b4fe",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div style={{
        background: "rgba(8,4,22,0.95)",
        border: "1px solid rgba(168,85,247,0.3)",
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 11,
        color: "#e9d5ff",
        boxShadow: "0 0 12px rgba(168,85,247,0.2)"
      }}>
        <span style={{ fontWeight: 600 }}>{name}</span>: {value} séries
      </div>
    );
  }
  return null;
};

export default function MuscleMap({ exercises = [], size = "md", showLabels = false }) {
  const raw = useMemo(() => calculateMuscleIntensity(exercises), [exercises]);

  const data = Object.entries(raw)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      key,
      name: LABELS[key],
      value,
      color: COLORS[key],
    }));

  const sizeMap = { sm: 140, md: 190, lg: 240 };
  const chartSize = sizeMap[size] || sizeMap.md;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2"
        style={{ width: chartSize, height: chartSize }}>
        <div style={{
          width: chartSize * 0.7,
          height: chartSize * 0.7,
          borderRadius: "50%",
          border: "1px dashed rgba(168,85,247,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: 10, color: "rgba(168,85,247,0.35)", fontFamily: "monospace" }}>
            Sem dados
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div style={{ width: chartSize, height: chartSize }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="75%"
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.color}
                  style={{ filter: `drop-shadow(0 0 6px ${entry.color}88)`, outline: "none" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center" style={{ maxWidth: chartSize + 40 }}>
        {data.map(entry => (
          <span key={entry.key} className="flex items-center gap-1 text-[9px] font-mono-cyber">
            <span style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: entry.color,
              boxShadow: `0 0 5px ${entry.color}`,
              flexShrink: 0
            }} />
            <span style={{ color: "rgba(220,200,255,0.7)" }}>{entry.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}