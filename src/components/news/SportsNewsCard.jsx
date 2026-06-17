import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Bookmark, Share2, ExternalLink, Flag } from "lucide-react";
import { categoryColor, categoryLabel, formatNewsDate } from "./newsConfig";

export default function SportsNewsCard({ news, liked, saved, likesCount = 0, onLike, onSave, onShare, onReport, compact = false }) {
  const color = categoryColor(news.category);
  return (
    <motion.article whileHover={{ y: -3 }} transition={{ duration: 0.18 }}
      className="relative rounded-2xl border overflow-hidden group"
      style={{ background: "rgba(4,4,14,0.88)", borderColor: `${color}30`, boxShadow: `0 0 26px ${color}10` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="relative h-44 overflow-hidden bg-purple-950/20">
        {news.image_url ? (
          <img src={news.image_url} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-950/50 to-cyan-950/20">
            <span className="font-cyber text-xs tracking-[0.35em] text-purple-300/40">BZ SPORTS</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        {news.is_featured && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-mono-cyber uppercase tracking-wider text-white bg-pink-500/25 border border-pink-400/40">Destaque</span>}
        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-mono-cyber uppercase tracking-wider" style={{ color, background: `${color}18`, border: `1px solid ${color}45` }}>{categoryLabel(news.category)}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 text-[10px] font-mono-cyber text-purple-300/45">
          <span className="truncate">{news.source_name}</span>
          <span className="flex-shrink-0">{formatNewsDate(news.published_at || news.created_date)}</span>
        </div>
        <h3 className={`${compact ? "text-base" : "text-lg"} font-bold text-white leading-tight`}>{news.title}</h3>
        <p className="text-sm text-white/62 leading-relaxed">{news.summary}</p>
        <div className="flex items-center justify-between pt-2 border-t border-purple-900/20">
          <div className="flex items-center gap-2">
            <button onClick={() => onLike?.(news)} className="p-2 rounded-lg transition-all" style={{ color: liked ? "#ec4899" : "rgba(255,255,255,0.45)", background: liked ? "rgba(236,72,153,0.12)" : "transparent" }} title="Curtir">
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            </button>
            <span className="text-[10px] font-mono-cyber text-white/35">{likesCount}</span>
            <button onClick={() => onSave?.(news)} className="p-2 rounded-lg transition-all" style={{ color: saved ? "#06b6d4" : "rgba(255,255,255,0.45)", background: saved ? "rgba(6,182,212,0.12)" : "transparent" }} title="Salvar">
              <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
            </button>
            <button onClick={() => onShare?.(news)} className="p-2 rounded-lg text-white/45 hover:text-cyan-300 transition-all" title="Compartilhar"><Share2 className="w-4 h-4" /></button>
            <button onClick={() => onReport?.(news)} className="p-2 rounded-lg text-white/30 hover:text-amber-300 transition-all" title="Denunciar"><Flag className="w-4 h-4" /></button>
          </div>
          <Link to={`/SportsNewsDetail?id=${news.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-125" style={{ color: "#fff", background: `${color}18`, border: `1px solid ${color}45` }}>
            Ler mais <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}