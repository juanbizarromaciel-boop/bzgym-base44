import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Briefcase, DollarSign, Sparkles, Copy, Check,
  MessageSquare, Loader2, Package
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

function formatCurrency(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

// Pacotes disponíveis de consultoria
const PACKAGES = [
  {
    id: "treino_dieta_ciclo",
    label: "Treino + Dieta + Ciclo",
    short: "Treino, Dieta e Ciclo Hormonal",
    emoji: "💪🥗💉",
    description: "Protocolo completo: prescrição de treino personalizado, planejamento alimentar detalhado e acompanhamento de ciclo hormonal com monitoramento contínuo.",
    highlights: [
      "Planilha de treino 100% individualizada",
      "Plano alimentar com macros calculados",
      "Protocolo de ciclo hormonal monitorado",
      "Ajustes mensais conforme evolução",
      "Suporte direto via chat",
    ],
  },
  {
    id: "treino_dieta",
    label: "Treino + Dieta",
    short: "Treino e Dieta",
    emoji: "💪🥗",
    description: "Combinação poderosa: treino periodizado e dieta estratégica trabalhando juntos para maximizar seus resultados de forma segura e eficiente.",
    highlights: [
      "Planilha de treino periodizada",
      "Plano alimentar com macros ajustados",
      "Revisão mensal de cargas e dieta",
      "Suporte direto via chat",
    ],
  },
  {
    id: "treino_ciclo",
    label: "Treino + Ciclo",
    short: "Treino e Ciclo Hormonal",
    emoji: "💪💉",
    description: "Sinergia entre treino avançado e protocolo hormonal: cada sessão é desenhada para potencializar ao máximo os resultados do ciclo.",
    highlights: [
      "Planilha de treino avançada",
      "Protocolo de ciclo hormonal personalizado",
      "Ajustes conforme fase do ciclo",
      "Suporte direto via chat",
    ],
  },
  {
    id: "dieta_ciclo",
    label: "Dieta + Ciclo",
    short: "Dieta e Ciclo Hormonal",
    emoji: "🥗💉",
    description: "Nutrição e hormonal alinhados: dieta adaptada às fases do ciclo para otimizar composição corporal e recuperação.",
    highlights: [
      "Plano alimentar especializado",
      "Protocolo hormonal detalhado",
      "Ajuste nutricional por fase do ciclo",
      "Suporte direto via chat",
    ],
  },
  {
    id: "treino",
    label: "Apenas Treino",
    short: "Treino",
    emoji: "💪",
    description: "Treinamento inteligente e periodizado: protocolo montado do zero, ajustado à sua rotina, objetivos e nível de experiência.",
    highlights: [
      "Planilha de treino personalizada",
      "Periodização por mesociclos",
      "Ajustes mensais de volume e intensidade",
      "Suporte direto via chat",
    ],
  },
  {
    id: "dieta",
    label: "Apenas Dieta",
    short: "Dieta",
    emoji: "🥗",
    description: "Nutrição de alto nível: cardápio calculado com precisão para o seu objetivo, seja bulking, cutting ou manutenção.",
    highlights: [
      "Plano alimentar com macros individualizados",
      "Cardápio semanal rotativo",
      "Estratégia de refeição pré e pós-treino",
      "Suporte direto via chat",
    ],
  },
  {
    id: "ciclo",
    label: "Apenas Ciclo",
    short: "Ciclo Hormonal",
    emoji: "💉",
    description: "Protocolo hormonal seguro e eficaz: substâncias, dosagens, frequência e TPC detalhados por um especialista.",
    highlights: [
      "Protocolo hormonal completo",
      "Dosagens individualizadas",
      "Planejamento de TPC",
      "Suporte direto via chat",
    ],
  },
];

export default function ConsultancyBilling() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("treino_dieta_ciclo");
  const [customValue, setCustomValue] = useState("");
  const [personalName, setPersonalName] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeForm, setFinanceForm] = useState({ student_id: "", description: "", due_date: "" });
  const [savingFinance, setSavingFinance] = useState(false);
  const [customStudentName, setCustomStudentName] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setPersonalName(u.full_name || "");
      setPixKey(u.email || "");
    }).catch(() => {});
    base44.entities.Student.list().then(s => setStudents(s.filter(st => st.active !== false))).catch(() => {});
  }, []);

  const selectedPackage = PACKAGES.find(p => p.id === selectedPackageId);
  const valueNum = parseFloat(customValue) || 0;
  const now = new Date();
  const monthLabel = MONTH_NAMES[now.getMonth()] + "/" + now.getFullYear();

  const getStudentDisplayName = () => {
    if (selectedStudentId) {
      return students.find(s => s.id === selectedStudentId)?.name || "";
    }
    return customStudentName;
  };

  const getDueDate = () => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 5);
    return format(d, 'yyyy-MM-dd');
  };

  const openFinanceModal = () => {
    if (!valueNum) { toast.error("Informe o valor da consultoria."); return; }
    if (!selectedStudentId && !customStudentName.trim()) { toast.error("Selecione ou informe o nome do cliente."); return; }
    setFinanceForm({
      student_id: selectedStudentId,
      description: `Consultoria ${selectedPackage?.short} — ${monthLabel}`,
      due_date: getDueDate(),
    });
    setShowFinanceModal(true);
  };

  const saveToFinance = async () => {
    if (!financeForm.student_id) { toast.error("Selecione um aluno cadastrado para lançar no financeiro."); return; }
    if (!financeForm.due_date) { toast.error("Informe o vencimento."); return; }
    setSavingFinance(true);
    try {
      await base44.entities.Payment.create({
        student_id: financeForm.student_id,
        personal_id: user?.email,
        amount: valueNum,
        due_date: financeForm.due_date,
        payment_date: "",
        status: "pendente",
        description: financeForm.description,
      });
      toast.success("Lançado no financeiro como pendente!");
      setShowFinanceModal(false);
    } catch (e) {
      toast.error("Erro: " + e.message);
    }
    setSavingFinance(false);
  };

  const generateMessage = () => {
    if (!valueNum) { toast.error("Informe o valor da consultoria."); return; }
    if (!selectedPackage) { toast.error("Selecione um pacote."); return; }
    const name = getStudentDisplayName().trim();
    if (!name) { toast.error("Informe o nome do cliente."); return; }

    const pkg = selectedPackage;
    const highlightsList = pkg.highlights.map(h => `✅ ${h}`).join("\n");

    const msg = `Olá, ${name}! Tudo bem? 👋

Vim passar o resumo da sua consultoria comigo referente ao mês de ${monthLabel}.

━━━━━━━━━━━━━━━━━━━━
📦 PACOTE CONTRATADO
━━━━━━━━━━━━━━━━━━━━
${pkg.emoji} *${pkg.short}*

${pkg.description}

O que está incluso:
${highlightsList}

━━━━━━━━━━━━━━━━━━━━
💰 INVESTIMENTO
━━━━━━━━━━━━━━━━━━━━
Valor: *${formatCurrency(valueNum)}*
Referência: ${monthLabel}

Pix: ${pixKey}

━━━━━━━━━━━━━━━━━━━━

Você está investindo no que há de mais importante: o seu corpo e a sua evolução. Cada detalhe do seu protocolo é pensado com dedicação e ciência para que você alcance seus melhores resultados. 🚀

Qualquer dúvida estou à disposição!

Abraço,
${personalName.trim() || "[Seu nome]"}`;

    setGeneratedMessage(msg);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    toast.success("Mensagem copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const canGenerate = valueNum > 0 && (selectedStudentId || customStudentName.trim());

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(168,85,247,0.06))', border: '1px solid rgba(6,182,212,0.2)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), rgba(168,85,247,0.3), transparent)' }} />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', boxShadow: '0 0 20px rgba(6,182,212,0.2)' }}>
            <Briefcase className="w-6 h-6 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.8))' }} />
          </div>
          <div>
            <h1 className="font-cyber text-2xl text-white tracking-wide">COBRANÇA DE CONSULTORIA</h1>
            <p className="text-xs font-mono-cyber mt-0.5" style={{ color: 'rgba(103,232,249,0.5)' }}>
              Gere mensagens de cobrança valorizadas para seus clientes de consultoria
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Configurações */}
        <div className="space-y-4">
          {/* Cliente e valor */}
          <div className="rounded-xl p-4 border space-y-4"
            style={{ background: 'rgba(8,4,22,0.7)', borderColor: 'rgba(6,182,212,0.18)' }}>
            <p className="text-[10px] font-mono-cyber tracking-widest uppercase" style={{ color: 'rgba(103,232,249,0.5)' }}>Dados do Cliente</p>

            {/* Selecionar aluno */}
            <div>
              <label className="text-[10px] font-mono-cyber tracking-wider uppercase mb-1 block" style={{ color: 'rgba(103,232,249,0.5)' }}>Aluno Cadastrado</label>
              <select
                value={selectedStudentId}
                onChange={e => { setSelectedStudentId(e.target.value); if (e.target.value) setCustomStudentName(""); }}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(6,182,212,0.22)', color: '#e0f7fa' }}>
                <option value="">Selecionar da lista...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* OU nome manual */}
            <div>
              <label className="text-[10px] font-mono-cyber tracking-wider uppercase mb-1 block" style={{ color: 'rgba(103,232,249,0.4)' }}>
                Ou digitar nome do cliente
              </label>
              <input
                value={customStudentName}
                onChange={e => { setCustomStudentName(e.target.value); if (e.target.value) setSelectedStudentId(""); }}
                placeholder="Ex: João Silva"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(6,182,212,0.18)', color: '#e0f7fa' }}
              />
            </div>

            {/* Valor e Personal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono-cyber tracking-wider uppercase mb-1 block" style={{ color: 'rgba(103,232,249,0.5)' }}>
                  <DollarSign className="inline w-3 h-3 mr-1" />Valor (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  placeholder="Ex: 500"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono-cyber tracking-wider uppercase mb-1 block" style={{ color: 'rgba(103,232,249,0.5)' }}>Seu Nome</label>
                <input
                  value={personalName}
                  onChange={e => setPersonalName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(6,182,212,0.18)', color: '#e0f7fa' }}
                />
              </div>
            </div>

            {/* Pix */}
            <div>
              <label className="text-[10px] font-mono-cyber tracking-wider uppercase mb-1 block" style={{ color: 'rgba(103,232,249,0.5)' }}>Chave Pix</label>
              <input
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                placeholder="Seu email, CPF ou chave Pix"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(6,182,212,0.18)', color: '#e0f7fa' }}
              />
            </div>
          </div>

          {/* Resumo */}
          {valueNum > 0 && (
            <div className="rounded-xl p-4 border text-center"
              style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}>
              <p className="text-[10px] font-mono-cyber tracking-widest uppercase mb-1" style={{ color: 'rgba(110,231,183,0.5)' }}>Valor da Consultoria</p>
              <p className="font-cyber text-3xl" style={{ color: '#6ee7b7' }}>{formatCurrency(valueNum)}</p>
              <p className="text-xs font-mono-cyber mt-1" style={{ color: 'rgba(110,231,183,0.4)' }}>{selectedPackage?.short} — {monthLabel}</p>
            </div>
          )}

          {/* Botões */}
          <button
            onClick={generateMessage}
            disabled={!canGenerate}
            className="w-full py-3.5 rounded-xl font-cyber text-sm tracking-widest transition-all flex items-center justify-center gap-2"
            style={{
              background: canGenerate ? 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(168,85,247,0.15))' : 'rgba(6,182,212,0.05)',
              border: `1px solid ${canGenerate ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.1)'}`,
              color: canGenerate ? '#e0f7fa' : 'rgba(103,232,249,0.3)',
              boxShadow: canGenerate ? '0 0 20px rgba(6,182,212,0.15)' : 'none',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
            }}>
            <Sparkles className="w-4 h-4" />
            GERAR MENSAGEM
          </button>

          <button
            onClick={openFinanceModal}
            disabled={!canGenerate}
            className="w-full py-3.5 rounded-xl font-cyber text-sm tracking-widest transition-all flex items-center justify-center gap-2"
            style={{
              background: canGenerate ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.03)',
              border: `1px solid ${canGenerate ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.08)'}`,
              color: canGenerate ? '#6ee7b7' : 'rgba(16,185,129,0.25)',
              boxShadow: canGenerate ? '0 0 16px rgba(16,185,129,0.12)' : 'none',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
            }}>
            <DollarSign className="w-4 h-4" />
            LANÇAR NO FINANCEIRO
          </button>
        </div>

        {/* RIGHT: Seleção de pacote */}
        <div className="space-y-3">
          <p className="text-[10px] font-mono-cyber tracking-widest uppercase px-1" style={{ color: 'rgba(103,232,249,0.5)' }}>
            <Package className="inline w-3 h-3 mr-1" />Selecione o Pacote
          </p>
          {PACKAGES.map(pkg => {
            const isSelected = selectedPackageId === pkg.id;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className="w-full text-left rounded-xl p-4 border transition-all"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(168,85,247,0.08))'
                    : 'rgba(8,4,22,0.6)',
                  borderColor: isSelected ? 'rgba(6,182,212,0.45)' : 'rgba(6,182,212,0.1)',
                  boxShadow: isSelected ? '0 0 18px rgba(6,182,212,0.12)' : 'none',
                }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{pkg.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: isSelected ? '#e0f7fa' : 'rgba(224,247,250,0.6)' }}>
                        {pkg.label}
                      </p>
                      <p className="text-[10px] font-mono-cyber mt-0.5" style={{ color: isSelected ? 'rgba(103,232,249,0.6)' : 'rgba(103,232,249,0.25)' }}>
                        {pkg.highlights.length} itens inclusos
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" style={{ background: '#06b6d4', boxShadow: '0 0 8px rgba(6,182,212,0.8)' }} />
                  )}
                </div>
                {isSelected && (
                  <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: 'rgba(6,182,212,0.12)' }}>
                    {pkg.highlights.map((h, i) => (
                      <p key={i} className="text-xs" style={{ color: 'rgba(103,232,249,0.7)' }}>✅ {h}</p>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mensagem gerada */}
      {generatedMessage && (
        <div className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'rgba(6,182,212,0.25)', background: 'rgba(8,4,22,0.8)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b"
            style={{ background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.15)' }}>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <p className="text-xs font-cyber text-cyan-300 tracking-widest">MENSAGEM GERADA</p>
            </div>
            <button
              onClick={copyMessage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.12)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.35)' : 'rgba(6,182,212,0.3)'}`,
                color: copied ? '#6ee7b7' : '#67e8f9',
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

      {/* Finance Modal */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 relative" style={{ background: 'rgba(8,4,22,0.98)', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.12)' }}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-cyber text-base text-white tracking-wide">LANÇAR NO FINANCEIRO</h2>
                <p className="text-xs font-mono-cyber mt-0.5" style={{ color: 'rgba(110,231,183,0.4)' }}>Cobrança pendente de consultoria</p>
              </div>
              <button onClick={() => setShowFinanceModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-500/10">
                <span style={{ color: '#6ee7b7', fontSize: '1rem' }}>✕</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(110,231,183,0.5)' }}>VALOR TOTAL</p>
                <p className="font-cyber text-2xl mt-1" style={{ color: '#6ee7b7' }}>{formatCurrency(valueNum)}</p>
                <p className="text-[10px] font-mono-cyber mt-0.5" style={{ color: 'rgba(110,231,183,0.4)' }}>{selectedPackage?.short}</p>
              </div>

              <div>
                <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(110,231,183,0.5)', letterSpacing: '0.1em' }}>ALUNO (precisa estar cadastrado)</label>
                <select
                  value={financeForm.student_id}
                  onChange={e => setFinanceForm(f => ({ ...f, student_id: e.target.value }))}
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(16,185,129,0.25)', color: '#f0e6ff', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none' }}>
                  <option value="">Selecionar aluno...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(110,231,183,0.5)', letterSpacing: '0.1em' }}>DESCRIÇÃO</label>
                <input
                  type="text"
                  value={financeForm.description}
                  onChange={e => setFinanceForm(f => ({ ...f, description: e.target.value }))}
                  style={{ background: 'rgba(4,2,14,0.7)', border: '1px solid rgba(16,185,129,0.25)', color: '#f0e6ff', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none' }}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono-cyber block mb-1" style={{ color: 'rgba(110,231,183,0.5)', letterSpacing: '0.1em' }}>VENCIMENTO</label>
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
    </div>
  );
}