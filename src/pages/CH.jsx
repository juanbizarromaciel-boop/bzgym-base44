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
import { Calendar, Plus, Activity, Edit, Trash2, Syringe } from "lucide-react";
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
    substance: "",
    dosage_mg_per_week: "",
    dosage_mg_per_application: "",
    application_frequency: "2x_semana",
    cycle_start_date: "",
    cycle_duration_weeks: "",
    application_site: "",
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
        substance: cycle.substance || "",
        dosage_mg_per_week: cycle.dosage_mg_per_week || "",
        dosage_mg_per_application: cycle.dosage_mg_per_application || "",
        application_frequency: cycle.application_frequency || "2x_semana",
        cycle_start_date: cycle.cycle_start_date || "",
        cycle_duration_weeks: cycle.cycle_duration_weeks || "",
        application_site: cycle.application_site || "",
        notes: cycle.notes || ""
      });
    } else {
      setEditingCycle(null);
      setFormData({
        substance: "",
        dosage_mg_per_week: "",
        dosage_mg_per_application: "",
        application_frequency: "2x_semana",
        cycle_start_date: new Date().toISOString().split('T')[0],
        cycle_duration_weeks: "",
        application_site: "",
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

    const data = {
      ...formData,
      student_id: studentId,
      dosage_mg_per_week: parseFloat(formData.dosage_mg_per_week),
      dosage_mg_per_application: parseFloat(formData.dosage_mg_per_application),
      cycle_duration_weeks: formData.cycle_duration_weeks ? parseInt(formData.cycle_duration_weeks) : null
    };

    if (editingCycle) {
      updateMut.mutate({ id: editingCycle.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const frequencyLabels = {
    "1x_semana": "1x por semana",
    "2x_semana": "2x por semana",
    "3x_semana": "3x por semana",
    "dia_sim_dia_nao": "Dia sim, dia não",
    "diario": "Diário"
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
        subtitle="Acompanhamento de ciclos de hormônios anabolizantes"
        action={
          <Button onClick={() => handleOpenDialog()} className="btn-neon-purple">
            <Plus className="w-4 h-4 mr-2" />
            Novo Ciclo
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
            <Syringe className="w-12 h-12 mx-auto mb-4 text-purple-500/30" />
            <p className="text-purple-400/50 text-sm">Nenhum ciclo registrado</p>
          </div>
        ) : (
          filteredCycles.map(cycle => (
            <div key={cycle.id} className="cyber-card p-5 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <Syringe className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg">{cycle.substance}</p>
                    <p className="text-purple-400/60 text-xs">
                      Início: {new Date(cycle.cycle_start_date).toLocaleDateString("pt-BR")}
                    </p>
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

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                  <p className="text-purple-400/50 text-xs mb-1">Dosagem Semanal</p>
                  <p className="text-white text-lg font-bold">{cycle.dosage_mg_per_week} mg</p>
                </div>
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                  <p className="text-cyan-400/50 text-xs mb-1">Por Aplicação</p>
                  <p className="text-white text-lg font-bold">{cycle.dosage_mg_per_application} mg</p>
                </div>
                <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3">
                  <p className="text-pink-400/50 text-xs mb-1">Frequência</p>
                  <p className="text-white text-sm">{frequencyLabels[cycle.application_frequency]}</p>
                </div>
              </div>

              {cycle.cycle_duration_weeks && (
                <div className="mb-3">
                  <Badge className="bg-green-500/10 border-green-500/30 text-green-400">
                    Duração: {cycle.cycle_duration_weeks} semanas
                  </Badge>
                </div>
              )}

              {cycle.application_site && (
                <p className="text-purple-300/70 text-sm mb-2">
                  <span className="text-purple-400/50">Local: </span>{cycle.application_site}
                </p>
              )}

              {cycle.notes && (
                <p className="text-purple-300/70 text-sm">{cycle.notes}</p>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0a16] border-purple-500/30 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cyber text-purple-300">
              {editingCycle ? "Editar Ciclo" : "Novo Ciclo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-purple-300 text-xs">Substância</Label>
              <Input
                value={formData.substance}
                onChange={(e) => setFormData({ ...formData, substance: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: Testosterona, Trembolona..."
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Dosagem Total (mg/semana)</Label>
              <Input
                type="number"
                value={formData.dosage_mg_per_week}
                onChange={(e) => setFormData({ ...formData, dosage_mg_per_week: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: 500"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Dosagem por Aplicação (mg)</Label>
              <Input
                type="number"
                value={formData.dosage_mg_per_application}
                onChange={(e) => setFormData({ ...formData, dosage_mg_per_application: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: 250"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Frequência de Aplicação</Label>
              <Select value={formData.application_frequency} onValueChange={(v) => setFormData({ ...formData, application_frequency: v })}>
                <SelectTrigger className="cyber-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x_semana">1x por semana</SelectItem>
                  <SelectItem value="2x_semana">2x por semana</SelectItem>
                  <SelectItem value="3x_semana">3x por semana</SelectItem>
                  <SelectItem value="dia_sim_dia_nao">Dia sim, dia não</SelectItem>
                  <SelectItem value="diario">Diário</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <Label className="text-purple-300 text-xs">Duração do Ciclo (semanas)</Label>
              <Input
                type="number"
                value={formData.cycle_duration_weeks}
                onChange={(e) => setFormData({ ...formData, cycle_duration_weeks: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: 12"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Local de Aplicação</Label>
              <Input
                value={formData.application_site}
                onChange={(e) => setFormData({ ...formData, application_site: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: Glúteo, Deltoide..."
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="cyber-input mt-1"
                rows={3}
                placeholder="Anotações sobre o ciclo..."
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