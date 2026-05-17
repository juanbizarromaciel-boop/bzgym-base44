import React from "react";
import { Check, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemePresetCard({ theme, isActive, onApply }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
        isActive
          ? "border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
          : "border-purple-900/20 hover:border-purple-500/30"
      }`}
      style={{
        background: isActive
          ? "rgba(168,85,247,0.08)"
          : "rgba(7,5,22,0.95)",
      }}
      onClick={() => onApply(theme)}
    >
      {/* Active badge */}
      {isActive && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "rgba(168,85,247,0.8)" }}>
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      {theme.locked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3.5 h-3.5 text-yellow-400/60" />
        </div>
      )}

      {/* Color swatches */}
      <div className="flex gap-1 mb-3">
        {theme.preview.map((color, i) => (
          <div key={i} className="w-7 h-7 rounded-md border border-white/10 flex-shrink-0"
            style={{ background: color }} />
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{theme.emoji}</span>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{theme.name}</p>
          <p className="text-[10px] text-purple-400/50 font-mono-cyber mt-0.5 leading-tight">{theme.description}</p>
        </div>
      </div>

      {isActive && (
        <p className="text-[10px] font-mono-cyber text-purple-400 mt-2">✓ ativo</p>
      )}
    </motion.div>
  );
}