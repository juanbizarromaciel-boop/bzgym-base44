import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, User, ImageIcon, X, Loader2, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [isTrainer, setIsTrainer] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setIsTrainer(u.role === "admin" || u.role === "personal");
    }).catch(() => {});
  }, []);

  // Fetch all students (always needed — aluno precisa pra achar o próprio id)
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    enabled: !!user
  });

  const { data: allMessages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 500),
    refetchInterval: 4000,
    enabled: !!user
  });

  // For students: find own student record
  const myStudent = !isTrainer && user
    ? students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase())
    : null;

  const activeStudentId = isTrainer ? selectedStudentId : myStudent?.id;

  // For trainer: list only their students
  const myStudents = isTrainer
    ? students.filter(s => !s.personal_id || s.personal_id === user?.email || user?.role === "admin")
    : [];

  const messages = allMessages
    .filter(m => m.student_id === activeStudentId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMut = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      setMessage("");
      setImageFile(null);
      setImagePreview(null);
    },
    onError: () => toast.error("Erro ao enviar mensagem")
  });

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande. Máximo 5MB."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    if (!message.trim() && !imageFile) return;
    if (!activeStudentId) return;

    let image_url = null;
    if (imageFile) {
      setUploading(true);
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
      setUploading(false);
    }

    sendMut.mutate({
      student_id: activeStudentId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      message: message.trim(),
      image_url,
      is_trainer: isTrainer,
      read: false
    });
  };

  const unreadForStudent = (sid) =>
    allMessages.filter(m => m.student_id === sid && !m.read && m.sender_email !== user?.email).length;

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title="Chat"
        accentColor="#06b6d4"
        subtitle={isTrainer ? "Converse com seus alunos" : "Fale com seu personal trainer"}
      />

      {isTrainer ? (
        /* ── TRAINER VIEW: lista de alunos à esquerda, chat à direita ── */
        <div className="flex gap-4" style={{ height: 'calc(100vh - 230px)', minHeight: '520px' }}>
          {/* Student list sidebar */}
          <div className="w-64 flex-shrink-0 cyber-card rounded-2xl border border-purple-900/20 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-purple-900/20">
              <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase">Alunos</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {myStudents.length === 0 && (
                <div className="text-center py-8 text-purple-500/30">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-mono-cyber">nenhum aluno</p>
                </div>
              )}
              {myStudents.map(s => {
                const unread = unreadForStudent(s.id);
                const isActive = selectedStudentId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all border-b border-purple-900/10 ${
                      isActive ? "bg-purple-500/10 border-l-2 border-l-purple-500" : "hover:bg-purple-500/5"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-cyber text-purple-400">{s.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{s.name}</p>
                    </div>
                    {unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 min-w-0">
            {selectedStudentId ? (
              <ChatPanel
                messages={messages}
                user={user}
                message={message}
                setMessage={setMessage}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                setImageFile={setImageFile}
                fileInputRef={fileInputRef}
                handleImageSelect={handleImageSelect}
                handleSend={handleSend}
                sending={sendMut.isPending || uploading}
                messagesEndRef={messagesEndRef}
                studentName={myStudents.find(s => s.id === selectedStudentId)?.name}
              />
            ) : (
              <div className="cyber-card rounded-2xl h-full border border-purple-900/20 flex flex-col items-center justify-center text-center p-8">
                <MessageCircle className="w-16 h-16 mb-4 text-purple-500/20" />
                <p className="font-mono-cyber text-sm text-purple-500/30">// selecione um aluno para conversar</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── STUDENT VIEW: chat direto ── */
        <div style={{ height: 'calc(100vh - 230px)', minHeight: '520px' }}>
          {myStudent ? (
            <ChatPanel
              messages={messages}
              user={user}
              message={message}
              setMessage={setMessage}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              setImageFile={setImageFile}
              fileInputRef={fileInputRef}
              handleImageSelect={handleImageSelect}
              handleSend={handleSend}
              sending={sendMut.isPending || uploading}
              messagesEndRef={messagesEndRef}
            />
          ) : (
            <div className="cyber-card rounded-2xl h-full border border-purple-900/20 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-16 h-16 mb-4 text-purple-500/20" />
              <p className="font-mono-cyber text-sm text-purple-500/30">// perfil de aluno não encontrado</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ── Sub-component: ChatPanel ── */
function ChatPanel({ messages, user, message, setMessage, imagePreview, setImagePreview, setImageFile,
  fileInputRef, handleImageSelect, handleSend, sending, messagesEndRef, studentName }) {

  return (
    <div className="cyber-card rounded-2xl border border-purple-900/20 overflow-hidden flex flex-col h-full">
      {studentName && (
        <div className="px-5 py-3 border-b border-purple-900/20 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <span className="text-xs font-cyber text-purple-400">{studentName[0]?.toUpperCase()}</span>
          </div>
          <span className="text-sm font-medium text-white">{studentName}</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
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
                <div className="max-w-[75%] md:max-w-[65%]">
                  <div className={`flex items-center gap-1.5 mb-1 px-1 ${isMine ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] text-purple-500/40 font-mono-cyber">
                      {msg.sender_name || msg.sender_email}
                    </span>
                    <span className="text-[9px] text-purple-500/25 font-mono-cyber">
                      {new Date(msg.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`rounded-2xl overflow-hidden ${
                    isMine
                      ? "bg-purple-500/15 border border-purple-500/25"
                      : "bg-black/40 border border-purple-900/30"
                  }`}>
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="imagem"
                        className="max-w-full rounded-t-2xl cursor-pointer"
                        style={{ maxHeight: '260px', objectFit: 'contain', background: 'rgba(0,0,0,0.3)' }}
                        onClick={() => window.open(msg.image_url, '_blank')}
                      />
                    )}
                    {msg.message && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-white px-4 py-3">
                        {msg.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3 border-t border-purple-900/20"
          >
            <div className="relative inline-block">
              <img src={imagePreview} alt="preview" className="h-20 rounded-lg border border-purple-500/30 object-cover" />
              <button
                onClick={() => { setImagePreview(null); setImageFile(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-purple-900/30 p-4 bg-black/20">
        <div className="flex gap-2 items-end">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border border-purple-900/30 text-purple-500/50 hover:text-purple-300 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all flex-shrink-0"
            title="Enviar imagem"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="cyber-input flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !imagePreview) || sending}
            className="btn-neon-purple px-5 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}