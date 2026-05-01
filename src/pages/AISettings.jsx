import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Key, Zap, Shield, Activity, ChevronRight,
  CheckCircle2, XCircle, Loader2, AlertTriangle, Eye, EyeOff, BarChart3
} from "lucide-react";
import { toast } from "sonner";

const MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Rápido, econômico, recomendado" },
  { id: "gpt-4o", label: "GPT-4o", desc: "Alta qualidade, mais tokens" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo", desc: "Premium, contexto extenso" },
];

export default function AISettings() {
  const qc = useQueryClient();
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [testMsg, setTestMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const defaultSettings = {
    enabled: false, safe_mode: true, model: "gpt-4o-mini", monthly_limit: 100,
    allow_workout_generation: true, allow_diet_generation: true,
    allow_food_generation: true, allow_progression_suggestions: true,
  };

  useEffect(() => {
    base44.entities.AISettings.list().then(list => {
      if (list[0]) { setSettings(list[0]); setSettingsId(list[0].id); }
      else setSettings({ ...defaultSettings });
    });
    loadUsage();
    loadLogs();
  }, []);

  const loadUsage = async () => {
    const res = await base44.functions.invoke('aiSettings', { action: 'get_usage' });
    if (res?.data) setUsage(res.data);
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    const res = await base44.functions.invoke('aiSettings', { action: 'get_logs' });
    if (res?.data?.logs) setLogs(res.data.logs);
    setLoadingLogs(false);
  };

  const updateSetting = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...settings };
      if (settingsId) {
        await base44.entities.AISettings.update(settingsId, data);
      } else {
        const user = await base44.auth.me();
        const created = await base44.entities.AISettings.create({ ...data, teacher_id: user.email });
        setSettingsId(created.id);
      }
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    if (!apiKey) { toast.error("Informe a API Key para testar."); return; }
    setTestStatus('loading');
    setTestMsg("");
    try {
      const res = await base44.functions.invoke('aiCoach', {
        type: 'test',
        prompt: 'Teste de conexão do BZ AI Coach',
        api_key: apiKey,
        model: settings?.model || 'gpt-4o-mini'
      });
      const data = res?.data;
      if (data?.success) {
        setTestStatus('ok');
        setTestMsg(data.data?.message || 'Conexão estabelecida com sucesso!');
        toast.success("API conectada com sucesso!");
      } else {
        setTestStatus('error');
        const errMsg = data?.error || 'Falha na conexão';
        setTestMsg(errMsg);
        toast.error(errMsg);
      }
    } catch (e) {
      // Extract error message from axios error response
      const errMsg = e?.response?.data?.error || e?.response?.data?.message || e.message || 'Erro desconhecido';
      setTestStatus('error');
      setTestMsg(errMsg);
      toast.error(errMsg);
    }
  };

  const SwitchRow = ({ label, desc, field, color = "#a855f7" }) => (
    <div className="flex items-center justify-between py-3.5 border-b" style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: '#f0e6ff' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'rgba(196,181,224,0.5)' }}>{desc}</p>}
      </div>
      <Switch
        checked={!!settings?.[field]}
        onCheckedChange={v => updateSetting(field, v)}
        style={settings?.[field] ? { '--switch-bg': color } : {}}
      />
    </div>
  );

  if (!settings) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="mb-2">
        <p className="text-[10px] font-mono-cyber tracking-[0.3em] uppercase mb-1" style={{ color: 'rgba(192,132,252,0.5)' }}>configurações</p>
        <h1 className="font-cyber text-2xl text-white tracking-widest" style={{ textShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
          INTELIGÊNCIA <span style={{ color: '#c084fc' }}>ARTIFICIAL</span>
        </h1>
        <p className="text-xs mt-1.5" style={{ color: 'rgba(196,181,224,0.5)' }}>A chave de API é enviada diretamente ao backend e nunca fica exposta no navegador.</p>
        <div className="mt-4 h-px" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.4), transparent)' }} />
      </div>

      {/* API Key Card */}
      <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(168,85,247,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-purple-200 tracking-wider">CHAVE DE API</h2>
        </div>
        <p className="text-xs mb-3" style={{ color: 'rgba(196,181,224,0.55)' }}>
          Configure sua API Key da OpenAI. Para uso permanente, defina a variável de ambiente <code className="text-purple-400 bg-purple-900/30 px-1 rounded">OPENAI_API_KEY</code> nas configurações do app. 
          Abaixo, use para testar a conexão.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-proj-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="cyber-input pr-10"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'loading'}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#e9d5ff' }}>
            {testStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Testar
          </button>
        </div>
        {testStatus === 'ok' && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs font-mono-cyber">
            <CheckCircle2 className="w-3.5 h-3.5" /> {testMsg}
          </div>
        )}
        {testStatus === 'error' && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs font-mono-cyber">
            <XCircle className="w-3.5 h-3.5" /> {testMsg}
          </div>
        )}
        <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: 'rgba(253,224,71,0.8)' }}>Para produção, defina <code className="text-amber-300">OPENAI_API_KEY</code> nas variáveis de ambiente do app (Dashboard → Code → Environment Variables). A chave informada acima é usada apenas para teste.</p>
        </div>
      </div>

      {/* Model Selection */}
      <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(168,85,247,0.2)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-purple-200 tracking-wider">MODELO DE IA</h2>
        </div>
        <div className="space-y-2">
          {MODELS.map(m => (
            <button key={m.id} onClick={() => updateSetting('model', m.id)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left"
              style={{
                borderColor: settings.model === m.id ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.12)',
                background: settings.model === m.id ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.03)'
              }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: settings.model === m.id ? '#e9d5ff' : 'rgba(196,181,224,0.7)' }}>{m.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(168,85,247,0.5)' }}>{m.desc}</p>
              </div>
              {settings.model === m.id && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Switches */}
      <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(168,85,247,0.2)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-purple-200 tracking-wider">CONTROLES</h2>
        </div>
        <SwitchRow label="Ativar IA" desc="Liga ou desliga todas as funcionalidades de IA" field="enabled" />
        <SwitchRow label="Modo Seguro" desc="Exige revisão do professor antes de qualquer ação" field="safe_mode" />
        <SwitchRow label="Gerar treinos com IA" desc="Permite criar planos de treino automaticamente" field="allow_workout_generation" />
        <SwitchRow label="Gerar dietas com IA" desc="Permite montar planos alimentares automaticamente" field="allow_diet_generation" />
        <SwitchRow label="Cadastrar alimentos com IA" desc="Permite gerar dados nutricionais automaticamente" field="allow_food_generation" />
        <SwitchRow label="Sugestões de progressão" desc="Permite sugerir progressão de carga baseada no histórico" field="allow_progression_suggestions" />
        <div className="pt-3">
          <label className="text-xs font-medium block mb-2" style={{ color: 'rgba(196,181,224,0.8)' }}>Limite mensal de chamadas</label>
          <Input
            type="number"
            value={settings.monthly_limit || 100}
            onChange={e => updateSetting('monthly_limit', parseInt(e.target.value))}
            className="cyber-input max-w-xs"
          />
        </div>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="rounded-xl p-5 border" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(6,182,212,0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-cyan-200 tracking-wider">USO ESTE MÊS</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total de chamadas", val: usage.total_calls },
              { label: "Sucesso", val: usage.successful },
              { label: "Erros", val: usage.errors },
              { label: "Tokens usados", val: usage.total_tokens?.toLocaleString() },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 rounded-lg" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
                <p className="font-cyber text-2xl text-cyan-400">{s.val ?? 0}</p>
                <p className="text-[10px] font-mono-cyber mt-1" style={{ color: 'rgba(103,232,249,0.5)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(6,4,18,0.95)', borderColor: 'rgba(168,85,247,0.15)' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(168,85,247,0.12)', background: 'rgba(168,85,247,0.04)' }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-purple-200 tracking-wider">HISTÓRICO DE CHAMADAS</h2>
          </div>
          <button onClick={loadLogs} className="text-xs font-mono-cyber text-purple-400/50 hover:text-purple-400 transition-colors">atualizar →</button>
        </div>
        {loadingLogs ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-mono-cyber" style={{ color: 'rgba(168,85,247,0.35)' }}>// nenhuma chamada registrada ainda</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(168,85,247,0.08)' }}>
            {logs.slice(0, 15).map((log, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Badge className={`text-xs flex-shrink-0 ${
                  log.type === 'food' ? 'bg-orange-500/15 border border-orange-500/25 text-orange-300' :
                  log.type === 'diet' ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300' :
                  log.type === 'workout' ? 'bg-purple-500/15 border border-purple-500/25 text-purple-300' :
                  'bg-cyan-500/15 border border-cyan-500/25 text-cyan-300'
                }`}>{log.type}</Badge>
                <p className="text-xs flex-1 truncate" style={{ color: 'rgba(196,181,224,0.7)' }}>{log.prompt?.slice(0, 80)}...</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {log.status === 'success'
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span className="text-[10px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.4)' }}>
                    {log.tokens_used ? `${log.tokens_used}tk` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="btn-neon-purple px-8 py-3 rounded-xl text-sm font-semibold tracking-wider flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}