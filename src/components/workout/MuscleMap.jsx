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

const muscleFill = (intensity, hue = "purple") => {
  const hues = {
    purple: { active: "rgba(168,85,247,", border: "rgba(168,85,247,", glow: "168,85,247" },
    pink:   { active: "rgba(236,72,153,", border: "rgba(236,72,153,", glow: "236,72,153" },
    cyan:   { active: "rgba(6,182,212,",  border: "rgba(6,182,212,",  glow: "6,182,212" },
  };
  const c = hues[hue] || hues.purple;
  if (intensity === 0) return {
    fill: "rgba(30,20,50,0.5)",
    stroke: "rgba(168,85,247,0.15)",
    filter: "none",
  };
  const alpha = 0.35 + intensity * 0.55;
  return {
    fill: `${c.active}${alpha.toFixed(2)})`,
    stroke: `${c.border}${(0.5 + intensity * 0.5).toFixed(2)})`,
    filter: `drop-shadow(0 0 ${3 + intensity * 7}px rgba(${c.glow},${(0.6 + intensity * 0.4).toFixed(2)}))`,
  };
};

const M = (intensity, hue) => {
  const s = muscleFill(intensity, hue);
  return { fill: s.fill, stroke: s.stroke, strokeWidth: "0.6", style: { filter: s.filter } };
};

// Skin tone
const SKIN = "rgba(18,10,35,0.95)";
const SK = "rgba(168,85,247,0.22)";

/*
  ViewBox: "0 0 60 200"
  Body centered at x=30, width ~60 total
  Proporções atléticas:
    Cabeça: cx=30, r~7
    Pescoço: 27-33
    Ombros: 14-46 (largura ombros ~32)
    Cintura: 22-38 (estreita)
    Quadril: 20-40
    Braços: distantes do torso
    Pernas: separadas por ~6 no centro
*/

