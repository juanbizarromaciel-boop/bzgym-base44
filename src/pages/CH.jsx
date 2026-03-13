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
import { Calendar, Plus, Activity, Edit, Trash2, Syringe, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function CH() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [substanceDialogOpen, setSubstanceDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [editingSubstance, setEditingSubstance] = useState(null);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [expandedCycles, setExpandedCycles] = useState({});
  const qc = useQueryClient();

  const [cycleFormData, setCycleFormData] = useState({
    student_id: "",
    name: "",
    cycle_start_date: "",
    cycle_duration_weeks: "",
    notes: ""
  });

  const [substanceFormData, setSubstanceFormData] = useState({
    substance: "",
    dosage_mg_per_week: "",
    dosage_mg_per_application: "",
    application_frequency: "2x_semana",
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
    queryKey: ["cycles"],
    queryFn: () => base44.entities.Cycle.list("-created_date", 100)
  });

  const { data: substances = [] } = useQuery({
    queryKey: ["substances"],
    queryFn: () => base44.entities.CycleSubstance.list("-created_date", 200)
  });

  const createCycleMut = useMutation({
    mutationFn: (data) => base44.entities.Cycle.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycles"] });
      toast.success("Ciclo criado");
      handleCloseCycleDialog();
    }
  });

  const updateCycleMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cycle.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycles"] });
      toast.success("Ciclo atualizado");
      handleCloseCycleDialog();
    }
  });

  const deleteCycleMut = useMutation({
    mutationFn: (id) => base44.entities.Cycle.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycles"] });
      qc.invalidateQueries({ queryKey: ["substances"] });
      toast.success("Ciclo excluído");
    }
  });

  const createSubstanceMut = useMutation({
    mutationFn: (data) => base44.entities.CycleSubstance.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["substances"] });
      toast.success("Substância adicionada");
      handleCloseSubstanceDialog();
    }
  });

  const updateSubstanceMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CycleSubstance.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["substances"] });
      toast.success("Substância atualizada");
      handleCloseSubstanceDialog();
    }
  });

  const deleteSubstanceMut = useMutation({
    mutationFn: (id) => base44.entities.CycleSubstance.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["substances"] });
      toast.success("Substância excluída");
    }
  });

  const handleOpenCycleDialog = (cycle = null) => {
    if (cycle) {
      setEditingCycle(cycle);
      setCycleFormData({
        student_id: cycle.student_id || "",
        name: cycle.name || "",
        cycle_start_date: cycle.cycle_start_date || "",
        cycle_duration_weeks: cycle.cycle_duration_weeks || "",
        notes: cycle.notes || ""
      });
    } else {
      setEditingCycle(null);
      setCycleFormData({
        student_id: "",
        name: "",
        cycle_start_date: new Date().toISOString().split('T')[0],
        cycle_duration_weeks: "",
        notes: ""
      });
    }
    setCycleDialogOpen(true);
  };

  const handleCloseCycleDialog = () => {
    setCycleDialogOpen(false);
    setEditingCycle(null);
  };

  const handleOpenSubstanceDialog = (cycleId, substance = null) => {
    setSelectedCycleId(cycleId);
    if (substance) {
      setEditingSubstance(substance);
      setSubstanceFormData({
        substance: substance.substance || "",
        dosage_mg_per_week: substance.dosage_mg_per_week || "",
        dosage_mg_per_application: substance.dosage_mg_per_application || "",
        application_frequency: substance.application_frequency || "2x_semana",
        application_site: substance.application_site || "",
        notes: substance.notes || ""
      });
    } else {
      setEditingSubstance(null);
      setSubstanceFormData({
        substance: "",
        dosage_mg_per_week: "",
        dosage_mg_per_application: "",
        application_frequency: "2x_semana",
        application_site: "",
        notes: ""
      });
    }
    setSubstanceDialogOpen(true);
  };

  const handleCloseSubstanceDialog = () => {
    setSubstanceDialogOpen(false);
    setEditingSubstance(null);
    setSelectedCycleId(null);
  };

  const handleSubmitCycle = () => {
    if (!cycleFormData.student_id || !cycleFormData.name) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const data = {
      ...cycleFormData,
      cycle_duration_weeks: cycleFormData.cycle_duration_weeks ? parseInt(cycleFormData.cycle_duration_weeks) : null
    };

    if (editingCycle) {
      updateCycleMut.mutate({ id: editingCycle.id, data });
    } else {
      createCycleMut.mutate(data);
    }
  };

  const handleSubmitSubstance = () => {
    if (!substanceFormData.substance) {
      toast.error("Digite o nome da substância");
      return;
    }

    const data = {
      ...substanceFormData,
      cycle_id: selectedCycleId,
      dosage_mg_per_week: parseFloat(substanceFormData.dosage_mg_per_week),
      dosage_mg_per_application: parseFloat(substanceFormData.dosage_mg_per_application)
    };

    if (editingSubstance) {
      updateSubstanceMut.mutate({ id: editingSubstance.id, data });
    } else {
      createSubstanceMut.mutate(data);
    }
  };

  const frequencyLabels = {
    "1x_semana": "1x/semana",
    "2x_semana": "2x/semana",
    "3x_semana": "3x/semana",
    "dia_sim_dia_nao": "Dia sim, dia não",
    "diario": "Diário"
  };

  const getStudentName = (studentId) => {
    const s = students.find(st => st.id === studentId);
    return s?.name || "Aluno";
  };

  const toggleCycleExpand = (cycleId) => {
    setExpandedCycles(prev => ({ ...prev, [cycleId]: !prev[cycleId] }));
  };

  const filteredCycles = cycles.filter(c => {
    if (user?.role === "admin") {
      return c.active;
    } else {
      return c.student_id === student?.id && c.active;
    }
  });

  const cyclesByStudent = filteredCycles.reduce((acc, cycle) => {
    if (!acc[cycle.student_id]) {
      acc[cycle.student_id] = [];
    }
    acc[cycle.student_id].push(cycle);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ciclos Hormonais"
        subtitle="Gerenciar ciclos e substâncias anabolizantes"
        action={
          user?.role === "admin" && (
            <Button onClick={() => handleOpenCycleDialog()} className="btn-neon-purple">
              <Plus className="w-4 h-4 mr-2" />
              Novo Ciclo
            </Button>
          )
        }
      />

      {filteredCycles.length === 0 ? (
        <div className="cyber-card p-12 rounded-xl text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-purple-500/30" />
          <p className="text-purple-400/50 text-sm">Nenhum ciclo encontrado</p>
        </div>
      ) : (
        Object.entries(cyclesByStudent).map(([studentId, studentCycles]) => (
          <div key={studentId} className="space-y-4">
            {user?.role === "admin" && (
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getStudentName(studentId).substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-cyber text-white tracking-wider">
                  {getStudentName(studentId)}
                </h3>
              </div>
            )}

            <div className="space-y-3">
              {studentCycles.map(cycle => {
                const cycleSubstances = substances.filter(s => s.cycle_id === cycle.id);
                const isExpanded = expandedCycles[cycle.id];

                return (
                  <div key={cycle.id} className="cyber-card rounded-xl overflow-hidden">
                    <div className="p-4 bg-purple-500/5 border-b border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleCycleExpand(cycle.id)}
                            className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center hover:bg-purple-500/20 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
                          </button>
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-lg">{cycle.name}</h4>
                            <p className="text-purple-400/60 text-xs">
                              Início: {new Date(cycle.cycle_start_date).toLocaleDateString("pt-BR")}
                              {cycle.cycle_duration_weeks && ` • ${cycle.cycle_duration_weeks} semanas`}
                            </p>
                          </div>
                        </div>

                        {user?.role === "admin" && (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleOpenSubstanceDialog(cycle.id)}
                              size="sm"
                              className="btn-neon-cyan text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Substância
                            </Button>
                            <Button
                              onClick={() => handleOpenCycleDialog(cycle)}
                              size="sm"
                              variant="ghost"
                              className="text-purple-400 hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteCycleMut.mutate(cycle.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        {cycleSubstances.length === 0 ? (
                          <p className="text-purple-400/40 text-sm text-center py-4">
                            Nenhuma substância adicionada
                          </p>
                        ) : (
                          cycleSubstances.map(substance => (
                            <div key={substance.id} className="bg-black/20 border border-purple-500/10 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Syringe className="w-5 h-5 text-cyan-400" />
                                  <div>
                                    <p className="text-white font-medium">{substance.substance}</p>
                                    <Badge className="bg-pink-500/10 border-pink-500/30 text-pink-400 text-xs mt-1">
                                      {frequencyLabels[substance.application_frequency]}
                                    </Badge>
                                  </div>
                                </div>
                                {user?.role === "admin" && (
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleOpenSubstanceDialog(cycle.id, substance)}
                                      size="sm"
                                      variant="ghost"
                                      className="text-purple-400 hover:text-white h-7 w-7 p-0"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      onClick={() => deleteSubstanceMut.mutate(substance.id)}
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-400 hover:text-red-300 h-7 w-7 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-purple-400/50 text-xs mb-1">Semanal</p>
                                  <p className="text-white text-sm font-bold">{substance.dosage_mg_per_week} mg</p>
                                </div>
                                <div>
                                  <p className="text-cyan-400/50 text-xs mb-1">Por Aplicação</p>
                                  <p className="text-white text-sm font-bold">{substance.dosage_mg_per_application} mg</p>
                                </div>
                              </div>

                              {substance.application_site && (
                                <p className="text-purple-300/60 text-xs mt-2">
                                  <span className="text-purple-400/50">Local: </span>{substance.application_site}
                                </p>
                              )}

                              {substance.notes && (
                                <p className="text-purple-300/70 text-xs mt-2">{substance.notes}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Dialog Ciclo */}
      <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
        <DialogContent className="bg-[#0a0a16] border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cyber text-purple-300">
              {editingCycle ? "Editar Ciclo" : "Novo Ciclo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-purple-300 text-xs">Aluno *</Label>
              <Select value={cycleFormData.student_id} onValueChange={(v) => setCycleFormData({ ...cycleFormData, student_id: v })}>
                <SelectTrigger className="cyber-input mt-1">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.active).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Nome do Ciclo *</Label>
              <Input
                value={cycleFormData.name}
                onChange={(e) => setCycleFormData({ ...cycleFormData, name: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: Ciclo Bulking 2026"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Data de Início *</Label>
              <Input
                type="date"
                value={cycleFormData.cycle_start_date}
                onChange={(e) => setCycleFormData({ ...cycleFormData, cycle_start_date: e.target.value })}
                className="cyber-input mt-1"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Duração (semanas)</Label>
              <Input
                type="number"
                value={cycleFormData.cycle_duration_weeks}
                onChange={(e) => setCycleFormData({ ...cycleFormData, cycle_duration_weeks: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: 12"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Observações</Label>
              <Textarea
                value={cycleFormData.notes}
                onChange={(e) => setCycleFormData({ ...cycleFormData, notes: e.target.value })}
                className="cyber-input mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmitCycle}
              disabled={createCycleMut.isPending || updateCycleMut.isPending}
              className="w-full btn-neon-purple"
            >
              {editingCycle ? "Atualizar" : "Criar Ciclo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Substância */}
      <Dialog open={substanceDialogOpen} onOpenChange={setSubstanceDialogOpen}>
        <DialogContent className="bg-[#0a0a16] border-purple-500/30 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cyber text-purple-300">
              {editingSubstance ? "Editar Substância" : "Nova Substância"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-purple-300 text-xs">Substância *</Label>
              <Input
                value={substanceFormData.substance}
                onChange={(e) => setSubstanceFormData({ ...substanceFormData, substance: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: Testosterona, Trembolona..."
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Dosagem Total (mg/semana) *</Label>
              <Input
                type="number"
                value={substanceFormData.dosage_mg_per_week}
                onChange={(e) => setSubstanceFormData({ ...substanceFormData, dosage_mg_per_week: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: 500"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Dosagem por Aplicação (mg) *</Label>
              <Input
                type="number"
                value={substanceFormData.dosage_mg_per_application}
                onChange={(e) => setSubstanceFormData({ ...substanceFormData, dosage_mg_per_application: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: 250"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Frequência de Aplicação</Label>
              <Select value={substanceFormData.application_frequency} onValueChange={(v) => setSubstanceFormData({ ...substanceFormData, application_frequency: v })}>
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
              <Label className="text-purple-300 text-xs">Local de Aplicação</Label>
              <Input
                value={substanceFormData.application_site}
                onChange={(e) => setSubstanceFormData({ ...substanceFormData, application_site: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: Glúteo, Deltoide..."
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Observações</Label>
              <Textarea
                value={substanceFormData.notes}
                onChange={(e) => setSubstanceFormData({ ...substanceFormData, notes: e.target.value })}
                className="cyber-input mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmitSubstance}
              disabled={createSubstanceMut.isPending || updateSubstanceMut.isPending}
              className="w-full btn-neon-purple"
            >
              {editingSubstance ? "Atualizar" : "Adicionar Substância"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}