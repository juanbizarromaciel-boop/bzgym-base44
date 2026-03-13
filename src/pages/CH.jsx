import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Activity, TrendingUp, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function CH() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const qc = useQueryClient();

  const [formData, setFormData] = useState({
    cycle_start_date: "",
    cycle_length_days: 28,
    phase: "menstrual",
    symptoms: [],
    energy_level: 5,
    training_intensity: "moderada",
    notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== "admin") {
        base44.entities.Student.list().then(students => {
          const found = students.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
          setStudent(found);
        });
      }
    });
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
    enabled: user?.role === "admin"
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ["cycles", selectedStudent || student?.id],
    queryFn: () => base44.entities.HormonalCycle.list("-created_date", 100),
    enabled: !!(selectedStudent || student?.id)
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.HormonalCycle.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycles"] });
      toast.success("Registro criado");
      handleCloseDialog();
    }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HormonalCycle.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycles"] });
      toast.success("Registro atualizado");
      handleCloseDialog();
    }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.HormonalCycle.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycles"] });
      toast.success("Registro excluído");
    }
  });

  const handleOpenDialog = (cycle = null) => {
    if (cycle) {
      setEditingCycle(cycle);
      setFormData({
        cycle_start_date: cycle.cycle_start_date || "",
        cycle_length_days: cycle.cycle_length_days || 28,
        phase: cycle.phase || "menstrual",
        symptoms: cycle.symptoms || [],
        energy_level: cycle.energy_level || 5,
        training_intensity: cycle.training_intensity || "moderada",
        notes: cycle.notes || ""
      });
    } else {
      setEditingCycle(null);
      setFormData({
        cycle_start_date: new Date().toISOString().split('T')[0],
        cycle_length_days: 28,
        phase: "menstrual",
        symptoms: [],
        energy_level: 5,
        training_intensity: "moderada",
        notes: ""
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCycle(null);
  };

  const handleSubmit = () => {
    const studentId = user?.role === "admin" ? selectedStudent : student?.id;
    if (!studentId) {
      toast.error("Selecione um aluno");
      return;
    }

    const data = { ...formData, student_id: studentId };

    if (editingCycle) {
      updateMut.mutate({ id: editingCycle.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const phaseColors = {
    menstrual: "bg-red-500/10 border-red-500/30 text-red-400",
    folicular: "bg-green-500/10 border-green-500/30 text-green-400",
    ovulatoria: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    lutea: "bg-purple-500/10 border-purple-500/30 text-purple-400"
  };

  const filteredCycles = cycles.filter(c => {
    if (user?.role === "admin") {
      return selectedStudent ? c.student_id === selectedStudent : true;
    } else {
      return c.student_id === student?.id;
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ciclo Hormonal"
        subtitle="Acompanhamento do ciclo hormonal e ajustes de treino"
        action={
          <Button onClick={() => handleOpenDialog()} className="btn-neon-purple">
            <Plus className="w-4 h-4 mr-2" />
            Novo Registro
          </Button>
        }
      />

      {user?.role === "admin" && (
        <div className="cyber-card p-4 rounded-xl">
          <Label className="text-purple-300 text-xs mb-2 block">Selecionar Aluno</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="cyber-input">
              <SelectValue placeholder="Escolha um aluno" />
            </SelectTrigger>
            <SelectContent>
              {students.filter(s => s.active).map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4">
        {filteredCycles.length === 0 ? (
          <div className="cyber-card p-12 rounded-xl text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-purple-500/30" />
            <p className="text-purple-400/50 text-sm">Nenhum registro encontrado</p>
          </div>
        ) : (
          filteredCycles.map(cycle => (
            <div key={cycle.id} className="cyber-card p-5 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {new Date(cycle.cycle_start_date).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-purple-400/60 text-xs">Ciclo de {cycle.cycle_length_days} dias</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleOpenDialog(cycle)}
                    size="sm"
                    variant="ghost"
                    className="text-purple-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteMut.mutate(cycle.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-purple-400/50 text-xs mb-1">Fase</p>
                  <Badge className={phaseColors[cycle.phase]}>
                    {cycle.phase}
                  </Badge>
                </div>
                <div>
                  <p className="text-purple-400/50 text-xs mb-1">Energia</p>
                  <p className="text-white text-sm">{cycle.energy_level}/10</p>
                </div>
                <div>
                  <p className="text-purple-400/50 text-xs mb-1">Intensidade</p>
                  <Badge className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                    {cycle.training_intensity}
                  </Badge>
                </div>
              </div>

              {cycle.notes && (
                <p className="text-purple-300/70 text-sm">{cycle.notes}</p>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0a16] border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cyber text-purple-300">
              {editingCycle ? "Editar Registro" : "Novo Registro"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-purple-300 text-xs">Data de Início</Label>
              <Input
                type="date"
                value={formData.cycle_start_date}
                onChange={(e) => setFormData({ ...formData, cycle_start_date: e.target.value })}
                className="cyber-input mt-1"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Duração do Ciclo (dias)</Label>
              <Input
                type="number"
                value={formData.cycle_length_days}
                onChange={(e) => setFormData({ ...formData, cycle_length_days: parseInt(e.target.value) })}
                className="cyber-input mt-1"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Fase Atual</Label>
              <Select value={formData.phase} onValueChange={(v) => setFormData({ ...formData, phase: v })}>
                <SelectTrigger className="cyber-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menstrual">Menstrual</SelectItem>
                  <SelectItem value="folicular">Folicular</SelectItem>
                  <SelectItem value="ovulatoria">Ovulatória</SelectItem>
                  <SelectItem value="lutea">Lútea</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Nível de Energia (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.energy_level}
                onChange={(e) => setFormData({ ...formData, energy_level: parseInt(e.target.value) })}
                className="cyber-input mt-1"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Intensidade de Treino</Label>
              <Select value={formData.training_intensity} onValueChange={(v) => setFormData({ ...formData, training_intensity: v })}>
                <SelectTrigger className="cyber-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="moderada">Moderada</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="cyber-input mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
              className="w-full btn-neon-purple"
            >
              {editingCycle ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}