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

  useEffect(() => {
    if (exercise) {
      setForm(exercise);
    } else {
      setForm(emptyExercise);
    }
  }, [exercise, open]);

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
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{exercise ? "Editar Exercício" : "Adicionar Exercício"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-400">Exercício</Label>
            {exercisesList?.length > 0 ? (
              <Select value={form.exercise_id} onValueChange={handleExerciseSelect}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue placeholder="Selecione o exercício" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {exercisesList.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id} className="text-white hover:bg-gray-700">
                      {ex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.exercise_name}
                onChange={(e) => setForm({ ...form, exercise_name: e.target.value })}
                placeholder="Nome do exercício"
                className="bg-gray-800 border-gray-700 text-white mt-1"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400">Séries</Label>
              <Input
                type="number"
                value={form.sets}
                onChange={(e) => setForm({ ...form, sets: parseInt(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400">Repetições</Label>
              <Input
                value={form.reps}
                onChange={(e) => setForm({ ...form, reps: e.target.value })}
                placeholder="8-12"
                className="bg-gray-800 border-gray-700 text-white mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400">Carga (kg)</Label>
              <Input
                type="number"
                value={form.load_kg}
                onChange={(e) => setForm({ ...form, load_kg: parseFloat(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400">Descanso (seg)</Label>
              <Input
                type="number"
                value={form.rest_seconds}
                onChange={(e) => setForm({ ...form, rest_seconds: parseInt(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-700 text-white mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-400">Técnica</Label>
            <Select value={form.technique} onValueChange={(v) => setForm({ ...form, technique: v })}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {techniques.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-white hover:bg-gray-700">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.technique !== "normal" && (
            <div>
              <Label className="text-gray-400">Detalhes da Técnica</Label>
              <Input
                value={form.technique_details}
                onChange={(e) => setForm({ ...form, technique_details: e.target.value })}
                placeholder="Ex: 7x3 com 15s de pausa"
                className="bg-gray-800 border-gray-700 text-white mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-gray-400">Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observações sobre execução..."
              className="bg-gray-800 border-gray-700 text-white mt-1 h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}