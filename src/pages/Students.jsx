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
import { Plus, Search, Camera, Link2 } from "lucide-react";
import InviteCodePanel from "../components/students/InviteCodePanel";
import StudentCard from "@/components/students/StudentCard";
import StudentPaymentPanel from "@/components/students/StudentPaymentPanel";
import PageHeader from "@/components/shared/PageHeader";
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
  const [activeTab, setActiveTab] = useState("students");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const qc = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", currentUser?.email],
    queryFn: async () => {
      if (!["admin", "personal"].includes(currentUser?.role)) return base44.entities.Student.list("-created_date", 500);
      const [owned, created] = await Promise.all([
        base44.entities.Student.filter({ personal_id: currentUser.email }, "-created_date", 500),
        base44.entities.Student.filter({ created_by_id: currentUser.id }, "-created_date", 500),
      ]);
      return [...new Map([...owned, ...created].map(student => [student.id, student])).values()];
    },
    enabled: !!currentUser,
  });

  const { data: accessControls = [] } = useQuery({
    queryKey: ["student-access-controls", currentUser?.email],
    queryFn: () => base44.entities.StudentAccessControl.list("-created_date", 500),
    enabled: ["admin", "personal"].includes(currentUser?.role),
  });

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

  const accessMut = useMutation({
    mutationFn: ({ student, control }) => control
      ? base44.entities.StudentAccessControl.update(control.id, { blocked: !control.blocked })
      : base44.entities.StudentAccessControl.create({ student_id: student.id, student_email: student.email, personal_id: student.personal_id || currentUser.email, blocked: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-access-controls"] }),
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
    <motion.div className="app-page" initial="hidden" animate="show" variants={stagger}>
      <PageHeader title="Alunos" subtitle={`${students.filter(student => student.active !== false).length} alunos ativos`} action={<div className="flex gap-2">{["personal", "admin"].includes(currentUser?.role) && <button onClick={() => setInviteOpen(true)} className="app-button-secondary h-11 gap-2 rounded-xl px-4 text-sm"><Link2 className="h-4 w-4" />Convite</button>}<button onClick={() => setDialogOpen(true)} className="app-button-primary h-11 gap-2 rounded-xl px-4 text-sm"><Plus className="h-4 w-4" />Novo aluno</button></div>} />

      <motion.div variants={fadeUp} className="mb-6 flex gap-2 border-b border-app-primary/15 pb-3">
        <button onClick={() => setActiveTab("students")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "students" ? "bg-app-primary/20 text-app-text" : "text-app-muted"}`}>Gestão de alunos</button>
        {["personal", "admin"].includes(currentUser?.role) && <button onClick={() => setActiveTab("payments")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "payments" ? "bg-app-primary/20 text-app-text" : "text-app-muted"}`}>Alunos Pagamento</button>}
      </motion.div>

      {activeTab === "students" ? <>
        <motion.div variants={fadeUp} className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/50" />
          <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="app-input pl-10" />
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(student => <motion.div key={student.id} variants={fadeUp}><StudentCard student={student} goal={goals[student.goal]} goalClass={goalColors[student.goal]} onEdit={() => openEdit(student)} onDelete={() => deleteMut.mutate(student.id)} /></motion.div>)}
        </motion.div>
      </> : <StudentPaymentPanel students={students} controls={accessControls} onToggle={(student, control) => accessMut.mutate({ student, control })} pendingId={accessMut.isPending ? accessMut.variables?.student?.id : null} />}

      <InviteCodePanel open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{background: '#04040e'}}>
          <DialogHeader>
            <DialogTitle className="font-body tracking-widest text-purple-300">{editingStudent ? "EDITAR ALUNO" : "NOVO ALUNO"}</DialogTitle>
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
              <p className="text-[10px] text-purple-500/40 font-body">Clique para foto de perfil</p>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">NOME *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="app-input mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">EMAIL</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="app-input mt-1" />
              </div>
              <div>
                <Label className="text-purple-400/60 text-xs tracking-wider">TELEFONE</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="app-input mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBJETIVO</Label>
              <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
                <SelectTrigger className="app-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                  {Object.entries(goals).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="app-input mt-1 h-20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={handleSave} className="app-button-primary px-4 py-2 rounded-lg text-sm font-medium" disabled={createMut.isPending || updateMut.isPending || photoUploading}>
              {createMut.isPending || updateMut.isPending || photoUploading ? "..." : "SALVAR"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}