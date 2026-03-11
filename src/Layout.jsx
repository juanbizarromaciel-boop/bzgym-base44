import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Dumbbell, Users, ClipboardList, BarChart3, Timer, Menu, X,
  Library, LayoutDashboard, User
} from "lucide-react";

const adminNav = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Alunos", icon: Users, page: "Students" },
  { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
  { name: "Treinos", icon: ClipboardList, page: "WorkoutPlans" },
  { name: "Treinar Aluno", icon: Dumbbell, page: "StudentWorkout" },
  { name: "Progresso", icon: BarChart3, page: "Progress" },
  { name: "Cronômetro", icon: Timer, page: "TimerPage" },
];

const studentNav = [
  { name: "Meu Treino", icon: Dumbbell, page: "MyWorkout" },
  { name: "Progresso", icon: BarChart3, page: "Progress" },
  { name: "Cronômetro", icon: Timer, page: "TimerPage" },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    base44.auth.me().then((user) => {
      setRole(user?.role || "user");
      setUserName(user?.full_name || user?.email || "");
    }).catch(() => setRole("user"));
  }, []);

  const isAdmin = role === "admin";
  const navItems = isAdmin ? adminNav : studentNav;

  const NavLink = ({ item }) => {
    const isActive = currentPageName === item.page;
    return (
      <Link
        to={createPageUrl(item.page)}
        onClick={() => setSidebarOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 relative group
          ${isActive
            ? "text-white bg-purple-500/10 border-r-2 border-purple-400"
            : "text-purple-300/50 hover:text-purple-200 hover:bg-purple-500/5"
          }
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        )}
        <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-purple-400" : ""}`} />
        <span className="tracking-wide">{item.name}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,1)]" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#000000] bg-grid text-white">

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-purple-900/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69b152b7ec586487b4d800db/a7e184410_generated_image.png" alt="BZ" className="w-8 h-8 rounded-md object-cover" style={{boxShadow: '0 0 8px rgba(168,85,247,0.4)'}} />
          <div className="flex items-baseline gap-1.5">
            <span className="font-cyber text-base font-bold tracking-widest text-white" style={{textShadow: '0 0 10px rgba(168,85,247,0.6)'}}>BZ</span>
            <span className="font-cyber text-xs text-purple-400/50 tracking-widest">GYM</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-purple-400 hover:text-white p-1"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40
        bg-black border-r border-purple-900/30
        transition-transform duration-300 ease-out flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-purple-900/20 hidden lg:block">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69b152b7ec586487b4d800db/a7e184410_generated_image.png"
              alt="BZ GYM"
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              style={{boxShadow: '0 0 15px rgba(168,85,247,0.35), 0 0 30px rgba(168,85,247,0.1)'}}
            />
            <div>
              <h1 className="font-cyber font-black text-xl tracking-widest text-white leading-none" style={{textShadow: '0 0 15px rgba(168,85,247,0.6)'}}>
                BZ
              </h1>
              <p className="text-xs text-purple-400/50 tracking-[0.3em] uppercase font-cyber">GYM</p>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3 border-b border-purple-900/20">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isAdmin 
              ? "bg-purple-500/10 border border-purple-500/20" 
              : "bg-cyan-500/10 border border-cyan-500/20"
          }`}>
            <User className={`w-3.5 h-3.5 ${isAdmin ? "text-purple-400" : "text-cyan-400"}`} />
            <span className={`text-xs font-medium tracking-wider uppercase ${isAdmin ? "text-purple-400" : "text-cyan-400"}`}>
              {isAdmin ? "Professor" : "Aluno"}
            </span>
          </div>
          {userName && <p className="text-xs text-purple-300/40 mt-2 px-1 truncate">{userName}</p>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 mt-12 lg:mt-0">
          <div className="px-3 mb-3">
            <p className="text-[10px] text-purple-500/40 uppercase tracking-[0.2em] font-medium px-1">Menu</p>
          </div>
          {navItems.map((item) => (
            <NavLink key={item.page} item={item} />
          ))}
        </nav>

        {/* Bottom glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
        <div className="p-4">
          <p className="text-[10px] text-purple-500/30 text-center font-mono-cyber">SYSTEM v2.0</p>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}