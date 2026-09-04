import React from "react";
import { Camera, LayoutTemplate, Sparkles, Waves } from "lucide-react";

const templates = [
  { value: "photo_stats", label: "Performance", detail: "Foto + estatísticas", Icon: Camera, preview: "from-cyan-500/40 via-purple-600/30 to-black" },
  { value: "neon_pulse", label: "Neon Pulse", detail: "Energia e impacto", Icon: Waves, preview: "from-purple-500/50 via-fuchsia-800/30 to-cyan-600/30" },
  { value: "editorial", label: "Editorial", detail: "Forte e minimalista", Icon: LayoutTemplate, preview: "from-slate-700/50 via-black to-cyan-500/30" },
  { value: "violet_glass", label: "Violet Glass", detail: "Sofisticado e vítreo", Icon: Sparkles, preview: "from-violet-500/50 via-purple-950/60 to-cyan-900/40" },
];

export default function WorkoutShareTemplatePicker({ value, onChange }) {
  return <div className="grid grid-cols-2 gap-2.5">
    {templates.map(({ value: option, label, detail, Icon, preview }) => {
      const active = value === option;
      return <button key={option} type="button" onClick={() => onChange(option)} className={`overflow-hidden rounded-2xl border text-left transition-all ${active ? "border-cyan-400 ring-2 ring-cyan-400/20" : "border-purple-500/20 hover:border-purple-400/40"}`}>
        <div className={`relative h-24 bg-gradient-to-br ${preview}`}>
          <div className="absolute left-3 top-3 rounded-lg border border-white/20 bg-black/25 p-1.5"><Icon className="h-4 w-4 text-white" /></div>
          <div className="absolute bottom-3 left-3 right-3"><div className="mb-1 h-1.5 w-3/4 rounded-full bg-white/80" /><div className="h-1 w-1/2 rounded-full bg-cyan-300/70" /></div>
        </div>
        <div className={`px-3 py-2.5 ${active ? "bg-cyan-500/10" : "bg-purple-500/5"}`}><p className="text-xs font-semibold text-white">{label}</p><p className="mt-0.5 text-[10px] text-purple-200/55">{detail}</p></div>
      </button>;
    })}
  </div>;
}