import React from "react";
import { AlignCenter, ArrowDown, ArrowUp, PanelLeft } from "lucide-react";

const templates = [
  { value: "photo_stats", label: "Topo", detail: "Estatísticas no alto", Icon: ArrowUp, position: "items-start pt-8" },
  { value: "neon_pulse", label: "Centro", detail: "Destaque central", Icon: AlignCenter, position: "items-center justify-center" },
  { value: "editorial", label: "Rodapé", detail: "Leitura na base", Icon: ArrowDown, position: "items-end pb-8" },
  { value: "violet_glass", label: "Lateral", detail: "Coluna à esquerda", Icon: PanelLeft, position: "items-start justify-center" },
];

export default function WorkoutShareTemplatePicker({ value, onChange }) {
  return <div className="grid grid-cols-2 gap-2.5">
    {templates.map(({ value: option, label, detail, Icon, position }) => {
      const active = value === option;
      return <button key={option} type="button" onClick={() => onChange(option)} className={`overflow-hidden rounded-2xl border text-left transition-all ${active ? "border-app-primary ring-2 ring-app-primary/20" : "border-app-primary/15 hover:border-app-primary/35"}`}>
        <div className={`relative flex h-24 bg-gradient-to-br from-app-highlight via-app-surface to-app-bg ${position}`}>
          <div className="absolute left-3 top-3 rounded-lg border border-app-primary/20 bg-app-bg/60 p-1.5"><Icon className="h-4 w-4 text-app-text" /></div>
          <div className="mx-3 w-3/4 space-y-1"><div className="h-1.5 w-4/5 rounded-full bg-app-text/80" /><div className="h-1 w-1/2 rounded-full bg-app-text/45" /><div className="h-1 w-2/3 rounded-full bg-app-text/45" /></div>
        </div>
        <div className={`px-3 py-2.5 ${active ? "bg-app-primary/10" : "bg-app-surface/60"}`}><p className="text-xs font-semibold text-app-text">{label}</p><p className="mt-0.5 text-[10px] text-app-muted">{detail}</p></div>
      </button>;
    })}
  </div>;
}