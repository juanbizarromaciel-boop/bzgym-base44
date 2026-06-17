import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminAlertLink({ alert, variants }) {
  return (
    <motion.div variants={variants}>
      <Link to={alert.link} className="flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all hover:brightness-110 group" style={{ borderColor: `${alert.color}30`, background: `${alert.color}06` }}>
        <div className="w-2 h-2 rounded-full" style={{ background: alert.color, boxShadow: `0 0 8px ${alert.color}` }} />
        <alert.icon className="w-4 h-4" style={{ color: alert.color }} />
        <span className="text-sm flex-1 font-semibold" style={{ color: `${alert.color}dd` }}>{alert.text}</span>
        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: alert.color }} />
      </Link>
    </motion.div>
  );
}