import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Calendar, DollarSign, Sparkles, Copy, Check, ChevronLeft, ChevronRight,
  Clock, Trash2, MessageSquare, Loader2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import ScheduledClassList from "@/components/calendar/ScheduledClassList";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function formatCurrency(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ClassCalendar() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState({}); // { "YYYY-MM-DD": { time: "08:00" } }
  const [hourlyRate, setHourlyRate] = useState("");
  const [classDuration, setClassDuration] = useState(60); // minutes
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [personalName, setPersonalName] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [students, setStudents] = useState([]);
  const [pixKey, setPixKey] = useState("");
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeForm, setFinanceForm] = useState({ student_id: "", description: "", due_date: "" });
  const [savingFinance, setSavingFinance] = useState(false);
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [focusedDate, setFocusedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setPersonalName(u.full_name || "");
      setPixKey(u.email || "");
      base44.entities.Student.filter({ personal_id: u.email }).then(ownStudents => {
        setStudents(ownStudents.filter(student => student.active !== false && student.email));
      }).catch(() => {});
      Promise.all([
        base44.entities.CalendarioEvento.filter({ personal_id: u.email }, "data", 500),
        base44.entities.CalendarioEvento.filter({ usuario_id: u.email }, "data", 500),
      ]).then(lists => {
        const ownClasses = [...new Map(lists.flat().map(event => [event.id, event])).values()];
        setScheduledClasses(ownClasses.filter(event => event.tipo === "treino"));
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  // Calcula o 5º dia útil do próximo mês
  const getNextDueDate = (fromMonth, fromYear) => {
    const nextMonth = fromMonth === 11 ? 0 : fromMonth + 1;
    const nextYear = fromMonth === 11 ? fromYear + 1 : fromYear;
    let count = 0;
    let day = 1;
    while (count < 5) {
      const d = new Date(nextYear, nextMonth, day);
      const weekday = d.getDay();
      if (weekday !== 0 && weekday !== 6) count++;
      if (count < 5) day++;
    }
    return format(new Date(nextYear, nextMonth, day), 'yyyy-MM-dd');
  };

  const openFinanceModal = () => {
    const due = getNextDueDate(month, year);
    const monthLabel = MONTH_NAMES[month] + "/" + year;
    setFinanceForm({
      student_id: selectedStudentId,
      description: `Mensalidade ${monthLabel}`,
      due_date: due,
    });
    setShowFinanceModal(true);
  };

  const saveToFinance = async () => {
    if (!financeForm.student_id) { toast.error("Selecione um aluno."); return; }
    if (!financeForm.due_date) { toast.error("Informe o vencimento."); return; }
    setSavingFinance(true);
    try {
      const student = students.find(item => item.id === financeForm.student_id);
      if (!student?.email) { toast.error("O aluno selecionado precisa ter um e-mail cadastrado."); setSavingFinance(false); return; }
      const displayName = studentName.trim() || student.name || student.email;
      const payment = await base44.entities.Payment.create({
        student_id: financeForm.student_id,
        user_email: student.email,
        user_name: displayName,
        personal_id: user?.email,
        amount: totalValue || 0,
        due_date: financeForm.due_date,
        payment_date: "",
        status: "pendente",
        description: financeForm.description,
      });
      const classValue = durationHours * rateNum;
      const createdClasses = await base44.entities.CalendarioEvento.bulkCreate(sortedDays.map(([data, value]) => ({
        usuario_id: user.email, personal_id: user.email, student_id: student.id, student_email: student.email || "",
        payment_id: payment.id, class_value: classValue, duration_minutes: classDuration,
        titulo: `Aula com ${displayName}`, descricao: `${classDuration} minutos`, tipo: "treino", data, horario: value.time,
        recorrencia: "nenhuma", status: "pendente",
      })));
      setScheduledClasses(previous => [...previous, ...createdClasses]);
      toast.success("Financeiro e agenda atualizados!");
      setShowFinanceModal(false);
    } catch (e) {
      toast.error("Erro: " + e.message);
    }
    setSavingFinance(false);
  };

  const cancelClass = async (classEvent) => {
    const scheduledAt = new Date(`${classEvent.data}T${classEvent.horario || "23:59"}:00`);
    if (scheduledAt <= new Date()) { toast.error("Só é possível abater aulas canceladas antes do horário marcado."); return; }
    if (!window.confirm("Cancelar esta aula e abater o valor do financeiro?")) return;
    setCancellingId(classEvent.id);
    try {
      await base44.entities.CalendarioEvento.update(classEvent.id, { status: "cancelado" });
      if (classEvent.payment_id) {
        const payment = await base44.entities.Payment.get(classEvent.payment_id);
        const amount = Math.max(0, Number(payment.amount || 0) - Number(classEvent.class_value || 0));
        await base44.entities.Payment.update(payment.id, { amount, status: amount === 0 ? "cancelado" : payment.status });
      }
      setScheduledClasses(items => items.map(item => item.id === classEvent.id ? { ...item, status: "cancelado" } : item));
      toast.success("Aula cancelada e valor abatido do financeiro.");
    } catch (error) {
      toast.error("Não foi possível cancelar a aula: " + error.message);
    } finally {
      setCancellingId(null);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart); // 0=Sun

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const toggleDay = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    setSelectedDays(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { time: "08:00" } };
    });
  };

  const updateTime = (key, time) => {
    setSelectedDays(prev => ({ ...prev, [key]: { ...prev[key], time } }));
  };

  const removeDay = (key) => {
    setSelectedDays(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const sortedDays = Object.entries(selectedDays).sort(([a], [b]) => a.localeCompare(b));
  const totalClasses = sortedDays.length;
  const durationHours = classDuration / 60;
  const rateNum = parseFloat(hourlyRate) || 0;
  const totalValue = totalClasses * durationHours * rateNum;

  const generateMessage = () => {
    if (totalClasses === 0) { toast.error("Selecione pelo menos um dia de aula"); return; }
    if (!rateNum) { toast.error("Informe o valor por hora"); return; }

    // Captura snapshot dos valores atuais no momento do clique
    const snapDays = Object.entries(selectedDays).sort(([a], [b]) => a.localeCompare(b));
    const snapTotal = snapDays.length;
    const snapRate = parseFloat(hourlyRate) || 0;
    const snapDurationHours = classDuration / 60;
    const snapValuePerClass = snapDurationHours * snapRate;
    const snapTotalValue = snapTotal * snapValuePerClass;
    const snapMonth = currentDate.getMonth();
    const snapYear = currentDate.getFullYear();
    const snapMonthName = MONTH_NAMES[snapMonth] + "/" + snapYear;
    const durationLabel = snapDurationHours === 1 ? "1h" : snapDurationHours % 1 === 0 ? `${snapDurationHours}h` : `${classDuration}min`;
    const snapPixKey = pixKey || user?.email || "";

    const classesList = snapDays.map(([key, val]) => {
      const d = new Date(key + "T00:00:00");
      const dayNum = format(d, "dd/MM");
      const weekDay = format(d, "EEEE", { locale: ptBR });
      return `${dayNum} — ${weekDay}, às ${val.time}`;
    }).join("\n");

    const msg = `Olá, ${studentName.trim() || "[Nome do aluno]"}! Tudo bem?

Segue o resumo das aulas realizadas em ${snapMonthName}:

Total de aulas: ${snapTotal}
Duração de cada aula: ${durationLabel}
Valor por aula: ${formatCurrency(snapValuePerClass)}
Valor total: ${formatCurrency(snapTotalValue)}

Aulas realizadas:
${classesList}

Valor referente ao mês: ${formatCurrency(snapTotalValue)}

Pix: ${snapPixKey}

Obrigado pela confiança.

Um abraço,
${personalName.trim() || "[Seu nome]"}`;

    setGeneratedMessage(msg);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    toast.success("Mensagem copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(168,85,247,0.2)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(6,182,212,0.3), transparent)' }} />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>
            <Calendar className="w-6 h-6 text-purple-400" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' }} />
          </div>
          <div>
            <h1 className="font-cyber text-2xl text-white tracking-wide">CALENDÁRIO DE AULAS</h1>
            <p className="text-xs font-mono-cyber mt-0.5" style={{ color: 'rgba(192,132,252,0.5)' }}>
              Selecione os dias, calcule o valor e gere a mensagem com IA
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Calendar + Config */}
        <div className="space-y-4">
          {/* Config fields */}
          <div className="rounded-xl p-4 border space-y-3"
            style={{ background: 'rgba(8,4,22,0.7)', borderColor: 'rgba(168,85,247,0.18)' }}>
            <p className="text-[10px] font-mono-cyber text-purple-400/50 tracking-widest uppercase">Configurações</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] font-mono-cyber text-purple-400/50 tracking-wider uppercase mb-1 block">Aluno</label>
                <select
                  value={selectedStudentId}
                  onChange={e => {
                    const id = e.target.value;
                    const selected = students.find(item => item.id === id);
                    setSelectedStudentId(id);
                    setStudentName(selected?.name || "");
                  }}
                  className="cyber-input w-full rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">Selecionar aluno...</option>
                  {students.filter(item => item.active !== false && item.email).map(item => <option key={item.id} value={item.id}>{item.name || item.email}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono-cyber text-purple-400/50 tracking-wider uppercase mb-1 block">Nome do aluno (opcional)</label>
                <input
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Nome para exibição"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none cyber-input"
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(168,85,247,0.2)', color: '#edd9ff' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono-cyber text-purple-400/50 tracking-wider uppercase mb-1 block">Seu Nome</label>
                <input
                  value={personalName}
                  onChange={e => setPersonalName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(168,85,247,0.2)', color: '#edd9ff' }}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-mono-cyber text-purple-400/50 tracking-wider uppercase mb-1 block">Chave Pix</label>
                <input
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  placeholder="Email, CPF ou chave Pix"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(168,85,247,0.2)', color: '#edd9ff' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono-cyber text-purple-400/50 tracking-wider uppercase mb-1 block">
                  <DollarSign className="inline w-3 h-3 mr-1" />Valor por Hora (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value)}
                  placeholder="Ex: 120"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono-cyber text-purple-400/50 tracking-wider uppercase mb-1 block">
                  <Clock className="inline w-3 h-3 mr-1" />Duração (min)
                </label>
                <select
                  value={classDuration}
                  onChange={e => setClassDuration(Number(e.target.value))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(168,85,247,0.2)', color: '#edd9ff' }}>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min (1h)</option>
                  <option value={90}>90 min (1h30)</option>
                  <option value={120}>120 min (2h)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-xl p-4 border"
            style={{ background: 'rgba(8,4,22,0.7)', borderColor: 'rgba(168,85,247,0.18)' }}>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-purple-500/10 transition-colors">
                <ChevronLeft className="w-4 h-4 text-purple-400" />
              </button>
              <h2 className="font-cyber text-sm text-white tracking-widest">
                {MONTH_NAMES[month]} {year}
              </h2>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-purple-500/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-mono-cyber py-1"
                  style={{ color: 'rgba(192,132,252,0.35)', letterSpacing: '0.1em' }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells */}
              {Array.from({ length: startWeekday }).map((_, i) => <div key={`e-${i}`} />)}

              {daysInMonth.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const isSelected = !!selectedDays[key];
                const dayClasses = scheduledClasses.filter(item => item.data === key && item.status !== "cancelado");
                const today = isToday(day);

                return (
                  <button
                    key={key}
                    onClick={() => { setFocusedDate(key); toggleDay(day); }}
                    className="relative aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(6,182,212,0.2))'
                        : today
                        ? 'rgba(168,85,247,0.08)'
                        : 'rgba(168,85,247,0.03)',
                      border: isSelected
                        ? '1px solid rgba(168,85,247,0.6)'
                        : today
                        ? '1px solid rgba(168,85,247,0.25)'
                        : '1px solid rgba(168,85,247,0.06)',
                      color: isSelected ? '#fff' : today ? '#c084fc' : 'rgba(196,181,224,0.5)',
                      boxShadow: isSelected ? '0 0 10px rgba(168,85,247,0.3)' : 'none',
                    }}>
                    {isSelected && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: '#c084fc', boxShadow: '0 0 4px rgba(192,132,252,0.9)' }} />
                    )}
                    {format(day, 'd')}
                    {dayClasses.length > 0 && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-1 text-[8px] leading-3 text-black">{dayClasses.length}</span>}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[10px] font-mono-cyber mt-3" style={{ color: 'rgba(168,85,247,0.3)' }}>
              Clique nos dias para selecionar e consultar as aulas
            </p>
          </div>
          <ScheduledClassList date={focusedDate} classes={scheduledClasses} students={students} onCancel={cancelClass} cancellingId={cancellingId} />
        </div>

        {/* RIGHT: Selected days + Summary + Message */}
        <div className="space-y-4">
          {/* Summary card */}
          <div className="rounded-xl p-4 border"
            style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <p className="text-[10px] font-mono-cyber tracking-widest uppercase mb-3" style={{ color: 'rgba(110,231,183,0.5)' }}>Resumo do Mês</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-cyber text-2xl text-white">{totalClasses}</p>
                <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(196,181,224,0.4)' }}>AULAS</p>
              </div>
              <div>
                <p className="font-cyber text-2xl text-cyan-400">{classDuration}min</p>
                <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(196,181,224,0.4)' }}>POR AULA</p>
              </div>
              <div>
                <p className="font-cyber text-2xl text-emerald-400">{rateNum ? formatCurrency(totalValue) : '—'}</p>
                <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(196,181,224,0.4)' }}>TOTAL</p>
              </div>
            </div>
            {rateNum > 0 && totalClasses > 0 && (
              <div className="mt-3 pt-3 border-t text-xs font-mono-cyber text-center"
                style={{ borderColor: 'rgba(16,185,129,0.15)', color: 'rgba(110,231,183,0.5)' }}>
                {totalClasses} aulas × {durationHours}h × {formatCurrency(rateNum)}/h = <span style={{ color: '#6ee7b7' }}>{formatCurrency(totalValue)}</span>
              </div>
            )}
          </div>

          {/* Selected days list */}
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
            <div className="px-4 py-2.5 flex items-center justify-between"
              style={{ background: 'rgba(168,85,247,0.08)', borderBottom: '1px solid rgba(168,85,247,0.1)' }}>
              <p className="text-[10px] font-mono-cyber text-purple-400/50 tracking-widest uppercase">
                Dias Selecionados ({totalClasses})
              </p>
              {totalClasses > 0 && (
                <button onClick={() => setSelectedDays({})}
                  className="text-[10px] font-mono-cyber text-red-400/50 hover:text-red-400 transition-colors">
                  limpar tudo
                </button>
              )}
            </div>

            {totalClasses === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-500/20" />
                <p className="text-xs font-mono-cyber" style={{ color: 'rgba(168,85,247,0.3)' }}>
                  // nenhum dia selecionado
                </p>
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto">
                {sortedDays.map(([key, val]) => {
                  const d = new Date(key + "T00:00:00");
                  const label = format(d, "EEE, dd/MM", { locale: ptBR });
                  return (
                    <div key={key} className="flex items-center justify-between px-4 py-2.5 border-b hover:bg-purple-500/5 transition-colors"
                      style={{ borderColor: 'rgba(168,85,247,0.06)' }}>
                      <span className="text-sm text-white capitalize">{label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={val.time}
                          onChange={e => updateTime(key, e.target.value)}
                          className="rounded px-2 py-1 text-xs outline-none"
                          style={{ background: 'rgba(4,2,14,0.6)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}
                        />
                        <button onClick={() => removeDay(key)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3 h-3 text-red-400/50" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={generateMessage}
            disabled={totalClasses === 0 || !rateNum}
            className="w-full py-3.5 rounded-xl font-cyber text-sm tracking-widest transition-all flex items-center justify-center gap-2"
            style={{
              background: totalClasses === 0 || !rateNum ? 'rgba(168,85,247,0.05)' : 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(6,182,212,0.15))',
              border: `1px solid ${totalClasses === 0 || !rateNum ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.5)'}`,
              color: totalClasses === 0 || !rateNum ? 'rgba(168,85,247,0.3)' : '#edd9ff',
              boxShadow: totalClasses === 0 || !rateNum ? 'none' : '0 0 20px rgba(168,85,247,0.2)',
              cursor: totalClasses === 0 || !rateNum ? 'not-allowed' : 'pointer',
            }}>
            <Sparkles className="w-4 h-4" />
            GERAR MENSAGEM
          </button>

          {/* Lançar no Financeiro */}
          <button
            onClick={openFinanceModal}
            disabled={totalClasses === 0 || !rateNum}
            className="w-full py-3.5 rounded-xl font-cyber text-sm tracking-widest transition-all flex items-center justify-center gap-2"
            style={{
              background: totalClasses === 0 || !rateNum ? 'rgba(16,185,129,0.03)' : 'rgba(16,185,129,0.12)',
              border: `1px solid ${totalClasses === 0 || !rateNum ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.4)'}`,
              color: totalClasses === 0 || !rateNum ? 'rgba(16,185,129,0.25)' : '#6ee7b7',
              boxShadow: totalClasses === 0 || !rateNum ? 'none' : '0 0 16px rgba(16,185,129,0.12)',
              cursor: totalClasses === 0 || !rateNum ? 'not-allowed' : 'pointer',
            }}>
            <DollarSign className="w-4 h-4" />
            LANÇAR NO FINANCEIRO
          </button>
        </div>
      </div>

      {/* Generated Message */}
      {/* Finance Modal */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 relative" style={{ background: 'rgba(8,4,22,0.98)', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.12)' }}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-cyber text-base text-white tracking-wide">LANÇAR NO FINANCEIRO</h2>
                <p className="text-xs font-mono-cyber mt-0.5" style={{ color: 'rgba(110,231,183,0.4)' }}>Cobrança pendente — sem data de pagamento</p>
              </div>
              <button onClick={() => setShowFinanceModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-500/10">
                <span style={{ color: '#6ee7b7', fontSize: '1rem' }}>✕</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Total */}
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(110,231,183,0.5)' }}>VALOR TOTAL</p>
                <p className="font-cyber text-2xl mt-1" style={{ color: '#6ee7b7' }}>{formatCurrency(totalValue)}</p>
                <p className="text-[10px] font-mono-cyber mt-0.5" style={{ color: 'rgba(110,231,183,0.4)' }}>
                  {totalClasses} aulas × {durationHours}h × {formatCurrency(rateNum)}/h
                </p>
              </div>

              {/* Aluno */}
              <div>
                <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(110,231,183,0.5)', letterSpacing: '0.1em' }}>ALUNO</label>
                <select
                  value={financeForm.student_id}
                  onChange={e => {
                    const id = e.target.value;
                    const selected = students.find(item => item.id === id);
                    setFinanceForm(f => ({ ...f, student_id: id }));
                    setSelectedStudentId(id);
                    setStudentName(selected?.name || "");
                  }}
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(16,185,129,0.25)', color: '#f0e6ff', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none' }}>
                  <option value="">Selecionar aluno...</option>
                  {students.filter(s => s.active !== false && s.email).map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>) }
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(110,231,183,0.5)', letterSpacing: '0.1em' }}>DESCRIÇÃO</label>
                <input
                  type="text"
                  value={financeForm.description}
                  onChange={e => setFinanceForm(f => ({ ...f, description: e.target.value }))}
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(16,185,129,0.25)', color: '#f0e6ff', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none' }}
                />
              </div>

              {/* Vencimento */}
              <div>
                <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(110,231,183,0.5)', letterSpacing: '0.1em' }}>
                  VENCIMENTO (5º DIA ÚTIL DO PRÓXIMO MÊS — EDITÁVEL)
                </label>
                <input
                  type="date"
                  value={financeForm.due_date}
                  onChange={e => setFinanceForm(f => ({ ...f, due_date: e.target.value }))}
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowFinanceModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', color: 'rgba(110,231,183,0.5)' }}>
                Cancelar
              </button>
              <button onClick={saveToFinance} disabled={savingFinance}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.45)', color: '#6ee7b7', boxShadow: '0 0 14px rgba(16,185,129,0.12)' }}>
                {savingFinance ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                Lançar Pendente
              </button>
            </div>
          </div>
        </div>
      )}

      {generatedMessage && (
        <div className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'rgba(168,85,247,0.25)', background: 'rgba(8,4,22,0.8)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b"
            style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.15)' }}>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <p className="text-xs font-cyber text-purple-300 tracking-widest">MENSAGEM GERADA</p>
            </div>
            <button
              onClick={copyMessage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(168,85,247,0.12)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.35)' : 'rgba(168,85,247,0.3)'}`,
                color: copied ? '#6ee7b7' : '#c084fc',
              }}>
              {copied ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
            </button>
          </div>
          <div className="p-5">
            <pre className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed font-sans">
              {generatedMessage}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}