export default function MuscleMap({ exercises = [], size = "md", showLabels = false }) {
  const intensity = useMemo(() => calculateMuscleIntensity(exercises), [exercises]);

  const sizeMap = { sm: 60, md: 85, lg: 120 };
  const w = sizeMap[size] || sizeMap.md;
  const h = w * (200 / 60); // aspect ratio 60:200

  const activeLabels = {
    peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
    triceps: "Tríceps", pernas: "Pernas", gluteos: "Glúteos",
    abdomen: "Abdômen", panturrilha: "Panturrilha", antebraco: "Antebraço"
  };
  const activeGroups = Object.entries(intensity).filter(([, v]) => v > 0).map(([k]) => activeLabels[k]);

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

      <div className="flex gap-4 justify-center items-start">

        {/* ── FRENTE ── */}
        <div className="flex flex-col items-center">
          {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-1 uppercase">Frente</p>}
          <svg width={w} height={h} viewBox="0 0 60 200" fill="none" xmlns="http://www.w3.org/2000/svg">

            {/* ── SILHUETA FRENTE ── */}
            {/* Cabeça */}
            <ellipse cx="30" cy="9" rx="7" ry="8" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Pescoço */}
            <rect x="27" y="16" width="6" height="6" rx="1" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            {/* Trapézio/Ombros */}
            <path d="M27 19 Q18 21 14 25 L14 38 Q16 42 20 43 L22 34 Q24 26 30 25 Q36 26 38 34 L40 43 Q44 42 46 38 L46 25 Q42 21 33 19 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Torso (ombros largos → cintura estreita → quadril) */}
            <path d="M20 43 Q17 55 18 70 Q19 82 22 86 L22 96 L38 96 L38 86 Q41 82 42 70 Q43 55 40 43 L30 44 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Quadril */}
            <path d="M22 96 Q19 100 19 105 L22 108 L38 108 L41 105 Q41 100 38 96 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Braço esquerdo superior */}
            <path d="M14 25 Q10 28 9 38 L9 56 Q10 60 13 62 L15 60 Q14 54 14 40 L16 28 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Braço direito superior */}
            <path d="M46 25 Q50 28 51 38 L51 56 Q50 60 47 62 L45 60 Q46 54 46 40 L44 28 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Antebraço esquerdo */}
            <path d="M9 56 Q8 65 9 74 L11 78 L14 77 L13 62 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Antebraço direito */}
            <path d="M51 56 Q52 65 51 74 L49 78 L46 77 L47 62 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Mão esquerda */}
            <ellipse cx="10" cy="81" rx="3" ry="4.5" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            {/* Mão direita */}
            <ellipse cx="50" cy="81" rx="3" ry="4.5" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            {/* Coxa esquerda */}
            <path d="M19 108 Q17 125 18 142 L22 145 L26 143 L25 108 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Coxa direita */}
            <path d="M41 108 Q43 125 42 142 L38 145 L34 143 L35 108 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Joelho esquerdo */}
            <ellipse cx="22" cy="147" rx="4" ry="3" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            {/* Joelho direito */}
            <ellipse cx="38" cy="147" rx="4" ry="3" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            {/* Perna esquerda */}
            <path d="M18 150 Q17 165 18 178 L21 181 L25 180 L24 150 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Perna direita */}
            <path d="M42 150 Q43 165 42 178 L39 181 L35 180 L36 150 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Pé esquerdo */}
            <path d="M17 178 L15 185 L26 185 L25 180 Z" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            {/* Pé direito */}
            <path d="M43 178 L45 185 L34 185 L35 180 Z" fill={SKIN} stroke={SK} strokeWidth="0.4"/>

            {/* ── MÚSCULOS FRENTE ── */}

            {/* Deltóide esquerdo */}
            <path d="M14 25 Q10 27 9 34 L11 42 Q13 42 15 38 L16 28 Z"
              {...M(intensity.ombros, "purple")}/>
            {/* Deltóide direito */}
            <path d="M46 25 Q50 27 51 34 L49 42 Q47 42 45 38 L44 28 Z"
              {...M(intensity.ombros, "purple")}/>

            {/* Peitoral esquerdo */}
            <path d="M21 28 Q19 32 19 42 Q20 50 25 51 L30 50 L30 28 Q26 27 21 28 Z"
              {...M(intensity.peito, "pink")}/>
            {/* Peitoral direito */}
            <path d="M39 28 Q41 32 41 42 Q40 50 35 51 L30 50 L30 28 Q34 27 39 28 Z"
              {...M(intensity.peito, "pink")}/>
            {intensity.peito > 0 && <>
              <path d="M21 40 Q25 44 30 43" stroke="rgba(236,72,153,0.3)" strokeWidth="0.4" fill="none"/>
              <path d="M39 40 Q35 44 30 43" stroke="rgba(236,72,153,0.3)" strokeWidth="0.4" fill="none"/>
            </>}

            {/* Abdômen (6 quadrados) */}
            <path d="M25 52 L25 94 Q27 97 30 97 Q33 97 35 94 L35 52 Q32 51 30 51 Q28 51 25 52 Z"
              {...M(intensity.abdomen, "cyan")}/>
            <line x1="25" y1="61" x2="35" y2="61" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5"/>
            <line x1="25" y1="70" x2="35" y2="70" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5"/>
            <line x1="25" y1="79" x2="35" y2="79" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5"/>
            <line x1="25" y1="88" x2="35" y2="88" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5"/>
            <line x1="30" y1="52" x2="30" y2="94" stroke="rgba(6,182,212,0.2)" strokeWidth="0.4"/>

            {/* Oblíquos esquerdo */}
            <path d="M19 58 Q17 72 18 86 L22 84 L23 68 Z"
              {...M(intensity.abdomen * 0.6, "cyan")}/>
            {/* Oblíquos direito */}
            <path d="M41 58 Q43 72 42 86 L38 84 L37 68 Z"
              {...M(intensity.abdomen * 0.6, "cyan")}/>

            {/* Bíceps esquerdo */}
            <path d="M10 34 Q8 40 8 52 Q9 58 12 60 L14 58 Q13 50 13 38 Z"
              {...M(intensity.biceps, "purple")}/>
            {/* Bíceps direito */}
            <path d="M50 34 Q52 40 52 52 Q51 58 48 60 L46 58 Q47 50 47 38 Z"
              {...M(intensity.biceps, "purple")}/>

            {/* Antebraço esquerdo */}
            <path d="M9 60 Q8 68 9 76 L12 79 L14 77 L13 60 Z"
              {...M(intensity.antebraco, "purple")}/>
            {/* Antebraço direito */}
            <path d="M51 60 Q52 68 51 76 L48 79 L46 77 L47 60 Z"
              {...M(intensity.antebraco, "purple")}/>

            {/* Quad esquerdo – lateral */}
            <path d="M17 108 Q15 122 16 138 L20 142 L22 137 Q21 120 21 108 Z"
              {...M(intensity.pernas, "pink")}/>
            {/* Quad esquerdo – reto */}
            <path d="M22 108 L22 142 L26 144 L26 108 Z"
              {...M(intensity.pernas, "pink")}/>
            {/* Quad esquerdo – medial */}
            <path d="M26 108 L26 138 Q27 143 29 144 L30 143 L29 108 Z"
              {...M(intensity.pernas, "pink")}/>

            {/* Quad direito – lateral */}
            <path d="M43 108 Q45 122 44 138 L40 142 L38 137 Q39 120 39 108 Z"
              {...M(intensity.pernas, "pink")}/>
            {/* Quad direito – reto */}
            <path d="M38 108 L38 142 L34 144 L34 108 Z"
              {...M(intensity.pernas, "pink")}/>
            {/* Quad direito – medial */}
            <path d="M34 108 L34 138 Q33 143 31 144 L30 143 L31 108 Z"
              {...M(intensity.pernas, "pink")}/>

            {/* Panturrilha esquerda */}
            <path d="M18 152 Q16 162 17 174 L20 178 L23 176 Q22 164 22 152 Z"
              {...M(intensity.panturrilha, "cyan")}/>
            {/* Panturrilha direita */}
            <path d="M42 152 Q44 162 43 174 L40 178 L37 176 Q38 164 38 152 Z"
              {...M(intensity.panturrilha, "cyan")}/>
          </svg>
        </div>

        {/* ── COSTAS ── */}
        <div className="flex flex-col items-center">
          {showLabels && <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-wider mb-1 uppercase">Costas</p>}
          <svg width={w} height={h} viewBox="0 0 60 200" fill="none" xmlns="http://www.w3.org/2000/svg">

            {/* ── SILHUETA COSTAS (espelhada) ── */}
            <ellipse cx="30" cy="9" rx="7" ry="8" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <rect x="27" y="16" width="6" height="6" rx="1" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            <path d="M27 19 Q18 21 14 25 L14 38 Q16 42 20 43 L22 34 Q24 26 30 25 Q36 26 38 34 L40 43 Q44 42 46 38 L46 25 Q42 21 33 19 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M20 43 Q17 55 18 70 Q19 82 22 86 L22 96 L38 96 L38 86 Q41 82 42 70 Q43 55 40 43 L30 44 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M22 96 Q19 100 19 105 L22 108 L38 108 L41 105 Q41 100 38 96 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M14 25 Q10 28 9 38 L9 56 Q10 60 13 62 L15 60 Q14 54 14 40 L16 28 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M46 25 Q50 28 51 38 L51 56 Q50 60 47 62 L45 60 Q46 54 46 40 L44 28 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M9 56 Q8 65 9 74 L11 78 L14 77 L13 62 Z" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M51 56 Q52 65 51 74 L49 78 L46 77 L47 62 Z" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <ellipse cx="10" cy="81" rx="3" ry="4.5" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            <ellipse cx="50" cy="81" rx="3" ry="4.5" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            <path d="M19 108 Q17 125 18 142 L22 145 L26 143 L25 108 Z" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M41 108 Q43 125 42 142 L38 145 L34 143 L35 108 Z" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <ellipse cx="22" cy="147" rx="4" ry="3" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            <ellipse cx="38" cy="147" rx="4" ry="3" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            <path d="M18 150 Q17 165 18 178 L21 181 L25 180 L24 150 Z" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M42 150 Q43 165 42 178 L39 181 L35 180 L36 150 Z" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M17 178 L15 185 L26 185 L25 180 Z" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            <path d="M43 178 L45 185 L34 185 L35 180 Z" fill={SKIN} stroke={SK} strokeWidth="0.4"/>

            {/* ── MÚSCULOS COSTAS ── */}

            {/* Trapézio superior */}
            <path d="M22 20 Q26 18 30 19 Q34 18 38 20 L42 28 Q36 24 30 25 Q24 24 18 28 Z"
              {...M(intensity.costas, "cyan")}/>
            {/* Trapézio médio */}
            <path d="M18 28 Q14 30 13 36 L17 42 Q21 38 26 36 L30 35 L34 36 Q39 38 43 42 L47 36 Q46 30 42 28 Q36 24 30 25 Q24 24 18 28 Z"
              {...M(intensity.costas, "cyan")}/>

            {/* Deltóide posterior esquerdo */}
            <path d="M14 25 Q10 27 9 33 L11 40 Q14 40 16 36 Z"
              {...M(intensity.ombros, "purple")}/>
            {/* Deltóide posterior direito */}
            <path d="M46 25 Q50 27 51 33 L49 40 Q46 40 44 36 Z"
              {...M(intensity.ombros, "purple")}/>

            {/* Infraespinhal esquerdo */}
            <path d="M18 42 Q15 50 17 58 L24 56 L24 42 Q21 41 18 42 Z"
              {...M(intensity.costas * 0.7, "cyan")}/>
            {/* Infraespinhal direito */}
            <path d="M42 42 Q45 50 43 58 L36 56 L36 42 Q39 41 42 42 Z"
              {...M(intensity.costas * 0.7, "cyan")}/>

            {/* Lattísimo esquerdo */}
            <path d="M17 44 Q13 54 13 68 L18 73 Q21 66 22 56 L24 56 Z"
              {...M(intensity.costas, "cyan")}/>
            {/* Lattísimo direito */}
            <path d="M43 44 Q47 54 47 68 L42 73 Q39 66 38 56 L36 56 Z"
              {...M(intensity.costas, "cyan")}/>
            {intensity.costas > 0 && <>
              <path d="M17 48 L22 58" stroke="rgba(6,182,212,0.35)" strokeWidth="0.4" fill="none"/>
              <path d="M16 58 L21 67" stroke="rgba(6,182,212,0.35)" strokeWidth="0.4" fill="none"/>
              <path d="M43 48 L38 58" stroke="rgba(6,182,212,0.35)" strokeWidth="0.4" fill="none"/>
              <path d="M44 58 L39 67" stroke="rgba(6,182,212,0.35)" strokeWidth="0.4" fill="none"/>
            </>}

            {/* Eretores da espinha / lombar */}
            <path d="M26 56 L26 90 Q28 93 30 93 Q32 93 34 90 L34 56 Q32 55 30 55 Q28 55 26 56 Z"
              {...M(intensity.costas * 0.5, "cyan")}/>
            <line x1="30" y1="26" x2="30" y2="92" stroke="rgba(6,182,212,0.15)" strokeWidth="0.4"/>
            <line x1="28" y1="56" x2="28" y2="90" stroke="rgba(6,182,212,0.18)" strokeWidth="0.35"/>
            <line x1="32" y1="56" x2="32" y2="90" stroke="rgba(6,182,212,0.18)" strokeWidth="0.35"/>

            {/* Teres Major esquerdo */}
            <path d="M17 58 Q14 64 16 70 L20 67 L21 58 Z"
              {...M(intensity.costas * 0.6, "cyan")}/>
            {/* Teres Major direito */}
            <path d="M43 58 Q46 64 44 70 L40 67 L39 58 Z"
              {...M(intensity.costas * 0.6, "cyan")}/>

            {/* Tríceps esquerdo */}
            <path d="M11 34 Q9 42 9 54 L12 58 L14 56 Q13 46 13 36 Z"
              {...M(intensity.triceps, "purple")}/>
            {/* Tríceps direito */}
            <path d="M49 34 Q51 42 51 54 L48 58 L46 56 Q47 46 47 36 Z"
              {...M(intensity.triceps, "purple")}/>

            {/* Antebraço esquerdo costas */}
            <path d="M9 60 Q8 68 9 76 L12 79 L14 77 L13 60 Z"
              {...M(intensity.antebraco, "purple")}/>
            {/* Antebraço direito costas */}
            <path d="M51 60 Q52 68 51 76 L48 79 L46 77 L47 60 Z"
              {...M(intensity.antebraco, "purple")}/>

            {/* Glúteo esquerdo */}
            <path d="M19 100 Q17 106 18 114 L23 116 L28 113 L28 105 Q23 103 19 100 Z"
              {...M(intensity.gluteos, "pink")}/>
            {/* Glúteo direito */}
            <path d="M41 100 Q43 106 42 114 L37 116 L32 113 L32 105 Q37 103 41 100 Z"
              {...M(intensity.gluteos, "pink")}/>
            <path d="M20 108 Q25 111 30 111 Q35 111 40 108" stroke="rgba(236,72,153,0.2)" strokeWidth="0.5" fill="none"/>

            {/* Isquiotibial esquerdo – bíceps femoral */}
            <path d="M18 116 Q16 130 17 142 L21 145 L23 140 Q22 126 22 116 Z"
              {...M(intensity.pernas * 0.8, "pink")}/>
            {/* Isquiotibial esquerdo – semitendíneo */}
            <path d="M23 116 L23 142 L26 144 L27 140 L27 116 Z"
              {...M(intensity.pernas * 0.8, "pink")}/>

            {/* Isquiotibial direito – bíceps femoral */}
            <path d="M42 116 Q44 130 43 142 L39 145 L37 140 Q38 126 38 116 Z"
              {...M(intensity.pernas * 0.8, "pink")}/>
            {/* Isquiotibial direito – semitendíneo */}
            <path d="M37 116 L37 142 L34 144 L33 140 L33 116 Z"
              {...M(intensity.pernas * 0.8, "pink")}/>

            {/* Panturrilha esquerda costas */}
            <path d="M18 152 Q16 163 17 174 L20 178 L23 176 Q22 163 22 152 Z"
              {...M(intensity.panturrilha, "cyan")}/>
            <path d="M22 154 Q21 165 22 176 L25 178 L26 176 L26 152 Z"
              {...M(intensity.panturrilha * 0.7, "cyan")}/>
            {/* Panturrilha direita costas */}
            <path d="M42 152 Q44 163 43 174 L40 178 L37 176 Q38 163 38 152 Z"
              {...M(intensity.panturrilha, "cyan")}/>
            <path d="M38 154 Q39 165 38 176 L35 178 L34 176 L34 152 Z"
              {...M(intensity.panturrilha * 0.7, "cyan")}/>

            {/* Tendão de Aquiles */}
            <line x1="22" y1="178" x2="22" y2="185" stroke={SK} strokeWidth="0.5"/>
            <line x1="38" y1="178" x2="38" y2="185" stroke={SK} strokeWidth="0.5"/>
          </svg>
        </div>
      </div>

      {/* Legenda */}
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