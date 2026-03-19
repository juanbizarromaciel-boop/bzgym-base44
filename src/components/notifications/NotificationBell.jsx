import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Dumbbell, MessageCircle, CheckCircle, UserPlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NotificationBell() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [dismissedStudents, setDismissedStudents] = useState(new Set());
  const [dismissedLogs, setDismissedLogs] = useState(new Set());
  const [dismissedPlans, setDismissedPlans] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

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

  const updateMessageMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChatMessage.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] })
  });

  const activateStudentMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    }
  });

  const markMessageReadMut = useMutation({
    mutationFn: async (msgIds) => {
      await Promise.all(msgIds.map(id => base44.entities.ChatMessage.update(id, { read: true })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] })
  });

  const dismissMessage = (msgId) => {
    markMessageReadMut.mutate([msgId]);
  };

  const clearAllNotifications = () => {
    // Dismiss all pending students
    setDismissedStudents(new Set(pendingStudents.map(s => s.id)));
    // Dismiss all logs
    setDismissedLogs(new Set(recentLogs.map(l => l.id)));
    // Dismiss plans
    setDismissedPlans(true);
    // Mark all messages as read
    const msgIds = unreadMessages.map(m => m.id);
    if (msgIds.length > 0) markMessageReadMut.mutate(msgIds);
    toast.success("Notificações limpas");
  };

  // Admin notifications - pending students
  const pendingStudents = user?.role === "admin" ? allStudents.filter(s => s.active === false && !dismissedStudents.has(s.id)) : [];

  // Student notifications
  const myPlans = student ? plans.filter(p => p.student_id === student.id) : [];
  const newPlansCount = dismissedPlans ? 0 : myPlans.filter(p => {
    const createdDate = new Date(p.created_date);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return createdDate > oneDayAgo;
  }).length;

  const unreadMessages = messages.filter(m => {
    if (user?.role === "admin") {
      return !m.read && !m.is_trainer;
    } else {
      return !m.read && m.is_trainer && m.student_id === student?.id;
    }
  });

  // Admin notifications
  const recentLogs = user?.role === "admin" ? logs.filter(log => {
    const logDate = new Date(log.created_date);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return logDate > oneHourAgo && !dismissedLogs.has(log.id);
  }) : [];

  const totalNotifications = newPlansCount + unreadMessages.length + pendingStudents.length + (user?.role === "admin" ? recentLogs.length : 0);

  const handleMarkMessageRead = (msg) => {
    if (!msg.read) {
      updateMessageMut.mutate({
        id: msg.id,
        data: { ...msg, read: true }
      });
    }
  };

  const handleNavigateToChat = () => {
    setIsOpen(false);
    navigate("/Chat");
  };

  const handleNavigateToWorkout = () => {
    setIsOpen(false);
    navigate("/MyWorkout");
  };

  const handleActivateStudent = (studentData) => {
    activateStudentMut.mutate({
      id: studentData.id,
      data: { ...studentData, active: true }
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Bell Button */}
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

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
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
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-purple-500/10 transition-colors"
                >
                  <X className="w-4 h-4 text-purple-500/50" />
                </button>
              </div>
              {totalNotifications > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 active:bg-purple-500/15 transition-colors text-purple-400 text-xs font-medium"
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
                  {/* Pending students (admin only) */}
                  {pendingStudents.map(pendingStudent => (
                    <div
                      key={pendingStudent.id}
                      className="p-3 rounded-lg border border-pink-500/30 bg-pink-500/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                          <UserPlus className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white mb-1">
                              Novo aluno cadastrado
                            </p>
                            <button
                              onClick={() => setDismissedStudents(prev => new Set([...prev, pendingStudent.id]))}
                              className="p-0.5 rounded hover:bg-pink-500/20 transition-colors flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5 text-pink-400/60 hover:text-pink-300" />
                            </button>
                          </div>
                          <p className="text-xs text-purple-400/60 mb-2">
                            {pendingStudent.name}
                          </p>
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

                  {/* New workout plans (students only) */}
                  {newPlansCount > 0 && (
                    <button
                      onClick={handleNavigateToWorkout}
                      className="w-full text-left p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white mb-1">
                            {newPlansCount} novo{newPlansCount > 1 ? 's' : ''} treino{newPlansCount > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-purple-400/60">
                            Seu personal montou treino{newPlansCount > 1 ? 's' : ''} para você!
                          </p>
                          <p className="text-[10px] text-cyan-400/50 font-mono-cyber mt-1">
                            Toque para ver →
                          </p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Unread messages */}
                  {unreadMessages.slice(0, 5).map(msg => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        handleMarkMessageRead(msg);
                        handleNavigateToChat();
                      }}
                      className="w-full text-left p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white mb-1 truncate">
                            {msg.sender_name || msg.sender_email}
                          </p>
                          <p className="text-xs text-purple-400/60 line-clamp-2">
                            {msg.message}
                          </p>
                          <p className="text-[10px] text-purple-400/40 font-mono-cyber mt-1">
                            {new Date(msg.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Recent workout logs (admin only) */}
                  {user?.role === "admin" && recentLogs.slice(0, 5).map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-pink-500/20 bg-pink-500/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white mb-1">
                            Treino concluído
                          </p>
                          <p className="text-xs text-purple-400/60 truncate">
                            {log.exercise_name} • {log.max_load_kg}kg
                          </p>
                          <p className="text-[10px] text-pink-400/40 font-mono-cyber mt-1">
                            {new Date(log.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {unreadMessages.length > 5 && (
                    <button
                      onClick={handleNavigateToChat}
                      className="w-full text-center py-2 text-xs font-mono-cyber text-purple-400/60 hover:text-purple-400 transition-colors"
                    >
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