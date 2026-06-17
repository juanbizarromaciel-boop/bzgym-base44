import React from "react";
import { Bell, CheckCircle2, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminHero({ greeting, todayDate, userName, alerts, variants }) {
  return (
    <motion.div variants={variants} className="relative rounded-2xl overflow-hidden p-6 md:p-8" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(7,7,26,0.98) 45%, rgba(6,182,212,0.07))', border: '1px solid rgba(168,85,247,0.45)', boxShadow: '0 0 60px rgba(168,85,247,0.18), 0 8px 40px rgba(0,0,0,0.6)' }}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #a855f7 25%, #ec4899 50%, #06b6d4 75%, transparent)', boxShadow: '0 0 12px rgba(168,85,247,0.9)' }} />
      <div className="absolute top-0 left-0 w-6 h-6" style={{ borderTop: '2px solid #a855f7', borderLeft: '2px solid #a855f7' }} />
      <div className="absolute top-0 right-0 w-6 h-6" style={{ borderTop: '2px solid #06b6d4', borderRight: '2px solid #06b6d4' }} />
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono-cyber tracking-[0.4em] uppercase mb-2" style={{ color: '#c084fc' }}>◈ {todayDate}</p>
          <h1 className="font-cyber text-4xl md:text-5xl font-black tracking-widest" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #c084fc 45%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{greeting},</h1>
          <h2 className="font-cyber text-3xl font-black tracking-widest mt-1" style={{ color: '#a855f7', textShadow: '0 0 20px #a855f7' }}>{userName.toUpperCase()}</h2>
          <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg w-fit" style={{ border: '1px solid rgba(6,182,212,0.45)', background: 'rgba(6,182,212,0.08)' }}>
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono-cyber tracking-widest uppercase text-cyan-300">super administrador</span>
          </div>
        </div>
        {alerts.length === 0 ? <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ border: '1px solid rgba(52,211,153,0.45)', background: 'rgba(52,211,153,0.08)' }}><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-xs font-mono-cyber text-emerald-300">sistema ok</span></div> : <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl animate-pulse" style={{ border: '1px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.08)' }}><Bell className="w-4 h-4 text-amber-400" /><span className="text-xs font-mono-cyber text-amber-300">{alerts.length} alerta(s)</span></div>}
      </div>
    </motion.div>
  );
}