import React from "react";
import { Link } from "react-router-dom";

export default function DashboardLinkGrid({ title, items }) {
  return (
    <section>
      <h2 className="app-section-title mb-2.5 text-[13px]">{title}</h2>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ label, value, icon: Icon, path, tone }) => (
          <Link key={label} to={path} className="app-glass-card app-glass-card-interactive flex h-[128px] min-w-0 flex-col rounded-[17px] p-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><Icon className="h-[17px] w-[17px]" /></div>
            {value !== undefined && <p className="mt-4 text-[25px] font-medium leading-none tracking-tight text-professor">{value}</p>}
            <p className={`${value !== undefined ? "mt-2" : "mt-auto"} text-[9px] font-medium leading-tight text-professor-muted`}>{label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}