import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="w-full">
        {/* Neon gothic stripe */}
        <div className="relative h-px w-full mb-4 overflow-visible">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.9) 20%, rgba(192,132,252,1) 50%, rgba(168,85,247,0.9) 80%, transparent)',
              boxShadow: '0 0 8px rgba(168,85,247,0.9), 0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2)',
            }}
          />
          {/* Center diamond ornament */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45"
            style={{
              background: '#c084fc',
              boxShadow: '0 0 8px rgba(192,132,252,1), 0 0 16px rgba(168,85,247,0.8)',
            }}
          />
          {/* Side ornaments */}
          <div
            className="absolute top-1/2 left-[20%] -translate-y-1/2 w-1 h-1 rotate-45"
            style={{ background: 'rgba(168,85,247,0.7)', boxShadow: '0 0 6px rgba(168,85,247,0.9)' }}
          />
          <div
            className="absolute top-1/2 right-[20%] -translate-y-1/2 w-1 h-1 rotate-45"
            style={{ background: 'rgba(168,85,247,0.7)', boxShadow: '0 0 6px rgba(168,85,247,0.9)' }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold font-cyber tracking-widest text-white uppercase"
              style={{ textShadow: '0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-1 text-sm tracking-[0.25em] font-cyber uppercase"
                style={{
                  color: '#c084fc',
                  textShadow: '0 0 10px rgba(192,132,252,0.8), 0 0 22px rgba(168,85,247,0.4)',
                }}
              >
                ▸ {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>

        {/* Bottom accent line */}
        <div className="h-px mt-4"
          style={{
            background: 'linear-gradient(90deg, rgba(168,85,247,0.6), rgba(168,85,247,0.1) 60%, transparent)',
          }}
        />
      </div>
    </div>
  );
}