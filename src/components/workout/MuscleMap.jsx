import React, { useMemo } from "react";

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

// Active = highlighted with neon glow, inactive = dim outline
const muscleFill = (intensity, hue = "purple") => {
  const hues = {
    purple: { active: "rgba(168,85,247,", border: "rgba(168,85,247,", glow: "168,85,247" },
    pink:   { active: "rgba(236,72,153,", border: "rgba(236,72,153,", glow: "236,72,153" },
    cyan:   { active: "rgba(6,182,212,",  border: "rgba(6,182,212,",  glow: "6,182,212" },
  };
  const c = hues[hue] || hues.purple;
  if (intensity === 0) return {
    fill: "rgba(30,20,50,0.6)",
    stroke: "rgba(168,85,247,0.18)",
    filter: "none",
    opacity: 1,
  };
  const alpha = 0.35 + intensity * 0.55;
  return {
    fill: `${c.active}${alpha.toFixed(2)})`,
    stroke: `${c.border}${(0.5 + intensity * 0.5).toFixed(2)})`,
    filter: `drop-shadow(0 0 ${3 + intensity * 8}px rgba(${c.glow},${(0.6 + intensity * 0.4).toFixed(2)}))`,
    opacity: 1,
  };
};

// Shared props helper
const M = (intensity, hue) => {
  const s = muscleFill(intensity, hue);
  return { fill: s.fill, stroke: s.stroke, strokeWidth: "0.6", style: { filter: s.filter } };
};

// Base skin tone for body silhouette
const SKIN = "rgba(20,12,40,0.9)";
const SKIN_STROKE = "rgba(168,85,247,0.25)";

