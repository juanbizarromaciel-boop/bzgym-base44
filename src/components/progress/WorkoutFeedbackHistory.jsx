import React from "react";
import { MessageSquareText } from "lucide-react";

export default function WorkoutFeedbackHistory({ logs }) {
  const feedbackLogs = logs
    .filter(log => log.notes?.trim() || log.workout_notes?.trim())
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!feedbackLogs.length) return null;

  const workoutComments = [...new Map(
    feedbackLogs.filter(log => log.workout_notes?.trim()).map(log => [`${log.date}:${log.workout_plan_id}`, log])
  ).values()];

  return (
    <section className="cyber-card mb-6 rounded-xl border border-purple-900/20 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300">
        <MessageSquareText className="h-4 w-4" /> Pareceres do aluno
      </h2>
      <div className="space-y-3">
        {workoutComments.map(log => (
          <div key={`${log.date}:${log.workout_plan_id}`} className="rounded-lg border border-purple-500/15 bg-purple-500/5 p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-purple-400/50">Treino · {new Date(`${log.date}T12:00:00`).toLocaleDateString("pt-BR")}</p>
            <p className="break-words text-sm text-purple-100/80">{log.workout_notes}</p>
          </div>
        ))}
        {feedbackLogs.filter(log => log.notes?.trim()).map(log => (
          <div key={log.id} className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-cyan-400/60">{log.exercise_name} · {new Date(`${log.date}T12:00:00`).toLocaleDateString("pt-BR")}</p>
            <p className="break-words text-sm text-purple-100/80">{log.notes}</p>
          </div>
        ))}
      </div>
    </section>
  );
}