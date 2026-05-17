import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Palette, RotateCcw, Plus, Bookmark, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/shared/PageHeader";
import ThemePresetCard from "@/components/themes/ThemePresetCard";
import SavedThemeCard from "@/components/themes/SavedThemeCard";
import ThemeEditor from "@/components/themes/ThemeEditor";
import { PRESET_THEMES, DEFAULT_THEME_VARS, applyThemeVars, resetToDefaultTheme } from "@/lib/themes";

const TABS = ["Temas Prontos", "Meus Temas", "Criar Tema"];

export default function AppThemes() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("Temas Prontos");
  const [activeThemeId, setActiveThemeId] = useState("default");
  const [savedThemes, setSavedThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      await loadSavedThemes(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadSavedThemes = async (u) => {
    if (!u) return;
    const themes = await base44.entities.UserTheme.filter({ user_email: u.email });
    setSavedThemes(themes);
    const active = themes.find(t => t.is_active);
    if (active) setActiveThemeId(active.id);
    else setActiveThemeId("default");
  };

  const applyPreset = async (theme) => {
    applyThemeVars(theme.vars);
    setActiveThemeId(theme.id);
    toast.success(`Tema "${theme.name}" aplicado!`);
    if (!user) return;
    try {
      // Desativa todos os temas salvos
      for (const t of savedThemes.filter(t => t.is_active)) {
        await base44.entities.UserTheme.update(t.id, { is_active: false });
      }
      // Salva preset como tema ativo
      const existing = savedThemes.find(t => t.theme_name === theme.name && t.is_system);
      if (existing) {
        await base44.entities.UserTheme.update(existing.id, { is_active: true, theme_data: theme.vars });
      } else {
        await base44.entities.UserTheme.create({
          user_email: user.email,
          theme_name: theme.name,
          theme_data: theme.vars,
          is_active: true,
          is_personal_default: false,
          is_system: true,
        });
      }
      await loadSavedThemes(user);
    } catch (e) { console.error(e); }
  };

  const restoreDefault = async () => {
    resetToDefaultTheme();
    setActiveThemeId("default");
    toast.success("Tema padrão restaurado!");
    if (!user) return;
    for (const t of savedThemes.filter(t => t.is_active)) {
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    }
    await loadSavedThemes(user);
  };

  const applyCustomTheme = async (themeVars, themeName) => {
    applyThemeVars(themeVars);
    setActiveThemeId("custom");
    toast.success(`Tema "${themeName}" aplicado!`);
    if (!user) return;
    for (const t of savedThemes.filter(t => t.is_active)) {
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    }
    await loadSavedThemes(user);
  };

  const saveCustomTheme = async (themeVars, themeName) => {
    if (!user) return;
    await base44.entities.UserTheme.create({
      user_email: user.email,
      theme_name: themeName,
      theme_data: themeVars,
      is_active: false,
      is_personal_default: false,
      is_system: false,
    });
    await loadSavedThemes(user);
    toast.success(`Tema "${themeName}" salvo!`);
    setTab("Meus Temas");
  };

  const applySavedTheme = async (theme) => {
    applyThemeVars(theme.theme_data);
    setActiveThemeId(theme.id);
    toast.success(`Tema "${theme.theme_name}" aplicado!`);
    for (const t of savedThemes.filter(t => t.is_active)) {
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    }
    await base44.entities.UserTheme.update(theme.id, { is_active: true });
    await loadSavedThemes(user);
  };

  const editSavedTheme = (theme) => {
    setEditingTheme(theme);
    setTab("Criar Tema");
  };

  const duplicateSavedTheme = async (theme) => {
    await base44.entities.UserTheme.create({
      user_email: user.email,
      theme_name: `${theme.theme_name} (Cópia)`,
      theme_data: theme.theme_data,
      is_active: false,
      is_personal_default: false,
      is_system: false,
    });
    await loadSavedThemes(user);
    toast.success("Tema duplicado!");
  };

  const deleteSavedTheme = async (theme) => {
    if (theme.is_system) { toast.error("Temas do sistema não podem ser excluídos."); return; }
    await base44.entities.UserTheme.delete(theme.id);
    await loadSavedThemes(user);
    toast.success("Tema excluído.");
  };

  const setPersonalDefault = async (theme) => {
    // Remove padrão pessoal anterior
    for (const t of savedThemes.filter(t => t.is_personal_default)) {
      await base44.entities.UserTheme.update(t.id, { is_personal_default: false });
    }
    // Define novo padrão pessoal
    const val = !theme.is_personal_default;
    await base44.entities.UserTheme.update(theme.id, { is_personal_default: val });
    await loadSavedThemes(user);
    toast.success(val ? "Tema definido como padrão pessoal!" : "Padrão pessoal removido.");
  };

  const saveEditedTheme = async (themeVars, themeName) => {
    if (!editingTheme) return;
    await base44.entities.UserTheme.update(editingTheme.id, {
      theme_data: themeVars,
      theme_name: themeName,
    });
    await loadSavedThemes(user);
    toast.success("Tema atualizado!");
    setEditingTheme(null);
    setTab("Meus Temas");
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const userSavedThemes = savedThemes.filter(t => !t.is_system);

  return (
    <div>
      <PageHeader
        title="Temas do App"
        subtitle="Personalize o visual do aplicativo"
        accentColor="#a855f7"
        action={
          <button onClick={restoreDefault}
            className="btn-neon-amber px-4 py-2 rounded-xl text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Restaurar Padrão
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl border border-purple-900/20 w-fit"
        style={{ background: "rgba(7,5,22,0.8)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); if (t !== "Criar Tema") setEditingTheme(null); }}
            className="px-4 py-2 rounded-lg text-xs font-mono-cyber transition-all"
            style={tab === t ? {
              background: "rgba(168,85,247,0.2)",
              border: "1px solid rgba(168,85,247,0.35)",
              color: "#c084fc",
            } : { color: "rgba(168,85,247,0.4)" }}>
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── TEMAS PRONTOS ─────────────────────── */}
        {tab === "Temas Prontos" && (
          <motion.div key="presets" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {PRESET_THEMES.map(theme => (
                <ThemePresetCard
                  key={theme.id}
                  theme={theme}
                  isActive={activeThemeId === theme.id || (
                    activeThemeId === "default" && theme.id === "default"
                  )}
                  onApply={() => applyPreset(theme)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── MEUS TEMAS ────────────────────────── */}
        {tab === "Meus Temas" && (
          <motion.div key="saved" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {userSavedThemes.length === 0 ? (
              <div className="cyber-card rounded-xl border border-purple-900/20 p-12 text-center">
                <Bookmark className="w-10 h-10 mx-auto mb-3 text-purple-500/20" />
                <p className="text-sm font-mono-cyber text-purple-500/30">// Nenhum tema salvo</p>
                <p className="text-xs text-purple-500/20 mt-1">Crie um tema personalizado e salve-o aqui</p>
                <button onClick={() => setTab("Criar Tema")}
                  className="mt-4 btn-neon-purple px-4 py-2 rounded-xl text-sm flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" /> Criar Tema
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {userSavedThemes.map(theme => (
                  <SavedThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={activeThemeId === theme.id}
                    onApply={applySavedTheme}
                    onEdit={editSavedTheme}
                    onDuplicate={duplicateSavedTheme}
                    onDelete={deleteSavedTheme}
                    onSetDefault={setPersonalDefault}
                  />
                ))}
                <button onClick={() => setTab("Criar Tema")}
                  className="rounded-xl border border-dashed border-purple-900/30 p-6 text-center hover:border-purple-500/30 transition-all group">
                  <Plus className="w-6 h-6 mx-auto mb-2 text-purple-500/30 group-hover:text-purple-500/60 transition-all" />
                  <p className="text-xs font-mono-cyber text-purple-500/30 group-hover:text-purple-500/50 transition-all">Novo Tema</p>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── CRIAR / EDITAR TEMA ───────────────── */}
        {tab === "Criar Tema" && (
          <motion.div key="editor" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="max-w-2xl">
              <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest mb-4">
                {editingTheme ? `// Editando: ${editingTheme.theme_name}` : "// Criar tema personalizado"}
              </p>
              <div className="cyber-card rounded-xl border border-purple-900/20 p-6">
                <ThemeEditor
                  initialVars={editingTheme?.theme_data}
                  onApply={applyCustomTheme}
                  onSave={editingTheme ? saveEditedTheme : saveCustomTheme}
                  onCancel={() => { setTab("Meus Temas"); setEditingTheme(null); }}
                  onRestore={restoreDefault}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensagem de suporte */}
      <div className="mt-8 rounded-xl border border-purple-900/20 p-4 flex items-start gap-3"
        style={{ background: "rgba(168,85,247,0.04)" }}>
        <MessageCircle className="w-5 h-5 text-purple-400/40 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-purple-400/40 font-mono-cyber leading-relaxed">
          Caso tenha dificuldade para configurar seu tema ou perceba algum problema visual, entre em contato com o administrador do aplicativo.
        </p>
      </div>
    </div>
  );
}