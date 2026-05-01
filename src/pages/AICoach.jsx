import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIFoodGenerator from "../components/ai/AIFoodGenerator";
import AIDietGenerator from "../components/ai/AIDietGenerator";
import AIWorkoutGenerator from "../components/ai/AIWorkoutGenerator";
import { Sparkles, Utensils, Dumbbell, ClipboardList, Settings, Zap, Shield } from "lucide-react";
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
      {/* Header */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="cyber-orb w-80 h-80 opacity-30" style={{ background: 'rgba(168,85,247,0.4)', top: '-60px', left: '-40px', animationDelay: '0s' }} />
          <div className="cyber-orb w-60 h-60 opacity-20" style={{ background: 'rgba(6,182,212,0.4)', bottom: '-40px', right: '80px', animationDelay: '6s' }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(6,182,212,0.2))', border: '1px solid rgba(168,85,247,0.4)', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <p className="text-[10px] font-mono-cyber tracking-[0.3em] uppercase" style={{ color: 'rgba(192,132,252,0.6)' }}>powered by openai</p>
              <h1 className="font-cyber text-3xl md:text-4xl text-white tracking-widest leading-none"
                style={{ textShadow: '0 0 30px rgba(168,85,247,0.5)' }}>
                BZ <span style={{ color: '#c084fc' }}>AI</span> COACH
              </h1>
            </div>
          </div>
          <p className="text-sm mt-3 ml-0.5" style={{ color: 'rgba(196,181,224,0.7)' }}>
            Assistente inteligente para cadastro de alimentos, montagem de dietas e criação de treinos.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono-cyber"
              style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.07)', color: '#6ee7b7' }}>
              <Shield className="w-3 h-3" /> Revisão obrigatória antes de salvar
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono-cyber"
              style={{ borderColor: 'rgba(168,85,247,0.25)', background: 'rgba(168,85,247,0.07)', color: '#c084fc' }}>
              <Zap className="w-3 h-3" /> API key nunca exposta no frontend
            </span>
            {!settings?.enabled && (
              <Link to="/AISettings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono-cyber transition-all hover:scale-105"
                style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)', color: '#fcd34d' }}>
                <Settings className="w-3 h-3" /> Configurar API Key →
              </Link>
            )}
          </div>
          <div className="mt-5 h-px" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.4), rgba(6,182,212,0.2), transparent)' }} />
        </div>
      </div>

      {/* Aviso se IA desativada */}
      {settings && !settings.enabled && (
        <div className="mb-6 p-4 rounded-xl border flex items-start gap-3"
          style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)' }}>
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">IA desativada nas configurações</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(196,181,224,0.6)' }}>
              Você pode usar a IA normalmente, mas ela está marcada como desativada. <Link to="/AISettings" className="text-amber-400 hover:underline">Ativar nas configurações →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="food">
        <TabsList className="w-full mb-6 p-1 rounded-xl" style={{ background: 'rgba(6,4,18,0.95)', border: '1px solid rgba(168,85,247,0.18)' }}>
          <TabsTrigger value="food" className="flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-semibold tracking-wider py-2.5 data-[state=active]:text-white"
            style={{ '--tw-ring-color': 'transparent' }}>
            <Utensils className="w-4 h-4" /> ALIMENTOS
          </TabsTrigger>
          <TabsTrigger value="diet" className="flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-semibold tracking-wider py-2.5 data-[state=active]:text-white">
            <ClipboardList className="w-4 h-4" /> DIETA
          </TabsTrigger>
          <TabsTrigger value="workout" className="flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-semibold tracking-wider py-2.5 data-[state=active]:text-white">
            <Dumbbell className="w-4 h-4" /> TREINO
          </TabsTrigger>
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
      </Tabs>
    </div>
  );
}