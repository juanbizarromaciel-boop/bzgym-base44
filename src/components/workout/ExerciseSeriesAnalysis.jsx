import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Minus, Dumbbell, ChevronDown, ChevronUp, AlertTriangle, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

function calcVolume(sets) {
  if (!sets?.length) return 0;
  return sets.reduce((acc, s) => acc + ((s.reps_done || 0) * (s.load_kg || 0)), 0);
}

function getProgressionStatus(logs) {
  // Compare last two sessions by volume
  if (logs.length < 2) return { type: "new", label: "Novo", color: "#a855f7" };
  const last = calcVolume(logs[logs.length - 1].sets_completed);
  const prev = calcVolume(logs[logs.length - 2].sets_completed);
  const lastLoad = logs[logs.length - 1].max_load_kg || 0;
  const prevLoad = logs[logs.length - 2].max_load_kg || 0;

  if (last > prev || lastLoad > prevLoad) return { type: "up", label: "Progrediu", color: "#10b981" };
  if (last < prev || lastLoad < prevLoad) return { type: "down", label: "Regrediu", color: "#ec4899" };
  return { type: "same", label: "Sem progressão", color: "#f59e0b" };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#04040e] border border-purple-500/40 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-purple-400/50 font-mono-cyber mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-purple-300/70">{p.name}:</span>
          <span className="font-bold text-white">{p.name === "Volume" ? `${Math.round(p.value)} kg·r` : `${p.value} kg`}</span>
        </div>
      ))}
    </div>
  );
};

