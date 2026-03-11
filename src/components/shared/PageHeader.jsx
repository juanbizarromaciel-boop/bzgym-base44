import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1
          className="text-2xl md:text-3xl font-bold font-cyber tracking-widest text-white uppercase"
          style={{ textShadow: '0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-purple-400/50 mt-1 text-sm tracking-wider">{subtitle}</p>
        )}
        <div className="h-px w-32 mt-3 bg-gradient-to-r from-purple-500/60 to-transparent" />
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}