import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AdminStatCard({ label, value, icon: Icon, color, link }) {
  const inner = (
    <motion.div whileHover={{ scale: 1.03, y: -2 }} transition={{ duration: 0.18 }} className="relative rounded-xl p-4 border overflow-hidden cursor-pointer" style={{ borderColor: `${color}35`, background: `${color}08`, boxShadow: `0 0 20px ${color}15` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <Icon className="w-5 h-5 mb-2" style={{ color }} />
      <p className="font-cyber text-3xl font-black text-white" style={{ textShadow: `0 0 16px ${color}` }}>{value ?? "—"}</p>
      <p className="text-[10px] font-mono-cyber mt-1 tracking-wider uppercase" style={{ color: `${color}aa` }}>{label}</p>
    </motion.div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}