function ExerciseCard({ exerciseName, logs }) {
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState("volume"); // "volume" | "carga" | "series"

  const progression = useMemo(() => getProgressionStatus(logs), [logs]);

  const chartData = useMemo(() => {
    return logs.map(log => ({
      label: format(parseISO(log.date), "dd/MM", { locale: ptBR }),
      "Volume": Math.round(calcVolume(log.sets_completed)),
      "Carga Máx": log.max_load_kg || 0,
      "Séries": log.sets_completed?.length || 0,
    }));
  }, [logs]);

  const lastLog = logs[logs.length - 1];
  const prevLog = logs.length >= 2 ? logs[logs.length - 2] : null;
  const totalSessions = logs.length;
  const maxLoad = Math.max(...logs.map(l => l.max_load_kg || 0));
  const maxVolume = Math.max(...logs.map(l => calcVolume(l.sets_completed)));

  const progIcon = progression.type === "up"
    ? <TrendingUp className="w-3.5 h-3.5" />
    : progression.type === "down"
    ? <TrendingDown className="w-3.5 h-3.5" />
    : progression.type === "same"
    ? <AlertTriangle className="w-3.5 h-3.5" />
    : <Minus className="w-3.5 h-3.5" />;

  return (
    <div className="cyber-card rounded-xl border border-purple-900/20 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-purple-500/5 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-white truncate">{exerciseName}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] font-mono-cyber text-purple-500/40">{totalSessions} sessões</span>
              <span className="text-[10px] font-mono-cyber text-cyan-400/60">max {maxLoad}kg</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-mono-cyber"
            style={{ borderColor: `${progression.color}40`, background: `${progression.color}12`, color: progression.color }}>
            {progIcon}
            <span className="hidden sm:inline">{progression.label}</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-purple-500/40" /> : <ChevronDown className="w-4 h-4 text-purple-500/40" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-purple-900/15 p-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/30 border border-purple-900/15 rounded-lg p-2.5 text-center">
              <p className="font-cyber text-lg text-purple-300">{maxLoad}</p>
              <p className="text-[9px] font-mono-cyber text-purple-500/40 uppercase tracking-wider">Max kg</p>
            </div>
            <div className="bg-black/30 border border-purple-900/15 rounded-lg p-2.5 text-center">
              <p className="font-cyber text-lg text-cyan-300">{Math.round(maxVolume).toLocaleString()}</p>
              <p className="text-[9px] font-mono-cyber text-purple-500/40 uppercase tracking-wider">Vol Máx</p>
            </div>
            <div className="bg-black/30 border border-purple-900/15 rounded-lg p-2.5 text-center">
              <p className="font-cyber text-lg text-pink-300">{totalSessions}</p>
              <p className="text-[9px] font-mono-cyber text-purple-500/40 uppercase tracking-wider">Sessões</p>
            </div>
          </div>

          {/* No-progression alert */}
          {(progression.type === "down" || progression.type === "same") && prevLog && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border"
              style={{ borderColor: `${progression.color}35`, background: `${progression.color}0a` }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: progression.color }} />
              <div className="text-xs font-mono-cyber" style={{ color: progression.color }}>
                {progression.type === "down"
                  ? `⚠ Regressão detectada — vol. anterior: ${Math.round(calcVolume(prevLog.sets_completed))} kg·r → atual: ${Math.round(calcVolume(lastLog?.sets_completed))} kg·r`
                  : `⚡ Sem progressão no último treino — volume igual ao anterior (${Math.round(calcVolume(lastLog?.sets_completed))} kg·r)`
                }
              </div>
            </div>
          )}

          {/* View switcher */}
          <div className="flex gap-1 bg-black/30 p-1 rounded-lg w-fit">
            {[
              { id: "volume", label: "Volume" },
              { id: "carga", label: "Carga" },
              { id: "series", label: "Séries" },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono-cyber tracking-wider transition-all ${
                  view === v.id ? "bg-purple-500/20 text-purple-300 border border-purple-500/25" : "text-purple-500/40 hover:text-purple-400"
                }`}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                {view === "carga" ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`g-${exerciseName}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.12)" />
                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'rgba(168,85,247,0.4)', fontFamily: 'Share Tech Mono' }} stroke="rgba(168,85,247,0.15)" />
                    <YAxis tick={{ fontSize: 8, fill: 'rgba(168,85,247,0.4)', fontFamily: 'Share Tech Mono' }} stroke="rgba(168,85,247,0.15)" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Carga Máx" stroke="#06b6d4" strokeWidth={2} fill={`url(#g-${exerciseName})`} dot={{ fill: "#06b6d4", r: 3, strokeWidth: 0 }} />
                  </AreaChart>
                ) : view === "series" ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.12)" />
                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'rgba(168,85,247,0.4)', fontFamily: 'Share Tech Mono' }} stroke="rgba(168,85,247,0.15)" />
                    <YAxis tick={{ fontSize: 8, fill: 'rgba(168,85,247,0.4)', fontFamily: 'Share Tech Mono' }} stroke="rgba(168,85,247,0.15)" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Séries" fill="#ec4899" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`gv-${exerciseName}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.12)" />
                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'rgba(168,85,247,0.4)', fontFamily: 'Share Tech Mono' }} stroke="rgba(168,85,247,0.15)" />
                    <YAxis tick={{ fontSize: 8, fill: 'rgba(168,85,247,0.4)', fontFamily: 'Share Tech Mono' }} stroke="rgba(168,85,247,0.15)" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Volume" stroke="#a855f7" strokeWidth={2} fill={`url(#gv-${exerciseName})`} dot={{ fill: "#a855f7", r: 3, strokeWidth: 0 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Sessions history — all sets per session */}
          <div className="space-y-3">
            <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest">Histórico de Séries</p>
            {[...logs].reverse().map((log, i) => {
              const vol = calcVolume(log.sets_completed);
              const isLast = i === 0;
              const isPrev = i === 1;
              const prevVol = i > 0 ? calcVolume([...logs].reverse()[i - 1]?.sets_completed) : null;
              const volDiff = prevVol !== null ? vol - prevVol : null;

              return (
                <div key={log.id || i} className={`rounded-xl border p-3 ${isLast ? "border-purple-500/25 bg-purple-500/5" : "border-purple-900/15 bg-black/20"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-cyber text-purple-300/70">
                        {format(parseISO(log.date), "dd 'de' MMM yyyy", { locale: ptBR })}
                      </span>
                      {isLast && <Badge className="text-[8px] border border-purple-500/30 bg-purple-500/10 text-purple-300 px-1.5">ÚLTIMO</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono-cyber">
                      <span className="text-orange-400">{Math.round(vol)} kg·r</span>
                      {volDiff !== null && (
                        <span className={volDiff > 0 ? "text-green-400" : volDiff < 0 ? "text-pink-400" : "text-amber-400"}>
                          {volDiff > 0 ? `+${Math.round(volDiff)}` : volDiff < 0 ? `${Math.round(volDiff)}` : "="}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sets table */}
                  <div className="rounded-lg overflow-hidden border border-purple-900/10">
                    <div className="grid grid-cols-4 text-[9px] font-mono-cyber text-purple-500/40 uppercase tracking-wider px-3 py-1.5 bg-purple-900/10">
                      <span>Série</span>
                      <span>Reps</span>
                      <span>Carga</span>
                      <span>Vol (kg·r)</span>
                    </div>
                    {(log.sets_completed || []).map((set, si) => {
                      const setVol = (set.reps_done || 0) * (set.load_kg || 0);
                      return (
                        <div key={si} className={`grid grid-cols-4 text-xs px-3 py-2 ${si % 2 === 0 ? "bg-black/10" : ""}`}>
                          <span className="font-cyber text-purple-400/60">{set.set_number || si + 1}</span>
                          <span className="text-white font-medium">{set.reps_done || 0}</span>
                          <span className="text-cyan-300">{set.load_kg || 0} kg</span>
                          <span className="text-orange-300/70">{Math.round(setVol)}</span>
                        </div>
                      );
                    })}
                    {/* Session total */}
                    <div className="grid grid-cols-4 text-[10px] px-3 py-1.5 bg-purple-500/5 border-t border-purple-900/15 font-mono-cyber">
                      <span className="col-span-3 text-purple-500/40 uppercase tracking-wider">Total</span>
                      <span className="text-orange-400 font-bold">{Math.round(vol)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExerciseSeriesAnalysis({ studentId, allLogs }) {
  const [searchTerm, setSearchTerm] = useState("");

  const exerciseLogsMap = useMemo(() => {
    const studentLogs = allLogs.filter(l => l.student_id === studentId);
    const map = {};
    studentLogs.forEach(log => {
      if (!log.exercise_name) return;
      if (!map[log.exercise_name]) map[log.exercise_name] = [];
      map[log.exercise_name].push(log);
    });
    // Sort each list by date
    Object.keys(map).forEach(name => {
      map[name].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    return map;
  }, [allLogs, studentId]);

  // Sort exercises: worst progression first
  const sortedExercises = useMemo(() => {
    return Object.entries(exerciseLogsMap)
      .filter(([name]) => !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort(([, logsA], [, logsB]) => {
        const progOrder = { down: 0, same: 1, new: 2, up: 3 };
        const progA = getProgressionStatus(logsA).type;
        const progB = getProgressionStatus(logsB).type;
        return progOrder[progA] - progOrder[progB];
      });
  }, [exerciseLogsMap, searchTerm]);

  const stats = useMemo(() => {
    const all = Object.entries(exerciseLogsMap).map(([name, logs]) => ({ name, prog: getProgressionStatus(logs).type }));
    return {
      total: all.length,
      progressing: all.filter(e => e.prog === "up").length,
      stagnant: all.filter(e => e.prog === "same").length,
      regressing: all.filter(e => e.prog === "down").length,
    };
  }, [exerciseLogsMap]);

  if (!studentId) return (
    <div className="text-center py-16 text-purple-500/20">
      <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-mono-cyber text-sm">// selecione um aluno para ver as séries</p>
    </div>
  );

  if (sortedExercises.length === 0 && !searchTerm) return (
    <div className="text-center py-16 text-purple-500/20">
      <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-mono-cyber text-sm">// nenhum treino registrado ainda</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="cyber-card rounded-xl p-3 border border-green-500/15 text-center">
          <p className="font-cyber text-xl text-green-400">{stats.progressing}</p>
          <p className="text-[9px] font-mono-cyber text-green-500/50 uppercase tracking-wider mt-0.5">Progredindo</p>
        </div>
        <div className="cyber-card rounded-xl p-3 border border-amber-500/15 text-center">
          <p className="font-cyber text-xl text-amber-400">{stats.stagnant}</p>
          <p className="text-[9px] font-mono-cyber text-amber-500/50 uppercase tracking-wider mt-0.5">Estagnados</p>
        </div>
        <div className="cyber-card rounded-xl p-3 border border-pink-500/15 text-center">
          <p className="font-cyber text-xl text-pink-400">{stats.regressing}</p>
          <p className="text-[9px] font-mono-cyber text-pink-500/50 uppercase tracking-wider mt-0.5">Regredindo</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar exercício..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full cyber-input px-4 py-2.5 text-sm rounded-xl"
      />

      {/* Exercise list */}
      <div className="space-y-2">
        {sortedExercises.map(([name, logs]) => (
          <ExerciseCard key={name} exerciseName={name} logs={logs} />
        ))}
        {sortedExercises.length === 0 && (
          <div className="text-center py-8 text-purple-500/30 font-mono-cyber text-sm">
            // nenhum exercício encontrado
          </div>
        )}
      </div>
    </div>
  );
}