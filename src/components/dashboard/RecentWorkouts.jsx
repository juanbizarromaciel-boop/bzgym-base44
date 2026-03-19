import React, { useMemo } from "react";
import { Zap, User } from "lucide-react";

export default function RecentWorkouts({ logs, plans, students }) {
  // Group logs by student_id + workout_plan_id + date
  const sessions = useMemo(() => {
    const map = {};

    logs.forEach((log) => {
      const key = `${log.student_id}__${log.workout_plan_id || "sem_plano"}__${log.date}`;
      if (!map[key]) {
        map[key] = {
          key,
          student_id: log.student_id,
          workout_plan_id: log.workout_plan_id,
          date: log.date,
          created_date: log.created_date,
          exercise_count: 0,
        };
      }
      map[key].exercise_count += 1;
    });

    return Object.values(map)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10);
  }, [logs]);

  const getStudent = (id) => students.find((s) => s.id === id);
  const getPlan = (id) => plans.find((p) => p.id === id);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const dayOfWeekLabel = {
    segunda: "SEG",
    terca: "TER",
    quarta: "QUA",
    quinta: "QUI",
    sexta: "SEX",
    sabado: "SAB",
    domingo: "DOM",
  };

  return (
    <div className="cyber-card rounded-xl p-6 border border-purple-900/20">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-4 h-4 text-purple-400" />
        <h2 className="font-cyber text-sm tracking-widest text-purple-300 uppercase">
          Últimos Treinos Realizados
        </h2>
      </div>

      {sessions.length === 0 ? (
        <p className="text-purple-500/40 text-sm font-mono-cyber">
          // nenhum treino registrado
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const student = getStudent(session.student_id);
            const plan = getPlan(session.workout_plan_id);

            return (
              <div
                key={session.key}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-black/40 border border-purple-900/20 hover:border-purple-500/20 transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 shadow-[0_0_6px_rgba(168,85,247,1)]" />
                  <div className="flex-1 min-w-0">
                    {/* Workout plan name */}
                    <p className="text-sm font-medium text-white truncate">
                      {plan ? plan.name : "Treino livre"}
                      {plan?.day_of_week && (
                        <span className="ml-2 text-[10px] font-cyber text-purple-400/60 border border-purple-500/20 rounded px-1 py-0.5">
                          {dayOfWeekLabel[plan.day_of_week] || plan.day_of_week}
                        </span>
                      )}
                    </p>
                    {/* Student name */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-cyan-400/60 flex-shrink-0" />
                      <p className="text-xs text-cyan-400/70 truncate">
                        {student ? student.name : "Aluno desconhecido"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                  <span className="font-mono-cyber text-xs text-purple-400/60">
                    {formatDate(session.date)}
                  </span>
                  <span className="text-[10px] text-purple-500/40 font-mono-cyber">
                    {session.exercise_count} exerc.
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}