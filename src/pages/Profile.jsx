import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Camera, Save, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ phone: "", notes: "" });

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

  if (!user) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Perfil" subtitle="Minha conta" />

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
    </div>
  );
}