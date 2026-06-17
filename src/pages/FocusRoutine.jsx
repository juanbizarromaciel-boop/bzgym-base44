import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, CheckSquare, Square, RotateCcw, Play, Pause, SkipForward,
  Plus, Trash2, Calendar, Star, Brain, Zap, Coffee, Target, ChevronDown, ChevronUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PRIORITY_COLORS = { alta: "#ec4899", media: "#f59e0b", baixa: "#06b6d4" };
const PRIORITY_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" };

const POMODORO_MODES = [
  { key: "focus", label: "Foco", minutes: 25, color: "#a855f7", icon: Brain },
  { key: "short", label: "Pausa curta", minutes: 5, color: "#06b6d4", icon: Coffee },
  { key: "long", label: "Pausa longa", minutes: 15, color: "#10b981", icon: Star },
];

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ─── Pomodoro ────────────────────────────────────────────────────────────────
function PomodoroSection() {
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useLocalStorage("bz_pomodoro_sessions", 0);
  const intervalRef = useRef(null);
  const cfg = POMODORO_MODES.find(m => m.key === mode);

  useEffect(() => {
    setSecondsLeft(cfg.minutes * 60);
    setRunning(false);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "focus") { setSessions(n => n + 1); toast.success("Sessão concluída! 🎯"); }
            else toast.success("Pausa encerrada!");
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = () => { setRunning(false); setSecondsLeft(cfg.minutes * 60); };
  const skip = () => { setRunning(false); setSecondsLeft(0); };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const total = cfg.minutes * 60;
  const pct = ((total - secondsLeft) / total) * 100;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="cyber-card rounded-2xl p-6 border border-purple-900/20">
      <div className="flex items-center gap-2 mb-5">
        <Timer className="w-4 h-4" style={{ color: cfg.color, filter: `drop-shadow(0 0 5px ${cfg.color})` }} />
        <p className="font-cyber text-xs tracking-[0.3em] uppercase" style={{ color: cfg.color }}>Pomodoro Timer</p>
        <span className="ml-auto text-[10px] font-mono-cyber text-purple-500/40">{sessions} sessões hoje</span>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        {POMODORO_MODES.map(m => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className="flex-1 py-2 rounded-xl text-[10px] font-mono-cyber tracking-wider transition-all"
            style={mode === m.key
              ? { background: `${m.color}20`, border: `1px solid ${m.color}60`, color: m.color }
              : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(168,85,247,0.4)' }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Circle timer */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={radius} strokeWidth="6" fill="none" stroke="rgba(168,85,247,0.08)" />
            <circle cx="64" cy="64" r={radius} strokeWidth="6" fill="none"
              stroke={cfg.color}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (pct / 100) * circumference}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${cfg.color})`, transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-cyber text-3xl font-black" style={{ color: cfg.color, textShadow: `0 0 20px ${cfg.color}` }}>
              {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-mono-cyber text-purple-500/40 tracking-widest">{cfg.label.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={reset} className="p-3 rounded-xl border border-purple-900/30 text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10 transition-all">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={() => setRunning(r => !r)}
          className="px-8 py-3 rounded-xl font-bold text-sm tracking-wider transition-all"
          style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}50`, color: '#fff', boxShadow: `0 0 20px ${cfg.color}25` }}>
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={skip} className="p-3 rounded-xl border border-purple-900/30 text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10 transition-all">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Daily Checklist ─────────────────────────────────────────────────────────
function DailyChecklist() {
  const todayKey = new Date().toISOString().split("T")[0];
  const [tasks, setTasks] = useLocalStorage(`bz_checklist_${todayKey}`, []);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("media");

  const add = () => {
    if (!newTask.trim()) return;
    setTasks(t => [...t, { id: Date.now(), text: newTask.trim(), done: false, priority }]);
    setNewTask("");
  };
  const toggle = (id) => setTasks(t => t.map(item => item.id === id ? { ...item, done: !item.done } : item));
  const remove = (id) => setTasks(t => t.filter(item => item.id !== id));

  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="cyber-card rounded-2xl p-6 border border-purple-900/20">
      <div className="flex items-center gap-2 mb-2">
        <CheckSquare className="w-4 h-4 text-cyan-400" style={{ filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.8))' }} />
        <p className="font-cyber text-xs tracking-[0.3em] uppercase text-cyan-400">Checklist do Dia</p>
        <span className="ml-auto text-[10px] font-mono-cyber text-purple-500/40">{done}/{tasks.length}</span>
      </div>

      {tasks.length > 0 && (
        <div className="mb-4">
          <div className="h-1 bg-purple-900/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #06b6d4, #a855f7)', boxShadow: '0 0 8px rgba(6,182,212,0.6)' }} />
          </div>
          <p className="text-[9px] font-mono-cyber text-purple-500/30 mt-1">{pct}% concluído</p>
        </div>
      )}

      {/* Add task */}
      <div className="flex gap-2 mb-4">
        <Input value={newTask} onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Nova tarefa..." className="cyber-input flex-1 text-sm" />
        <select value={priority} onChange={e => setPriority(e.target.value)}
          className="cyber-input text-xs px-2 rounded-lg"
          style={{ color: PRIORITY_COLORS[priority], background: 'rgba(0,0,0,0.4)', border: `1px solid ${PRIORITY_COLORS[priority]}40` }}>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={add} className="px-3 py-2 rounded-xl transition-all"
          style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc' }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && (
          <p className="text-center text-purple-500/25 font-mono-cyber text-xs py-4">// nenhuma tarefa ainda</p>
        )}
        <AnimatePresence>
          {tasks.map(task => (
            <motion.div key={task.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all group"
              style={{
                background: task.done ? 'rgba(16,185,129,0.05)' : 'rgba(168,85,247,0.04)',
                borderColor: task.done ? 'rgba(16,185,129,0.2)' : `${PRIORITY_COLORS[task.priority] || '#a855f7'}20`,
              }}>
              <button onClick={() => toggle(task.id)} className="flex-shrink-0">
                {task.done
                  ? <CheckSquare className="w-5 h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 5px rgba(16,185,129,0.8))' }} />
                  : <Square className="w-5 h-5" style={{ color: PRIORITY_COLORS[task.priority] || '#a855f7' }} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-tight ${task.done ? 'line-through text-purple-500/40' : 'text-white'}`}>{task.text}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: PRIORITY_COLORS[task.priority], boxShadow: `0 0 6px ${PRIORITY_COLORS[task.priority]}` }} />
                <button onClick={() => remove(task.id)} className="text-purple-500/30 hover:text-pink-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Weekly Routine ───────────────────────────────────────────────────────────
function WeeklyRoutine() {
  const [routine, setRoutine] = useLocalStorage("bz_weekly_routine", {});
  const [editDay, setEditDay] = useState(null);
  const [newItem, setNewItem] = useState("");

  const today = new Date().getDay();

  const addItem = (day) => {
    if (!newItem.trim()) return;
    setRoutine(r => ({ ...r, [day]: [...(r[day] || []), { id: Date.now(), text: newItem.trim() }] }));
    setNewItem("");
  };
  const removeItem = (day, id) => setRoutine(r => ({ ...r, [day]: (r[day] || []).filter(i => i.id !== id) }));

  return (
    <div className="cyber-card rounded-2xl p-6 border border-purple-900/20">
      <div className="flex items-center gap-2 mb-5">
        <Calendar className="w-4 h-4 text-amber-400" style={{ filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.8))' }} />
        <p className="font-cyber text-xs tracking-[0.3em] uppercase text-amber-400">Rotina Semanal</p>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {WEEK_DAYS.map((d, i) => (
          <button key={i} onClick={() => setEditDay(editDay === i ? null : i)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
            style={{
              background: editDay === i ? 'rgba(245,158,11,0.18)' : i === today ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.02)',
              border: editDay === i ? '1px solid rgba(245,158,11,0.5)' : i === today ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}>
            <span className="text-[9px] font-mono-cyber" style={{ color: editDay === i ? '#fbbf24' : i === today ? '#d8b4fe' : 'rgba(168,85,247,0.4)' }}>{d}</span>
            {(routine[i] || []).length > 0 && (
              <div className="w-1 h-1 rounded-full" style={{ background: i === today ? '#a855f7' : '#f59e0b', boxShadow: `0 0 4px ${i === today ? '#a855f7' : '#f59e0b'}` }} />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {editDay !== null && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden">
            <p className="text-[10px] font-mono-cyber text-amber-400/70 tracking-widest">{WEEK_DAYS[editDay].toUpperCase()}</p>
            <div className="flex gap-2">
              <Input value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem(editDay)}
                placeholder="Atividade do dia..." className="cyber-input flex-1 text-sm" />
              <button onClick={() => addItem(editDay)} className="px-3 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {(routine[editDay] || []).map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 group">
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#f59e0b', boxShadow: '0 0 4px #f59e0b' }} />
                  <span className="flex-1 text-sm text-white/80">{item.text}</span>
                  <button onClick={() => removeItem(editDay, item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-500/30 hover:text-pink-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(routine[editDay] || []).length === 0 && (
                <p className="text-[10px] text-purple-500/25 font-mono-cyber text-center py-2">// nenhuma atividade</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Wellbeing Check ─────────────────────────────────────────────────────────
function WellbeingCheck() {
  const todayKey = new Date().toISOString().split("T")[0];
  const [answers, setAnswers] = useLocalStorage(`bz_wellbeing_${todayKey}`, {});
  const [showResult, setShowResult] = useState(false);

  const questions = [
    { key: "sleep", label: "Como foi seu sono?", icon: "😴" },
    { key: "energy", label: "Seu nível de energia hoje?", icon: "⚡" },
    { key: "focus", label: "Consegue se concentrar?", icon: "🎯" },
    { key: "mood", label: "Qual seu humor geral?", icon: "😊" },
    { key: "body", label: "Como está se sentindo fisicamente?", icon: "💪" },
  ];

  const options = ["Muito ruim", "Ruim", "Regular", "Bom", "Ótimo"];
  const filled = Object.keys(answers).length;
  const avg = filled ? Object.values(answers).reduce((a, b) => a + b, 0) / filled : 0;

  return (
    <div className="cyber-card rounded-2xl p-6 border border-purple-900/20">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-4 h-4 text-pink-400" style={{ filter: 'drop-shadow(0 0 5px rgba(236,72,153,0.8))' }} />
        <p className="font-cyber text-xs tracking-[0.3em] uppercase text-pink-400">Check de Bem-estar</p>
      </div>
      <p className="text-[9px] text-purple-500/30 font-mono-cyber mb-4">// autoconhecimento · não é diagnóstico médico</p>

      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.key}>
            <p className="text-sm text-white/80 mb-2">{q.icon} {q.label}</p>
            <div className="flex gap-1.5">
              {options.map((opt, i) => (
                <button key={i} onClick={() => setAnswers(a => ({ ...a, [q.key]: i + 1 }))}
                  className="flex-1 py-1.5 rounded-lg text-[9px] font-mono-cyber transition-all"
                  style={answers[q.key] === i + 1
                    ? { background: 'rgba(236,72,153,0.2)', border: '1px solid rgba(236,72,153,0.5)', color: '#fb7185' }
                    : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(168,85,247,0.4)' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filled === questions.length && (
        <div className="mt-4 p-4 rounded-xl border border-pink-500/20 bg-pink-500/5">
          <p className="text-[9px] font-mono-cyber text-pink-400/60 tracking-widest mb-1">RESULTADO DE HOJE</p>
          <p className="text-lg font-cyber" style={{ color: avg >= 4 ? '#10b981' : avg >= 3 ? '#f59e0b' : '#ec4899' }}>
            {avg >= 4 ? "Ótimo dia! 🚀" : avg >= 3 ? "Dia equilibrado ⚖️" : "Cuide-se hoje 💙"}
          </p>
          <p className="text-[9px] text-purple-500/30 font-mono-cyber mt-1">
            Média: {avg.toFixed(1)}/5 · Estas respostas são apenas para seu autoconhecimento
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "pomodoro", label: "Pomodoro", icon: Timer, color: "#a855f7" },
  { key: "checklist", label: "Checklist", icon: CheckSquare, color: "#06b6d4" },
  { key: "routine", label: "Rotina", icon: Calendar, color: "#f59e0b" },
  { key: "wellbeing", label: "Bem-estar", icon: Brain, color: "#ec4899" },
];

export default function FocusRoutine() {
  const [activeTab, setActiveTab] = useState("pomodoro");
  const tab = TABS.find(t => t.key === activeTab);

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8 relative">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }} />
        <div className="py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, #a855f7, #06b6d4)', borderRadius: '2px', boxShadow: '0 0 12px rgba(168,85,247,0.6)' }} />
            <h1 className="text-3xl font-black font-cyber tracking-wider"
              style={{ color: '#ffffff', textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
              FOCO & ROTINA
            </h1>
          </div>
          <div className="flex items-center gap-2" style={{ paddingLeft: '14px' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} />
            <p className="text-sm font-mono-cyber" style={{ color: 'rgba(168,85,247,0.8)' }}>
              // produtividade · bem-estar · rotina
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(6,182,212,0.8), transparent)' }} />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono-cyber tracking-wider transition-all"
            style={activeTab === t.key
              ? { background: `${t.color}20`, border: `1px solid ${t.color}60`, color: '#fff', boxShadow: `0 0 14px ${t.color}25` }
              : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.5)' }}>
            <t.icon className="w-3.5 h-3.5" style={activeTab === t.key ? { filter: `drop-shadow(0 0 5px ${t.color})` } : {}} />
            {t.label}
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} key={activeTab}>
        {activeTab === "pomodoro" && <PomodoroSection />}
        {activeTab === "checklist" && <DailyChecklist />}
        {activeTab === "routine" && <WeeklyRoutine />}
        {activeTab === "wellbeing" && <WellbeingCheck />}
      </motion.div>
    </motion.div>
  );
}