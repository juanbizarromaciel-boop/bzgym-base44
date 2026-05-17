import React from "react";

export default function PageHeader({ title, subtitle, action, accentColor = "#a855f7" }) {
  const hex = accentColor;

  return (
    <div className="flex flex-col gap-0 mb-8">
      {/* Tech border top — scanline + diamonds */}
      <div className="relative h-[3px] w-full mb-5 overflow-visible">
        {/* Main glow line */}
        <div className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${hex}44 10%, ${hex}ff 40%, ${hex}ff 60%, ${hex}44 90%, transparent 100%)`,
            boxShadow: `0 0 12px ${hex}cc, 0 0 28px ${hex}88, 0 0 55px ${hex}44`,
          }}
        />
        {/* Center diamond */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45"
          style={{ background: hex, boxShadow: `0 0 12px ${hex}, 0 0 24px ${hex}cc, 0 0 40px ${hex}88` }} />
        {/* Side diamonds */}
        <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-1.5 h-1.5 rotate-45"
          style={{ background: hex + "cc", boxShadow: `0 0 8px ${hex}` }} />
        <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-1.5 h-1.5 rotate-45"
          style={{ background: hex + "cc", boxShadow: `0 0 8px ${hex}` }} />
        {/* Outer small dots */}
        <div className="absolute top-1/2 left-[5%] -translate-y-1/2 w-1 h-1 rotate-45"
          style={{ background: hex + "66" }} />
        <div className="absolute top-1/2 right-[5%] -translate-y-1/2 w-1 h-1 rotate-45"
          style={{ background: hex + "66" }} />
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        {/* Left tech corner */}
        <div className="absolute -left-1 -top-1 w-3 h-3 pointer-events-none"
          style={{ borderTop: `2px solid ${hex}cc`, borderLeft: `2px solid ${hex}cc` }} />

        <div>
          <p className="text-[9px] font-mono-cyber tracking-[0.4em] uppercase mb-1.5"
            style={{ color: `${hex}99`, textShadow: `0 0 8px ${hex}66` }}>
            ◈ BZ GYM SYSTEM
          </p>
          <h1 className="text-2xl md:text-3xl font-black font-cyber tracking-widest text-white uppercase leading-none"
            style={{ textShadow: `0 0 24px ${hex}88, 0 0 50px ${hex}44` }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-xs tracking-[0.22em] font-mono-cyber uppercase"
              style={{ color: hex, textShadow: `0 0 10px ${hex}cc, 0 0 22px ${hex}66` }}>
              ▸ {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Bottom accent line with tech notch */}
      <div className="relative h-px mt-5">
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(90deg, ${hex}88, ${hex}33 60%, transparent)` }} />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45"
          style={{ background: hex, boxShadow: `0 0 6px ${hex}` }} />
      </div>
    </div>
  );
}