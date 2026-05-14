import React, { useState, useEffect, useRef } from "react";
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, User, Image, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [isTrainer, setIsTrainer] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
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

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    enabled: !!user
  });

  // Find my student record
  const myStudent = !isTrainer && user
    ? students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase())
    : null;

  // For personal: only their students
  const myStudents = isTrainer && user
    ? students.filter(s => s.personal_id === user.email || user.role === "admin")
    : [];

  const activeStudentId = isTrainer ? selectedStudentId : myStudent?.id;

  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 500),
    refetchInterval: 3000,
    enabled: !!user
  });

  const sendMut = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      setMessage("");
      setImageFile(null);
      setImagePreview(null);
    }
  });

  const messages = allMessages
    .filter(m => m.student_id === activeStudentId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!message.trim() && !imageFile) return;
    if (!activeStudentId) { toast.error("Selecione um aluno"); return; }

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
      message: message.trim() || "",
      image_url,
      is_trainer: isTrainer,
      read: false
    });
  };

  const getUnread = (studentId) =>
    allMessages.filter(m => m.student_id === studentId && !m.read && m.sender_email !== user?.email).length;

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const displayStudents = isTrainer ? myStudents : [];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title="Chat"
        accentColor="#06b6d4"
        subtitle={isTrainer ? "Converse com seus alunos" : "Fale com seu personal trainer"}
      />

      {isTrainer ? (
        /* TRAINER: sidebar + chat */
        <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)', minHeight: 520 }}>
          {/* Student list */}
          <div className="w-56 flex-shrink-0 cyber-card rounded-xl border border-purple-900/20 overflow-y-auto">
            <div className="p-3 border-b border-purple-900/20">
              <p className="text-[9px] font-mono-cyber text-purple-500/40 tracking-widest uppercase">Alunos</p>
            </div>
            {displayStudents.length === 0 ? (
              <p className="text-[10px] text-purple-500/30 font-mono-cyber p-4">// nenhum aluno</p>
            ) : (
              displayStudents.map(s => {
                const unread = getUnread(s.id);
                const active = selectedStudentId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-purple-500/10 ${
                      active ? "bg-purple-500/15 border-l-2 border-purple-400" : "border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-purple-400/60" />
                      </div>
                      <span className="text-xs text-white truncate">{s.name}</span>
                    </div>
                    {unread > 0 && (
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
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
                uploading={uploading}
                sendPending={sendMut.isPending}
                messagesEndRef={messagesEndRef}
              />
            ) : (
              <div className="cyber-card rounded-2xl h-full border border-purple-900/20 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-purple-500/20" />
                  <p className="font-mono-cyber text-sm text-purple-500/30">// selecione um aluno</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STUDENT */
        myStudent ? (
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
            uploading={uploading}
            sendPending={sendMut.isPending}
            messagesEndRef={messagesEndRef}
            style={{ height: 'calc(100vh - 280px)', minHeight: 500 }}
          />
        ) : (
          <div className="cyber-card rounded-2xl p-16 border border-purple-900/20 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-purple-500/20" />
            <p className="font-mono-cyber text-sm text-purple-500/30">// perfil não encontrado — fale com seu personal</p>
          </div>
        )
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
    </motion.div>
  );
}

function ChatPanel({ messages, user, message, setMessage, imagePreview, setImagePreview, setImageFile,
  fileInputRef, handleImageSelect, handleSend, uploading, sendPending, messagesEndRef, style }) {
  return (
    <div className="cyber-card rounded-2xl border border-purple-900/20 overflow-hidden flex flex-col"
      style={style || { height: 'calc(100vh - 220px)', minHeight: 520 }}>
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
                <div className="max-w-[75%] md:max-w-[60%]">
                  <div className={`flex items-center gap-1.5 mb-1 px-1 ${isMine ? "justify-end" : ""}`}>
                    <User className="w-3 h-3 text-purple-500/40" />
                    <span className="text-[10px] text-purple-500/40 font-mono-cyber">{msg.sender_name || msg.sender_email}</span>
                    <span className="text-[9px] text-purple-500/25 font-mono-cyber">
                      {new Date(msg.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    isMine
                      ? "bg-purple-500/15 border border-purple-500/25 text-white"
                      : "bg-black/40 border border-purple-900/30 text-purple-100"
                  }`}>
                    {msg.image_url && (
                      <img src={msg.image_url} alt="foto" className="rounded-xl max-w-full mb-2 max-h-60 object-cover cursor-pointer"
                        onClick={() => window.open(msg.image_url, "_blank")} />
                    )}
                    {msg.message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="relative inline-block">
            <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-purple-500/30" />
            <button
              onClick={() => { setImagePreview(null); setImageFile(null); }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
          <span className="text-[10px] text-purple-500/40 font-mono-cyber">imagem selecionada</span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-purple-900/30 p-3 bg-black/20">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2.5 rounded-lg border border-purple-900/30 text-purple-500/50 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
          >
            <Image className="w-4 h-4" />
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
            disabled={(!message.trim() && !imagePreview) || sendPending || uploading}
            className="btn-neon-purple px-4 flex-shrink-0"
          >
            {uploading || sendPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}