export default function MuscleMap({ exercises = [], size = "md", showLabels = false }) {
  const intensity = useMemo(() => calculateMuscleIntensity(exercises), [exercises]);

  const sizeMap = { sm: 70, md: 100, lg: 140 };
  const w = sizeMap[size] || sizeMap.md;
  const h = w * 2.6;

  // Active muscles summary for label
  const activeLabels = {
    peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
    triceps: "Tríceps", pernas: "Pernas", gluteos: "Glúteos",
    abdomen: "Abdômen", panturrilha: "Panturrilha", antebraco: "Antebraço"
  };
  const activeGroups = Object.entries(intensity).filter(([, v]) => v > 0).map(([k]) => activeLabels[k]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Active muscles badge */}
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
        {/* FRONT VIEW */}
        <div className="flex flex-col items-center">
          {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-1.5 uppercase">Frente</p>}
          <svg width={w} height={h} viewBox="10 0 80 210" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow-front">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* === BODY SILHOUETTE === */}
            {/* Head */}
            <ellipse cx="50" cy="11" rx="10" ry="11" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Neck */}
            <path d="M44 20 L44 27 L56 27 L56 20 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />
            {/* Torso */}
            <path d="M28 27 Q22 30 19 38 L17 78 Q18 90 32 92 L35 100 L65 100 L68 92 Q82 90 83 78 L81 38 Q78 30 72 27 Z"
              fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Left upper arm */}
            <path d="M19 38 Q12 42 10 52 L10 72 Q12 77 17 78 L17 38 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Right upper arm */}
            <path d="M81 38 Q88 42 90 52 L90 72 Q88 77 83 78 L83 38 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Left forearm */}
            <path d="M10 72 Q8 80 9 92 L12 100 L17 100 L17 72 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Right forearm */}
            <path d="M90 72 Q92 80 91 92 L88 100 L83 100 L83 72 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Left hand */}
            <ellipse cx="11" cy="104" rx="4" ry="6" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />
            {/* Right hand */}
            <ellipse cx="89" cy="104" rx="4" ry="6" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />
            {/* Hips */}
            <path d="M32 100 L30 108 L35 115 L65 115 L70 108 L68 100 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Left thigh */}
            <path d="M35 115 L33 155 L42 157 L46 115 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Right thigh */}
            <path d="M65 115 L67 155 L58 157 L54 115 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Left shin */}
            <path d="M33 155 L32 185 L40 187 L42 157 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Right shin */}
            <path d="M67 155 L68 185 L60 187 L58 157 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Left foot */}
            <path d="M31 185 L28 192 L41 192 L40 187 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />
            {/* Right foot */}
            <path d="M69 185 L72 192 L59 192 L60 187 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />

            {/* === MUSCLES FRONT === */}

            {/* Deltoid front-left */}
            <path d="M19 38 Q14 36 12 42 L14 52 Q17 54 19 50 Z"
              {...M(intensity.ombros, "purple")} />
            {/* Deltoid front-right */}
            <path d="M81 38 Q86 36 88 42 L86 52 Q83 54 81 50 Z"
              {...M(intensity.ombros, "purple")} />

            {/* Trapezius front (clavicle area) */}
            <path d="M37 27 Q44 25 50 26 Q56 25 63 27 L65 32 Q57 28 50 29 Q43 28 35 32 Z"
              {...M(intensity.ombros * 0.5 + intensity.costas * 0.3, "purple")} />

            {/* Pectoralis Major left */}
            <path d="M35 33 Q32 36 31 45 Q33 56 40 57 L50 55 L50 34 Q43 33 35 33 Z"
              {...M(intensity.peito, "pink")} />
            {/* Pectoralis Major right */}
            <path d="M65 33 Q68 36 69 45 Q67 56 60 57 L50 55 L50 34 Q57 33 65 33 Z"
              {...M(intensity.peito, "pink")} />
            {/* Pec detail lines */}
            {intensity.peito > 0 && <>
              <path d="M36 45 Q43 48 50 47" stroke="rgba(236,72,153,0.3)" strokeWidth="0.4" fill="none" />
              <path d="M64 45 Q57 48 50 47" stroke="rgba(236,72,153,0.3)" strokeWidth="0.4" fill="none" />
            </>}

            {/* Serratus anterior left */}
            <path d="M31 50 Q28 55 29 65 L32 68 Q34 60 35 52 Z"
              {...M(intensity.peito * 0.4, "pink")} />
            {/* Serratus anterior right */}
            <path d="M69 50 Q72 55 71 65 L68 68 Q66 60 65 52 Z"
              {...M(intensity.peito * 0.4, "pink")} />

            {/* Rectus Abdominis (6-pack) */}
            <path d="M43 58 L43 100 Q46 103 50 103 Q54 103 57 100 L57 58 Q54 57 50 57 Q46 57 43 58 Z"
              {...M(intensity.abdomen, "cyan")} />
            {/* Ab horizontal lines */}
            <line x1="43" y1="67" x2="57" y2="67" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5" />
            <line x1="43" y1="76" x2="57" y2="76" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5" />
            <line x1="43" y1="85" x2="57" y2="85" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5" />
            <line x1="43" y1="94" x2="57" y2="94" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5" />
            {/* Ab vertical line */}
            <line x1="50" y1="58" x2="50" y2="100" stroke="rgba(6,182,212,0.2)" strokeWidth="0.4" />

            {/* Obliques left */}
            <path d="M31 65 Q29 80 32 92 L37 90 L38 70 Z"
              {...M(intensity.abdomen * 0.6, "cyan")} />
            {/* Obliques right */}
            <path d="M69 65 Q71 80 68 92 L63 90 L62 70 Z"
              {...M(intensity.abdomen * 0.6, "cyan")} />

            {/* Biceps left */}
            <path d="M14 48 Q11 52 11 63 Q12 70 16 72 L18 70 Q16 63 17 52 Z"
              {...M(intensity.biceps, "purple")} />
            {/* Biceps right */}
            <path d="M86 48 Q89 52 89 63 Q88 70 84 72 L82 70 Q84 63 83 52 Z"
              {...M(intensity.biceps, "purple")} />
            {/* Bicep peak detail */}
            {intensity.biceps > 0 && <>
              <path d="M13 58 Q12 62 13 66" stroke="rgba(168,85,247,0.4)" strokeWidth="0.5" fill="none" />
              <path d="M87 58 Q88 62 87 66" stroke="rgba(168,85,247,0.4)" strokeWidth="0.5" fill="none" />
            </>}

            {/* Forearm / Antebraco left */}
            <path d="M10 72 Q9 82 10 92 L14 98 L17 96 L17 72 Z"
              {...M(intensity.antebraco, "purple")} />
            {/* Forearm / Antebraco right */}
            <path d="M90 72 Q91 82 90 92 L86 98 L83 96 L83 72 Z"
              {...M(intensity.antebraco, "purple")} />

            {/* Quad left - vastus lateralis */}
            <path d="M33 115 Q29 130 30 148 L35 153 L38 145 Q37 130 38 115 Z"
              {...M(intensity.pernas, "pink")} />
            {/* Quad left - rectus femoris */}
            <path d="M38 115 L38 154 L43 156 L44 115 Z"
              {...M(intensity.pernas, "pink")} />
            {/* Quad left - vastus medialis */}
            <path d="M44 115 L43 148 Q44 155 46 156 L48 155 L47 115 Z"
              {...M(intensity.pernas, "pink")} />

            {/* Quad right - vastus lateralis */}
            <path d="M67 115 Q71 130 70 148 L65 153 L62 145 Q63 130 62 115 Z"
              {...M(intensity.pernas, "pink")} />
            {/* Quad right - rectus femoris */}
            <path d="M62 115 L62 154 L57 156 L56 115 Z"
              {...M(intensity.pernas, "pink")} />
            {/* Quad right - vastus medialis */}
            <path d="M56 115 L57 148 Q56 155 54 156 L52 155 L53 115 Z"
              {...M(intensity.pernas, "pink")} />

            {/* Patella left */}
            <ellipse cx="38" cy="157" rx="5" ry="3" fill="rgba(30,20,50,0.8)" stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Patella right */}
            <ellipse cx="62" cy="157" rx="5" ry="3" fill="rgba(30,20,50,0.8)" stroke={SKIN_STROKE} strokeWidth="0.5" />

            {/* Tibia left */}
            <path d="M34 160 L33 185 L38 187 L40 185 L39 160 Z"
              fill="rgba(20,12,40,0.7)" stroke={SKIN_STROKE} strokeWidth="0.4" />
            {/* Tibia right */}
            <path d="M66 160 L67 185 L62 187 L60 185 L61 160 Z"
              fill="rgba(20,12,40,0.7)" stroke={SKIN_STROKE} strokeWidth="0.4" />

            {/* Gastrocnemius (calf) left */}
            <path d="M32 162 Q29 170 30 180 L33 185 L35 183 Q33 173 34 162 Z"
              {...M(intensity.panturrilha, "cyan")} />
            {/* Gastrocnemius (calf) right */}
            <path d="M68 162 Q71 170 70 180 L67 185 L65 183 Q67 173 66 162 Z"
              {...M(intensity.panturrilha, "cyan")} />
          </svg>
        </div>

        {/* BACK VIEW */}
        <div className="flex flex-col items-center">
          {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-1.5 uppercase">Costas</p>}
          <svg width={w} height={h} viewBox="10 0 80 210" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* === BODY SILHOUETTE BACK === */}
            <ellipse cx="50" cy="11" rx="10" ry="11" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M44 20 L44 27 L56 27 L56 20 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />
            <path d="M28 27 Q22 30 19 38 L17 78 Q18 90 32 92 L35 100 L65 100 L68 92 Q82 90 83 78 L81 38 Q78 30 72 27 Z"
              fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M19 38 Q12 42 10 52 L10 72 Q12 77 17 78 L17 38 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M81 38 Q88 42 90 52 L90 72 Q88 77 83 78 L83 38 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M10 72 Q8 80 9 92 L12 100 L17 100 L17 72 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M90 72 Q92 80 91 92 L88 100 L83 100 L83 72 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <ellipse cx="11" cy="104" rx="4" ry="6" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />
            <ellipse cx="89" cy="104" rx="4" ry="6" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />
            <path d="M32 100 L30 108 L35 115 L65 115 L70 108 L68 100 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M35 115 L33 155 L42 157 L46 115 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M65 115 L67 155 L58 157 L54 115 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M33 155 L32 185 L40 187 L42 157 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M67 155 L68 185 L60 187 L58 157 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
            <path d="M31 185 L28 192 L41 192 L40 187 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />
            <path d="M69 185 L72 192 L59 192 L60 187 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.4" />

            {/* === MUSCLES BACK === */}

            {/* Trapezius upper */}
            <path d="M36 27 Q43 24 50 25 Q57 24 64 27 L68 35 Q60 30 50 31 Q40 30 32 35 Z"
              {...M(intensity.costas, "cyan")} />
            {/* Trapezius mid */}
            <path d="M32 35 Q26 38 23 44 L28 50 Q33 46 40 44 L50 43 L60 44 Q67 46 72 50 L77 44 Q74 38 68 35 Q60 30 50 31 Q40 30 32 35 Z"
              {...M(intensity.costas, "cyan")} />

            {/* Deltoid rear left */}
            <path d="M19 38 Q14 36 12 44 L15 52 Q18 52 20 48 Z"
              {...M(intensity.ombros, "purple")} />
            {/* Deltoid rear right */}
            <path d="M81 38 Q86 36 88 44 L85 52 Q82 52 80 48 Z"
              {...M(intensity.ombros, "purple")} />

            {/* Infraspinatus left */}
            <path d="M28 50 Q25 58 27 66 L38 63 L38 50 Q33 49 28 50 Z"
              {...M(intensity.costas * 0.7, "cyan")} />
            {/* Infraspinatus right */}
            <path d="M72 50 Q75 58 73 66 L62 63 L62 50 Q67 49 72 50 Z"
              {...M(intensity.costas * 0.7, "cyan")} />

            {/* Lat left - latissimus dorsi */}
            <path d="M27 52 Q22 60 22 75 L28 80 Q31 74 33 65 L38 63 Z"
              {...M(intensity.costas, "cyan")} />
            {/* Lat right */}
            <path d="M73 52 Q78 60 78 75 L72 80 Q69 74 67 65 L62 63 Z"
              {...M(intensity.costas, "cyan")} />

            {/* Lat fan lines */}
            {intensity.costas > 0 && <>
              <path d="M28 55 L33 65" stroke="rgba(6,182,212,0.35)" strokeWidth="0.5" fill="none" />
              <path d="M26 62 L32 70" stroke="rgba(6,182,212,0.35)" strokeWidth="0.5" fill="none" />
              <path d="M72 55 L67 65" stroke="rgba(6,182,212,0.35)" strokeWidth="0.5" fill="none" />
              <path d="M74 62 L68 70" stroke="rgba(6,182,212,0.35)" strokeWidth="0.5" fill="none" />
            </>}

            {/* Spinal erector / lower back */}
            <path d="M43 65 L43 95 Q46 98 50 98 Q54 98 57 95 L57 65 Q54 63 50 63 Q46 63 43 65 Z"
              {...M(intensity.costas * 0.5, "cyan")} />
            {/* Spine line */}
            <line x1="50" y1="33" x2="50" y2="98" stroke="rgba(6,182,212,0.18)" strokeWidth="0.4" />
            {/* Erector detail */}
            <path d="M46 65 L46 95" stroke="rgba(6,182,212,0.2)" strokeWidth="0.4" />
            <path d="M54 65 L54 95" stroke="rgba(6,182,212,0.2)" strokeWidth="0.4" />

            {/* Teres Major left */}
            <path d="M27 66 Q24 72 26 78 L30 75 L32 66 Z"
              {...M(intensity.costas * 0.6, "cyan")} />
            {/* Teres Major right */}
            <path d="M73 66 Q76 72 74 78 L70 75 L68 66 Z"
              {...M(intensity.costas * 0.6, "cyan")} />

            {/* Triceps left */}
            <path d="M15 46 Q12 54 12 66 L15 70 L18 68 Q17 56 18 48 Z"
              {...M(intensity.triceps, "purple")} />
            {/* Triceps right */}
            <path d="M85 46 Q88 54 88 66 L85 70 L82 68 Q83 56 82 48 Z"
              {...M(intensity.triceps, "purple")} />
            {/* Tricep horseshoe */}
            {intensity.triceps > 0 && <>
              <path d="M14 55 Q13 60 14 65" stroke="rgba(168,85,247,0.4)" strokeWidth="0.5" fill="none" />
              <path d="M86 55 Q87 60 86 65" stroke="rgba(168,85,247,0.4)" strokeWidth="0.5" fill="none" />
            </>}

            {/* Forearm back left */}
            <path d="M10 72 Q9 82 10 92 L14 98 L17 96 L17 72 Z"
              {...M(intensity.antebraco, "purple")} />
            {/* Forearm back right */}
            <path d="M90 72 Q91 82 90 92 L86 98 L83 96 L83 72 Z"
              {...M(intensity.antebraco, "purple")} />

            {/* Gluteus Maximus left */}
            <path d="M34 100 Q30 107 31 116 L38 118 L46 115 L46 108 Q40 106 34 100 Z"
              {...M(intensity.gluteos, "pink")} />
            {/* Gluteus Maximus right */}
            <path d="M66 100 Q70 107 69 116 L62 118 L54 115 L54 108 Q60 106 66 100 Z"
              {...M(intensity.gluteos, "pink")} />
            {/* Glute crease */}
            <path d="M35 110 Q43 113 50 113 Q57 113 65 110" stroke="rgba(236,72,153,0.25)" strokeWidth="0.5" fill="none" />

            {/* Hamstrings left - biceps femoris */}
            <path d="M33 118 Q30 135 31 150 L36 153 L40 148 Q39 133 38 118 Z"
              {...M(intensity.pernas * 0.8, "pink")} />
            {/* Hamstrings left - semitendinosus */}
            <path d="M40 118 L39 150 L43 153 L45 148 L44 118 Z"
              {...M(intensity.pernas * 0.8, "pink")} />

            {/* Hamstrings right - biceps femoris */}
            <path d="M67 118 Q70 135 69 150 L64 153 L60 148 Q61 133 62 118 Z"
              {...M(intensity.pernas * 0.8, "pink")} />
            {/* Hamstrings right - semitendinosus */}
            <path d="M60 118 L61 150 L57 153 L55 148 L56 118 Z"
              {...M(intensity.pernas * 0.8, "pink")} />

            {/* Gastrocnemius back left */}
            <path d="M32 158 Q28 168 29 180 L33 185 L36 183 Q34 170 35 158 Z"
              {...M(intensity.panturrilha, "cyan")} />
            {/* Soleus left */}
            <path d="M35 162 Q34 172 35 182 L38 185 L40 183 L40 160 Z"
              {...M(intensity.panturrilha * 0.7, "cyan")} />

            {/* Gastrocnemius back right */}
            <path d="M68 158 Q72 168 71 180 L67 185 L64 183 Q66 170 65 158 Z"
              {...M(intensity.panturrilha, "cyan")} />
            {/* Soleus right */}
            <path d="M65 162 Q66 172 65 182 L62 185 L60 183 L60 160 Z"
              {...M(intensity.panturrilha * 0.7, "cyan")} />

            {/* Achilles tendon left */}
            <line x1="37" y1="183" x2="37" y2="192" stroke={SKIN_STROKE} strokeWidth="0.5" />
            {/* Achilles tendon right */}
            <line x1="63" y1="183" x2="63" y2="192" stroke={SKIN_STROKE} strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="flex gap-4 text-[9px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.4)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(236,72,153,0.5)' }} /> Peito/Pernas/Glúteos
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(6,182,212,0.5)' }} /> Costas/Abdômen
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(168,85,247,0.5)' }} /> Braços/Ombros
          </span>
        </div>
      )}
    </div>
  );
}