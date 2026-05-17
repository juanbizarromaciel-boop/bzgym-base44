import React from "react";

const colorMap = {
  purple: { hex: "#a855f7", glow: "rgba(168,85,247,0.5)" },
  cyan:   { hex: "#06b6d4", glow: "rgba(6,182,212,0.5)" },
  pink:   { hex: "#ec4899", glow: "rgba(236,72,153,0.5)" },
  orange: { hex: "#f97316", glow: "rgba(249,115,22,0.5)" },
  emerald:{ hex: "#10b981", glow: "rgba(16,185,129,0.5)" },
  amber:  { hex: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
};

export default function StatsCard({ title, value, icon: Icon, color = "purple" }) {
  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="relative rounded-xl p-5 border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(145deg, var(--bg-card) 0%, var(--bg-void) 100%)`,
        borderColor: `${c.hex}50`,
        boxShadow: `0 4px 28px rgba(0,0,0,0.5), 0 0 20px ${c.hex}12, inset 0 1px 0 ${c.hex}18`,
      }}>
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c.hex}, transparent)` }} />
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
        style={{ borderTop: `1.5px solid ${c.hex}cc`, borderLeft: `1.5px solid ${c.hex}cc` }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none"
        style={{ borderBottom: `1.5px solid ${c.hex}55`, borderRight: `1.5px solid ${c.hex}55` }} />
      {/* Corner dot */}
      <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
        style={{ background: c.hex, boxShadow: `0 0 6px ${c.hex}` }} />
      {/* BG watermark icon */}
      {Icon && <Icon className="absolute bottom-2 right-2 w-10 h-10 opacity-5" style={{ color: c.hex }} />}

      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${c.hex}18`, border: `1px solid ${c.hex}40`, boxShadow: `0 0 10px ${c.hex}25` }}>
          {Icon && <Icon className="w-4 h-4" style={{ color: c.hex, filter: `drop-shadow(0 0 5px ${c.hex})` }} />}
        </div>
      </div>
      <p className="font-cyber text-4xl font-black leading-none"
        style={{ color: c.hex, textShadow: `0 0 20px ${c.hex}, 0 0 40px ${c.hex}70` }}>
        {value}
      </p>
      <p className="text-[11px] mt-2 font-mono-cyber tracking-wider uppercase font-semibold"
        style={{ color: 'var(--text-primary)', opacity: 0.85 }}>
        {title}
      </p>
    </div>
  );
}