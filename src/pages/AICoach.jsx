import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIFoodGenerator from "../components/ai/AIFoodGenerator";
import AIDietGenerator from "../components/ai/AIDietGenerator";
import AIWorkoutGenerator from "../components/ai/AIWorkoutGenerator";
import AIExerciseManager from "../components/ai/AIExerciseManager";
import AIImageAnalyzer from "../components/ai/AIImageAnalyzer";
import {
  Sparkles, Utensils, Dumbbell, ClipboardList,
  Settings, Zap, Shield, Library, BrainCircuit, Camera
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AICoach() {
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    base44.entities.AISettings.list().then(list => {
      setSettings(list[0] || null);
      setLoadingSettings(false);
    }).catch(() => setLoadingSettings(false));
  }, []);

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative mb-8 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d0820 0%, #080418 50%, #060214 100%)',
          border: '1px solid rgba(168,85,247,0.25)',
          boxShadow: '0 0 0 1px rgba(168,85,247,0.06) inset, 0 20px 60px rgba(0,0,0,0.6)'
        }}>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.8) 30%, rgba(6,182,212,0.6) 70%, transparent 100%)' }} />

        {/* Side glow */}
        <div className="absolute top-0 bottom-0 left-0 w-px"
          style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.6) 0%, rgba(168,85,247,0.1) 60%, transparent 100%)' }} />

        <div className="p-6">
          {/* Top row: icon + title + badge */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(88,28,235,0.2) 100%)',
                    border: '1px solid rgba(168,85,247,0.45)',
                    boxShadow: '0 0 20px rgba(168,85,247,0.25), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}>
                  <BrainCircuit className="w-7 h-7" style={{ color: '#e4b4ff', filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.9))' }} />
                </div>
                {/* Pulse dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
                  style={{ background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.9)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              <div>
                <p className="text-[9px] font-mono-cyber tracking-[0.45em] uppercase mb-1"
                  style={{ color: 'rgba(192,132,252,0.45)' }}>
                  powered by openai
                </p>
                <h1 className="font-cyber text-2xl md:text-3xl leading-none tracking-wider">
                  <span style={{ color: '#ffffff' }}>BZ </span>
                  <span style={{ color: '#c084fc', textShadow: '0 0 24px rgba(192,132,252,0.7)' }}>AI</span>
                  <span style={{ color: '#ffffff' }}> COACH</span>
                </h1>
              </div>
            </div>

            {/* Status pill */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 neon-dot" />
              <span className="text-[9px] font-mono-cyber text-emerald-400/80 tracking-wider">ONLINE</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-5"
            style={{ color: 'rgba(196,181,224,0.65)', maxWidth: 500 }}>
            Assistente inteligente para cadastro de alimentos, montagem de dietas, criação de treinos e gerenciamento da biblioteca de exercícios.
          </p>

          {/* Divider */}
          <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 60%, transparent 100%)' }} />

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono-cyber"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', color: '#6ee7b7' }}>
              <Shield className="w-3 h-3" /> Revisão antes de salvar
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono-cyber"
              style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.18)', color: '#c084fc' }}>
              <Zap className="w-3 h-3" /> API key segura
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono-cyber"
              style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)', color: '#22d3ee' }}>
              <Sparkles className="w-3 h-3" /> Imagens com IA
            </span>
            {!settings?.enabled && (
              <Link to="/AISettings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono-cyber transition-all hover:scale-105"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.28)', color: '#fcd34d' }}>
                <Settings className="w-3 h-3" /> Configurar →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Warning if disabled ─────────────────────────────────── */}
      {settings && !settings.enabled && (
        <div className="mb-6 p-4 rounded-xl border flex items-start gap-3"
          style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)' }}>
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">IA desativada nas configurações</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(196,181,224,0.6)' }}>
              Você pode usar a IA normalmente, mas ela está marcada como desativada.{" "}
              <Link to="/AISettings" className="text-amber-400 hover:underline">Ativar nas configurações →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="food">
        <TabsList className="w-full mb-6 p-1 rounded-xl gap-1"
          style={{ background: 'rgba(6,4,18,0.97)', border: '1px solid rgba(168,85,247,0.18)' }}>
          {[
            { value: "food", icon: Utensils, label: "ALIMENTOS" },
            { value: "diet", icon: ClipboardList, label: "DIETA" },
            { value: "workout", icon: Dumbbell, label: "TREINO" },
            { value: "exercises", icon: Library, label: "EXERCÍCIOS" },
            { value: "photo", icon: Camera, label: "FOTO IA" },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger key={value} value={value}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[10px] sm:text-xs font-semibold tracking-wider py-2.5 transition-all data-[state=active]:text-white data-[state=inactive]:text-purple-500/40"
              style={{ '--tw-ring-color': 'transparent' }}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.slice(0, 4)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="food">
          <AIFoodGenerator settings={settings} />
        </TabsContent>
        <TabsContent value="diet">
          <AIDietGenerator settings={settings} />
        </TabsContent>
        <TabsContent value="workout">
          <AIWorkoutGenerator settings={settings} />
        </TabsContent>
        <TabsContent value="exercises">
          <AIExerciseManager settings={settings} />
        </TabsContent>
        <TabsContent value="photo">
          <AIImageAnalyzer settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}