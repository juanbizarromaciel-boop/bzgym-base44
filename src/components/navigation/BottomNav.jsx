import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { getBottomNavigation } from "@/components/navigation/navigationConfig";
import MoreMenuScreen from "@/components/navigation/MoreMenuScreen";

export default function BottomNav({ role }) {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const tabs = getBottomNavigation(role);
  return <><MoreMenuScreen open={showMore} role={role} onClose={() => setShowMore(false)} /><nav className="app-glass-nav fixed left-4 right-4 z-40 mx-auto h-[72px] max-w-[398px] overflow-hidden rounded-[23px] lg:hidden" style={{ bottom: "calc(8px + env(safe-area-inset-bottom))" }} aria-label="Navegação principal"><div className="flex h-full items-center justify-around px-2 py-2">{tabs.map(tab => {
    const active = location.pathname === tab.route || (location.pathname === "/" && tab.isHome);
    const Icon = tab.icon;
    return <Link key={tab.id} to={tab.route} aria-current={active ? "page" : undefined} className="relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors" style={{ background: active ? "hsl(var(--app-primary) / 0.1)" : "transparent" }}>{active && <motion.span layoutId="bottom-nav-indicator" className="absolute -top-px left-1/2 h-px w-8 -translate-x-1/2 rounded-full bg-app-primary" />}<Icon className={`h-5 w-5 ${active ? "text-purple-200" : "text-purple-400/45"}`} /><span className={`truncate text-[10px] leading-none ${active ? "text-purple-200" : "text-purple-400/50"}`}>{tab.label}</span></Link>;
  })}<button data-cybernav-trigger aria-expanded={showMore} onClick={() => setShowMore(true)} className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-purple-400/50"><MoreHorizontal className="h-5 w-5" /><span className="text-[10px] leading-none">Mais</span></button></div></nav></>;
}