import React from "react";

export default function PageHeader({ title, subtitle, action, accentColor = "#a855f7" }) {
  const hex = accentColor;
  // derive rgba from hex for shadow
  const isHex = hex.startsWith("#");

  return (
    <div className="flex flex-col gap-0 mb-8">
      {/* Top neon line */}
      <div className="relative h-px w-full mb-5 overflow-visible">
        <div className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${hex}cc 25%, ${hex}ff 50%, ${hex}cc 75%, transparent)`,
            boxShadow: `0 0 8px ${hex}cc, 0 0 20px ${hex}66, 0 0 40px ${hex}33`,
          }}
        />
        {/* Center diamond */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45"
          style={{ background: hex, boxShadow: `0 0 8px ${hex}, 0 0 16px ${hex}bb` }} />
        {/* Side diamonds */}
        <div className="absolute top-1/2 left-[18%] -translate-y-1/2 w-1 h-1 rotate-45"
          style={{ background: hex + "bb", boxShadow: `0 0 5px ${hex}` }} />
        <div className="absolute top-1/2 right-[18%] -translate-y-1/2 w-1 h-1 rotate-45"
          style={{ background: hex + "bb", boxShadow: `0 0 5px ${hex}` }} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[9px] font-mono-cyber tracking-[0.35em] uppercase mb-1.5"
            style={{ color: `${hex}88` }}>
            ◈ BZ GYM SYSTEM
          </p>
          <h1 className="text-2xl md:text-3xl font-black font-cyber tracking-widest text-white uppercase leading-none"
            style={{ textShadow: `0 0 20px ${hex}66, 0 0 40px ${hex}33` }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-xs tracking-[0.22em] font-mono-cyber uppercase"
              style={{ color: hex, textShadow: `0 0 8px ${hex}bb, 0 0 20px ${hex}55` }}>
              ▸ {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Bottom accent line */}
      <div className="h-px mt-5"
        style={{ background: `linear-gradient(90deg, ${hex}55, ${hex}18 55%, transparent)` }} />
    </div>
  );
}