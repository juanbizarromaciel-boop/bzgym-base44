import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer, Zap } from "lucide-react";

const TECHNIQUE_TIMERS = {
  cluster: { label: "Cluster", description: "Pausa intra-série", defaultSeconds: 15, color: "purple" },
  rest_pause: { label: "Rest-Pause", description: "Pausa RP", defaultSeconds: 20, color: "pink" },
  myo_reps: { label: "Myo Reps", description: "Pausa Myo", defaultSeconds: 10, color: "pink" },
};

function MiniTimer({ seconds: initialSeconds, label, description, color, autoKey }) {
  const colors = {
    purple: { ring: "#a855f7", glow: "rgba(168,85,247,", text: "text-purple-300", bg: "bg-purple-500/10", border: "border-purple-500/30" },
    cyan: { ring: "#06b6d4", glow: "rgba(6,182,212,", text: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
    pink: { ring: "#ec4899", glow: "rgba(236,72,153,", text: "text-pink-300", bg: "bg-pink-500/10", border: "border-pink-500/30" },
  };
  const c = colors[color] || colors.purple;

  const [secs, setSecs] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSecs(initialSeconds);
    setRunning(false);
    setFinished(false);
  }, [initialSeconds, autoKey]);

  useEffect(() => {
    if (running && secs > 0) {
      intervalRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) { setRunning(false); setFinished(true); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = () => { setSecs(initialSeconds); setRunning(false); setFinished(false); };
  const progress = ((initialSeconds - secs) / initialSeconds) * 100;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  const mins = Math.floor(secs / 60);
  const ss = secs % 60;

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${c.bg} ${c.border} transition-all duration-300 animate-fade-in-up`}
      style={{ boxShadow: running ? `0 0 12px ${c.glow}0.3)` : 'none' }}>
      {/* Ring */}
      <div className="relative flex-shrink-0">
        <svg width="44" height="44" className="-rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(88,28,135,0.2)" strokeWidth="3" />
          <circle
            cx="22" cy="22" r={r} fill="none"
            stroke={finished ? "#f472b6" : c.ring}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1000"
            style={{ filter: `drop-shadow(0 0 4px ${finished ? "rgba(244,114,182,0.9)" : c.glow + "0.9)"})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {finished
            ? <span className="text-[8px] text-pink-400 font-cyber animate-blink-neon">OK</span>
            : <span className={`text-[9px] font-cyber ${c.text} tabular-nums`}>{mins}:{ss.toString().padStart(2,"0")}</span>
          }
        </div>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${c.text} leading-tight`}>{label}</p>
        <p className="text-[10px] text-purple-400/40 font-mono-cyber">{description}</p>
      </div>

      {/* Controls */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => { if (finished) { reset(); } else { setRunning(r => !r); } }}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${c.bg} border ${c.border} hover:opacity-80`}
        >
          {finished ? <RotateCcw className={`w-3 h-3 ${c.text}`} /> : running ? <Pause className={`w-3 h-3 ${c.text}`} /> : <Play className={`w-3 h-3 ${c.text} ml-0.5`} />}
        </button>
        {!finished && (
          <button onClick={reset} className="h-7 w-7 rounded-lg flex items-center justify-center bg-black/40 border border-purple-900/30 hover:opacity-80 transition-all">
            <RotateCcw className="w-3 h-3 text-purple-500/40" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ExerciseTimers({ restSeconds = 60, technique = "normal" }) {
  const [resetKey, setResetKey] = useState(0);
  const techConfig = TECHNIQUE_TIMERS[technique];

  return (
    <div className="space-y-2 min-w-0 w-full sm:w-auto sm:min-w-[220px]">
      {/* Rest timer */}
      <MiniTimer
        key={`rest-${resetKey}`}
        autoKey={resetKey}
        seconds={restSeconds}
        label="Descanso"
        description="Entre séries"
        color="cyan"
      />

      {/* Technique timer */}
      {techConfig && (
        <MiniTimer
          key={`tech-${resetKey}-${technique}`}
          autoKey={`${resetKey}-${technique}`}
          seconds={techConfig.defaultSeconds}
          label={techConfig.label}
          description={techConfig.description}
          color={techConfig.color}
        />
      )}
    </div>
  );
}