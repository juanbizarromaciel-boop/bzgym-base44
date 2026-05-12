import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [isTrainer, setIsTrainer] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setIsTrainer(u.role === "admin");
    }).catch(() => {});
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    enabled: isTrainer
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 500),
    refetchInterval: 3000
  });

  const sendMut = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      setMessage("");
    }
  });

  // Find student for current user
  const myStudent = !isTrainer && user ? students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase()) : null;
  const activeStudentId = isTrainer ? selectedStudentId : myStudent?.id;

  const messages = allMessages
    .filter(m => m.student_id === activeStudentId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const unreadCount = allMessages.filter(m => !m.read && m.sender_email !== user?.email).length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !activeStudentId) return;

    sendMut.mutate({
      student_id: activeStudentId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      message: message.trim(),
      is_trainer: isTrainer,
      read: false
    });
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Chat"
        accentColor="#06b6d4"
        subtitle={isTrainer ? "Converse com seus alunos" : "Fale com seu personal trainer"}
        action={unreadCount > 0 && (
          <Badge className="bg-pink-500/20 border border-pink-500/30 text-pink-300">
            {unreadCount} nova{unreadCount > 1 ? "s" : ""}
          </Badge>
        )}
      />

      {/* Student selector for trainer */}
      {isTrainer && (
        <div className="mb-6">
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-full sm:w-80 cyber-input">
              <SelectValue placeholder="Selecione um aluno" />
            </SelectTrigger>
            <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
              {students.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-white">
                  {s.name}
                  {allMessages.filter(m => m.student_id === s.id && !m.read && m.sender_email !== user.email).length > 0 && (
                    <span className="ml-2 text-pink-400">●</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Chat area */}
      {activeStudentId ? (
        <div className="cyber-card rounded-2xl border border-purple-900/20 overflow-hidden flex flex-col" style={{height: 'calc(100vh - 280px)', minHeight: '500px'}}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-purple-500/30">
                <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-mono-cyber text-sm">// nenhuma mensagem ainda</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMine = msg.sender_email === user.email;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] md:max-w-[60%] ${isMine ? "order-2" : "order-1"}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <User className="w-3 h-3 text-purple-500/40" />
                        <span className="text-[10px] text-purple-500/40 font-mono-cyber">
                          {msg.sender_name || msg.sender_email}
                        </span>
                        <span className="text-[9px] text-purple-500/25 font-mono-cyber">
                          {new Date(msg.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isMine
                            ? "bg-purple-500/15 border border-purple-500/25 text-white"
                            : "bg-black/40 border border-purple-900/30 text-purple-100"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-purple-900/30 p-4 bg-black/20">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="cyber-input flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMut.isPending}
                className="btn-neon-purple px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cyber-card rounded-2xl p-16 border border-purple-900/20 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-purple-500/20" />
          <p className="font-mono-cyber text-sm text-purple-500/30">
            {isTrainer ? "// selecione um aluno para iniciar" : "// perfil não encontrado"}
          </p>
        </div>
      )}
    </div>
  );
}