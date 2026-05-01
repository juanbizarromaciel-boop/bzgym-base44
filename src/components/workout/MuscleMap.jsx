import React, { useMemo } from "react";

const IMAGE_URL = "https://media.base44.com/images/public/69b152b7ec586487b4d800db/2ce8e2174_a_clean_minimal_vector_line_art_medical_anatomy_i_1.png";

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

// Returns a color with opacity based on intensity
const muscleColor = (intensity, type = "purple") => {
  if (intensity === 0) return "transparent";
  const colors = {
    purple: `rgba(168,85,247,${(0.3 + intensity * 0.55).toFixed(2)})`,
    pink:   `rgba(236,72,153,${(0.3 + intensity * 0.55).toFixed(2)})`,
    cyan:   `rgba(6,182,212,${(0.3 + intensity * 0.55).toFixed(2)})`,
  };
  return colors[type] || colors.purple;
};

const muscleGlow = (intensity, type = "purple") => {
  if (intensity === 0) return "none";
  const glows = {
    purple: `0 0 ${6 + intensity * 10}px rgba(168,85,247,${(0.5 + intensity * 0.5).toFixed(2)})`,
    pink:   `0 0 ${6 + intensity * 10}px rgba(236,72,153,${(0.5 + intensity * 0.5).toFixed(2)})`,
    cyan:   `0 0 ${6 + intensity * 10}px rgba(6,182,212,${(0.5 + intensity * 0.5).toFixed(2)})`,
  };
  return glows[type] || glows.purple;
};

// Muscle region: absolute positioned div over the image
const MuscleRegion = ({ style, intensity, type, shape = "ellipse" }) => {
  const color = muscleColor(intensity, type);
  const glow = muscleGlow(intensity, type);
  if (intensity === 0) return null;
  return (
    <div style={{
      position: "absolute",
      backgroundColor: color,
      boxShadow: glow,
      borderRadius: shape === "ellipse" ? "50%" : shape === "rect" ? "4px" : "30%",
      mixBlendMode: "screen",
      pointerEvents: "none",
      transition: "all 0.3s ease",
      ...style,
    }} />
  );
};

