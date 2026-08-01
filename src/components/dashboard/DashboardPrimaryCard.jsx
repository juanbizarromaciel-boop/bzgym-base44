import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function DashboardPrimaryCard({ icon: Icon, eyebrow, title, subtitle, path, actionLabel = "Ver detalhes", tone = "purple" }) {
  const tones = {
    purple: "border-purple-300/20 bg-purple-400/10 text-purple-200",
    cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
    green: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-300/20 bg-amber-400/10 text-amber-200",
  };
  return (
    <section className="app-glass-card grid min-h-[132px] grid-cols-[48px_minmax(0,1fr)_auto] gap-3 rounded-[20px] p-3.5">
      <div className={`flex h-12 w-12 items-center justify-center self-center rounded-full border ${tones[tone] || tones.purple}`}><Icon className="h-[22px] w-[22px]" /></div>
      <div className="min-w-0 self-center"><p className="text-[10px] font-medium text-purple-200">{eyebrow}</p><h2 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-tight text-professor">{title}</h2>{subtitle && <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-professor-muted">{subtitle}</p>}</div>
      {path && <Link to={path} className="flex min-h-9 items-center gap-1 self-end whitespace-nowrap text-[10px] font-medium text-purple-200">{actionLabel}<ChevronRight className="h-3.5 w-3.5" /></Link>}
    </section>
  );
}