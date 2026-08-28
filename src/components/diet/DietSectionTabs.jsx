import React from "react";
import { Calculator, CheckSquare, History, Utensils } from "lucide-react";

const tabs = [
  { id: "plano", label: "Minha dieta", icon: Utensils },
  { id: "checklist", label: "Checklist", icon: CheckSquare },
  { id: "historico", label: "Histórico", icon: History },
  { id: "simulador", label: "Simulador", icon: Calculator },
];

export default function DietSectionTabs({ activeTab, onChange }) {
  return <nav aria-label="Seções da dieta" className="app-glass-card mb-6 grid grid-cols-4 gap-1 rounded-2xl p-1.5">
    {tabs.map(tab => {
      const active = activeTab === tab.id;
      const Icon = tab.icon;
      return <button key={tab.id} onClick={() => onChange(tab.id)} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 transition-colors ${active ? "border-app-primary/35 bg-app-primary/20 text-app-text" : "border-transparent text-app-muted"}`}>
        <Icon className={`h-4 w-4 ${active ? "text-app-primary" : "text-app-muted"}`} />
        <span className="w-full truncate text-center text-[9px] font-semibold leading-tight sm:text-xs">{tab.label}</span>
      </button>;
    })}
  </nav>;
}