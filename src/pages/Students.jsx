import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Search, UserCircle, Phone, Mail, Target, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

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

const emptyStudent = { name: "", email: "", phone: "", goal: "hipertrofia", notes: "", active: true };

export default function Students() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(emptyStudent);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
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

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingStudent(null);
    setForm(emptyStudent);
  };

  const openEdit = (s) => {
    setEditingStudent(s);
    setForm({ name: s.name, email: s.email || "", phone: s.phone || "", goal: s.goal || "hipertrofia", notes: s.notes || "", active: s.active !== false });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingStudent) {
      updateMut.mutate({ id: editingStudent.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Alunos"
        subtitle={`${students.filter((s) => s.active !== false).length} alunos ativos`}
        action={
          <button onClick={() => setDialogOpen(true)} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" /> NOVO ALUNO
          </button>
        }
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/50" />
        <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="cyber-input pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((student) => (
          <div key={student.id} className="cyber-card rounded-xl p-5 border border-purple-900/20 hover:border-purple-500/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"
                  style={{boxShadow: '0 0 10px rgba(168,85,247,0.1)'}}>
                  <UserCircle className="w-6 h-6 text-purple-400" />
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
            <div className="space-y-1.5 text-xs text-purple-400/40 font-mono-cyber">
              {student.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{student.email}</div>}
              {student.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{student.phone}</div>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{background: '#04040e'}}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">{editingStudent ? "EDITAR ALUNO" : "NOVO ALUNO"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <button onClick={handleSave} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "..." : "SALVAR"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}