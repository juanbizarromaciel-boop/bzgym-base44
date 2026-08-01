import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function DashboardActionCards({ title, items }) {
  return (
    <section>
      <h2 className="app-section-title mb-2.5 text-[13px]">{title}</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {items.map(({ title: itemTitle, description, icon: Icon, path, tone }) => (
          <Link key={itemTitle} to={path} className="app-glass-card app-glass-card-interactive group flex h-[160px] min-w-0 flex-col rounded-[18px] p-3 text-center">
            <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border ${tone}`}><Icon className="h-5 w-5" /></div>
            <h3 className="mt-3 text-[11px] font-medium leading-tight text-professor">{itemTitle}</h3>
            <p className="mt-1.5 text-[9px] leading-snug text-professor-muted">{description}</p>
            <ArrowRight className="mx-auto mt-auto h-4 w-4 text-purple-200/80 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </section>
  );
}