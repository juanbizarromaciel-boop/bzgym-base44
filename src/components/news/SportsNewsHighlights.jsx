import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, ArrowRight } from "lucide-react";
import { categoryColor, categoryLabel, formatNewsDate } from "./newsConfig";

export default function SportsNewsHighlights() {
  const { data: news = [] } = useQuery({ queryKey: ["sportsNewsHighlights"], queryFn: () => base44.entities.SportsNews.list("-published_at", 20) });
  const valid = news.filter(n => n.status === "ativo" && n.source_name && n.original_url);
  const featured = valid.find(n => n.is_featured) || valid[0];
  const latest = valid.filter(n => n.id !== featured?.id).slice(0, 3);
  if (!featured && latest.length === 0) return null;
  const color = categoryColor(featured?.category);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-cyan-300" />
          <h2 className="font-cyber text-sm tracking-widest text-white">ÚLTIMAS DO ESPORTE</h2>
        </div>
        <button onClick={() => window.dispatchEvent(new CustomEvent("openSportsNewsTab"))} className="text-xs font-mono-cyber text-cyan-300/70 hover:text-cyan-200">ver tudo</button>
      </div>
      {featured && (
        <Link to={`/SportsNewsDetail?id=${featured.id}`} className="block relative rounded-2xl overflow-hidden border group" style={{ borderColor: `${color}40`, background: "rgba(4,4,14,0.92)", boxShadow: `0 0 32px ${color}12` }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
          <div className="grid sm:grid-cols-[1.1fr_1.4fr]">
            <div className="h-52 sm:h-full bg-purple-950/20 overflow-hidden">
              {featured.image_url ? <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Newspaper className="w-12 h-12 text-cyan-300/20" /></div>}
            </div>
            <div className="p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-mono-cyber uppercase tracking-wider" style={{ color, background: `${color}18`, border: `1px solid ${color}45` }}>Destaque · {categoryLabel(featured.category)}</span>
                  <span className="text-[10px] font-mono-cyber text-white/35">{formatNewsDate(featured.published_at || featured.created_date)}</span>
                </div>
                <h3 className="text-xl font-bold text-white leading-tight mb-2">{featured.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{featured.summary}</p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-cyber text-white/35">
                <span>{featured.source_name}</span><span className="flex items-center gap-1 text-cyan-300/70">Ler mais <ArrowRight className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
        </Link>
      )}
      <div className="grid sm:grid-cols-3 gap-3">
        {latest.map(item => <Link key={item.id} to={`/SportsNewsDetail?id=${item.id}`} className="rounded-xl p-3 border bg-white/[0.02] hover:bg-white/[0.04] transition-all" style={{ borderColor: `${categoryColor(item.category)}25` }}><p className="text-[9px] font-mono-cyber mb-1" style={{ color: categoryColor(item.category) }}>{categoryLabel(item.category)}</p><h4 className="text-sm font-semibold text-white leading-tight mb-2">{item.title}</h4><p className="text-[10px] font-mono-cyber text-white/35">{item.source_name}</p></Link>)}
      </div>
    </section>
  );
}