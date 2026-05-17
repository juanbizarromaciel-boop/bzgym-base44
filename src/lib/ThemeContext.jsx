import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { applyThemeVars, DEFAULT_THEME_VARS, resetToDefaultTheme } from "./themes";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeThemeId, setActiveThemeId] = useState("default");
  const [activeThemeName, setActiveThemeName] = useState("Tema Padrão");
  const [savedThemes, setSavedThemes] = useState([]);

  // Carrega usuário e tema salvo
  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) return;
      setUser(u);
      // Busca temas salvos do usuário
      const themes = await base44.entities.UserTheme.filter({ user_email: u.email });
      setSavedThemes(themes);
      // Aplica tema ativo ou padrão pessoal
      const active = themes.find(t => t.is_active);
      const personalDefault = themes.find(t => t.is_personal_default);
      const toApply = active || personalDefault;
      if (toApply && toApply.theme_data) {
        applyThemeVars(toApply.theme_data);
        setActiveThemeId(toApply.id);
        setActiveThemeName(toApply.theme_name);
      }
    }).catch(() => {});
  }, []);

  const applyTheme = useCallback(async (themeId, themeVars, themeName) => {
    applyThemeVars(themeVars);
    setActiveThemeId(themeId);
    setActiveThemeName(themeName);
    // Salva no perfil do usuário
    if (!user) return;
    try {
      const themes = await base44.entities.UserTheme.filter({ user_email: user.email });
      // Desativa tema anterior
      for (const t of themes) {
        if (t.is_active) {
          await base44.entities.UserTheme.update(t.id, { is_active: false });
        }
      }
      // Cria ou atualiza registro de tema ativo
      const existing = themes.find(t => t.id === themeId);
      if (existing) {
        await base44.entities.UserTheme.update(existing.id, {
          is_active: true,
          theme_data: themeVars,
          theme_name: themeName,
        });
      } else {
        await base44.entities.UserTheme.create({
          user_email: user.email,
          theme_name: themeName,
          theme_data: themeVars,
          is_active: true,
          is_personal_default: false,
          is_system: false,
        });
      }
      const updated = await base44.entities.UserTheme.filter({ user_email: user.email });
      setSavedThemes(updated);
    } catch (e) {
      console.error("Erro ao salvar tema:", e);
    }
  }, [user]);

  const restoreDefault = useCallback(async () => {
    resetToDefaultTheme();
    setActiveThemeId("default");
    setActiveThemeName("Tema Padrão");
    if (!user) return;
    try {
      const themes = await base44.entities.UserTheme.filter({ user_email: user.email });
      for (const t of themes) {
        if (t.is_active) {
          await base44.entities.UserTheme.update(t.id, { is_active: false });
        }
      }
      const updated = await base44.entities.UserTheme.filter({ user_email: user.email });
      setSavedThemes(updated);
    } catch (e) {}
  }, [user]);

  const refreshSavedThemes = useCallback(async () => {
    if (!user) return;
    const themes = await base44.entities.UserTheme.filter({ user_email: user.email });
    setSavedThemes(themes);
  }, [user]);

  return (
    <ThemeContext.Provider value={{
      user,
      activeThemeId,
      activeThemeName,
      savedThemes,
      applyTheme,
      restoreDefault,
      refreshSavedThemes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}