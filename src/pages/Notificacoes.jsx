import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Bell, Check, Trash2, Dumbbell, Utensils, ClipboardCheck,
  MessageSquare, DollarSign, Calendar, Trophy, Zap, Settings,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

const TIPO_CONFIG = {
  treino_novo:       { label: "Novo Treino",       icon: Dumbbell,       color: "#a855f7" },
  dieta_atualizada:  { label: "Dieta Atualizada",  icon: Utensils,       color: "#10b981" },
  checkin_pendente:  { label: "Check-in Pendente", icon: ClipboardCheck, color: "#f59e0b" },
  mensagem:          { label: "Mensagem",           icon: MessageSquare,  color: "#06b6d4" },
  pagamento:         { label: "Pagamento",          icon: DollarSign,     color: "#f97316" },
  tarefa:            { label: "Tarefa",             icon: Calendar,       color: "#8b5cf6" },
  pr:                { label: "Novo PR",            icon: Trophy,         color: "#fbbf24" },
  meta:              { label: "Meta Batida",        icon: Zap,            color: "#ec4899" },
  sistema:           { label: "Sistema",            icon: Settings,       color: "#64748b" },
};

const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

export default function Notificacoes() {
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ["notificacoes", user?.email],
    queryFn: () => base44.entities.Notificacao.filter({ usuario_id: user.email }, "-created_date", 50),
    enabled: !!user,
    staleTime: 15000,
  });

  const markReadMut = useMutation({
    mutationFn: (id) => base44.entities.Notificacao.update(id, { lida: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Notificacao.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
  const markAllReadMut = useMutation({
    mutationFn: async () => {
      const unread = notifs.filter(n => !n.lida);
      await Promise.all(unread.map(n => base44.entities.Notificacao.update(n.id, { lida: true })));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notificacoes"] }); toast.success("Todas marcadas como lidas"); },
  });

  const unreadCount = notifs.filter(n => !n.lida).length;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "agora";
    if (m < 60) return `${m}min atrás`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h atrás`;
    return `${Math.floor(h / 24)}d atrás`;
  };

  return (
    <motion.div initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }} />
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded" style={{ background: 'linear-gradient(to bottom, #a855f7, #ec4899)', boxShadow: '0 0 12px rgba(168,85,247,0.6)' }} />
              <h1 className="font-cyber text-3xl font-black tracking-wider text-white" style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>NOTIFICAÇÕES</h1>
            </div>
            {unreadCount > 0 && (
              <p className="text-xs font-mono-cyber text-pink-400/60 pl-4">{unreadCount} não lida(s)</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAllReadMut.mutate()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono-cyber tracking-wider transition-all"
              style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.30)', color: '#c084fc' }}>
              <Check className="w-3.5 h-3.5" /> Marcar todas
            </button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(236,72,153,0.4), transparent)' }} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : notifs.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-20 rounded-2xl border border-purple-900/20">
          <Bell className="w-12 h-12 mx-auto mb-4 text-purple-500/15" />
          <p className="font-mono-cyber text-sm text-purple-500/30">// nenhuma notificação</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {notifs.map(notif => {
            const cfg = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.sistema;
            const Icon = cfg.icon;
            return (
              <motion.div key={notif.id} variants={fadeUp} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-xl border overflow-hidden transition-all"
                style={{ borderColor: notif.lida ? 'rgba(168,85,247,0.12)' : `${cfg.color}30`, background: notif.lida ? 'rgba(4,4,14,0.6)' : `${cfg.color}08` }}>
                {!notif.lida && <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />}
                <div className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}35` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-semibold ${notif.lida ? 'text-white/50' : 'text-white'}`}>{notif.titulo}</p>
                      {!notif.lida && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />}
                    </div>
                    {notif.mensagem && <p className="text-xs text-white/40 mb-1">{notif.mensagem}</p>}
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono-cyber text-purple-400/30">{notif.created_date ? timeAgo(notif.created_date) : ""}</span>
                      <span className="text-[9px] font-mono-cyber px-1.5 py-0.5 rounded" style={{ background: `${cfg.color}15`, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    {notif.link_destino && (
                      <Link to={notif.link_destino} onClick={() => !notif.lida && markReadMut.mutate(notif.id)}
                        className="text-[10px] font-mono-cyber mt-2 inline-block hover:brightness-125 transition-all"
                        style={{ color: cfg.color }}>
                        ver mais →
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!notif.lida && (
                      <button onClick={() => markReadMut.mutate(notif.id)}
                        className="p-1.5 rounded-lg transition-all hover:bg-green-500/10"
                        title="Marcar como lida">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500/40 hover:text-green-400" />
                      </button>
                    )}
                    <button onClick={() => deleteMut.mutate(notif.id)}
                      className="p-1.5 rounded-lg transition-all hover:bg-pink-500/10"
                      title="Excluir">
                      <Trash2 className="w-3.5 h-3.5 text-purple-400/25 hover:text-pink-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </motion.div>
  );
}