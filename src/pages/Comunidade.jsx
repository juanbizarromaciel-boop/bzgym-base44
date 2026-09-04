import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Heart, MessageCircle, Plus, Trophy, TrendingUp, Lightbulb,
  HelpCircle, Zap, Image, X, Upload, Loader2, Filter, Dumbbell
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SportsNewsFeed from "@/components/news/SportsNewsFeed";
import SportsNewsHighlights from "@/components/news/SportsNewsHighlights";
import WorkoutShareComposer from "@/components/workout/WorkoutShareComposer";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const TIPO_CONFIG = {
  pr: { label: "PR", icon: Trophy, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.30)" },
  progresso: { label: "Progresso", icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.30)" },
  dica: { label: "Dica", icon: Lightbulb, color: "#06b6d4", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.30)" },
  duvida: { label: "Dúvida", icon: HelpCircle, color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.30)" },
  motivacao: { label: "Motivação", icon: Zap, color: "#ec4899", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.30)" },
};

const FILTER_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "pr", label: "PRs" },
  { value: "progresso", label: "Progresso" },
  { value: "dica", label: "Dicas" },
  { value: "duvida", label: "Dúvidas" },
  { value: "motivacao", label: "Motivação" },
];

function PostCard({ post, currentUserEmail, onLike, onDelete, isAdmin }) {
  const cfg = TIPO_CONFIG[post.tipo_post] || TIPO_CONFIG.motivacao;
  const Icon = cfg.icon;
  const hasLiked = (post.curtido_por || []).includes(currentUserEmail);
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m atrás`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h atrás`;
    return `${Math.floor(h / 24)}d atrás`;
  };

  return (
    <motion.div variants={fadeUp} layout
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${cfg.color}25`, background: 'rgba(4,4,14,0.85)' }}>
      {/* Top line */}
      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-cyber text-sm font-black"
              style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, color: cfg.color }}>
              {post.autor_nome?.substring(0, 2).toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{post.autor_nome || "Usuário"}</p>
              <p className="text-[10px] font-mono-cyber text-purple-400/40">{post.created_date ? timeAgo(post.created_date) : "agora"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <Icon className="w-3 h-3" style={{ color: cfg.color }} />
              <span className="text-[9px] font-mono-cyber uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            {(isAdmin || post.autor_id === currentUserEmail) && (
              <button onClick={() => onDelete(post.id)}
                className="p-1.5 rounded-lg text-purple-400/30 hover:text-pink-400 hover:bg-pink-500/10 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-white/80 leading-relaxed mb-4 whitespace-pre-wrap">{post.texto}</p>

        {/* Image */}
        {post.imagem_url && (
          <div className="rounded-xl overflow-hidden mb-4">
            <img src={post.imagem_url} alt="post" className="w-full object-cover max-h-64"
              onError={e => { e.target.style.display = 'none'; }} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t border-purple-900/20">
          <button onClick={() => onLike(post)}
            className="flex items-center gap-2 transition-all hover:scale-105"
            style={{ color: hasLiked ? '#ec4899' : 'rgba(168,85,247,0.4)' }}>
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`}
              style={{ filter: hasLiked ? 'drop-shadow(0 0 6px rgba(236,72,153,0.8))' : 'none' }} />
            <span className="text-xs font-mono-cyber">{post.curtidas || 0}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Comunidade() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("comunidade");
  const [filter, setFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [form, setForm] = useState({ tipo_post: "motivacao", texto: "", imagem_url: "", visibilidade: "alunos" });
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  useEffect(() => {
    const openNews = () => setActiveTab("noticias");
    window.addEventListener("openSportsNewsTab", openNews);
    return () => window.removeEventListener("openSportsNewsTab", openNews);
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["comunidadePosts"],
    queryFn: () => base44.entities.ComunidadePost.list("-created_date", 50),
    staleTime: 30000,
  });
  const { data: workoutLogs = [] } = useQuery({ queryKey: ["communityWorkoutLogs"], queryFn: () => base44.entities.WorkoutLog.list("-date", 50), enabled: !!user });
  const { data: workoutPlans = [] } = useQuery({ queryKey: ["communityWorkoutPlans"], queryFn: () => base44.entities.WorkoutPlan.list(), enabled: !!user });
  const { data: communityStudents = [] } = useQuery({ queryKey: ["communityStudents"], queryFn: () => base44.entities.Student.list(), enabled: !!user });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.ComunidadePost.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comunidadePosts"] }); toast.success("Post publicado!"); setDialogOpen(false); resetForm(); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.ComunidadePost.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comunidadePosts"] })
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.ComunidadePost.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comunidadePosts"] }); toast.success("Post removido"); }
  });

  const resetForm = () => setForm({ tipo_post: "motivacao", texto: "", imagem_url: "", visibilidade: "alunos" });

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(p => ({ ...p, imagem_url: file_url }));
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = () => {
    if (!form.texto.trim()) { toast.error("Escreva algo!"); return; }
    createMut.mutate({
      autor_id: user.email,
      autor_nome: user.full_name || user.email.split("@")[0],
      tipo_post: form.tipo_post,
      texto: form.texto.trim(),
      imagem_url: form.imagem_url || null,
      visibilidade: form.visibilidade,
      curtidas: 0,
      curtido_por: [],
    });
  };

  const handleLike = (post) => {
    if (!user) return;
    const likedBy = post.curtido_por || [];
    const hasLiked = likedBy.includes(user.email);
    const newLikedBy = hasLiked ? likedBy.filter(e => e !== user.email) : [...likedBy, user.email];
    updateMut.mutate({ id: post.id, d: { curtidas: newLikedBy.length, curtido_por: newLikedBy } });
  };

  const filtered = filter === "todos" ? posts : posts.filter(p => p.tipo_post === filter);
  const isAdmin = user?.role === "admin";
  const linkedStudent = communityStudents.find(student => student.email?.toLowerCase() === user?.email?.toLowerCase());
  const ownerIds = [user?.email, linkedStudent?.id].filter(Boolean);
  const myLogs = workoutLogs.filter(log => ownerIds.includes(log.student_id));
  const latestLog = myLogs[0];
  const latestLogs = latestLog ? myLogs.filter(log => log.date === latestLog.date && log.workout_plan_id === latestLog.workout_plan_id) : [];
  const latestPlan = workoutPlans.find(plan => plan.id === latestLog?.workout_plan_id);
  const latestWorkoutStats = latestLog ? {
    name: latestPlan?.name || "Meu treino",
    volumeKg: latestLogs.flatMap(log => log.sets_completed || []).reduce((sum, set) => sum + (Number(set.load_kg) || 0) * (Number(set.reps_done) || 0), 0),
    exercises: latestLogs.map(log => ({ name: log.exercise_name, maxLoad: log.max_load_kg || 0 })),
  } : null;

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className={`${activeTab === "noticias" ? "max-w-5xl" : "max-w-2xl"} mx-auto space-y-6`}>

      {/* Header */}
      <motion.div variants={fadeUp} className="relative">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.8), transparent)' }} />
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded" style={{ background: 'linear-gradient(to bottom, #ec4899, #a855f7)', boxShadow: '0 0 12px rgba(236,72,153,0.6)' }} />
              <h1 className="font-cyber text-3xl font-black tracking-wider text-white" style={{ textShadow: '0 0 20px rgba(236,72,153,0.5)' }}>COMUNIDADE</h1>
            </div>
            <p className="text-xs font-mono-cyber text-pink-400/50 pl-4">// compartilhe, inspire e evolua junto</p>
          </div>
          <button onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(168,85,247,0.12))', border: '1px solid rgba(236,72,153,0.45)', color: '#ffffff', boxShadow: '0 0 18px rgba(236,72,153,0.15)' }}>
            <Plus className="w-4 h-4" style={{ color: '#ec4899' }} />
            POSTAR
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.5), rgba(168,85,247,0.6), transparent)' }} />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2 rounded-2xl border p-1" style={{ borderColor: "rgba(168,85,247,0.25)", background: "rgba(4,4,14,0.70)" }}>
        <button onClick={() => setActiveTab("comunidade")} className="py-3 rounded-xl text-xs font-mono-cyber uppercase tracking-wider transition-all" style={activeTab === "comunidade" ? { background: "rgba(236,72,153,0.16)", color: "#f9a8d4", border: "1px solid rgba(236,72,153,0.38)" } : { color: "rgba(255,255,255,0.38)", border: "1px solid transparent" }}>Feed da Comunidade</button>
        <button onClick={() => setActiveTab("noticias")} className="py-3 rounded-xl text-xs font-mono-cyber uppercase tracking-wider transition-all" style={activeTab === "noticias" ? { background: "rgba(6,182,212,0.16)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.38)" } : { color: "rgba(255,255,255,0.38)", border: "1px solid transparent" }}>Notícias do Esporte</button>
      </motion.div>

      {activeTab === "noticias" ? (
        <SportsNewsFeed />
      ) : (
        <>
          <SportsNewsHighlights />

          {/* Filters */}
          <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {FILTER_OPTIONS.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-mono-cyber tracking-wider transition-all"
                style={filter === f.value ? {
                  background: 'rgba(236,72,153,0.20)', border: '1px solid rgba(236,72,153,0.55)',
                  color: '#f9a8d4', boxShadow: '0 0 12px rgba(236,72,153,0.20)',
                } : {
                  background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.45)',
                }}>
                {f.label}
              </button>
            ))}
          </motion.div>

          {/* Posts */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div variants={fadeUp} className="text-center py-20 rounded-2xl border border-purple-900/20">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-purple-500/20" />
              <p className="font-mono-cyber text-sm text-purple-500/30">// nenhum post ainda</p>
              <button onClick={() => setDialogOpen(true)} className="mt-5 btn-neon-pink px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Seja o primeiro a postar
              </button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filtered.map(post => (
                <PostCard key={post.id} post={post} currentUserEmail={user?.email} isAdmin={isAdmin}
                  onLike={handleLike} onDelete={(id) => deleteMut.mutate(id)} />
              ))}
            </AnimatePresence>
          )}
        </>
      )}

      {/* New post dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => { setDialogOpen(false); resetForm(); }}>
        <DialogContent className="border border-pink-900/40 text-white max-w-md" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-pink-300 flex items-center gap-2">
              <Plus className="w-4 h-4" /> NOVO POST
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">

            {/* Type selector */}
            <div>
              <Label className="text-pink-400/60 text-xs tracking-wider">TIPO DE POST</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Object.entries(TIPO_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button key={key} onClick={() => setForm(p => ({ ...p, tipo_post: key }))}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all"
                      style={form.tipo_post === key ? {
                        background: cfg.bg, borderColor: cfg.border, boxShadow: `0 0 12px ${cfg.color}30`,
                      } : {
                        background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(168,85,247,0.15)',
                      }}>
                      <Icon className="w-4 h-4" style={{ color: form.tipo_post === key ? cfg.color : 'rgba(168,85,247,0.3)' }} />
                      <span className="text-[9px] font-mono-cyber" style={{ color: form.tipo_post === key ? cfg.color : 'rgba(168,85,247,0.3)' }}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text */}
            <div>
              <Label className="text-pink-400/60 text-xs tracking-wider">MENSAGEM *</Label>
              <Textarea value={form.texto} onChange={e => setForm(p => ({ ...p, texto: e.target.value }))}
                placeholder="O que você quer compartilhar?"
                className="cyber-input mt-1 resize-none" rows={4} />
            </div>

            <div>
              <Label className="text-cyan-400/60 text-xs tracking-wider">TREINO (opcional)</Label>
              <button onClick={() => setShareOpen(true)} disabled={!latestWorkoutStats || uploading} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3 text-xs text-cyan-200 disabled:opacity-40">
                <Dumbbell className="h-4 w-4" /> {latestWorkoutStats ? "ANEXAR E COMPARTILHAR ÚLTIMO TREINO" : "NENHUM TREINO CONCLUÍDO"}
              </button>
            </div>

            {/* Image upload */}
            <div>
              <Label className="text-pink-400/60 text-xs tracking-wider">IMAGEM (opcional)</Label>
              {form.imagem_url ? (
                <div className="relative mt-1 rounded-xl overflow-hidden">
                  <img src={form.imagem_url} alt="preview" className="w-full h-40 object-cover" />
                  <button onClick={() => setForm(p => ({ ...p, imagem_url: "" }))}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-pink-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center mt-1 p-4 rounded-xl border-2 border-dashed cursor-pointer hover:border-pink-500/40 transition-all"
                  style={{ borderColor: 'rgba(236,72,153,0.20)', background: 'rgba(236,72,153,0.03)' }}>
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin text-pink-400" /> : (
                    <>
                      <Upload className="w-5 h-5 text-pink-400/40 mb-1" />
                      <p className="text-[10px] font-mono-cyber text-pink-400/40">Clique para enviar foto</p>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleUpload(e.target.files[0])} />
                </label>
              )}
            </div>

            <button onClick={handlePublish} disabled={createMut.isPending || !form.texto.trim()}
              className="w-full py-3 rounded-xl font-bold tracking-wider text-sm transition-all hover:brightness-110 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.20))', border: '1px solid rgba(236,72,153,0.50)', color: '#ffffff' }}>
              {createMut.isPending ? "PUBLICANDO..." : "PUBLICAR →"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <WorkoutShareComposer open={shareOpen} onClose={() => setShareOpen(false)} stats={latestWorkoutStats} onImageReady={handleUpload} />
    </motion.div>
  );
}