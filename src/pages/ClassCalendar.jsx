import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Calendar, DollarSign, Sparkles, Copy, Check, ChevronLeft, ChevronRight,
  Clock, Trash2, Plus, MessageSquare
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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
  const [studentName, setStudentName] = useState("");
  const [personalName, setPersonalName] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setPersonalName(u.full_name || "");
    }).catch(() => {});
  }, []);

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

  const generateMessage = async () => {
    if (totalClasses === 0) { toast.error("Selecione pelo menos um dia de aula"); return; }
    if (!rateNum) { toast.error("Informe o valor por hora"); return; }
    setGenerating(true);
    setGeneratedMessage("");

    const classesList = sortedDays.map(([key, val]) => {
      const d = new Date(key + "T00:00:00");
      const dayName = format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });
      return `• ${dayName} às ${val.time}h`;
    }).join("\n");

    const monthName = MONTH_NAMES[month] + "/" + year;
    const prompt = `Você é um personal trainer profissional chamado "${personalName || "Personal"}". 
Crie uma mensagem de cobrança mensal para o aluno${studentName ? ` "${studentName}"` : ""} referente ao mês de ${monthName}.

Dados:
- Total de aulas: ${totalClasses} aulas
- Duração de cada aula: ${classDuration} minutos (${durationHours}h)
- Valor por hora: ${formatCurrency(rateNum)}
- Valor total: ${formatCurrency(totalValue)}
- Aulas realizadas:
${classesList}

Crie uma mensagem de cobrança profissional, calorosa e valorizadora do trabalho do personal trainer. 
A mensagem deve:
1. Cumprimentar o aluno pelo nome (se tiver)
2. Apresentar o resumo do mês de forma organizada e bonita com emojis
3. Listar todas as aulas com data e horário
4. Mostrar o cálculo de forma transparente (nº aulas × duração × valor hora = total)
5. Valorizar a dedicação do aluno e o trabalho do personal
6. Finalizar com uma mensagem motivacional e solicitar o pagamento de forma educada
7. Usar emojis de forma elegante para tornar a mensagem mais visual
8. Ser formatada para WhatsApp (use *negrito* e _itálico_ quando necessário)

Use sempre o mesmo padrão profissional. A mensagem deve ser em português brasileiro.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setGeneratedMessage(res);
    } catch (e) {
      toast.error("Erro ao gerar mensagem");
    }
    setGenerating(false);
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
              <div>
                <label className="text-[10px] font-mono-cyber text-purple-400/50 tracking-wider uppercase mb-1 block">Aluno</label>
                <input
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Nome do aluno"
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
                const today = isToday(day);

                return (
                  <button
                    key={key}
                    onClick={() => toggleDay(day)}
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
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[10px] font-mono-cyber mt-3" style={{ color: 'rgba(168,85,247,0.3)' }}>
              Clique nos dias para selecionar as aulas
            </p>
          </div>
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
            disabled={generating || totalClasses === 0 || !rateNum}
            className="w-full py-3.5 rounded-xl font-cyber text-sm tracking-widest transition-all flex items-center justify-center gap-2"
            style={{
              background: generating || totalClasses === 0 || !rateNum
                ? 'rgba(168,85,247,0.05)'
                : 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(6,182,212,0.15))',
              border: `1px solid ${generating || totalClasses === 0 || !rateNum ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.5)'}`,
              color: generating || totalClasses === 0 || !rateNum ? 'rgba(168,85,247,0.3)' : '#edd9ff',
              boxShadow: generating || totalClasses === 0 || !rateNum ? 'none' : '0 0 20px rgba(168,85,247,0.2)',
              cursor: generating || totalClasses === 0 || !rateNum ? 'not-allowed' : 'pointer',
            }}>
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                GERANDO COM IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                GERAR MENSAGEM COM IA
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Message */}
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