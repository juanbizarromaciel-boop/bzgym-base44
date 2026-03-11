import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function RestTimer({ initialSeconds = 60, onComplete }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, seconds, onComplete]);

  const progress = ((initialSeconds - seconds) / initialSeconds) * 100;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 border border-purple-900/30 bg-black/60">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(88,28,135,0.3)"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeDasharray={`${progress}, 100`}
            className="transition-all duration-1000"
            style={{filter: 'drop-shadow(0 0 3px rgba(168,85,247,0.8))'}}
          />
        </svg>
      </div>
      <span className="font-cyber text-lg font-bold text-purple-300 tabular-nums w-14" style={{textShadow: '0 0 8px rgba(168,85,247,0.6)'}}>
        {mins}:{secs.toString().padStart(2, "0")}
      </span>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-purple-400 hover:bg-purple-500/10" onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-purple-400/50 hover:bg-purple-500/10" onClick={() => { setSeconds(initialSeconds); setIsRunning(false); }}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}