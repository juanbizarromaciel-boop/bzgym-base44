import React from "react";
import { Link } from "react-router-dom";

export default function AdminQuickAction({ label, icon: Icon, path, color }) {
  return (
    <Link to={path} className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:brightness-110 group" style={{ borderColor: `${color}25`, background: `${color}06` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
        <Icon className="w-4.5 h-4.5" style={{ color, filter: `drop-shadow(0 0 5px ${color})` }} />
      </div>
      <span className="text-[9px] font-mono-cyber text-center leading-tight" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
    </Link>
  );
}