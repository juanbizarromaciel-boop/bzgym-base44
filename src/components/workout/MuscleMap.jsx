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
            <path d="M27 19 Q16 21 11 26 L11 40 Q13 44 18 45 L20 35 Q23 26 30 25 Q37 26 40 35 L42 45 Q47 44 49 40 L49 26 Q44 21 33 19 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Torso (ombros largos → cintura estreita → quadril) */}
            <path d="M18 45 Q15 57 16 72 Q17 83 21 87 L22 96 L38 96 L39 87 Q43 83 44 72 Q45 57 42 45 L30 46 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Quadril */}
            <path d="M22 96 Q19 100 19 105 L22 108 L38 108 L41 105 Q41 100 38 96 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Braço esquerdo superior */}
            <path d="M11 26 Q7 30 6 40 L6 58 Q7 62 10 64 L12 62 Q11 55 11 42 L13 29 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Braço direito superior */}
            <path d="M49 26 Q53 30 54 40 L54 58 Q53 62 50 64 L48 62 Q49 55 49 42 L47 29 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Antebraço esquerdo */}
            <path d="M6 58 Q5 67 6 76 L9 80 L12 78 L10 64 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Antebraço direito */}
            <path d="M54 58 Q55 67 54 76 L51 80 L48 78 L50 64 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            {/* Mão esquerda */}
            <ellipse cx="7" cy="83" rx="3" ry="4.5" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            {/* Mão direita */}
            <ellipse cx="53" cy="83" rx="3" ry="4.5" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
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
            <path d="M11 26 Q7 28 6 36 L8 44 Q11 44 13 40 L14 30 Z"
              {...M(intensity.ombros, "purple")}/>
            {/* Deltóide direito */}
            <path d="M49 26 Q53 28 54 36 L52 44 Q49 44 47 40 L46 30 Z"
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
            <path d="M7 36 Q5 42 5 54 Q6 60 9 62 L11 60 Q10 52 10 40 Z"
              {...M(intensity.biceps, "purple")}/>
            {/* Bíceps direito */}
            <path d="M53 36 Q55 42 55 54 Q54 60 51 62 L49 60 Q50 52 50 40 Z"
              {...M(intensity.biceps, "purple")}/>

            {/* Antebraço esquerdo */}
            <path d="M6 62 Q5 70 6 78 L9 81 L12 79 L10 64 Z"
              {...M(intensity.antebraco, "purple")}/>
            {/* Antebraço direito */}
            <path d="M54 62 Q55 70 54 78 L51 81 L48 79 L50 64 Z"
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
            <path d="M27 19 Q16 21 11 26 L11 40 Q13 44 18 45 L20 35 Q23 26 30 25 Q37 26 40 35 L42 45 Q47 44 49 40 L49 26 Q44 21 33 19 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M18 45 Q15 57 16 72 Q17 83 21 87 L22 96 L38 96 L39 87 Q43 83 44 72 Q45 57 42 45 L30 46 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M22 96 Q19 100 19 105 L22 108 L38 108 L41 105 Q41 100 38 96 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M11 26 Q7 30 6 40 L6 58 Q7 62 10 64 L12 62 Q11 55 11 42 L13 29 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M49 26 Q53 30 54 40 L54 58 Q53 62 50 64 L48 62 Q49 55 49 42 L47 29 Z"
              fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M6 58 Q5 67 6 76 L9 80 L12 78 L10 64 Z" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <path d="M54 58 Q55 67 54 76 L51 80 L48 78 L50 64 Z" fill={SKIN} stroke={SK} strokeWidth="0.5"/>
            <ellipse cx="7" cy="83" rx="3" ry="4.5" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
            <ellipse cx="53" cy="83" rx="3" ry="4.5" fill={SKIN} stroke={SK} strokeWidth="0.4"/>
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
            <path d="M22 20 Q26 18 30 19 Q34 18 38 20 L44 28 Q37 24 30 25 Q23 24 16 28 Z"
              {...M(intensity.costas, "cyan")}/>
            {/* Trapézio médio */}
            <path d="M16 28 Q12 31 11 37 L15 43 Q19 39 24 37 L30 36 L36 37 Q41 39 45 43 L49 37 Q48 31 44 28 Q37 24 30 25 Q23 24 16 28 Z"
              {...M(intensity.costas, "cyan")}/>

            {/* Deltóide posterior esquerdo */}
            <path d="M11 26 Q7 28 6 35 L8 43 Q11 43 13 39 L14 30 Z"
              {...M(intensity.ombros, "purple")}/>
            {/* Deltóide posterior direito */}
            <path d="M49 26 Q53 28 54 35 L52 43 Q49 43 47 39 L46 30 Z"
              {...M(intensity.ombros, "purple")}/>

            {/* Infraespinhal esquerdo */}
            <path d="M16 43 Q13 51 15 59 L23 57 L23 43 Q20 42 16 43 Z"
              {...M(intensity.costas * 0.7, "cyan")}/>
            {/* Infraespinhal direito */}
            <path d="M44 43 Q47 51 45 59 L37 57 L37 43 Q40 42 44 43 Z"
              {...M(intensity.costas * 0.7, "cyan")}/>

            {/* Lattísimo esquerdo */}
            <path d="M15 45 Q11 56 11 70 L16 75 Q19 68 21 57 L23 57 Z"
              {...M(intensity.costas, "cyan")}/>
            {/* Lattísimo direito */}
            <path d="M45 45 Q49 56 49 70 L44 75 Q41 68 39 57 L37 57 Z"
              {...M(intensity.costas, "cyan")}/>
            {intensity.costas > 0 && <>
              <path d="M15 50 L21 60" stroke="rgba(6,182,212,0.35)" strokeWidth="0.4" fill="none"/>
              <path d="M14 60 L20 69" stroke="rgba(6,182,212,0.35)" strokeWidth="0.4" fill="none"/>
              <path d="M45 50 L39 60" stroke="rgba(6,182,212,0.35)" strokeWidth="0.4" fill="none"/>
              <path d="M46 60 L40 69" stroke="rgba(6,182,212,0.35)" strokeWidth="0.4" fill="none"/>
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
            <path d="M8 36 Q6 44 6 56 L9 60 L11 58 Q10 48 10 38 Z"
              {...M(intensity.triceps, "purple")}/>
            {/* Tríceps direito */}
            <path d="M52 36 Q54 44 54 56 L51 60 L49 58 Q50 48 50 38 Z"
              {...M(intensity.triceps, "purple")}/>

            {/* Antebraço esquerdo costas */}
            <path d="M6 60 Q5 68 6 76 L9 80 L12 78 L10 64 Z"
              {...M(intensity.antebraco, "purple")}/>
            {/* Antebraço direito costas */}
            <path d="M54 60 Q55 68 54 76 L51 80 L48 78 L50 64 Z"
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