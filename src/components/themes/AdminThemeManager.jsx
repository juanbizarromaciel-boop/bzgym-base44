import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Palette, RotateCcw, Trash2, Lock, Unlock, Users, Eye } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_THEME_VARS, PRESET_THEMES } from "@/lib/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminThemeManager() {
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-all-users-themes"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allThemes = [], isLoading } = useQuery({
    queryKey: ["admin-all-user-themes"],
    queryFn: () => base44.entities.UserTheme.list("-created_date", 500),
  });

  const updateThemeMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserTheme.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-all-user-themes"] }),
  });

  const deleteThemeMut = useMutation({
    mutationFn: (id) => base44.entities.UserTheme.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-user-themes"] });
      toast.success("Tema excluído.");
    },
  });

  const resetUserTheme = async (userEmail) => {
    const userThemes = allThemes.filter(t => t.user_email === userEmail && t.is_active);
    for (const t of userThemes) {
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    }
    qc.invalidateQueries({ queryKey: ["admin-all-user-themes"] });
    toast.success(`Tema de ${userEmail} resetado para o padrão.`);
  };

  const toggleLock = (theme) => {
    updateThemeMut.mutate({
      id: theme.id,
      data: { theme_locked: !theme.theme_locked },
    });
    toast.success(theme.theme_locked ? "Personalização desbloqueada." : "Personalização bloqueada.");
  };

  const applyGlobalTheme = async (presetId) => {
    const preset = PRESET_THEMES.find(p => p.id === presetId);
    if (!preset) return;
    // Para cada usuário, cria/atualiza tema ativo com o preset global
    for (const u of allUsers) {
      const userThemes = allThemes.filter(t => t.user_email === u.email);
      for (const t of userThemes.filter(t => t.is_active)) {
        await base44.entities.UserTheme.update(t.id, { is_active: false });
      }
      await base44.entities.UserTheme.create({
        user_email: u.email,
        theme_name: preset.name,
        theme_data: preset.vars,
        is_active: true,
        is_personal_default: false,
        is_system: true,
      });
    }
    qc.invalidateQueries({ queryKey: ["admin-all-user-themes"] });
    toast.success(`Tema "${preset.name}" aplicado para todos os usuários!`);
  };

  // Group themes by user
  const userThemeMap = allUsers.reduce((acc, u) => {
    acc[u.email] = {
      user: u,
      themes: allThemes.filter(t => t.user_email === u.email),
    };
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-purple-400" />
        <h2 className="font-cyber text-white tracking-wider">Gerenciar Temas dos Usuários</h2>
      </div>

      {/* Aplicar tema global */}
      <div className="rounded-xl border border-cyan-900/25 p-4"
        style={{ background: "rgba(6,182,212,0.04)" }}>
        <p className="text-xs font-mono-cyber text-cyan-400/60 uppercase tracking-widest mb-2">// Aplicar tema global para todos</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_THEMES.map(p => (
            <button key={p.id} onClick={() => applyGlobalTheme(p.id)}
              className="text-[10px] font-mono-cyber px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:scale-105"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#22d3ee" }}>
              <span>{p.emoji}</span> {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de usuários e seus temas */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          Object.values(userThemeMap).map(({ user: u, themes }) => {
            const activeTheme = themes.find(t => t.is_active);
            const defaultTheme = themes.find(t => t.is_personal_default);
            const customThemes = themes.filter(t => !t.is_system);

            return (
              <div key={u.id} className="rounded-xl border border-purple-900/20 overflow-hidden"
                style={{ background: "rgba(7,5,22,0.9)" }}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-900/15">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-400/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.full_name || u.email}</p>
                    <p className="text-[10px] font-mono-cyber text-purple-500/40">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-mono-cyber px-2 py-1 rounded"
                      style={{ background: "rgba(168,85,247,0.08)", color: "#c084fc" }}>
                      {activeTheme ? activeTheme.theme_name : "Padrão"}
                    </span>
                    <button onClick={() => resetUserTheme(u.email)}
                      title="Resetar para padrão"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-purple-500/10"
                      style={{ border: "1px solid rgba(168,85,247,0.2)" }}>
                      <RotateCcw className="w-3.5 h-3.5 text-purple-400/60" />
                    </button>
                  </div>
                </div>

                {customThemes.length > 0 && (
                  <div className="px-4 py-2 divide-y divide-purple-900/8">
                    {customThemes.map(theme => (
                      <div key={theme.id} className="flex items-center gap-2 py-2">
                        <div className="flex gap-1">
                          {Object.values(theme.theme_data || {}).filter(v => typeof v === "string" && v.startsWith("#")).slice(0, 3).map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded border border-white/10" style={{ background: c }} />
                          ))}
                        </div>
                        <p className="text-xs text-white/70 flex-1 truncate">{theme.theme_name}</p>
                        {theme.is_personal_default && (
                          <span className="text-[10px] text-yellow-400 font-mono-cyber">⭐ padrão</span>
                        )}
                        <button onClick={() => toggleLock(theme)}
                          title={theme.theme_locked ? "Desbloquear" : "Bloquear"}
                          className="w-6 h-6 rounded flex items-center justify-center transition-all hover:bg-yellow-500/10">
                          {theme.theme_locked
                            ? <Lock className="w-3 h-3 text-yellow-400/70" />
                            : <Unlock className="w-3 h-3 text-purple-400/40" />}
                        </button>
                        <button onClick={() => deleteThemeMut.mutate(theme.id)}
                          className="w-6 h-6 rounded flex items-center justify-center transition-all hover:bg-red-500/10">
                          <Trash2 className="w-3 h-3 text-red-400/60" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {customThemes.length === 0 && (
                  <p className="text-[10px] font-mono-cyber text-purple-500/25 px-4 py-2">// sem temas personalizados</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}