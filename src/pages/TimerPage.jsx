import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

const presets = [30, 45, 60, 90, 120, 180];

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
            <circle cx="160" cy="160" r={radius} fill="none" stroke="#1F2937" strokeWidth="8" />
            <circle
              cx="160" cy="160" r={radius}
              fill="none"
              stroke={isFinished ? "#EF4444" : "#10B981"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`font-mono text-6xl md:text-7xl font-bold tabular-nums ${
              isFinished ? "text-red-400 animate-pulse" : "text-white"
            }`}>
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
            {isFinished && <span className="text-red-400 text-sm mt-2 font-medium">Descanso finalizado!</span>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
            onClick={() => adjustTime(-5)}
          >
            <Minus className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            className={`h-16 w-16 rounded-full text-white shadow-lg ${
              isRunning
                ? "bg-yellow-600 hover:bg-yellow-700"
                : isFinished
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            onClick={() => {
              if (isFinished) { reset(); return; }
              setIsRunning(!isRunning);
            }}
          >
            {isFinished ? <RotateCcw className="w-6 h-6" /> : isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
            onClick={() => adjustTime(5)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex justify-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-white"
            onClick={reset}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Resetar
          </Button>
        </div>

        {/* Presets */}
        <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Tempos Rápidos</p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset}
                variant="outline"
                onClick={() => setPreset(preset)}
                className={`border-gray-700 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 ${
                  totalSeconds === preset ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "text-gray-400"
                }`}
              >
                {preset >= 60 ? `${preset / 60}min` : `${preset}s`}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}