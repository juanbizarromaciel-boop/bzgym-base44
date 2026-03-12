import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const techniques = [
  { value: "normal", label: "Normal" },
  { value: "cluster", label: "Cluster" },
  { value: "rest_pause", label: "Rest-Pause" },
  { value: "drop_set", label: "Drop Set" },
  { value: "super_set", label: "Super Set" },
  { value: "giant_set", label: "Giant Set" },
  { value: "piramidal", label: "Pirâmide" },
  { value: "fst7", label: "FST-7" },
  { value: "myo_reps", label: "Myo Reps" },
  { value: "tempo_controlado", label: "Tempo Controlado" },
];

const emptyExercise = {
  exercise_id: "",
  exercise_name: "",
  sets: 3,
  reps: "12",
  load_kg: 0,
  rest_seconds: 60,
  technique: "normal",
  technique_details: "",
  notes: "",
};

export default function ExerciseFormDialog({ open, onClose, onSave, exercise, exercisesList }) {
  const [form, setForm] = useState(emptyExercise);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");

  useEffect(() => {
    if (exercise) {
      setForm(exercise);
    } else {
      setForm(emptyExercise);
      setSelectedMuscleGroup("");
    }
  }, [exercise, open]);

  const muscleGroups = [
    { value: "peito", label: "Peito" },
    { value: "costas", label: "Costas" },
    { value: "ombros", label: "Ombros" },
    { value: "biceps", label: "Bíceps" },
    { value: "triceps", label: "Tríceps" },
    { value: "pernas", label: "Pernas" },
    { value: "gluteos", label: "Glúteos" },
    { value: "abdomen", label: "Abdômen" },
    { value: "panturrilha", label: "Panturrilha" },
    { value: "antebraco", label: "Antebraço" },
    { value: "cardio", label: "Cardio" },
    { value: "outro", label: "Outro" }
  ];

  const filteredExercises = selectedMuscleGroup
    ? exercisesList.filter(ex => ex.muscle_group === selectedMuscleGroup)
    : exercisesList;

  const handleExerciseSelect = (exerciseId) => {
    const selected = exercisesList.find((e) => e.id === exerciseId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        exercise_id: selected.id,
        exercise_name: selected.name,
      }));
    }
  };

  const handleSave = () => {
    if (!form.exercise_name) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{background: '#04040e'}}>
        <DialogHeader>
          <DialogTitle className="font-cyber tracking-widest text-purple-300">{exercise ? "EDITAR EXERCÍCIO" : "ADICIONAR EXERCÍCIO"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {exercisesList?.length > 0 && (
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">GRUPO MUSCULAR</Label>
              <Select value={selectedMuscleGroup} onValueChange={(v) => {
                setSelectedMuscleGroup(v);
                setForm({ ...form, exercise_id: "", exercise_name: "" });
              }}>
                <SelectTrigger className="cyber-input mt-1">
                  <SelectValue placeholder="Selecione o grupo muscular" />
                </SelectTrigger>
                <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                  {muscleGroups.map((mg) => (
                    <SelectItem key={mg.value} value={mg.value} className="text-white">{mg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-purple-400/60 text-xs tracking-wider">EXERCÍCIO</Label>
            {exercisesList?.length > 0 ? (
              <Select 
                value={form.exercise_id} 
                onValueChange={handleExerciseSelect}
                disabled={!selectedMuscleGroup}
              >
                <SelectTrigger className="cyber-input mt-1">
                  <SelectValue placeholder={selectedMuscleGroup ? "Selecione o exercício" : "Selecione o grupo muscular primeiro"} />
                </SelectTrigger>
                <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                  {filteredExercises.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id} className="text-white">{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.exercise_name} onChange={(e) => setForm({ ...form, exercise_name: e.target.value })} placeholder="Nome do exercício" className="cyber-input mt-1" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">SÉRIES</Label>
              <Input type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: parseInt(e.target.value) || 0 })} className="cyber-input mt-1" />
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">REPETIÇÕES</Label>
              <Input value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} placeholder="8-12" className="cyber-input mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">CARGA (kg)</Label>
              <Input type="number" value={form.load_kg} onChange={(e) => setForm({ ...form, load_kg: parseFloat(e.target.value) || 0 })} className="cyber-input mt-1" />
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">DESCANSO (seg)</Label>
              <Input type="number" value={form.rest_seconds} onChange={(e) => setForm({ ...form, rest_seconds: parseInt(e.target.value) || 0 })} className="cyber-input mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-purple-400/60 text-xs tracking-wider">TÉCNICA</Label>
            <Select value={form.technique} onValueChange={(v) => setForm({ ...form, technique: v })}>
              <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
              <SelectContent style={{background: '#04040e', borderColor: 'rgba(168,85,247,0.3)'}}>
                {techniques.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.technique !== "normal" && (
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">DETALHES DA TÉCNICA</Label>
              <Input value={form.technique_details} onChange={(e) => setForm({ ...form, technique_details: e.target.value })} placeholder="Ex: 7x3 com 15s de pausa" className="cyber-input mt-1" />
            </div>
          )}

          <div>
            <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações sobre execução..." className="cyber-input mt-1 h-20" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
          <button onClick={handleSave} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium">SALVAR</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}