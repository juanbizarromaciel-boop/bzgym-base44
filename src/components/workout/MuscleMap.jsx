import React, { useMemo } from "react";

// Muscle group intensity calculator from exercises
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

  const maxSets = Math.max(...Object.values(muscleGroups), 1);
  const normalized = {};
  Object.keys(muscleGroups).forEach(key => {
    normalized[key] = muscleGroups[key] / maxSets;
  });

  return normalized;
};

const getColor = (intensity) => {
  if (intensity === 0) return "rgba(168,85,247,0.08)";
  if (intensity < 0.3) return "rgba(168,85,247,0.25)";
  if (intensity < 0.6) return "rgba(6,182,212,0.4)";
  return "rgba(236,72,153,0.65)";
};

const getGlow = (intensity) => {
  if (intensity === 0) return "none";
  if (intensity < 0.3) return "0 0 5px rgba(168,85,247,0.3)";
  if (intensity < 0.6) return "0 0 10px rgba(6,182,212,0.5)";
  return "0 0 15px rgba(236,72,153,0.8)";
};

export default function MuscleMap({ exercises = [], size = "md", showLabels = false }) {
  const intensity = useMemo(() => calculateMuscleIntensity(exercises), [exercises]);

  const sizeMap = { sm: 120, md: 180, lg: 240 };
  const w = sizeMap[size] || sizeMap.md;
  const h = w * 1.8;

  return (
    <div className="flex flex-wrap gap-6 justify-center items-start">
      {/* Front view */}
      <div className="flex flex-col items-center">
        {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-2 uppercase">Frente</p>}
        <svg width={w} height={h} viewBox="0 0 100 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="50" cy="15" rx="12" ry="15" fill="rgba(168,85,247,0.05)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
          
          {/* Peito */}
          <path
            d="M35 30 Q40 35 50 35 Q60 35 65 30 L70 50 Q65 55 50 55 Q35 55 30 50 Z"
            fill={getColor(intensity.peito)}
            stroke="rgba(168,85,247,0.3)"
            strokeWidth="0.5"
            style={{ filter: `drop-shadow(${getGlow(intensity.peito)})` }}
          />

          {/* Ombros */}
          <ellipse cx="28" cy="32" rx="8" ry="10" fill={getColor(intensity.ombros)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.ombros)})` }} />
          <ellipse cx="72" cy="32" rx="8" ry="10" fill={getColor(intensity.ombros)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.ombros)})` }} />

          {/* Abdomen */}
          <rect x="40" y="58" width="20" height="28" rx="3" fill={getColor(intensity.abdomen)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.abdomen)})` }} />

          {/* Biceps */}
          <ellipse cx="22" cy="55" rx="5" ry="12" fill={getColor(intensity.biceps)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.biceps)})` }} />
          <ellipse cx="78" cy="55" rx="5" ry="12" fill={getColor(intensity.biceps)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.biceps)})` }} />

          {/* Antebraço */}
          <rect x="18" y="70" width="6" height="18" rx="2" fill={getColor(intensity.antebraco)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.antebraco)})` }} />
          <rect x="76" y="70" width="6" height="18" rx="2" fill={getColor(intensity.antebraco)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.antebraco)})` }} />

          {/* Pernas (frente) */}
          <rect x="38" y="92" width="10" height="45" rx="4" fill={getColor(intensity.pernas)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.pernas)})` }} />
          <rect x="52" y="92" width="10" height="45" rx="4" fill={getColor(intensity.pernas)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.pernas)})` }} />

          {/* Panturrilha */}
          <ellipse cx="43" cy="150" rx="4" ry="12" fill={getColor(intensity.panturrilha)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.panturrilha)})` }} />
          <ellipse cx="57" cy="150" rx="4" ry="12" fill={getColor(intensity.panturrilha)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.panturrilha)})` }} />
        </svg>
      </div>

      {/* Back view */}
      <div className="flex flex-col items-center">
        {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-2 uppercase">Costas</p>}
        <svg width={w} height={h} viewBox="0 0 100 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="50" cy="15" rx="12" ry="15" fill="rgba(168,85,247,0.05)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
          
          {/* Costas */}
          <path
            d="M30 30 L70 30 L75 55 Q72 60 50 60 Q28 60 25 55 Z"
            fill={getColor(intensity.costas)}
            stroke="rgba(168,85,247,0.3)"
            strokeWidth="0.5"
            style={{ filter: `drop-shadow(${getGlow(intensity.costas)})` }}
          />

          {/* Ombros */}
          <ellipse cx="28" cy="32" rx="8" ry="10" fill={getColor(intensity.ombros)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.ombros)})` }} />
          <ellipse cx="72" cy="32" rx="8" ry="10" fill={getColor(intensity.ombros)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.ombros)})` }} />

          {/* Triceps */}
          <ellipse cx="22" cy="50" rx="4" ry="10" fill={getColor(intensity.triceps)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.triceps)})` }} />
          <ellipse cx="78" cy="50" rx="4" ry="10" fill={getColor(intensity.triceps)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.triceps)})` }} />

          {/* Lombar */}
          <rect x="38" y="62" width="24" height="22" rx="3" fill={getColor(intensity.costas * 0.6)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" />

          {/* Glúteos */}
          <ellipse cx="43" cy="90" rx="7" ry="10" fill={getColor(intensity.gluteos)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.gluteos)})` }} />
          <ellipse cx="57" cy="90" rx="7" ry="10" fill={getColor(intensity.gluteos)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.gluteos)})` }} />

          {/* Posterior de coxa */}
          <rect x="38" y="102" width="10" height="35" rx="4" fill={getColor(intensity.pernas * 0.7)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" />
          <rect x="52" y="102" width="10" height="35" rx="4" fill={getColor(intensity.pernas * 0.7)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" />

          {/* Panturrilha */}
          <ellipse cx="43" cy="150" rx="4" ry="12" fill={getColor(intensity.panturrilha)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.panturrilha)})` }} />
          <ellipse cx="57" cy="150" rx="4" ry="12" fill={getColor(intensity.panturrilha)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.panturrilha)})` }} />
        </svg>
      </div>

      {/* Side view */}
      <div className="flex flex-col items-center">
        {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-2 uppercase">Lateral</p>}
        <svg width={w * 0.5} height={h} viewBox="0 0 50 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="25" cy="15" rx="10" ry="15" fill="rgba(168,85,247,0.05)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
          
          {/* Peito lateral */}
          <path d="M20 30 Q28 40 28 50 L22 52 Q18 45 20 30 Z" fill={getColor(intensity.peito)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.peito)})` }} />

          {/* Ombro lateral */}
          <ellipse cx="17" cy="32" rx="5" ry="10" fill={getColor(intensity.ombros)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.ombros)})` }} />

          {/* Abdomen lateral */}
          <rect x="20" y="54" width="8" height="28" rx="2" fill={getColor(intensity.abdomen)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.abdomen)})` }} />

          {/* Braço lateral */}
          <rect x="12" y="45" width="4" height="40" rx="2" fill={getColor((intensity.biceps + intensity.triceps) / 2)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" />

          {/* Perna lateral */}
          <rect x="20" y="88" width="12" height="50" rx="4" fill={getColor(intensity.pernas)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.pernas)})` }} />

          {/* Glúteo lateral */}
          <ellipse cx="23" cy="85" rx="6" ry="8" fill={getColor(intensity.gluteos)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.gluteos)})` }} />

          {/* Panturrilha lateral */}
          <ellipse cx="26" cy="150" rx="5" ry="12" fill={getColor(intensity.panturrilha)} stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" style={{ filter: `drop-shadow(${getGlow(intensity.panturrilha)})` }} />
        </svg>
      </div>
    </div>
  );
}