export default function MuscleMap({ exercises = [], size = "md", showLabels = false }) {
  const intensity = useMemo(() => calculateMuscleIntensity(exercises), [exercises]);

  // Size scaling
  const sizeMap = { sm: 200, md: 280, lg: 380 };
  const totalW = sizeMap[size] || sizeMap.md;
  // Image is roughly 1270x880, each half is ~635x880, ratio ~0.72
  const bodyH = Math.round(totalW * 0.72 * (880 / 635));
  const halfW = totalW / 2;

  const activeLabels = {
    peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
    triceps: "Tríceps", pernas: "Pernas", gluteos: "Glúteos",
    abdomen: "Abdômen", panturrilha: "Panturrilha", antebraco: "Antebraço"
  };
  const activeGroups = Object.entries(intensity).filter(([, v]) => v > 0).map(([k]) => activeLabels[k]);

  // Helper: percentage-based position on each half
  // Front half: left 0-50% of image, Back half: right 50-100%
  // Positions are in % of each HALF width and full height
  const F = (left, top, width, height) => ({
    left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`
  });
  const B = (left, top, width, height) => ({
    left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`
  });

  return (
    <div className="flex flex-col items-center gap-3">
      {activeGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
          {activeGroups.map(label => (
            <span key={label} className="text-[9px] font-mono-cyber px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#d8b4fe' }}>
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-center items-start">
        {/* ── FRENTE ── */}
        <div className="flex flex-col items-center">
          {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-1 uppercase">Frente</p>}
          <div style={{ position: "relative", width: halfW, height: bodyH, overflow: "hidden" }}>
            {/* Image clipped to front half */}
            <img
              src={IMAGE_URL}
              alt="Frente"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: totalW,
                height: bodyH,
                objectFit: "fill",
                filter: "invert(1) brightness(0.85)",
                mixBlendMode: "normal",
              }}
            />
            {/* Muscle overlays - Front */}
            {/* Chest / Peito */}
            <MuscleRegion intensity={intensity.peito} type="pink"
              style={F(22, 17, 56, 13)} shape="blob" />
            {/* Shoulders / Ombros - left */}
            <MuscleRegion intensity={intensity.ombros} type="purple"
              style={F(5, 15, 18, 10)} shape="ellipse" />
            {/* Shoulders / Ombros - right */}
            <MuscleRegion intensity={intensity.ombros} type="purple"
              style={F(77, 15, 18, 10)} shape="ellipse" />
            {/* Abdomen */}
            <MuscleRegion intensity={intensity.abdomen} type="cyan"
              style={F(30, 31, 40, 22)} shape="rect" />
            {/* Biceps - left */}
            <MuscleRegion intensity={intensity.biceps} type="purple"
              style={F(2, 22, 14, 16)} shape="ellipse" />
            {/* Biceps - right */}
            <MuscleRegion intensity={intensity.biceps} type="purple"
              style={F(84, 22, 14, 16)} shape="ellipse" />
            {/* Forearm - left */}
            <MuscleRegion intensity={intensity.antebraco} type="purple"
              style={F(0, 39, 11, 14)} shape="ellipse" />
            {/* Forearm - right */}
            <MuscleRegion intensity={intensity.antebraco} type="purple"
              style={F(89, 39, 11, 14)} shape="ellipse" />
            {/* Quads left */}
            <MuscleRegion intensity={intensity.pernas} type="pink"
              style={F(15, 55, 26, 24)} shape="ellipse" />
            {/* Quads right */}
            <MuscleRegion intensity={intensity.pernas} type="pink"
              style={F(59, 55, 26, 24)} shape="ellipse" />
            {/* Calves left */}
            <MuscleRegion intensity={intensity.panturrilha} type="cyan"
              style={F(14, 80, 20, 13)} shape="ellipse" />
            {/* Calves right */}
            <MuscleRegion intensity={intensity.panturrilha} type="cyan"
              style={F(66, 80, 20, 13)} shape="ellipse" />
          </div>
        </div>

        {/* ── COSTAS ── */}
        <div className="flex flex-col items-center">
          {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-1 uppercase">Costas</p>}
          <div style={{ position: "relative", width: halfW, height: bodyH, overflow: "hidden" }}>
            {/* Image clipped to back half - shift image left by halfW to show right portion */}
            <img
              src={IMAGE_URL}
              alt="Costas"
              style={{
                position: "absolute",
                top: 0,
                left: -halfW,
                width: totalW,
                height: bodyH,
                objectFit: "fill",
                filter: "invert(1) brightness(0.85)",
                mixBlendMode: "normal",
              }}
            />
            {/* Muscle overlays - Back */}
            {/* Trapezius */}
            <MuscleRegion intensity={intensity.costas} type="cyan"
              style={B(22, 14, 56, 12)} shape="ellipse" />
            {/* Lats left */}
            <MuscleRegion intensity={intensity.costas} type="cyan"
              style={B(5, 26, 25, 22)} shape="ellipse" />
            {/* Lats right */}
            <MuscleRegion intensity={intensity.costas} type="cyan"
              style={B(70, 26, 25, 22)} shape="ellipse" />
            {/* Lower back / erectors */}
            <MuscleRegion intensity={intensity.costas} type="cyan"
              style={B(32, 38, 36, 16)} shape="rect" />
            {/* Shoulders back - left */}
            <MuscleRegion intensity={intensity.ombros} type="purple"
              style={B(4, 14, 18, 11)} shape="ellipse" />
            {/* Shoulders back - right */}
            <MuscleRegion intensity={intensity.ombros} type="purple"
              style={B(78, 14, 18, 11)} shape="ellipse" />
            {/* Triceps - left */}
            <MuscleRegion intensity={intensity.triceps} type="purple"
              style={B(1, 24, 14, 16)} shape="ellipse" />
            {/* Triceps - right */}
            <MuscleRegion intensity={intensity.triceps} type="purple"
              style={B(85, 24, 14, 16)} shape="ellipse" />
            {/* Forearm back - left */}
            <MuscleRegion intensity={intensity.antebraco} type="purple"
              style={B(0, 40, 11, 13)} shape="ellipse" />
            {/* Forearm back - right */}
            <MuscleRegion intensity={intensity.antebraco} type="purple"
              style={B(89, 40, 11, 13)} shape="ellipse" />
            {/* Glutes */}
            <MuscleRegion intensity={intensity.gluteos} type="pink"
              style={B(20, 53, 60, 13)} shape="ellipse" />
            {/* Hamstrings left */}
            <MuscleRegion intensity={intensity.pernas} type="pink"
              style={B(14, 56, 26, 21)} shape="ellipse" />
            {/* Hamstrings right */}
            <MuscleRegion intensity={intensity.pernas} type="pink"
              style={B(60, 56, 26, 21)} shape="ellipse" />
            {/* Calves back - left */}
            <MuscleRegion intensity={intensity.panturrilha} type="cyan"
              style={B(14, 78, 22, 14)} shape="ellipse" />
            {/* Calves back - right */}
            <MuscleRegion intensity={intensity.panturrilha} type="cyan"
              style={B(64, 78, 22, 14)} shape="ellipse" />
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="flex flex-wrap gap-3 text-[9px] font-mono-cyber justify-center" style={{ color: 'rgba(168,85,247,0.4)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(236,72,153,0.5)' }}/> Peito/Pernas/Glúteos
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(6,182,212,0.5)' }}/> Costas/Abdômen
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(168,85,247,0.5)' }}/> Braços/Ombros
          </span>
        </div>
      )}
    </div>
  );
}