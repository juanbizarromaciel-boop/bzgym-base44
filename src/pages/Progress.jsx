import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

export default function Progress() {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("all");

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: logs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => base44.entities.WorkoutLog.list() });

  const studentLogs = useMemo(() => {
    let filtered = logs.filter((l) => l.student_id === selectedStudentId);
    if (selectedExercise !== "all") {
      filtered = filtered.filter((l) => l.exercise_name === selectedExercise);
    }
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [logs, selectedStudentId, selectedExercise]);

  const exerciseNames = useMemo(() => {
    const names = new Set(logs.filter((l) => l.student_id === selectedStudentId).map((l) => l.exercise_name));
    return [...names].filter(Boolean);
  }, [logs, selectedStudentId]);

  const chartData = useMemo(() => {
    return studentLogs.map((log) => ({
      date: log.date,
      carga: log.max_load_kg || 0,
      exercicio: log.exercise_name,
    }));
  }, [studentLogs]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].carga;
    const last = chartData[chartData.length - 1].carga;
    if (last > first) return { type: "up", value: ((last - first) / (first || 1) * 100).toFixed(1) };
    if (last < first) return { type: "down", value: ((first - last) / (first || 1) * 100).toFixed(1) };
    return { type: "same", value: "0" };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="border rounded-xl px-4 py-3 shadow-xl" style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.4)', boxShadow: '0 0 20px rgba(168,85,247,0.15)'}}>
        <p className="text-xs text-purple-400/50 font-mono-cyber mb-1">{label}</p>
        <p className="font-cyber text-lg text-purple-300" style={{textShadow: '0 0 8px rgba(168,85,247,0.6)'}}>{payload[0].value}kg</p>
        {payload[0].payload.exercicio && (
          <p className="text-xs text-purple-400/40 mt-1">{payload[0].payload.exercicio}</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Evolução" subtitle="Acompanhe o progresso de carga dos alunos" />

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Select value={selectedStudentId} onValueChange={(v) => { setSelectedStudentId(v); setSelectedExercise("all"); }}>
          <SelectTrigger className="w-full sm:w-64 cyber-input">
            <SelectValue placeholder="Selecione o aluno" />
          </SelectTrigger>
          <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedStudentId && (
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-full sm:w-64 cyber-input">
              <SelectValue placeholder="Filtrar por exercício" />
            </SelectTrigger>
            <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
              <SelectItem value="all" className="text-white">Todos os exercícios</SelectItem>
              {exerciseNames.map((name) => (
                <SelectItem key={name} value={name} className="text-white">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedStudentId && chartData.length > 0 && (
        <>
          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-4 mb-6 cyber-card rounded-xl p-4 border border-purple-900/20">
              <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${
                trend.type === "up" ? "bg-cyan-500/10 border-cyan-500/30" : trend.type === "down" ? "bg-pink-500/10 border-pink-500/30" : "bg-purple-500/10 border-purple-500/20"
              }`}>
                {trend.type === "up" && <TrendingUp className="w-5 h-5 text-cyan-400" />}
                {trend.type === "down" && <TrendingDown className="w-5 h-5 text-pink-400" />}
                {trend.type === "same" && <Minus className="w-5 h-5 text-purple-400" />}
              </div>
              <div>
                <p className="text-xs text-purple-400/40 tracking-wider font-mono-cyber uppercase">Variação de carga</p>
                <p className={`text-2xl font-bold font-cyber ${
                  trend.type === "up" ? "text-cyan-400" : trend.type === "down" ? "text-pink-400" : "text-purple-400"
                }`} style={{textShadow: trend.type === "up" ? '0 0 10px rgba(6,182,212,0.5)' : ''}}>
                  {trend.type === "up" ? "+" : trend.type === "down" ? "-" : ""}{trend.value}%
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="cyber-card rounded-xl p-6 border border-purple-900/20">
            <p className="font-cyber text-xs tracking-[0.2em] text-purple-400/60 uppercase mb-4">Evolução de Carga (kg)</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCarga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(88,28,135,0.15)" />
                  <XAxis dataKey="date" stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 10, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                  <YAxis stroke="rgba(168,85,247,0.3)" tick={{ fontSize: 10, fill: 'rgba(168,85,247,0.5)', fontFamily: 'Share Tech Mono' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="carga"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#colorCarga)"
                    dot={{ fill: "#a855f7", strokeWidth: 0, r: 4, filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}
                    activeDot={{ r: 6, fill: "#c084fc", stroke: "#000", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Log History */}
          <div className="cyber-card rounded-xl p-6 border border-purple-900/20 mt-4">
            <p className="font-cyber text-xs tracking-[0.2em] text-purple-400/60 uppercase mb-4">Histórico</p>
            <div className="space-y-2">
              {studentLogs.slice().reverse().slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-black/40 border border-purple-900/20 hover:border-purple-500/20 transition-all">
                  <div>
                    <p className="text-sm font-medium text-white">{log.exercise_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-purple-500/40 font-mono-cyber">{log.date}</span>
                      {log.technique_used && log.technique_used !== "normal" && (
                        <Badge className="bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs">
                          {log.technique_used.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-cyber text-xl text-purple-300" style={{textShadow: '0 0 8px rgba(168,85,247,0.5)'}}>{log.max_load_kg || 0}kg</p>
                    {log.sets_completed && (
                      <p className="text-xs text-purple-500/40 font-mono-cyber">{log.sets_completed.length} séries</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedStudentId && chartData.length === 0 && (
        <div className="text-center py-16 text-purple-500/30">
          <p className="font-mono-cyber text-sm">// nenhum registro encontrado</p>
        </div>
      )}

      {!selectedStudentId && (
        <div className="text-center py-16 text-purple-500/20">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" style={{filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.4))'}} />
          <p className="font-mono-cyber text-sm">// selecione um aluno para ver a evolução</p>
        </div>
      )}
    </div>
  );
}