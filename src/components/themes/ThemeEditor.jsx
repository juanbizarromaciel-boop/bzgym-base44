import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { applyThemeVars, DEFAULT_THEME_VARS, getContrastRatio } from "@/lib/themes";
import { AlertTriangle, Eye, Save, X, RotateCcw } from "lucide-react";

const EDITABLE_VARS = [
  { key: "--bg-void",      label: "Fundo Principal",       group: "Fundos" },
  { key: "--bg-dark",      label: "Fundo Secundário",      group: "Fundos" },
  { key: "--bg-card",      label: "Fundo dos Cards",       group: "Fundos" },
  { key: "--bg-card2",     label: "Fundo Cards Alt",       group: "Fundos" },
  { key: "--neon-purple",  label: "Cor de Destaque 1",     group: "Destaques" },
  { key: "--neon-cyan",    label: "Cor de Destaque 2",     group: "Destaques" },
  { key: "--neon-pink",    label: "Cor de Destaque 3",     group: "Destaques" },
  { key: "--neon-amber",   label: "Cor de Destaque 4",     group: "Destaques" },
  { key: "--neon-green",   label: "Cor de Destaque 5",     group: "Destaques" },
  { key: "--text-primary", label: "Texto Principal",       group: "Textos" },
  { key: "--text-secondary",label: "Texto Secundário",     group: "Textos" },
  { key: "--text-muted",   label: "Texto Muted",           group: "Textos" },
];

function isValidHex(hex) {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);
}

function getWarnings(vars) {
  const warnings = [];
  const bg = vars["--bg-void"];
  const text = vars["--text-primary"];
  if (isValidHex(bg) && isValidHex(text)) {
    const ratio = getContrastRatio(bg, text);
    if (ratio < 3) {
      warnings.push("⚠️ Contraste muito baixo entre fundo e texto principal. Pode dificultar a leitura.");
    }
  }
  if (bg && text && bg.toLowerCase() === text.toLowerCase()) {
    warnings.push("⚠️ Fundo e texto têm a mesma cor — o texto ficará invisível.");
  }
  return warnings;
}

export default function ThemeEditor({ initialVars, onApply, onSave, onCancel, onRestore }) {
  const [vars, setVars] = useState(() => {
    const base = { ...DEFAULT_THEME_VARS };
    const hexKeys = EDITABLE_VARS.map(v => v.key);
    hexKeys.forEach(k => {
      if (initialVars?.[k]) base[k] = initialVars[k];
    });
    return base;
  });
  const [themeName, setThemeName] = useState("Meu Tema Personalizado");
  const [previewActive, setPreviewActive] = useState(false);

  const warnings = getWarnings(vars);

  const updateVar = (key, value) => {
    setVars(prev => ({ ...prev, [key]: value }));
  };

  const handlePreview = () => {
    applyThemeVars(vars);
    setPreviewActive(true);
  };

  const handleCancel = () => {
    onRestore();
    setPreviewActive(false);
    onCancel();
  };

  const groups = [...new Set(EDITABLE_VARS.map(v => v.group))];

  return (
    <div className="space-y-5">
      {/* Nome do tema */}
      <div>
        <label className="text-[10px] font-mono-cyber text-purple-500/50 uppercase tracking-widest mb-1 block">
          Nome do Tema
        </label>
        <Input
          value={themeName}
          onChange={e => setThemeName(e.target.value)}
          className="cyber-input"
          placeholder="Ex: Meu Tema Azul"
        />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Color groups */}
      {groups.map(group => (
        <div key={group}>
          <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-[0.2em] mb-2">
            // {group}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EDITABLE_VARS.filter(v => v.group === group).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={isValidHex(vars[key]) ? vars[key] : "#000000"}
                  onChange={e => updateVar(key, e.target.value)}
                  className="w-8 h-8 rounded-lg border border-purple-900/30 cursor-pointer bg-transparent p-0.5 flex-shrink-0"
                  title={label}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{label}</p>
                  <input
                    value={vars[key]}
                    onChange={e => updateVar(key, e.target.value)}
                    className="w-full text-[10px] font-mono-cyber text-purple-400/60 bg-transparent border-b border-purple-900/20 focus:border-purple-500/40 outline-none"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button onClick={handlePreview}
          className="btn-neon-cyan px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <Eye className="w-4 h-4" /> Pré-visualizar
        </button>
        <button
          onClick={() => onApply(vars, themeName)}
          disabled={warnings.some(w => w.includes("invisível"))}
          className="btn-neon-purple px-4 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-40">
          <Eye className="w-4 h-4" /> Aplicar Tema
        </button>
        <button onClick={() => onSave(vars, themeName)}
          className="btn-neon-green px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <Save className="w-4 h-4" /> Salvar Tema
        </button>
        <button onClick={onRestore}
          className="btn-neon-amber px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Restaurar Padrão
        </button>
        <button onClick={handleCancel}
          className="px-4 py-2 rounded-xl text-sm border border-purple-900/30 text-purple-400/50 hover:bg-purple-500/5 transition-all flex items-center gap-2">
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}