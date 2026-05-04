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
      <div className="relative mb-8 rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(6,182,212,0.05) 60%, rgba(8,4,22,0.9) 100%)', border: '1px solid rgba(168,85,247,0.22)', boxShadow: '0 0 40px rgba(168,85,247,0.08), inset 0 1px 0 rgba(168,85,247,0.12)' }}>

        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="cyber-orb w-72 h-72 opacity-25" style={{ background: 'rgba(168,85,247,0.5)', top: '-80px', left: '-50px', animationDelay: '0s' }} />
          <div className="cyber-orb w-48 h-48 opacity-15" style={{ background: 'rgba(6,182,212,0.5)', bottom: '-40px', right: '60px', animationDelay: '5s' }} />
        </div>

        <div className="relative z-10">
          {/* Logo row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(6,182,212,0.2))', border: '1px solid rgba(168,85,247,0.5)', boxShadow: '0 0 25px rgba(168,85,247,0.4)' }}>
              <BrainCircuit className="w-7 h-7 text-purple-200" style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,1))' }} />
            </div>
            <div>
              <p className="text-[9px] font-mono-cyber tracking-[0.4em] uppercase mb-0.5" style={{ color: 'rgba(192,132,252,0.55)' }}>
                powered by openai
              </p>
              <h1 className="font-cyber text-3xl md:text-4xl leading-none"
                style={{ color: '#fff', textShadow: '0 0 35px rgba(168,85,247,0.6), 0 0 70px rgba(168,85,247,0.2)' }}>
                BZ <span style={{ color: '#c084fc', textShadow: '0 0 20px rgba(192,132,252,0.9)' }}>AI</span> COACH
              </h1>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(210,190,240,0.75)', maxWidth: 520 }}>
            Assistente inteligente para cadastro de alimentos, montagem de dietas, criação de treinos e gerenciamento da biblioteca de exercícios.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono-cyber"
              style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.07)', color: '#6ee7b7' }}>
              <Shield className="w-3 h-3" /> Revisão antes de salvar
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono-cyber"
              style={{ borderColor: 'rgba(168,85,247,0.25)', background: 'rgba(168,85,247,0.07)', color: '#c084fc' }}>
              <Zap className="w-3 h-3" /> API key segura no backend
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono-cyber"
              style={{ borderColor: 'rgba(6,182,212,0.25)', background: 'rgba(6,182,212,0.06)', color: '#22d3ee' }}>
              <Sparkles className="w-3 h-3" /> Geração de imagens IA
            </span>
            {!settings?.enabled && (
              <Link to="/AISettings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono-cyber transition-all hover:scale-105"
                style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)', color: '#fcd34d' }}>
                <Settings className="w-3 h-3" /> Configurar API Key →
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