import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Newspaper, Plus, RefreshCcw, Trash2, Star, Power, Save, Rss } from "lucide-react";
import { NEWS_CATEGORIES, categoryLabel, formatNewsDate } from "@/components/news/newsConfig";

const emptySource = { name: "", url: "", default_category: "fitness", active: true, update_frequency_minutes: 360, preferred_language: "pt-BR", country_region: "BR" };

export default function NewsManagement() {
  const [user, setUser] = useState(null);
  const [sourceForm, setSourceForm] = useState(emptySource);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(u => { setUser(u); if (u.role !== "admin") navigate("/AccessDenied"); }).catch(() => {}); }, [navigate]);

  const { data: news = [] } = useQuery({ queryKey: ["adminSportsNews"], queryFn: () => base44.entities.SportsNews.list("-created_date", 200) });
  const { data: sources = [] } = useQuery({ queryKey: ["newsSources"], queryFn: () => base44.entities.NewsSource.list("-created_date", 100) });

  const stats = useMemo(() => ({
    total: news.length,
    active: news.filter(n => n.status === "ativo").length,
    featured: news.filter(n => n.is_featured).length,
    sources: sources.filter(s => s.active).length,
  }), [news, sources]);

  const updateNews = useMutation({ mutationFn: ({ id, data }) => base44.entities.SportsNews.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["adminSportsNews"] }) });
  const deleteNews = useMutation({ mutationFn: (id) => base44.entities.SportsNews.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminSportsNews"] }); toast.success("Notícia excluída"); } });
  const createSource = useMutation({ mutationFn: (data) => base44.entities.NewsSource.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["newsSources"] }); setSourceForm(emptySource); toast.success("Fonte cadastrada"); } });
  const updateSource = useMutation({ mutationFn: ({ id, data }) => base44.entities.NewsSource.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["newsSources"] }) });
  const deleteSource = useMutation({ mutationFn: (id) => base44.entities.NewsSource.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["newsSources"] }) });
  const runUpdate = useMutation({ mutationFn: () => base44.functions.invoke("updateSportsNews", { force: true }), onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["adminSportsNews"] }); qc.invalidateQueries({ queryKey: ["newsSources"] }); toast.success(`${res.data.imported || 0} notícia(s) importada(s)`); } });

  if (!user || user.role !== "admin") return <div className="flex justify-center py-20"><div className="w-9 h-9 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <main className="max-w-6xl space-y-6">
      <section className="relative rounded-2xl p-6 border overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.10), rgba(4,4,14,0.95), rgba(168,85,247,0.08))", borderColor: "rgba(6,182,212,0.35)" }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Newspaper className="w-6 h-6 text-cyan-300" /><div><h1 className="font-cyber text-3xl font-black tracking-wider text-white">GESTÃO DE NOTÍCIAS</h1><p className="text-xs font-mono-cyber text-cyan-300/45">// central de curadoria esportiva do BZ Gym System</p></div></div>
          <button onClick={() => runUpdate.mutate()} disabled={runUpdate.isPending} className="btn-neon-cyan px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"><RefreshCcw className={`w-4 h-4 ${runUpdate.isPending ? "animate-spin" : ""}`} /> Atualizar fontes</button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{label:"notícias", value:stats.total},{label:"ativas", value:stats.active},{label:"destaques", value:stats.featured},{label:"fontes ativas", value:stats.sources}].map(s => <div key={s.label} className="rounded-xl border p-4 bg-white/[0.03] border-cyan-900/25"><p className="font-cyber text-3xl font-black text-white">{s.value}</p><p className="text-[10px] font-mono-cyber uppercase tracking-wider text-cyan-300/50">{s.label}</p></div>)}
      </section>

      <section className="rounded-2xl border p-5 space-y-4" style={{ background: "rgba(4,4,14,0.86)", borderColor: "rgba(16,185,129,0.25)" }}>
        <div className="flex items-center gap-2"><Rss className="w-4 h-4 text-emerald-300" /><h2 className="font-cyber text-lg tracking-wider text-white">Fontes externas</h2></div>
        <div className="grid md:grid-cols-7 gap-2">
          <input className="cyber-input px-3 py-2 md:col-span-1" placeholder="Nome" value={sourceForm.name} onChange={e => setSourceForm(p => ({ ...p, name: e.target.value }))} />
          <input className="cyber-input px-3 py-2 md:col-span-2" placeholder="URL RSS/API" value={sourceForm.url} onChange={e => setSourceForm(p => ({ ...p, url: e.target.value }))} />
          <select className="cyber-input px-3 py-2" value={sourceForm.default_category} onChange={e => setSourceForm(p => ({ ...p, default_category: e.target.value }))}>{NEWS_CATEGORIES.filter(c => c.value !== "todos").map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
          <input className="cyber-input px-3 py-2" placeholder="Idioma" value={sourceForm.preferred_language} onChange={e => setSourceForm(p => ({ ...p, preferred_language: e.target.value }))} />
          <input className="cyber-input px-3 py-2" placeholder="País" value={sourceForm.country_region} onChange={e => setSourceForm(p => ({ ...p, country_region: e.target.value }))} />
          <button onClick={() => sourceForm.name && sourceForm.url && createSource.mutate(sourceForm)} className="btn-neon-green rounded-xl flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button>
        </div>
        <div className="space-y-2">
          {sources.map(src => <div key={src.id} className="grid md:grid-cols-[1fr_2fr_1fr_1fr_auto] gap-2 items-center p-3 rounded-xl border border-emerald-900/20 bg-white/[0.02]"><div><p className="text-sm font-semibold text-white">{src.name}</p><p className="text-[10px] font-mono-cyber text-white/35">{src.last_update_status || "nunca_atualizado"} · {src.last_update_at ? formatNewsDate(src.last_update_at) : "sem atualização"}</p></div><p className="text-xs text-white/45 truncate">{src.url}</p><p className="text-xs text-emerald-300/70">{categoryLabel(src.default_category)}</p><button onClick={() => updateSource.mutate({ id: src.id, data: { active: !src.active } })} className={`text-xs px-3 py-2 rounded-lg ${src.active ? "text-emerald-300 bg-emerald-500/10" : "text-white/35 bg-white/5"}`}>{src.active ? "Ativa" : "Inativa"}</button><button onClick={() => deleteSource.mutate(src.id)} className="text-pink-300/60 hover:text-pink-300"><Trash2 className="w-4 h-4" /></button></div>)}
        </div>
      </section>

      <section className="rounded-2xl border p-5 space-y-4" style={{ background: "rgba(4,4,14,0.86)", borderColor: "rgba(168,85,247,0.25)" }}>
        <h2 className="font-cyber text-lg tracking-wider text-white">Notícias importadas</h2>
        <div className="space-y-3">
          {news.map(item => <div key={item.id} className="rounded-xl border border-purple-900/25 p-4 bg-white/[0.02] grid lg:grid-cols-[80px_1fr_auto] gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-purple-950/25">{item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}</div>
            <div className="space-y-2">
              <input className="cyber-input w-full px-3 py-2 font-semibold" value={item.title || ""} onChange={e => updateNews.mutate({ id: item.id, data: { title: e.target.value } })} />
              <textarea className="cyber-input w-full px-3 py-2 text-sm resize-none" rows={2} value={item.summary || ""} onChange={e => updateNews.mutate({ id: item.id, data: { summary: e.target.value } })} />
              <div className="flex flex-wrap gap-2 text-[10px] font-mono-cyber text-white/35"><span>{item.source_name}</span><span>{categoryLabel(item.category)}</span><span>{formatNewsDate(item.published_at || item.created_date)}</span></div>
            </div>
            <div className="flex lg:flex-col gap-2">
              <select className="cyber-input px-2 py-2 text-xs" value={item.category} onChange={e => updateNews.mutate({ id: item.id, data: { category: e.target.value } })}>{NEWS_CATEGORIES.filter(c => c.value !== "todos").map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
              <button onClick={() => updateNews.mutate({ id: item.id, data: { status: item.status === "ativo" ? "inativo" : "ativo" } })} className="p-2 rounded-lg bg-white/5 text-white/60"><Power className="w-4 h-4" /></button>
              <button onClick={() => updateNews.mutate({ id: item.id, data: { is_featured: !item.is_featured } })} className={`p-2 rounded-lg ${item.is_featured ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-white/45"}`}><Star className={`w-4 h-4 ${item.is_featured ? "fill-current" : ""}`} /></button>
              <button onClick={() => deleteNews.mutate(item.id)} className="p-2 rounded-lg bg-pink-500/10 text-pink-300/70"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>)}
          {news.length === 0 && <p className="text-sm text-white/35 font-mono-cyber text-center py-10">// nenhuma notícia importada ainda</p>}
        </div>
      </section>
    </main>
  );
}