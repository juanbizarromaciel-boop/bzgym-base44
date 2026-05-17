import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { applyThemeVars, resetToDefaultTheme } from "./themes";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeThemeId, setActiveThemeId] = useState("default");
  const [savedThemes, setSavedThemes] = useState([]);

  // Carrega usuário e aplica tema salvo na inicialização
  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) return;
      setUser(u);
      const themes = await base44.entities.UserTheme.filter({ user_email: u.email });
      setSavedThemes(themes);
      const active = themes.find(t => t.is_active);
      const personalDefault = themes.find(t => t.is_personal_default);
      const toApply = active || personalDefault;
      if (toApply?.theme_data) {
        applyThemeVars(toApply.theme_data);
        setActiveThemeId(toApply.id);
      }
    }).catch(() => {});
  }, []);

  const refreshSavedThemes = useCallback(async (u) => {
    const currentUser = u || user;
    if (!currentUser) return;
    const themes = await base44.entities.UserTheme.filter({ user_email: currentUser.email });
    setSavedThemes(themes);
    return themes;
  }, [user]);

  // Aplica tema visualmente E persiste no banco
  const applyTheme = useCallback(async (themeId, themeVars, themeName) => {
    // 1. Aplica imediatamente no DOM
    applyThemeVars(themeVars);
    setActiveThemeId(themeId);

    if (!user) return;

    // 2. Desativa todos os temas ativos
    const themes = await base44.entities.UserTheme.filter({ user_email: user.email });
    for (const t of themes.filter(t => t.is_active)) {
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    }

    // 3. Verifica se já existe registro com este themeId (para temas salvos) ou nome (para presets)
    const existingById = themes.find(t => t.id === themeId);
    const existingByName = themes.find(t => t.theme_name === themeName && t.is_system);

    if (existingById) {
      // Tema salvo customizado — só marca como ativo
      await base44.entities.UserTheme.update(existingById.id, { is_active: true, theme_data: themeVars });
    } else if (existingByName) {
      // Preset já registrado — atualiza e marca ativo
      await base44.entities.UserTheme.update(existingByName.id, { is_active: true, theme_data: themeVars });
    } else {
      // Novo registro — cria
      const isPreset = themeId !== "custom_preview";
      await base44.entities.UserTheme.create({
        user_email: user.email,
        theme_name: themeName,
        theme_data: themeVars,
        is_active: true,
        is_personal_default: false,
        is_system: isPreset,
      });
    }

    const updated = await base44.entities.UserTheme.filter({ user_email: user.email });
    setSavedThemes(updated);
    // Atualiza o activeThemeId com o id real do registro criado/atualizado
    const newActive = updated.find(t => t.is_active);
    if (newActive) setActiveThemeId(newActive.id);
  }, [user]);

  const restoreDefault = useCallback(async () => {
    resetToDefaultTheme();
    setActiveThemeId("default");
    if (!user) return;
    const themes = await base44.entities.UserTheme.filter({ user_email: user.email });
    for (const t of themes.filter(t => t.is_active)) {
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    }
    const updated = await base44.entities.UserTheme.filter({ user_email: user.email });
    setSavedThemes(updated);
  }, [user]);

  return (
    <ThemeContext.Provider value={{
      user,
      activeThemeId,
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