import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Dumbbell, Utensils, TrendingUp, MoreHorizontal
} from "lucide-react";

const studentTabs = [
  { label: "Início", icon: LayoutDashboard, path: "/StudentDashboard" },
  { label: "Treino", icon: Dumbbell, path: "/MyWorkout" },
  { label: "Dieta", icon: Utensils, path: "/MyDiet" },
  { label: "Progresso", icon: TrendingUp, path: "/Progress" },
];

const subscriberTabs = [
  { label: "Início", icon: LayoutDashboard, path: "/SubscriberDashboard" },
  { label: "Treino", icon: Dumbbell, path: "/MyWorkout" },
  { label: "Dieta", icon: Utensils, path: "/MyDiet" },
  { label: "Progresso", icon: TrendingUp, path: "/Progress" },
];

export default function BottomNav({ role, onMoreClick }) {
  const location = useLocation();

  const tabs = role === "assinante" ? subscriberTabs : studentTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        background: "linear-gradient(to top, rgba(6,4,18,0.98) 0%, rgba(8,5,22,0.96) 100%)",
        borderTop: "1px solid rgba(168,85,247,0.25)",
        boxShadow: "0 -4px 30px rgba(168,85,247,0.12), 0 -1px 0 rgba(168,85,247,0.15)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Top neon line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(6,182,212,0.4), rgba(168,85,247,0.6), transparent)",
        }}
      />

      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.path === "/StudentDashboard" && location.pathname === "/") ||
            (tab.path === "/SubscriberDashboard" && location.pathname === "/");

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative min-w-0"
              style={{
                background: isActive ? "rgba(168,85,247,0.12)" : "transparent",
                border: isActive ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-px rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, #a855f7, transparent)",
                    boxShadow: "0 0 8px #a855f7, 0 0 16px rgba(168,85,247,0.5)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <tab.icon
                className="w-5 h-5 flex-shrink-0"
                style={{
                  color: isActive ? "#d8b4fe" : "rgba(168,85,247,0.45)",
                  filter: isActive
                    ? "drop-shadow(0 0 6px rgba(168,85,247,0.9)) drop-shadow(0 0 12px rgba(168,85,247,0.5))"
                    : "none",
                  transition: "all 0.2s ease",
                }}
              />
              <span
                className="text-[9px] font-mono-cyber tracking-wider leading-none"
                style={{
                  color: isActive ? "#d8b4fe" : "rgba(168,85,247,0.35)",
                  textShadow: isActive ? "0 0 8px rgba(168,85,247,0.8)" : "none",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
          style={{ border: "1px solid transparent" }}
        >
          <MoreHorizontal
            className="w-5 h-5"
            style={{ color: "rgba(168,85,247,0.45)" }}
          />
          <span
            className="text-[9px] font-mono-cyber tracking-wider leading-none"
            style={{ color: "rgba(168,85,247,0.35)" }}
          >
            Mais
          </span>
        </button>
      </div>
    </nav>
  );
}