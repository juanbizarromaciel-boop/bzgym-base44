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
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-bold text-emerald-400">{payload[0].value}kg</p>
        {payload[0].payload.exercicio && (
          <p className="text-xs text-gray-500">{payload[0].payload.exercicio}</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Evolução" subtitle="Acompanhe o progresso de carga dos alunos" />

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Select value={selectedStudentId} onValueChange={(v) => { setSelectedStudentId(v); setSelectedExercise("all"); }}>
          <SelectTrigger className="w-full sm:w-64 bg-gray-900/60 border-gray-800 text-white">
            <SelectValue placeholder="Selecione o aluno" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-white hover:bg-gray-700">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedStudentId && (
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-full sm:w-64 bg-gray-900/60 border-gray-800 text-white">
              <SelectValue placeholder="Filtrar por exercício" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">Todos os exercícios</SelectItem>
              {exerciseNames.map((name) => (
                <SelectItem key={name} value={name} className="text-white hover:bg-gray-700">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedStudentId && chartData.length > 0 && (
        <>
          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                trend.type === "up" ? "bg-emerald-500/15" : trend.type === "down" ? "bg-red-500/15" : "bg-gray-700"
              }`}>
                {trend.type === "up" && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                {trend.type === "down" && <TrendingDown className="w-5 h-5 text-red-400" />}
                {trend.type === "same" && <Minus className="w-5 h-5 text-gray-400" />}
              </div>
              <div>
                <p className="text-sm text-gray-400">Variação de carga</p>
                <p className={`text-xl font-bold ${
                  trend.type === "up" ? "text-emerald-400" : trend.type === "down" ? "text-red-400" : "text-gray-400"
                }`}>
                  {trend.type === "up" ? "+" : trend.type === "down" ? "-" : ""}{trend.value}%
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Evolução de Carga (kg)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCarga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="carga"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="url(#colorCarga)"
                    dot={{ fill: "#10B981", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "#10B981", stroke: "#064E3B", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Log History */}
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Histórico</h3>
            <div className="space-y-2">
              {studentLogs.slice().reverse().slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between bg-gray-800/40 rounded-xl px-4 py-3 border border-gray-700/30">
                  <div>
                    <p className="text-sm font-medium text-white">{log.exercise_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{log.date}</span>
                      {log.technique_used && log.technique_used !== "normal" && (
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs">
                          {log.technique_used.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{log.max_load_kg || 0}kg</p>
                    {log.sets_completed && (
                      <p className="text-xs text-gray-500">
                        {log.sets_completed.length} séries
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedStudentId && chartData.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p>Nenhum registro encontrado para este aluno.</p>
        </div>
      )}

      {!selectedStudentId && (
        <div className="text-center py-16 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Selecione um aluno para ver a evolução.</p>
        </div>
      )}
    </div>
  );
}