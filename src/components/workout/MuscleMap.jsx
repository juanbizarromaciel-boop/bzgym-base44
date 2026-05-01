import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/**
 * MuscleMap - Pie chart showing muscle groups worked.
 *
 * Props:
 *   exercises: array of exercise objects. Each can be:
 *     - { muscle_group: "peito", sets: 3 }  (from Exercise entity)
 *     - { exercise_name: "Supino", muscle_group: "peito", sets: 3 } (from WorkoutPlan.exercises)
 *   exerciseLibrary: optional array of Exercise entity objects to resolve muscle_group by name
 *   loggedExercises: optional array of { exercise_name, sets_completed } from WorkoutLogs (for Progress period view)
 *   size: "sm" | "md" | "lg"
 *   showLabels: boolean
 */

const LABELS = {
  peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
  triceps: "Tríceps", pernas: "Pernas", gluteos: "Glúteos",
  abdomen: "Abdômen", panturrilha: "Panturrilha", antebraco: "Antebraço",
  cardio: "Cardio", outro: "Outro",
};

const COLORS = {
  peito:       "#ec4899",
  costas:      "#06b6d4",
  ombros:      "#a855f7",
  biceps:      "#c084fc",
  triceps:     "#818cf8",
  pernas:      "#f472b6",
  gluteos:     "#fb7185",
  abdomen:     "#22d3ee",
  panturrilha: "#67e8f9",
  antebraco:   "#d8b4fe",
  cardio:      "#ef4444",
  outro:       "#6b7280",
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

export default function MuscleMap({ exercises = [], exerciseLibrary = [], loggedExercises = [], size = "md", showLabels = false }) {
  const data = useMemo(() => {
    // Build a name → muscle_group lookup from library
    const libraryMap = {};
    exerciseLibrary.forEach(ex => {
      if (ex.name) libraryMap[ex.name.toLowerCase()] = ex.muscle_group;
    });

    const muscleGroups = {};

    // From plan exercises (primary source)
    exercises.forEach(ex => {
      let muscle = ex.muscle_group;
      if (!muscle && ex.exercise_name) {
        muscle = libraryMap[ex.exercise_name.toLowerCase()] || "outro";
      }
      if (!muscle) muscle = "outro";
      const sets = ex.sets || 3;
      muscleGroups[muscle] = (muscleGroups[muscle] || 0) + sets;
    });

    // From logged exercises (for period-based Progress view)
    loggedExercises.forEach(log => {
      let muscle = log.muscle_group;
      if (!muscle && log.exercise_name) {
        muscle = libraryMap[log.exercise_name.toLowerCase()] || "outro";
      }
      if (!muscle) muscle = "outro";
      const sets = log.sets_completed?.length || 3;
      muscleGroups[muscle] = (muscleGroups[muscle] || 0) + sets;
    });

    return Object.entries(muscleGroups)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        key,
        name: LABELS[key] || key,
        value,
        color: COLORS[key] || "#6b7280",
      }));
  }, [exercises, exerciseLibrary, loggedExercises]);

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
              innerRadius="42%"
              outerRadius="72%"
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