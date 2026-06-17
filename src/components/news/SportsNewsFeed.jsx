import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Newspaper, Search } from "lucide-react";
import SportsNewsCard from "./SportsNewsCard";
import { NEWS_CATEGORIES } from "./newsConfig";

export default function SportsNewsFeed() {
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState("todos");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: news = [], isLoading } = useQuery({ queryKey: ["sportsNews"], queryFn: () => base44.entities.SportsNews.list("-published_at", 80) });
  const { data: likes = [] } = useQuery({ queryKey: ["newsLikes"], queryFn: () => base44.entities.NewsLike.list(), enabled: !!user });
  const { data: saves = [] } = useQuery({ queryKey: ["savedNews"], queryFn: () => base44.entities.SavedNews.list(), enabled: !!user });

  const activeNews = useMemo(() => news
    .filter(n => n.status === "ativo" && n.source_name && n.original_url)
    .filter((n, i, arr) => arr.findIndex(x => (x.original_url && x.original_url === n.original_url) || x.title === n.title) === i)
    .filter(n => category === "todos" || n.category === category)
    .filter(n => !search.trim() || `${n.title} ${n.summary} ${n.source_name}`.toLowerCase().includes(search.toLowerCase())),
    [news, category, search]);

  const likeMut = useMutation({ mutationFn: async (item) => {
    const existing = likes.find(l => l.news_id === item.id && l.user_email === user?.email);
    if (existing) return base44.entities.NewsLike.delete(existing.id);
    return base44.entities.NewsLike.create({ news_id: item.id, user_email: user.email });
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["newsLikes"] }) });

  const saveMut = useMutation({ mutationFn: async (item) => {
    const existing = saves.find(s => s.news_id === item.id && s.user_email === user?.email);
    if (existing) return base44.entities.SavedNews.delete(existing.id);
    return base44.entities.SavedNews.create({ news_id: item.id, user_email: user.email });
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["savedNews"] }); toast.success("Atualizado"); } });

  const reportMut = useMutation({ mutationFn: (item) => base44.entities.NewsReport.create({ news_id: item.id, reported_by: user.email, reason: "Notícia denunciada pelo usuário" }), onSuccess: () => toast.success("Denúncia enviada para moderação") });

  const shareNews = async (item) => {
    const url = `${window.location.origin}/SportsNewsDetail?id=${item.id}`;
    if (navigator.share) await navigator.share({ title: item.title, text: item.summary, url });
    else { await navigator.clipboard.writeText(url); toast.success("Link copiado"); }
  };

  const countLikes = (id) => likes.filter(l => l.news_id === id).length;

  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl p-5 border overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.10), rgba(4,4,14,0.95), rgba(236,72,153,0.08))", borderColor: "rgba(6,182,212,0.35)" }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="flex items-center gap-3 mb-3">
          <Newspaper className="w-5 h-5 text-cyan-300" />
          <div>
            <h2 className="font-cyber text-xl font-black tracking-wider text-white">NOTÍCIAS DO ESPORTE</h2>
            <p className="text-xs font-mono-cyber text-cyan-300/45">// central profissional de notícias esportivas</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300/35" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar notícias, fontes ou temas..." className="cyber-input w-full pl-10 py-3" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {NEWS_CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-mono-cyber tracking-wider transition-all" style={category === c.value ? { background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.55)", color: "#67e8f9" } : { background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)", color: "rgba(255,255,255,0.42)" }}>{c.label}</button>
        ))}
      </div>

      {isLoading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" /></div>
      : activeNews.length === 0 ? <div className="text-center py-16 rounded-2xl border border-cyan-900/25 bg-cyan-500/5"><Newspaper className="w-12 h-12 mx-auto mb-4 text-cyan-300/20" /><p className="font-mono-cyber text-sm text-cyan-300/45">// nenhuma notícia disponível ainda</p><p className="text-xs text-white/35 mt-2">Cadastre fontes na Gestão de Notícias para alimentar essa área.</p></div>
      : <div className="grid md:grid-cols-2 gap-4">{activeNews.map(item => <SportsNewsCard key={item.id} news={item} liked={!!likes.find(l => l.news_id === item.id && l.user_email === user?.email)} saved={!!saves.find(s => s.news_id === item.id && s.user_email === user?.email)} likesCount={countLikes(item.id)} onLike={likeMut.mutate} onSave={saveMut.mutate} onShare={shareNews} onReport={reportMut.mutate} />)}</div>}
    </div>
  );
}