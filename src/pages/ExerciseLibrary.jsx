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
import { Plus, Search, Pencil, Trash2, Dumbbell } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

const muscleGroups = {
  peito: "Peito", costas: "Costas", ombros: "Ombros",
  biceps: "Bíceps", triceps: "Tríceps", pernas: "Pernas",
  gluteos: "Glúteos", abdomen: "Abdômen", panturrilha: "Panturrilha",
  antebraco: "Antebraço", cardio: "Cardio", outro: "Outro",
};

const muscleColors = {
  peito: "bg-red-500/15 text-red-400", costas: "bg-blue-500/15 text-blue-400",
  ombros: "bg-orange-500/15 text-orange-400", biceps: "bg-purple-500/15 text-purple-400",
  triceps: "bg-pink-500/15 text-pink-400", pernas: "bg-yellow-500/15 text-yellow-400",
  gluteos: "bg-rose-500/15 text-rose-400", abdomen: "bg-cyan-500/15 text-cyan-400",
  panturrilha: "bg-lime-500/15 text-lime-400", antebraco: "bg-amber-500/15 text-amber-400",
  cardio: "bg-emerald-500/15 text-emerald-400", outro: "bg-gray-500/15 text-gray-400",
};

const emptyExercise = { name: "", muscle_group: "peito", description: "", video_url: "" };

export default function ExerciseLibrary() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyExercise);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const qc = useQueryClient();

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Exercise.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises"] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Exercise.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises"] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Exercise.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyExercise); };

  const openEdit = (ex) => {
    setEditing(ex);
    setForm({ name: ex.name, muscle_group: ex.muscle_group, description: ex.description || "", video_url: ex.video_url || "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    editing ? updateMut.mutate({ id: editing.id, data: form }) : createMut.mutate(form);
  };

  const filtered = exercises
    .filter((e) => e.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => filterGroup === "all" || e.muscle_group === filterGroup);

  return (
    <div>
      <PageHeader
        title="Exercícios"
        subtitle={`${exercises.length} exercícios cadastrados`}
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Exercício
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-gray-900/60 border-gray-800 text-white placeholder:text-gray-600"
          />
        </div>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-full sm:w-48 bg-gray-900/60 border-gray-800 text-white">
            <SelectValue placeholder="Grupo Muscular" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">Todos</SelectItem>
            {Object.entries(muscleGroups).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-white hover:bg-gray-700">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((ex) => (
          <div key={ex.id} className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-4 hover:border-gray-700 transition-all group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${muscleColors[ex.muscle_group] || muscleColors.outro}`}>
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">{ex.name}</h3>
                  <Badge className={`${muscleColors[ex.muscle_group] || muscleColors.outro} text-xs mt-1`}>
                    {muscleGroups[ex.muscle_group] || ex.muscle_group}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => openEdit(ex)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-400" onClick={() => deleteMut.mutate(ex.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {ex.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{ex.description}</p>}
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-gray-800 border-gray-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-400">Grupo Muscular</Label>
              <Select value={form.muscle_group} onValueChange={(v) => setForm({ ...form, muscle_group: v })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {Object.entries(muscleGroups).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white hover:bg-gray-700">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400">Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-gray-800 border-gray-700 text-white mt-1 h-20" />
            </div>
            <div>
              <Label className="text-gray-400">URL do Vídeo</Label>
              <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." className="bg-gray-800 border-gray-700 text-white mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancelar</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}