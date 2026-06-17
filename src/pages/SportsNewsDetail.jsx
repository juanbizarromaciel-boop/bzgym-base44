import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Heart, Bookmark, Share2, Flag, Send, MessageCircle } from "lucide-react";
import { categoryColor, categoryLabel, formatNewsDate } from "@/components/news/newsConfig";

export default function SportsNewsDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  const [user, setUser] = useState(null);
  const [comment, setComment] = useState("");
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: allNews = [], isLoading } = useQuery({ queryKey: ["sportsNewsDetail", id], queryFn: () => base44.entities.SportsNews.list("-published_at", 300) });
  const news = useMemo(() => allNews.find(n => n.id === id), [allNews, id]);
  const { data: likes = [] } = useQuery({ queryKey: ["newsLikes", id], queryFn: () => base44.entities.NewsLike.filter({ news_id: id }), enabled: !!id });
  const { data: saves = [] } = useQuery({ queryKey: ["savedNews", id], queryFn: () => base44.entities.SavedNews.filter({ news_id: id }), enabled: !!id });
  const { data: comments = [] } = useQuery({ queryKey: ["newsComments", id], queryFn: () => base44.entities.NewsComment.filter({ news_id: id }, "-created_date", 80), enabled: !!id });

  const liked = likes.some(l => l.user_email === user?.email);
  const saved = saves.some(s => s.user_email === user?.email);
  const color = categoryColor(news?.category);

  const likeMut = useMutation({ mutationFn: async () => {
    const existing = likes.find(l => l.user_email === user?.email);
    if (existing) return base44.entities.NewsLike.delete(existing.id);
    return base44.entities.NewsLike.create({ news_id: id, user_email: user.email });
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["newsLikes", id] }) });

  const saveMut = useMutation({ mutationFn: async () => {
    const existing = saves.find(s => s.user_email === user?.email);
    if (existing) return base44.entities.SavedNews.delete(existing.id);
    return base44.entities.SavedNews.create({ news_id: id, user_email: user.email });
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["savedNews", id] }); toast.success("Atualizado"); } });

  const commentMut = useMutation({ mutationFn: () => base44.entities.NewsComment.create({ news_id: id, user_email: user.email, user_name: user.full_name || user.email, comment: comment.trim(), status: "ativo" }), onSuccess: () => { setComment(""); qc.invalidateQueries({ queryKey: ["newsComments", id] }); } });
  const reportMut = useMutation({ mutationFn: (payload) => base44.entities.NewsReport.create(payload), onSuccess: () => toast.success("Denúncia enviada para moderação") });
  const deleteCommentMut = useMutation({ mutationFn: (commentId) => base44.entities.NewsComment.delete(commentId), onSuccess: () => qc.invalidateQueries({ queryKey: ["newsComments", id] }) });

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: news.title, text: news.summary, url });
    else { await navigator.clipboard.writeText(url); toast.success("Link copiado"); }
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-9 h-9 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" /></div>;
  if (!news || news.status !== "ativo") return <div className="max-w-3xl mx-auto text-center py-20"><p className="font-mono-cyber text-white/50">Notícia não encontrada.</p><Link to="/Comunidade" className="text-cyan-300 text-sm mt-4 inline-block">Voltar para Comunidade</Link></div>;

  return (
    <main className="max-w-4xl mx-auto space-y-5">
      <Link to="/Comunidade" className="inline-flex items-center gap-2 text-sm text-cyan-300/75 hover:text-cyan-200"><ArrowLeft className="w-4 h-4" /> Voltar para Comunidade</Link>

      <article className="relative rounded-3xl border overflow-hidden" style={{ background: "rgba(4,4,14,0.92)", borderColor: `${color}40`, boxShadow: `0 0 40px ${color}12` }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <div className="h-72 md:h-96 bg-purple-950/20 overflow-hidden">
          {news.image_url ? <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-cyber text-white/20">BZ SPORTS</div>}
        </div>
        <div className="p-5 md:p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono-cyber uppercase tracking-wider" style={{ color, background: `${color}18`, border: `1px solid ${color}45` }}>{categoryLabel(news.category)}</span>
            <span className="text-[10px] font-mono-cyber text-white/35">{formatNewsDate(news.published_at || news.created_date)}</span>
            <span className="text-[10px] font-mono-cyber text-white/35">Fonte: {news.source_name}</span>
          </div>
          <h1 className="font-cyber text-3xl md:text-5xl font-black tracking-wider text-white leading-tight">{news.title}</h1>
          <p className="text-lg text-white/70 leading-relaxed">{news.summary}</p>
          <div className="prose prose-invert max-w-none text-white/68 leading-relaxed whitespace-pre-wrap">{news.content || news.summary}</div>
          <div className="flex flex-wrap items-center gap-2 pt-5 border-t border-purple-900/25">
            <button onClick={() => likeMut.mutate()} className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm" style={{ color: liked ? "#ec4899" : "rgba(255,255,255,0.6)", background: liked ? "rgba(236,72,153,0.12)" : "rgba(255,255,255,0.04)" }}><Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> {likes.length}</button>
            <button onClick={() => saveMut.mutate()} className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm" style={{ color: saved ? "#06b6d4" : "rgba(255,255,255,0.6)", background: saved ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.04)" }}><Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} /> Salvar</button>
            <button onClick={share} className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm text-white/60 bg-white/[0.04]"><Share2 className="w-4 h-4" /> Compartilhar</button>
            <button onClick={() => reportMut.mutate({ news_id: id, reported_by: user.email, reason: "Notícia inadequada" })} className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm text-amber-300/70 bg-amber-500/10"><Flag className="w-4 h-4" /> Denunciar</button>
            <a href={news.original_url} target="_blank" rel="noopener noreferrer" className="ml-auto px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold text-white" style={{ background: `${color}22`, border: `1px solid ${color}45` }}>Matéria original <ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
      </article>

      <section className="rounded-2xl border p-5" style={{ background: "rgba(4,4,14,0.86)", borderColor: "rgba(168,85,247,0.25)" }}>
        <div className="flex items-center gap-2 mb-4"><MessageCircle className="w-4 h-4 text-purple-300" /><h2 className="font-cyber text-lg tracking-wider text-white">Comentários</h2></div>
        <div className="flex gap-2 mb-5">
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comente com respeito à comunidade..." className="cyber-input flex-1 px-3 py-2" />
          <button onClick={() => comment.trim() && commentMut.mutate()} className="px-4 rounded-xl btn-neon-cyan"><Send className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          {comments.filter(c => c.status !== "oculto").map(c => <div key={c.id} className="p-3 rounded-xl border border-purple-900/20 bg-white/[0.02]"><div className="flex justify-between gap-3"><p className="text-xs font-semibold text-purple-200">{c.user_name || c.user_email}</p><div className="flex gap-2"><button onClick={() => reportMut.mutate({ news_id: id, comment_id: c.id, reported_by: user.email, reason: "Comentário inadequado" })} className="text-[10px] text-amber-300/55">denunciar</button>{(user?.role === "admin" || c.user_email === user?.email) && <button onClick={() => deleteCommentMut.mutate(c.id)} className="text-[10px] text-pink-300/55">excluir</button>}</div></div><p className="text-sm text-white/65 mt-1">{c.comment}</p></div>)}
          {comments.length === 0 && <p className="text-sm text-white/35 font-mono-cyber">// seja o primeiro a comentar</p>}
        </div>
      </section>
    </main>
  );
}