import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Plus, Minus, Timer, Zap } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

const presets = [30, 45, 60, 90, 120, 180];
const techniquePresets = [10, 15, 20, 30, 45];

export default function TimerPage() {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRl9vT19teleV...");
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const reset = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setIsRunning(false);
    setIsFinished(false);
  }, [totalSeconds]);

  const setPreset = (secs) => {
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setIsRunning(false);
    setIsFinished(false);
  };

  const adjustTime = (delta) => {
    const newTotal = Math.max(5, totalSeconds + delta);
    setTotalSeconds(newTotal);
    if (!isRunning) setSecondsLeft(newTotal);
  };

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div>
      <PageHeader title="Cronômetro" subtitle="Controle seu tempo de descanso" />

      <div className="max-w-md mx-auto">
        {/* Circular Timer */}
        <div className="relative flex items-center justify-center mb-8">
          <svg className="w-72 h-72 md:w-80 md:h-80 -rotate-90" viewBox="0 0 320 320">
            <circle cx="160" cy="160" r={radius} fill="none" stroke="rgba(88,28,135,0.2)" strokeWidth="6" />
            {/* Outer glow ring */}
            <circle cx="160" cy="160" r={radius + 6} fill="none" stroke="rgba(168,85,247,0.05)" strokeWidth="1" />
            <circle
              cx="160" cy="160" r={radius}
              fill="none"
              stroke={isFinished ? "#f472b6" : "#a855f7"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
              style={{filter: `drop-shadow(0 0 ${isFinished ? '12px rgba(244,114,182,1)' : '10px rgba(168,85,247,0.9)'})`}}
            />
            {/* Tick marks */}
            {Array.from({length: 12}).map((_, i) => {
              const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
              const x1 = 160 + (radius - 12) * Math.cos(angle);
              const y1 = 160 + (radius - 12) * Math.sin(angle);
              const x2 = 160 + (radius - 20) * Math.cos(angle);
              const y2 = 160 + (radius - 20) * Math.sin(angle);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />;
            })}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`font-cyber text-6xl md:text-7xl font-bold tabular-nums ${
              isFinished ? "text-pink-400" : "text-white"
            }`} style={{textShadow: isFinished ? '0 0 20px rgba(244,114,182,0.8)' : '0 0 20px rgba(168,85,247,0.6)'}}>
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] text-purple-500/40 font-mono-cyber tracking-[0.3em] mt-2 uppercase">
              {isFinished ? "CONCLUÍDO" : isRunning ? "EM ANDAMENTO" : "PAUSADO"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5 mb-8">
          <button
            className="h-12 w-12 rounded-full border border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10 hover:text-purple-300 flex items-center justify-center transition-all"
            onClick={() => adjustTime(-5)}
          >
            <Minus className="w-5 h-5" />
          </button>

          <button
            className={`h-18 w-18 rounded-full flex items-center justify-center transition-all duration-200 ${
              isFinished
                ? "btn-neon-pink"
                : isRunning
                ? "bg-yellow-500/15 border border-yellow-500/40 text-yellow-300"
                : "btn-neon-purple"
            }`}
            style={{width: 72, height: 72, boxShadow: isRunning ? '0 0 20px rgba(234,179,8,0.3)' : '0 0 20px rgba(168,85,247,0.3)'}}
            onClick={() => {
              if (isFinished) { reset(); return; }
              setIsRunning(!isRunning);
            }}
          >
            {isFinished ? <RotateCcw className="w-7 h-7" /> : isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </button>

          <button
            className="h-12 w-12 rounded-full border border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10 hover:text-purple-300 flex items-center justify-center transition-all"
            onClick={() => adjustTime(5)}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mb-8">
          <button className="text-purple-500/30 hover:text-purple-400 flex items-center gap-2 text-sm font-mono-cyber tracking-wider transition-colors" onClick={reset}>
            <RotateCcw className="w-4 h-4" /> RESETAR
          </button>
        </div>

        {/* Presets */}
        <div className="cyber-card rounded-xl p-5 border border-purple-900/20">
          <p className="text-[10px] text-purple-500/40 uppercase tracking-[0.2em] font-medium mb-4">Tempos Rápidos</p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setPreset(preset)}
                className={`py-2.5 rounded-lg text-sm font-cyber tracking-wider transition-all ${
                  totalSeconds === preset
                    ? "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                    : "border border-purple-900/30 text-purple-500/40 hover:border-purple-500/30 hover:text-purple-300"
                }`}
                style={totalSeconds === preset ? {boxShadow: '0 0 10px rgba(168,85,247,0.2)'} : {}}
              >
                {preset >= 60 ? `${preset / 60}MIN` : `${preset}S`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}