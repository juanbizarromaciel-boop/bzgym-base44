import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="app-glass-card mb-6 flex flex-col gap-4 rounded-[20px] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="app-section-title text-[11px] uppercase tracking-[0.18em]">BZ Gym System</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-app-text md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-app-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}