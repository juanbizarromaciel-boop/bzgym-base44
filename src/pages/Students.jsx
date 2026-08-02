import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, UserCircle, Phone, Mail, Target, Pencil, Trash2, Camera, Link2 } from "lucide-react";
import InviteCodePanel from "../components/students/InviteCodePanel";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const goals = {
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  resistencia: "Resistência",
  forca: "Força",
  saude: "Saúde",
};

const goalColors = {
  hipertrofia: "bg-red-500/15 text-red-400 border-red-500/30",
  emagrecimento: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  resistencia: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  forca: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  saude: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const emptyStudent = { name: "", email: "", phone: "", goal: "hipertrofia", notes: "", active: true, photo_url: "" };

export default function Students() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(emptyStudent);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const qc = useQueryClient();

  const { data: allStudents = [], isLoading } = useQuery({
    queryKey: ["students", currentUser?.email],
    queryFn: () => base44.entities.Student.list("-created_date", 500),
    enabled: !!currentUser,
  });

  const students = ["admin", "personal"].includes(currentUser?.role)
    ? allStudents.filter(s => s.personal_id === currentUser.email || s.created_by_id === currentUser.id)
    : allStudents;

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Student.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingStudent(null);
    setForm(emptyStudent);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const openEdit = (s) => {
    setEditingStudent(s);
    setForm({ name: s.name, email: s.email || "", phone: s.phone || "", goal: s.goal || "hipertrofia", notes: s.notes || "", active: s.active !== false, photo_url: s.photo_url || "" });
    setPhotoFile(null);
    setPhotoPreview(s.photo_url || null);
    setDialogOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name) return;
    let finalForm = { ...form };
    if (photoFile) {
      setPhotoUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      finalForm = { ...finalForm, photo_url: file_url };
      setPhotoUploading(false);
    }
    // Todo aluno criado por Admin ou Personal fica vinculado ao responsável atual.
    if (!editingStudent && ["admin", "personal"].includes(currentUser?.role)) {
      finalForm = { ...finalForm, personal_id: currentUser.email };
    }
    if (editingStudent) {
      updateMut.mutate({ id: editingStudent.id, data: finalForm });
    } else {
      createMut.mutate(finalForm);
    }
  };

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Custom Cyber Header */}
      <div className="mb-8 relative">
        {/* Top decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent)' }} />
        
        {/* Main header content */}
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, #06b6d4, #a855f7)', borderRadius: '2px', boxShadow: '0 0 12px rgba(6,182,212,0.6)' }} />
              <h1 className="text-3xl font-black font-cyber tracking-wider" style={{ color: '#ffffff', textShadow: '0 0 20px rgba(6,182,212,0.5), 0 0 40px rgba(168,85,247,0.3)' }}>
                ALUNOS
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ paddingLeft: '14px' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#06b6d4', boxShadow: '0 0 8px #06b6d4, 0 0 16px rgba(6,182,212,0.6)' }} />
              <p className="text-sm font-mono-cyber tracking-wide" style={{ color: 'rgba(6,182,212,0.8)', textShadow: '0 0 10px rgba(6,182,212,0.5)' }}>
                {students.filter((s) => s.active !== false).length} alunos ativos
              </p>
            </div>
          </div>

          <div className="flex gap-2">
          {(currentUser?.role === "personal" || currentUser?.role === "admin") && (
            <button onClick={() => setInviteOpen(true)}
              className="relative px-4 py-3 rounded-xl font-medium tracking-wider flex items-center gap-2 overflow-hidden group"
              style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.50)', boxShadow: '0 0 16px rgba(6,182,212,0.15)' }}>
              <Link2 className="w-4 h-4 relative z-10" style={{ color: '#06b6d4' }} />
              <span className="text-sm font-bold relative z-10" style={{ color: '#22d3ee' }}>CONVITE</span>
            </button>
          )}
          <button
            onClick={() => setDialogOpen(true)}
            className="relative px-5 py-3 rounded-xl font-medium tracking-wider flex items-center gap-2 overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(6,182,212,0.15))',
              border: '1px solid rgba(168,85,247,0.6)',
              boxShadow: '0 0 20px rgba(168,85,247,0.25), inset 0 0 12px rgba(168,85,247,0.08)'
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(6,182,212,0.25))' }} />
            
            <Plus className="w-5 h-5 relative z-10" style={{ color: '#a855f7', filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' }} />
            <span className="text-sm font-bold relative z-10" style={{ color: '#ffffff', textShadow: '0 0 8px rgba(168,85,247,0.5)' }}>NOVO ALUNO</span>
          </button>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(168,85,247,0.8), rgba(6,182,212,0.6), transparent)' }} />
      </div>

      <motion.div variants={fadeUp} className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/50" />
        <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="cyber-input pl-10" />
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((student) => (
          <motion.div key={student.id} variants={fadeUp} whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.18 }}
            className="relative rounded-xl p-5 border transition-all group overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, var(--bg-card) 0%, var(--bg-void) 100%)',
              borderColor: 'rgba(168,85,247,0.28)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.45), 0 0 16px rgba(168,85,247,0.06)',
            }}>
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.7), rgba(6,182,212,0.3), transparent)' }} />
            {/* Tech corners */}
            <div className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
              style={{ borderTop: '1.5px solid rgba(168,85,247,0.8)', borderLeft: '1.5px solid rgba(168,85,247,0.8)' }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none"
              style={{ borderBottom: '1.5px solid rgba(6,182,212,0.5)', borderRight: '1.5px solid rgba(6,182,212,0.5)' }} />
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.1), transparent 70%)' }} />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.35)', boxShadow: '0 0 12px rgba(168,85,247,0.2)' }}>
                  {student.photo_url
                    ? <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                    : <UserCircle className="w-6 h-6" style={{ color: 'rgba(168,85,247,0.9)', filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' }} />
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-white">{student.name}</h3>
                  {student.goal && (
                    <Badge className={`${goalColors[student.goal]} border text-xs mt-1`}>{goals[student.goal]}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/50 hover:text-purple-300" onClick={() => openEdit(student)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/50 hover:text-red-400" onClick={() => deleteMut.mutate(student.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs font-mono-cyber" style={{ color: 'rgba(168,85,247,0.6)' }}>
              {student.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{student.email}</div>}
              {student.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{student.phone}</div>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <InviteCodePanel open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{background: '#04040e'}}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">{editingStudent ? "EDITAR ALUNO" : "NOVO ALUNO"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-2">
              <label className="cursor-pointer group relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-purple-500/10 border-2 border-dashed border-purple-500/30 group-hover:border-purple-500/60 flex items-center justify-center transition-all">
                  {photoPreview
                    ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                    : <Camera className="w-7 h-7 text-purple-500/40" />
                  }
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              <p className="text-[10px] text-purple-500/40 font-mono-cyber">Clique para foto de perfil</p>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">NOME *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="cyber-input mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">EMAIL</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="cyber-input mt-1" />
              </div>
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">TELEFONE</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="cyber-input mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBJETIVO</Label>
              <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                  {Object.entries(goals).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="cyber-input mt-1 h-20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={handleSave} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium" disabled={createMut.isPending || updateMut.isPending || photoUploading}>
              {createMut.isPending || updateMut.isPending || photoUploading ? "..." : "SALVAR"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}