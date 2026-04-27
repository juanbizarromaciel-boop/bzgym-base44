import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Clock, Calendar, Gift, Sun, Star, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";

const FERIADOS_BR = [
  "01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"
];

function isSunday(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay() === 0;
}

function isHoliday(dateStr) {
  const mmdd = dateStr.slice(5);
  return FERIADOS_BR.includes(mmdd);
}

function getHolidayName(dateStr) {
  const map = {
    "01-01": "Ano Novo",
    "04-21": "Tiradentes",
    "05-01": "Dia do Trabalho",
    "09-07": "Independência",
    "10-12": "N. Sra. Aparecida",
    "11-02": "Finados",
    "11-15": "Proclamação da República",
    "11-20": "Consciência Negra",
    "12-25": "Natal"
  };
  return map[dateStr.slice(5)] || "Feriado";
}

function calcEffectiveHours(hours, isSun, isHol) {
  if (isSun || isHol) return hours * 2;
  return hours;
}

const emptyForm = {
  employee_name: "",
  date: new Date().toISOString().split("T")[0],
  hours_worked: "",
  notes: ""
};

export default function WorkHours() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dayOffDialog, setDayOffDialog] = useState(false);
  const [dayOffForm, setDayOffForm] = useState({ employee_name: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [useDayOffConfirm, setUseDayOffConfirm] = useState(null);
  const qc = useQueryClient();

  const { data: records = [] } = useQuery({
    queryKey: ["work_hours"],
    queryFn: () => base44.entities.WorkHour.list("-date", 500)
  });

  const { data: dayOffs = [] } = useQuery({
    queryKey: ["day_offs"],
    queryFn: () => base44.entities.DayOff.list("-date", 200)
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.WorkHour.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["work_hours"] }); qc.invalidateQueries({ queryKey: ["day_offs"] }); setDialogOpen(false); setForm(emptyForm); toast.success("Registro salvo!"); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.WorkHour.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["work_hours"] }); qc.invalidateQueries({ queryKey: ["day_offs"] }); setDeleteConfirm(null); toast.success("Registro removido!"); }
  });

  const createDayOffMut = useMutation({
    mutationFn: (d) => base44.entities.DayOff.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["day_offs"] }); setDayOffDialog(false); toast.success("Folga registrada!"); }
  });

  const useDayOffMut = useMutation({
    mutationFn: ({ id }) => base44.entities.DayOff.update(id, { status: "usada" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["day_offs"] }); setUseDayOffConfirm(null); toast.success("Folga marcada como usada!"); }
  });

  const deleteDayOffMut = useMutation({
    mutationFn: (id) => base44.entities.DayOff.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["day_offs"] }); toast.success("Folga removida!"); }
  });

  // Calcula domingos trabalhados por funcionário e quantas folgas já foram geradas
  function calcDayOffStats(employee) {
    const empRecords = records.filter(r => r.employee_name === employee);
    const sundaysWorked = empRecords.filter(r => r.is_sunday).length;
    const earnedDayOffs = Math.floor(sundaysWorked / 2);
    const empDayOffs = dayOffs.filter(d => d.employee_name === employee);
    const registeredDayOffs = empDayOffs.length;
    const availableDayOffs = empDayOffs.filter(d => d.status === "disponivel").length;
    const usedDayOffs = empDayOffs.filter(d => d.status === "usada").length;
    return { sundaysWorked, earnedDayOffs, registeredDayOffs, availableDayOffs, usedDayOffs };
  }

  function handleSave() {
    if (!form.employee_name || !form.date || !form.hours_worked) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const sun = isSunday(form.date);
    const hol = isHoliday(form.date);
    createMut.mutate({
      ...form,
      hours_worked: parseFloat(form.hours_worked),
      is_sunday: sun,
      is_holiday: hol,
      holiday_name: hol ? getHolidayName(form.date) : ""
    });
  }

  function handleSaveDayOff() {
    if (!dayOffForm.employee_name || !dayOffForm.date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createDayOffMut.mutate({ ...dayOffForm, status: "disponivel" });
  }

  // Funcionários únicos
  const employees = [...new Set(records.map(r => r.employee_name).filter(Boolean))];
  const filtered = filterEmployee === "all" ? records : records.filter(r => r.employee_name === filterEmployee);

  // Stats por funcionário
  function calcStats(employee) {
    const empRecords = records.filter(r => r.employee_name === employee);
    const totalReal = empRecords.reduce((s, r) => s + (r.hours_worked || 0), 0);
    const totalEffective = empRecords.reduce((s, r) => s + calcEffectiveHours(r.hours_worked || 0, r.is_sunday, r.is_holiday), 0);
    return { totalReal, totalEffective };
  }

  const formSun = isSunday(form.date);
  const formHol = isHoliday(form.date);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Horas"
        subtitle="Registro de horas trabalhadas com hora dupla em domingos e feriados"
        action={
          <div className="flex gap-2">
            <button onClick={() => setDayOffDialog(true)} className="btn-neon-cyan px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 tracking-wider">
              <Gift className="w-4 h-4" /> REGISTRAR FOLGA
            </button>
            <button onClick={() => setDialogOpen(true)} className="btn-neon-purple px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 tracking-wider">
              <Plus className="w-4 h-4" /> NOVO REGISTRO
            </button>
          </div>
        }
      />

      {/* Stats por funcionário */}
      {employees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map(emp => {
            const { totalReal, totalEffective } = calcStats(emp);
            const { sundaysWorked, earnedDayOffs, availableDayOffs, usedDayOffs } = calcDayOffStats(emp);
            return (
              <div key={emp} className="cyber-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-cyber text-xs text-purple-400">{emp.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <p className="font-semibold text-white truncate">{emp}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/40 rounded-lg p-2.5 border border-purple-900/20 text-center">
                    <p className="text-lg font-cyber text-purple-300">{totalReal.toFixed(1)}h</p>
                    <p className="text-[10px] text-purple-500/50 font-mono-cyber tracking-wider">HORAS REAIS</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-2.5 border border-cyan-900/20 text-center">
                    <p className="text-lg font-cyber text-cyan-300">{totalEffective.toFixed(1)}h</p>
                    <p className="text-[10px] text-cyan-500/50 font-mono-cyber tracking-wider">HORAS EFETIVAS</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-purple-900/20 pt-2">
                  <span className="text-purple-400/50 font-mono-cyber flex items-center gap-1">
                    <Sun className="w-3 h-3" /> {sundaysWorked} domingos
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-[10px] ${availableDayOffs > 0 ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-purple-500/10 border-purple-500/20 text-purple-400/50"}`}>
                      <Gift className="w-2.5 h-2.5 mr-1" />
                      {availableDayOffs} folgas disponíveis
                    </Badge>
                  </div>
                </div>
                {earnedDayOffs > availableDayOffs + usedDayOffs && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{earnedDayOffs - (availableDayOffs + usedDayOffs)} folga(s) ganhas não registradas</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Folgas disponíveis */}
      {dayOffs.filter(d => d.status === "disponivel").length > 0 && (
        <div className="cyber-card rounded-xl p-4">
          <p className="text-xs font-mono-cyber text-purple-500/50 tracking-widest mb-3 flex items-center gap-2">
            <Gift className="w-3.5 h-3.5" /> FOLGAS DISPONÍVEIS
          </p>
          <div className="flex flex-wrap gap-2">
            {dayOffs.filter(d => d.status === "disponivel").map(d => (
              <div key={d.id} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5 text-xs text-green-300">
                <Gift className="w-3 h-3" />
                <span>{d.employee_name}</span>
                <span className="text-green-500/50">·</span>
                <span>{new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                <button onClick={() => setUseDayOffConfirm(d)} className="ml-1 text-green-400/50 hover:text-green-300 transition-colors" title="Marcar como usada">✓</button>
                <button onClick={() => deleteDayOffMut.mutate(d.id)} className="text-green-400/30 hover:text-red-400 transition-colors" title="Remover">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtro */}
      {employees.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterEmployee("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterEmployee === "all" ? "bg-purple-500/20 border border-purple-500/40 text-purple-300" : "bg-black/30 border border-purple-900/20 text-purple-500/40 hover:text-purple-300"}`}
          >
            Todos
          </button>
          {employees.map(emp => (
            <button
              key={emp}
              onClick={() => setFilterEmployee(emp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterEmployee === emp ? "bg-purple-500/20 border border-purple-500/40 text-purple-300" : "bg-black/30 border border-purple-900/20 text-purple-500/40 hover:text-purple-300"}`}
            >
              {emp}
            </button>
          ))}
        </div>
      )}

      {/* Lista de registros */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-purple-500/30">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-mono-cyber text-sm">// nenhum registro encontrado</p>
          </div>
        )}
        {filtered.map(r => {
          const effective = calcEffectiveHours(r.hours_worked || 0, r.is_sunday, r.is_holiday);
          const isDouble = r.is_sunday || r.is_holiday;
          return (
            <div key={r.id} className={`cyber-card rounded-xl border overflow-hidden ${isDouble ? "border-yellow-500/20" : "border-purple-900/20"}`}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${r.is_sunday ? "bg-yellow-500/10 border border-yellow-500/20" : r.is_holiday ? "bg-orange-500/10 border border-orange-500/20" : "bg-purple-500/10 border border-purple-500/20"}`}>
                    {r.is_sunday ? <Sun className="w-4 h-4 text-yellow-400" /> : r.is_holiday ? <Star className="w-4 h-4 text-orange-400" /> : <Clock className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{r.employee_name}</p>
                      {r.is_sunday && <Badge className="text-[10px] bg-yellow-500/10 border-yellow-500/30 text-yellow-400">DOMINGO</Badge>}
                      {r.is_holiday && <Badge className="text-[10px] bg-orange-500/10 border-orange-500/30 text-orange-400">{r.holiday_name || "FERIADO"}</Badge>}
                    </div>
                    <p className="text-xs text-purple-400/40 font-mono-cyber mt-0.5">
                      {new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                    </p>
                    {r.notes && <p className="text-xs text-purple-400/30 mt-0.5 italic">{r.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-purple-300/60 font-mono-cyber">{r.hours_worked}h reais</p>
                    <p className={`text-base font-cyber font-bold ${isDouble ? "text-yellow-300" : "text-white"}`} style={isDouble ? { textShadow: "0 0 8px rgba(234,179,8,0.5)" } : {}}>
                      {effective}h
                      {isDouble && <span className="text-[10px] text-yellow-400/60 ml-1">×2</span>}
                    </p>
                  </div>
                  <button onClick={() => setDeleteConfirm(r)} className="p-1.5 text-purple-400/30 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog novo registro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border border-purple-900/40 text-white max-w-sm" style={{ background: "#04040e" }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">NOVO REGISTRO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">FUNCIONÁRIO *</Label>
              <Input
                value={form.employee_name}
                onChange={e => setForm({ ...form, employee_name: e.target.value })}
                placeholder="Nome do funcionário"
                className="cyber-input mt-1"
                list="employees-list"
              />
              <datalist id="employees-list">
                {employees.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">DATA *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="cyber-input mt-1"
              />
              {(isSunday(form.date) || isHoliday(form.date)) && (
                <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                  <Star className="w-3.5 h-3.5 flex-shrink-0" />
                  {isSunday(form.date) ? "Domingo" : getHolidayName(form.date)} — horas contadas em dobro!
                </div>
              )}
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">HORAS TRABALHADAS *</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={form.hours_worked}
                onChange={e => setForm({ ...form, hours_worked: e.target.value })}
                placeholder="Ex: 8"
                className="cyber-input mt-1"
              />
              {form.hours_worked && (isSunday(form.date) || isHoliday(form.date)) && (
                <p className="text-xs text-cyan-400/70 mt-1 font-mono-cyber">
                  = {parseFloat(form.hours_worked) * 2}h efetivas (dobro)
                </p>
              )}
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas opcionais..."
                className="cyber-input mt-1 h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={handleSave} disabled={createMut.isPending} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium">SALVAR</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog registrar folga */}
      <Dialog open={dayOffDialog} onOpenChange={setDayOffDialog}>
        <DialogContent className="border border-cyan-900/40 text-white max-w-sm" style={{ background: "#04040e" }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-cyan-300">REGISTRAR FOLGA</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-purple-400/50 font-mono-cyber">// A cada 2 domingos trabalhados, o funcionário ganha 1 folga</p>
          <div className="space-y-4">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">FUNCIONÁRIO *</Label>
              <Input
                value={dayOffForm.employee_name}
                onChange={e => setDayOffForm({ ...dayOffForm, employee_name: e.target.value })}
                placeholder="Nome do funcionário"
                className="cyber-input mt-1"
                list="employees-list"
              />
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">DATA DA FOLGA *</Label>
              <Input
                type="date"
                value={dayOffForm.date}
                onChange={e => setDayOffForm({ ...dayOffForm, date: e.target.value })}
                className="cyber-input mt-1"
              />
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">OBSERVAÇÕES</Label>
              <Textarea
                value={dayOffForm.notes || ""}
                onChange={e => setDayOffForm({ ...dayOffForm, notes: e.target.value })}
                className="cyber-input mt-1 h-16"
              />
            </div>
            {/* Aviso de saldo */}
            {dayOffForm.employee_name && employees.includes(dayOffForm.employee_name) && (() => {
              const { earnedDayOffs, availableDayOffs, usedDayOffs } = calcDayOffStats(dayOffForm.employee_name);
              const pending = earnedDayOffs - (availableDayOffs + usedDayOffs);
              return (
                <div className={`text-xs rounded-lg p-3 border flex items-start gap-2 ${pending > 0 ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"}`}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    {pending > 0
                      ? `${pending} folga(s) disponível(is) para registrar`
                      : "Sem saldo de folgas. Verifique os domingos trabalhados."}
                  </span>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDayOffDialog(false)} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={handleSaveDayOff} disabled={createDayOffMut.isPending} className="btn-neon-cyan px-4 py-2 rounded-lg text-sm font-medium">REGISTRAR</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog excluir registro */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="border border-pink-900/40 text-white max-w-sm" style={{ background: "#04040e" }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-pink-400">EXCLUIR REGISTRO</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-purple-300/70">Excluir o registro de <strong>{deleteConfirm?.employee_name}</strong> em <strong>{deleteConfirm?.date && new Date(deleteConfirm.date + "T12:00:00").toLocaleDateString("pt-BR")}</strong>?</p>
          <p className="text-xs text-purple-500/40 font-mono-cyber">// esta ação não pode ser desfeita</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={() => deleteMut.mutate(deleteConfirm.id)} disabled={deleteMut.isPending} className="btn-neon-pink px-4 py-2 rounded-lg text-sm font-medium">EXCLUIR</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog usar folga */}
      <Dialog open={!!useDayOffConfirm} onOpenChange={() => setUseDayOffConfirm(null)}>
        <DialogContent className="border border-green-900/40 text-white max-w-sm" style={{ background: "#04040e" }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-green-400">USAR FOLGA</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-purple-300/70">Marcar folga de <strong>{useDayOffConfirm?.employee_name}</strong> em <strong>{useDayOffConfirm?.date && new Date(useDayOffConfirm.date + "T12:00:00").toLocaleDateString("pt-BR")}</strong> como usada?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseDayOffConfirm(null)} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={() => useDayOffMut.mutate({ id: useDayOffConfirm.id })} disabled={useDayOffMut.isPending} className="btn-neon-cyan px-4 py-2 rounded-lg text-sm font-medium">CONFIRMAR</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}