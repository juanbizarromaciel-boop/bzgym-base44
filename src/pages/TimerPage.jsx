import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Plus, Minus, Timer, Zap } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

const presets = [30, 45, 60, 90, 120, 180];
const techniquePresets = [10, 15, 20, 30, 45];

function SingleTimer({ label, color, presetList, defaultSeconds }) {
  const colors = {
    purple: { ring: "#a855f7", finished: "#f472b6", text: "text-purple-300", active: "bg-purple-500/20 border border-purple-500/40 text-purple-200", inactive: "border border-purple-900/30 text-purple-500/50 hover:border-purple-500/30 hover:text-purple-300" },
    cyan: { ring: "#06b6d4", finished: "#f472b6", text: "text-cyan-300", active: "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200", inactive: "border border-cyan-900/30 text-cyan-600/50 hover:border-cyan-500/30 hover:text-cyan-300" },
  };
  const c = colors[color] || colors.purple;

  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { setIsRunning(false); setIsFinished(true); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const reset = useCallback(() => { setSecondsLeft(totalSeconds); setIsRunning(false); setIsFinished(false); }, [totalSeconds]);
  const setPreset = (s) => { setTotalSeconds(s); setSecondsLeft(s); setIsRunning(false); setIsFinished(false); };
  const adjustTime = (delta) => { const n = Math.max(5, totalSeconds + delta); setTotalSeconds(n); if (!isRunning) setSecondsLeft(n); };

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="cyber-card rounded-2xl p-5 border border-purple-900/20 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        {color === "cyan" ? <Timer className="w-4 h-4 text-cyan-400" style={{filter:'drop-shadow(0 0 5px rgba(6,182,212,0.8))'}} /> : <Zap className="w-4 h-4 text-purple-400" style={{filter:'drop-shadow(0 0 5px rgba(168,85,247,0.8))'}} />}
        <p className={`font-cyber text-sm tracking-widest font-bold ${c.text}`} style={{textShadow: color==='cyan' ? '0 0 8px rgba(6,182,212,0.6)' : '0 0 8px rgba(168,85,247,0.6)'}}>{label}</p>
      </div>

      <div className="relative flex items-center justify-center mb-5">
        <svg className="w-56 h-56 -rotate-90" viewBox="0 0 256 256">
          <circle cx="128" cy="128" r={radius} fill="none" stroke="rgba(88,28,135,0.15)" strokeWidth="5" />
          <circle cx="128" cy="128" r={radius} fill="none"
            stroke={isFinished ? "#f472b6" : (color==='cyan' ? '#06b6d4' : '#a855f7')}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            className="transition-all duration-1000"
            style={{filter: `drop-shadow(0 0 ${isFinished ? '12px rgba(244,114,182,1)' : color==='cyan' ? '10px rgba(6,182,212,0.9)' : '10px rgba(168,85,247,0.9)'})`}}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`font-cyber text-5xl font-bold tabular-nums ${isFinished ? 'animate-blink-neon text-pink-400' : c.text}`}
            style={{textShadow: isFinished ? '0 0 20px rgba(244,114,182,0.8)' : color==='cyan' ? '0 0 15px rgba(6,182,212,0.7)' : '0 0 15px rgba(168,85,247,0.7)'}}>
            {mins}:{secs.toString().padStart(2,"0")}
          </span>
          <span className="text-[9px] text-purple-500/40 font-mono-cyber tracking-[0.3em] mt-1 uppercase">
            {isFinished ? "✓ PRONTO" : isRunning ? "CONTANDO" : "PAUSADO"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button className="h-10 w-10 rounded-full border border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10 hover:text-purple-300 flex items-center justify-center transition-all"
          onClick={() => adjustTime(-5)}><Minus className="w-4 h-4" /></button>
        <button
          className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-200 ${isFinished ? 'btn-neon-pink' : isRunning ? 'bg-yellow-500/15 border border-yellow-500/40 text-yellow-200' : color==='cyan' ? 'btn-neon-cyan' : 'btn-neon-purple'}`}
          style={{boxShadow: isRunning ? '0 0 20px rgba(234,179,8,0.4)' : color==='cyan' ? '0 0 20px rgba(6,182,212,0.4)' : '0 0 20px rgba(168,85,247,0.4)'}}
          onClick={() => { if (isFinished) { reset(); return; } setIsRunning(!isRunning); }}
        >
          {isFinished ? <RotateCcw className="w-6 h-6" /> : isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        <button className="h-10 w-10 rounded-full border border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10 hover:text-purple-300 flex items-center justify-center transition-all"
          onClick={() => adjustTime(5)}><Plus className="w-4 h-4" /></button>
      </div>

      <div className="flex justify-center mb-4">
        <button className="text-purple-500/30 hover:text-purple-400 flex items-center gap-2 text-xs font-mono-cyber tracking-wider transition-colors" onClick={reset}>
          <RotateCcw className="w-3 h-3" /> RESETAR
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {presetList.map((p) => (
          <button key={p} onClick={() => setPreset(p)}
            className={`py-2 rounded-lg text-xs font-cyber tracking-wider transition-all ${totalSeconds === p ? c.active : c.inactive}`}
            style={totalSeconds === p ? {boxShadow: color==='cyan' ? '0 0 10px rgba(6,182,212,0.25)' : '0 0 10px rgba(168,85,247,0.25)'} : {}}>
            {p >= 60 ? `${p/60}MIN` : `${p}S`}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TimerPage() {

  return (
    <div>
      <PageHeader title="Cronômetros" subtitle="Descanso entre séries e técnicas avançadas" />
      <div className="max-w-lg mx-auto space-y-5">
        <SingleTimer
          label="DESCANSO ENTRE SÉRIES"
          color="cyan"
          presetList={presets}
          defaultSeconds={60}
        />
        <SingleTimer
          label="TIMER DE TÉCNICA"
          color="purple"
          presetList={techniquePresets}
          defaultSeconds={15}
        />
      </div>
    </div>
  );
}