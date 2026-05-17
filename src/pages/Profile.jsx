import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Camera, Save, LogOut, User, Palette, RotateCcw, Plus, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/shared/PageHeader";
import ThemePresetCard from "@/components/themes/ThemePresetCard";
import SavedThemeCard from "@/components/themes/SavedThemeCard";
import ThemeEditor from "@/components/themes/ThemeEditor";
import { PRESET_THEMES, applyThemeVars, resetToDefaultTheme } from "@/lib/themes";

const MAIN_TABS = ["Perfil", "Temas"];
const THEME_TABS = ["Temas Prontos", "Meus Temas", "Criar Tema"];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ phone: "", notes: "" });

  // Tema
  const [mainTab, setMainTab] = useState("Perfil");
  const [themeTab, setThemeTab] = useState("Temas Prontos");
  const [activeThemeId, setActiveThemeId] = useState("default");
  const [savedThemes, setSavedThemes] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const students = await base44.entities.Student.list();
      const s = students.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
      if (s) {
        setStudent(s);
        setPhotoPreview(s.photo_url || null);
        setForm({ phone: s.phone || "", notes: s.notes || "" });
      }
    });
  }, []);

  useEffect(() => {
    if (mainTab === "Temas" && user) {
      loadSavedThemes(user);
    }
  }, [mainTab, user]);

  const loadSavedThemes = async (u) => {
    setLoadingThemes(true);
    try {
      const themes = await base44.entities.UserTheme.filter({ user_email: u.email });
      setSavedThemes(themes);
      const active = themes.find(t => t.is_active);
      if (active) setActiveThemeId(active.id);
      else setActiveThemeId("default");
    } finally {
      setLoadingThemes(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!student) return;
    setUploading(true);
    let photo_url = student.photo_url;
    if (photoFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      photo_url = file_url;
    }
    await base44.entities.Student.update(student.id, { ...form, photo_url });
    setStudent(s => ({ ...s, ...form, photo_url }));
    setPhotoFile(null);
    setUploading(false);
    toast.success("Perfil atualizado!");
  };

  // ── Tema handlers ────────────────────────────────
  const applyPreset = async (theme) => {
    applyThemeVars(theme.vars);
    setActiveThemeId(theme.id);
    toast.success(`Tema "${theme.name}" aplicado!`);
    if (!user) return;
    for (const t of savedThemes.filter(t => t.is_active))
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    const existing = savedThemes.find(t => t.theme_name === theme.name && t.is_system);
    if (existing) {
      await base44.entities.UserTheme.update(existing.id, { is_active: true, theme_data: theme.vars });
    } else {
      await base44.entities.UserTheme.create({
        user_email: user.email, theme_name: theme.name, theme_data: theme.vars,
        is_active: true, is_personal_default: false, is_system: true,
      });
    }
    await loadSavedThemes(user);
  };

  const restoreDefault = async () => {
    resetToDefaultTheme();
    setActiveThemeId("default");
    toast.success("Tema padrão restaurado!");
    if (!user) return;
    for (const t of savedThemes.filter(t => t.is_active))
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    await loadSavedThemes(user);
  };

  const applySavedTheme = async (theme) => {
    applyThemeVars(theme.theme_data);
    setActiveThemeId(theme.id);
    toast.success(`Tema "${theme.theme_name}" aplicado!`);
    for (const t of savedThemes.filter(t => t.is_active))
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    await base44.entities.UserTheme.update(theme.id, { is_active: true });
    await loadSavedThemes(user);
  };

  const saveCustomTheme = async (themeVars, themeName) => {
    if (!user) return;
    await base44.entities.UserTheme.create({
      user_email: user.email, theme_name: themeName, theme_data: themeVars,
      is_active: false, is_personal_default: false, is_system: false,
    });
    await loadSavedThemes(user);
    toast.success(`Tema "${themeName}" salvo!`);
    setThemeTab("Meus Temas");
  };

  const applyCustomTheme = async (themeVars, themeName) => {
    applyThemeVars(themeVars);
    setActiveThemeId("custom");
    toast.success(`Tema "${themeName}" aplicado!`);
    if (!user) return;
    for (const t of savedThemes.filter(t => t.is_active))
      await base44.entities.UserTheme.update(t.id, { is_active: false });
    await loadSavedThemes(user);
  };

  const editSavedTheme = (theme) => {
    setEditingTheme(theme);
    setThemeTab("Criar Tema");
  };

  const duplicateSavedTheme = async (theme) => {
    await base44.entities.UserTheme.create({
      user_email: user.email, theme_name: `${theme.theme_name} (Cópia)`,
      theme_data: theme.theme_data, is_active: false, is_personal_default: false, is_system: false,
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
    for (const t of savedThemes.filter(t => t.is_personal_default))
      await base44.entities.UserTheme.update(t.id, { is_personal_default: false });
    const val = !theme.is_personal_default;
    await base44.entities.UserTheme.update(theme.id, { is_personal_default: val });
    await loadSavedThemes(user);
    toast.success(val ? "Tema definido como padrão pessoal!" : "Padrão pessoal removido.");
  };

  const saveEditedTheme = async (themeVars, themeName) => {
    if (!editingTheme) return;
    await base44.entities.UserTheme.update(editingTheme.id, { theme_data: themeVars, theme_name: themeName });
    await loadSavedThemes(user);
    toast.success("Tema atualizado!");
    setEditingTheme(null);
    setThemeTab("Meus Temas");
  };

  const userSavedThemes = savedThemes.filter(t => !t.is_system);

  if (!user) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Perfil" subtitle="Minha conta" />

      {/* Main Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl border border-purple-900/20 w-fit"
        style={{ background: "rgba(7,5,22,0.8)" }}>
        {MAIN_TABS.map(t => (
          <button key={t} onClick={() => setMainTab(t)}
            className="px-5 py-2 rounded-lg text-xs font-mono-cyber transition-all flex items-center gap-2"
            style={mainTab === t ? {
              background: "rgba(168,85,247,0.2)",
              border: "1px solid rgba(168,85,247,0.35)",
              color: "#c084fc",
            } : { color: "rgba(168,85,247,0.4)" }}>
            {t === "Temas" && <Palette className="w-3.5 h-3.5" />}
            {t === "Perfil" && <User className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── ABA PERFIL ── */}
        {mainTab === "Perfil" && (
          <motion.div key="perfil" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="max-w-md space-y-6">
              {/* Avatar upload */}
              <div className="cyber-card rounded-xl p-6 border border-purple-900/20 flex flex-col items-center gap-4">
                <label className="cursor-pointer group relative">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500/30 group-hover:border-purple-500/60 transition-all"
                    style={{ boxShadow: '0 0 20px rgba(168,85,247,0.15)' }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-purple-500/10 flex items-center justify-center">
                          <User className="w-10 h-10 text-purple-500/40" />
                        </div>
                    }
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.8)', boxShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                <div className="text-center">
                  <p className="font-cyber text-white tracking-wider">{user.full_name || user.email}</p>
                  <p className="text-xs text-purple-400/40 font-mono-cyber mt-1">{user.email}</p>
                  <span className={`inline-block mt-2 text-[10px] font-mono-cyber tracking-widest px-3 py-1 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                      : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                  }`}>
                    {user.role === 'admin' ? '▸ PROFESSOR' : '▸ ALUNO'}
                  </span>
                </div>
              </div>

              {/* Info */}
              {student && (
                <div className="cyber-card rounded-xl p-6 border border-purple-900/20 space-y-4">
                  <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase">// Informações</p>
                  <div>
                    <label className="text-xs text-purple-400/60 font-mono-cyber uppercase tracking-wider mb-2 block">Telefone</label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="(00) 00000-0000" className="cyber-input" />
                  </div>
                  <div>
                    <label className="text-xs text-purple-400/60 font-mono-cyber uppercase tracking-wider mb-2 block">Observações / Lesões</label>
                    <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Ex: lesão no joelho, etc." className="cyber-input" />
                  </div>
                  <button onClick={handleSave} disabled={uploading}
                    className="w-full btn-neon-purple py-3 rounded-xl font-cyber tracking-widest flex items-center justify-center gap-2">
                    {uploading
                      ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      : <><Save className="w-4 h-4" /> SALVAR</>
                    }
                  </button>
                </div>
              )}

              {/* Logout */}
              <button onClick={() => base44.auth.logout()}
                className="w-full py-3 rounded-xl border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 transition-all font-mono-cyber text-sm flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Sair da conta
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ABA TEMAS ── */}
        {mainTab === "Temas" && (
          <motion.div key="temas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Header da seção */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-mono-cyber text-purple-500/40 uppercase tracking-widest">// Personalize o visual do app</p>
              <button onClick={restoreDefault}
                className="btn-neon-amber px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
              </button>
            </div>

            {/* Sub-tabs de tema */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl border border-purple-900/20 w-fit"
              style={{ background: "rgba(7,5,22,0.8)" }}>
              {THEME_TABS.map(t => (
                <button key={t} onClick={() => { setThemeTab(t); if (t !== "Criar Tema") setEditingTheme(null); }}
                  className="px-4 py-2 rounded-lg text-xs font-mono-cyber transition-all"
                  style={themeTab === t ? {
                    background: "rgba(168,85,247,0.2)",
                    border: "1px solid rgba(168,85,247,0.35)",
                    color: "#c084fc",
                  } : { color: "rgba(168,85,247,0.4)" }}>
                  {t}
                </button>
              ))}
            </div>

            {loadingThemes ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* Temas Prontos */}
                {themeTab === "Temas Prontos" && (
                  <motion.div key="presets" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {PRESET_THEMES.map(theme => (
                        <ThemePresetCard
                          key={theme.id}
                          theme={theme}
                          isActive={activeThemeId === theme.id || (activeThemeId === "default" && theme.id === "default")}
                          onApply={() => applyPreset(theme)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Meus Temas */}
                {themeTab === "Meus Temas" && (
                  <motion.div key="saved" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {userSavedThemes.length === 0 ? (
                      <div className="cyber-card rounded-xl border border-purple-900/20 p-12 text-center">
                        <Bookmark className="w-10 h-10 mx-auto mb-3 text-purple-500/20" />
                        <p className="text-sm font-mono-cyber text-purple-500/30">// Nenhum tema salvo</p>
                        <p className="text-xs text-purple-500/20 mt-1">Crie um tema personalizado e salve-o aqui</p>
                        <button onClick={() => setThemeTab("Criar Tema")}
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
                        <button onClick={() => setThemeTab("Criar Tema")}
                          className="rounded-xl border border-dashed border-purple-900/30 p-6 text-center hover:border-purple-500/30 transition-all group">
                          <Plus className="w-6 h-6 mx-auto mb-2 text-purple-500/30 group-hover:text-purple-500/60 transition-all" />
                          <p className="text-xs font-mono-cyber text-purple-500/30 group-hover:text-purple-500/50 transition-all">Novo Tema</p>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Criar / Editar Tema */}
                {themeTab === "Criar Tema" && (
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
                          onCancel={() => { setThemeTab("Meus Temas"); setEditingTheme(null); }}
                          onRestore={restoreDefault}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}