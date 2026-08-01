import React from "react";
import { Link } from "react-router-dom";

export default function DashboardMetricScroller({ title, items }) {
  return (
    <section>
      <h2 className="app-section-title mb-2.5 text-[13px]">{title}</h2>
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ label, value, icon: Icon, path, tone }) => (
          <Link key={label} to={path} className="app-glass-card app-glass-card-interactive h-[128px] w-[94px] shrink-0 snap-start rounded-[17px] p-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><Icon className="h-[17px] w-[17px]" /></div>
            <p className="mt-4 text-[25px] font-medium leading-none tracking-tight text-professor">{value || 0}</p>
            <p className="mt-2 text-[9px] leading-tight text-professor-muted">{label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}