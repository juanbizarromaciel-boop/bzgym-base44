import React from "react";

const colorMap = {
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: "text-purple-400",
    glow: "rgba(168,85,247,0.3)",
    value: "text-purple-300",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: "text-cyan-400",
    glow: "rgba(6,182,212,0.3)",
    value: "text-cyan-300",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    icon: "text-pink-400",
    glow: "rgba(236,72,153,0.3)",
    value: "text-pink-300",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: "text-orange-400",
    glow: "rgba(249,115,22,0.3)",
    value: "text-orange-300",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-400",
    glow: "rgba(16,185,129,0.3)",
    value: "text-emerald-300",
  },
};

export default function StatsCard({ title, value, icon: Icon, color = "purple" }) {
  const c = colorMap[color] || colorMap.purple;

  return (
    <div
      className={`cyber-card rounded-xl p-5 border ${c.border} transition-all duration-300`}
      style={{ background: 'rgba(5,5,15,0.9)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}
          style={{ boxShadow: `0 0 12px ${c.glow}` }}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <span className="text-[10px] text-purple-500/40 uppercase tracking-[0.15em] font-medium">{title}</span>
      </div>
      <p className={`text-4xl font-bold font-cyber ${c.value}`}
        style={{ textShadow: `0 0 15px ${c.glow}` }}>
        {value}
      </p>
    </div>
  );
}