import React from "react";
import { Check, Pencil, Copy, Trash2, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function SavedThemeCard({ theme, isActive, onApply, onEdit, onDuplicate, onDelete, onSetDefault }) {
  const colors = Object.values(theme.theme_data || {}).filter(v =>
    typeof v === "string" && v.startsWith("#")
  ).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 transition-all ${
        isActive ? "border-purple-500/60" : "border-purple-900/20"
      }`}
      style={{ background: isActive ? "rgba(168,85,247,0.06)" : "rgba(7,5,22,0.95)" }}
    >
      {/* Color swatches */}
      <div className="flex gap-1 mb-3">
        {colors.length > 0
          ? colors.map((c, i) => (
              <div key={i} className="w-6 h-6 rounded border border-white/10" style={{ background: c }} />
            ))
          : [0,1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded border border-purple-900/20 bg-purple-500/10" />
            ))
        }
        {theme.is_personal_default && (
          <Star className="w-4 h-4 text-yellow-400 ml-auto flex-shrink-0" />
        )}
      </div>

      <p className="text-sm font-semibold text-white mb-1 truncate">{theme.theme_name}</p>
      {isActive && <p className="text-[10px] font-mono-cyber text-purple-400 mb-2">✓ ativo</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <button onClick={() => onApply(theme)}
          className="text-[10px] font-mono-cyber px-2 py-1 rounded-lg flex items-center gap-1 transition-all hover:scale-105"
          style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
          <Check className="w-3 h-3" /> Aplicar
        </button>
        <button onClick={() => onEdit(theme)}
          className="text-[10px] font-mono-cyber px-2 py-1 rounded-lg flex items-center gap-1 transition-all hover:scale-105"
          style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#22d3ee" }}>
          <Pencil className="w-3 h-3" /> Editar
        </button>
        <button onClick={() => onDuplicate(theme)}
          className="text-[10px] font-mono-cyber px-2 py-1 rounded-lg flex items-center gap-1 transition-all hover:scale-105"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
          <Copy className="w-3 h-3" /> Duplicar
        </button>
        <button onClick={() => onSetDefault(theme)}
          className="text-[10px] font-mono-cyber px-2 py-1 rounded-lg flex items-center gap-1 transition-all hover:scale-105"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
          <Star className="w-3 h-3" /> {theme.is_personal_default ? "Padrão ✓" : "Padrão"}
        </button>
        <button onClick={() => onDelete(theme)}
          className="text-[10px] font-mono-cyber px-2 py-1 rounded-lg flex items-center gap-1 transition-all hover:scale-105"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}