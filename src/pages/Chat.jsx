import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Image, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== "admin" && u.role !== "personal") {
        base44.entities.Student.list().then(all => {
          const found = all.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
          setStudent(found || null);
          if (found) setSelectedStudentId(found.id);
        });
      }
    }).catch(() => {});
  }, []);

  const isTrainer = user?.role === "admin" || user?.role === "personal";

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    enabled: isTrainer,
  });

  const activeStudentId = isTrainer ? selectedStudentId : student?.id;

  const { data: messages = [] } = useQuery({
    queryKey: ["chat_messages", activeStudentId],
    queryFn: () => base44.entities.ChatMessage.filter({ student_id: activeStudentId }, "created_date", 200),
    enabled: !!activeStudentId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMut = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat_messages", activeStudentId] });
      setMessage("");
      setImageFile(null);
      setImagePreview(null);
    },
    onError: () => toast.error("Erro ao enviar mensagem"),
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    if (!message.trim() && !imageFile) return;
    if (!activeStudentId) return;

    let imageUrl = null;
    if (imageFile) {
      setUploading(true);
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = res.file_url;
      setUploading(false);
    }

    sendMut.mutate({
      student_id: activeStudentId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      message: message.trim(),
      image_url: imageUrl || undefined,
      is_trainer: isTrainer,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Trainer: show student list if no student selected
  if (isTrainer && !selectedStudentId) {
    const activeStudents = students.filter(s => s.active !== false);
    return (
      <div className="space-y-5">
        {/* Custom Cyber Header */}
        <div className="mb-6 relative">
          {/* Top decorative line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent)' }} />
          
          {/* Main header content */}
          <div className="py-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, #06b6d4, #a855f7)', borderRadius: '2px', boxShadow: '0 0 12px rgba(6,182,212,0.6)' }} />
              <h1 className="text-3xl font-black font-cyber tracking-wider" style={{ color: '#ffffff', textShadow: '0 0 20px rgba(6,182,212,0.5), 0 0 40px rgba(168,85,247,0.3)' }}>
                CHAT
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ paddingLeft: '14px' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#06b6d4', boxShadow: '0 0 8px #06b6d4, 0 0 16px rgba(6,182,212,0.6)' }} />
              <p className="text-sm font-mono-cyber tracking-wide" style={{ color: 'rgba(6,182,212,0.8)', textShadow: '0 0 10px rgba(6,182,212,0.5)' }}>
                Mensagens com alunos
              </p>
            </div>
          </div>

          {/* Bottom decorative line */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(168,85,247,0.8), rgba(6,182,212,0.6), transparent)' }} />
        </div>
        <div className="space-y-2">
          {activeStudents.length === 0 && (
            <p className="text-purple-500/30 font-mono-cyber text-sm text-center py-16">// nenhum aluno ativo</p>
          )}
          {activeStudents.map(s => (
            <button key={s.id} onClick={() => setSelectedStudentId(s.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-900/20 bg-black/30 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{s.name?.substring(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{s.name}</p>
                <p className="text-purple-500/40 text-xs font-mono-cyber">{s.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedStudentName = isTrainer
    ? students.find(s => s.id === selectedStudentId)?.name
    : student?.name;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {isTrainer && (
          <button onClick={() => setSelectedStudentId(null)} className="text-purple-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h2 className="font-cyber text-white tracking-wider text-base">
            {isTrainer ? selectedStudentName : "Chat com Personal"}
          </h2>
          <p className="text-purple-500/40 text-[10px] font-mono-cyber">// conversa em tempo real</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-purple-500/20">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-mono-cyber text-sm">// nenhuma mensagem ainda</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_email === user?.email;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isMine
                  ? "bg-purple-500/20 border border-purple-500/30 text-white"
                  : "bg-black/40 border border-purple-900/20 text-white"
              }`}>
                {!isMine && (
                  <p className="text-[9px] font-mono-cyber text-cyan-400/60 mb-1">{msg.sender_name}</p>
                )}
                {msg.image_url && (
                  <img src={msg.image_url} alt="imagem" className="rounded-lg mb-2 max-w-full max-h-48 object-contain" />
                )}
                {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                <p className={`text-[9px] font-mono-cyber mt-1 ${isMine ? "text-purple-400/40 text-right" : "text-purple-500/30"}`}>
                  {new Date(msg.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative w-20 h-20 mb-2">
          <img src={imagePreview} className="w-full h-full object-cover rounded-lg border border-purple-500/30" />
          <button onClick={() => { setImageFile(null); setImagePreview(null); }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        <button onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-purple-900/30 text-purple-500/50 hover:text-purple-300 hover:border-purple-500/40 transition-all">
          <Image className="w-4 h-4" />
        </button>
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="cyber-input flex-1"
          disabled={uploading || sendMut.isPending}
        />
        <Button onClick={handleSend} disabled={uploading || sendMut.isPending || (!message.trim() && !imageFile)}
          className="btn-neon-cyan px-4 h-9 flex-shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}