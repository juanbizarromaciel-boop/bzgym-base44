import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dumbbell,
  Users,
  ClipboardList,
  BarChart3,
  Timer,
  Menu,
  X,
  Library,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", icon: Home, page: "Dashboard" },
  { name: "Alunos", icon: Users, page: "Students" },
  { name: "Exercícios", icon: Library, page: "ExerciseLibrary" },
  { name: "Treinos", icon: ClipboardList, page: "WorkoutPlans" },
  { name: "Treinar", icon: Dumbbell, page: "StudentWorkout" },
  { name: "Evolução", icon: BarChart3, page: "Progress" },
  { name: "Cronômetro", icon: Timer, page: "TimerPage" },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <style>{`
        :root {
          --accent: #10B981;
          --accent-hover: #059669;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111827; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-emerald-500" />
          <span className="font-bold text-lg tracking-tight">FitCoach</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white hover:bg-gray-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900/95 backdrop-blur-md border-r border-gray-800 z-40
        transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-800 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">FitCoach</h1>
              <p className="text-xs text-gray-500">Personal Trainer</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-16 lg:mt-0">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                  }
                `}
              >
                <item.icon className={`w-4.5 h-4.5 ${isActive ? "text-emerald-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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