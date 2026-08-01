import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Dumbbell, MessageCircle, CheckCircle, UserPlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const STORAGE_KEY = "bz_dismissed_notifications";

function loadDismissed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { students: [], logs: [], plansDismissedAt: null };
  } catch {
    return { students: [], logs: [], plansDismissedAt: null };
  }
}

function saveDismissed(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function NotificationBell() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [dismissed, setDismissed] = useState(loadDismissed);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const updateDismissed = useCallback((updater) => {
    setDismissed(prev => {
      const next = updater(prev);
      saveDismissed(next);
      return next;
    });
  }, []);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== "admin") {
        base44.entities.Student.list().then(students => {
          const found = students.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
          setStudent(found);
        });
      }
    }).catch(() => {});
  }, []);

  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    refetchInterval: 30000,
    retry: 1
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => base44.entities.WorkoutPlan.list(),
    enabled: !!student,
    refetchInterval: 30000,
    retry: 1
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 100),
    refetchInterval: 15000,
    retry: 1
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.WorkoutLog.list("-created_date", 50),
    enabled: user?.role === "admin",
    refetchInterval: 30000,
    retry: 1
  });

  const activateStudentMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] })
  });

  const markMessageReadMut = useMutation({
    mutationFn: async (msgIds) => {
      await Promise.all(msgIds.map(id => base44.entities.ChatMessage.update(id, { read: true })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] })
  });

  const deleteLogMut = useMutation({
    mutationFn: async (logIds) => {
      // Just dismiss locally — logs belong to students, admin only dismisses from view
      // We store dismissed IDs in localStorage so they never come back
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] })
  });

  // --- Computed notifications ---
  const dismissedStudentSet = new Set(dismissed.students);
  const dismissedLogSet = new Set(dismissed.logs);

  const pendingStudents = user?.role === "admin"
    ? allStudents.filter(s => s.active === false && !dismissedStudentSet.has(s.id))
    : [];

  const myPlans = student ? plans.filter(p => p.student_id === student.id) : [];
  const newPlansCount = dismissed.plansDismissedAt
    ? myPlans.filter(p => new Date(p.created_date) > new Date(dismissed.plansDismissedAt)).length
    : myPlans.filter(p => {
        const createdDate = new Date(p.created_date);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return createdDate > oneDayAgo;
      }).length;

  const personalStudentIds = new Set(allStudents.filter(s => s.personal_id === user?.email).flatMap(s => [s.id, s.email].filter(Boolean)));
  const unreadMessages = messages.filter(m => {
    if (user?.role === "admin") return !m.read && !m.is_trainer;
    if (user?.role === "personal") return !m.read && !m.is_trainer && personalStudentIds.has(m.student_id);
    return !m.read && m.is_trainer && m.student_id === student?.id;
  });

  const recentLogs = user?.role === "admin" ? logs.filter(log => {
    const logDate = new Date(log.created_date);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return logDate > oneHourAgo && !dismissedLogSet.has(log.id);
  }) : [];

  const totalNotifications = newPlansCount + unreadMessages.length + pendingStudents.length + recentLogs.length;

  // --- Actions ---
  const dismissStudent = (id) => {
    updateDismissed(prev => ({ ...prev, students: [...prev.students, id] }));
  };

  const dismissLog = (id) => {
    updateDismissed(prev => ({ ...prev, logs: [...prev.logs, id] }));
  };

  const dismissPlans = () => {
    updateDismissed(prev => ({ ...prev, plansDismissedAt: new Date().toISOString() }));
  };

  const dismissMessage = (msgId) => {
    markMessageReadMut.mutate([msgId]);
  };

  const clearAllNotifications = () => {
    updateDismissed(prev => ({
      students: [...prev.students, ...pendingStudents.map(s => s.id)],
      logs: [...prev.logs, ...recentLogs.map(l => l.id)],
      plansDismissedAt: new Date().toISOString(),
    }));
    const msgIds = unreadMessages.map(m => m.id);
    if (msgIds.length > 0) markMessageReadMut.mutate(msgIds);
    toast.success("Notificações limpas");
  };

  const handleMarkMessageRead = (msg) => {
    if (!msg.read) markMessageReadMut.mutate([msg.id]);
  };

  const handleNavigateToChat = () => { setIsOpen(false); navigate("/Chat"); };
  const handleNavigateToWorkout = () => { setIsOpen(false); navigate("/MyWorkout"); };
  const handleActivateStudent = (studentData) => {
    activateStudentMut.mutate({ id: studentData.id, data: { ...studentData, active: true } });
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-purple-500/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-purple-400" />
        {totalNotifications > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 border-2 border-black flex items-center justify-center text-[10px] font-bold text-white"
            style={{ boxShadow: '0 0 10px rgba(236,72,153,0.8)' }}
          >
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsOpen(false)} />
          <div
            className="fixed top-16 right-2 sm:right-4 lg:right-8 z-50 w-[calc(100vw-16px)] sm:w-96 max-h-[calc(100vh-80px)] overflow-hidden rounded-xl border border-purple-500/30 shadow-2xl"
            style={{ background: '#04040e', boxShadow: '0 0 40px rgba(168,85,247,0.2)' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-purple-900/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <h3 className="font-cyber text-sm text-white tracking-wider">NOTIFICAÇÕES</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-purple-500/10 transition-colors">
                  <X className="w-4 h-4 text-purple-500/50" />
                </button>
              </div>
              {totalNotifications > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors text-purple-400 text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Todas
                </button>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(100vh-180px)] p-2">
              {totalNotifications === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-purple-500/20" />
                  <p className="text-xs font-mono-cyber text-purple-500/40">// sem notificações</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Pending students */}
                  {pendingStudents.map(pendingStudent => (
                    <div key={pendingStudent.id} className="p-3 rounded-lg border border-pink-500/30 bg-pink-500/10">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                          <UserPlus className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white mb-1">Novo aluno cadastrado</p>
                            <button onClick={() => dismissStudent(pendingStudent.id)} className="p-0.5 rounded hover:bg-pink-500/20 transition-colors flex-shrink-0">
                              <X className="w-3.5 h-3.5 text-pink-400/60 hover:text-pink-300" />
                            </button>
                          </div>
                          <p className="text-xs text-purple-400/60 mb-2">{pendingStudent.name}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px]">
                              {pendingStudent.goal}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => handleActivateStudent(pendingStudent)}
                            disabled={activateStudentMut.isPending}
                            size="sm"
                            className="w-full mt-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 text-xs"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativar Aluno
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* New workout plans */}
                  {newPlansCount > 0 && (
                    <div className="relative p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                      <button onClick={dismissPlans} className="absolute top-2 right-2 p-0.5 rounded hover:bg-cyan-500/20 transition-colors">
                        <X className="w-3.5 h-3.5 text-cyan-400/60 hover:text-cyan-300" />
                      </button>
                      <button onClick={handleNavigateToWorkout} className="w-full text-left">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                            <Dumbbell className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-white mb-1">
                              {newPlansCount} novo{newPlansCount > 1 ? 's' : ''} treino{newPlansCount > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-purple-400/60">Seu personal montou treino{newPlansCount > 1 ? 's' : ''} para você!</p>
                            <p className="text-[10px] text-cyan-400/50 font-mono-cyber mt-1">Toque para ver →</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Unread messages */}
                  {unreadMessages.slice(0, 5).map(msg => (
                    <div key={msg.id} className="relative p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                      <button onClick={() => dismissMessage(msg.id)} className="absolute top-2 right-2 p-0.5 rounded hover:bg-purple-500/20 transition-colors">
                        <X className="w-3.5 h-3.5 text-purple-400/60 hover:text-purple-300" />
                      </button>
                      <button onClick={() => { handleMarkMessageRead(msg); handleNavigateToChat(); }} className="w-full text-left">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-white mb-1 truncate">{msg.sender_name || msg.sender_email}</p>
                            <p className="text-xs text-purple-400/60 line-clamp-2">{msg.message}</p>
                            <p className="text-[10px] text-purple-400/40 font-mono-cyber mt-1">
                              {new Date(msg.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}

                  {/* Recent workout logs (admin) */}
                  {user?.role === "admin" && recentLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="p-3 rounded-lg border border-pink-500/20 bg-pink-500/5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white mb-1">Treino concluído</p>
                            <button onClick={() => dismissLog(log.id)} className="p-0.5 rounded hover:bg-pink-500/20 transition-colors flex-shrink-0">
                              <X className="w-3.5 h-3.5 text-pink-400/60 hover:text-pink-300" />
                            </button>
                          </div>
                          <p className="text-xs text-purple-400/60 truncate">{log.exercise_name} • {log.max_load_kg}kg</p>
                          <p className="text-[10px] text-pink-400/40 font-mono-cyber mt-1">
                            {new Date(log.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {unreadMessages.length > 5 && (
                    <button onClick={handleNavigateToChat} className="w-full text-center py-2 text-xs font-mono-cyber text-purple-400/60 hover:text-purple-400 transition-colors">
                      + {unreadMessages.length - 5} mensagens não lidas
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}