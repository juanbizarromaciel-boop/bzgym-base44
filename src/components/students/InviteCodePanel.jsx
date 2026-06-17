import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link2, Copy, RefreshCw, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function InviteCodePanel({ open, onClose }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  const { data: allCodes = [], isLoading } = useQuery({
    queryKey: ["inviteCodes"],
    queryFn: () => base44.entities.InviteCode.list(),
    staleTime: 15000,
  });

  const myCodes = allCodes.filter(c => c.personal_id === user?.email);

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.InviteCode.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inviteCodes"] }); setCreating(false); toast.success("Código gerado!"); }
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.InviteCode.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inviteCodes"] }); toast.success("Código removido"); }
  });

  const handleGenerate = () => {
    if (!user?.email) return;
    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    createMut.mutate({
      personal_id: user.email,
      personal_name: user.full_name || user.email,
      code,
      status: "ativo",
      expires_at: expiresAt.toISOString().split("T")[0],
    });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyLink = (code) => {
    const url = `${window.location.origin}/Onboarding?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const STATUS_STYLE = {
    ativo: { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.30)" },
    usado: { color: "#a855f7", bg: "rgba(168,85,247,0.10)", border: "rgba(168,85,247,0.25)" },
    expirado: { color: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)" },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{ background: '#04040e' }}>
        <DialogHeader>
          <DialogTitle className="font-cyber tracking-widest text-purple-300 flex items-center gap-2">
            <Link2 className="w-4 h-4" /> CÓDIGOS DE CONVITE
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-purple-400/50 font-mono-cyber -mt-1">
          Gere um código para vincular novos alunos ao seu perfil automaticamente.
        </p>

        <button onClick={handleGenerate} disabled={createMut.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm tracking-wider transition-all"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.20), rgba(6,182,212,0.15))', border: '1px solid rgba(168,85,247,0.50)', color: '#ffffff' }}>
          {createMut.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          GERAR NOVO CÓDIGO
        </button>

        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
        ) : myCodes.length === 0 ? (
          <p className="text-center text-purple-500/30 font-mono-cyber text-sm py-6">// nenhum código gerado ainda</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {[...myCodes].reverse().map(c => {
              const style = STATUS_STYLE[c.status] || STATUS_STYLE.ativo;
              return (
                <motion.div key={c.id} variants={fadeUp}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: style.border, background: style.bg }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-cyber text-lg font-black tracking-[0.2em]" style={{ color: style.color }}>{c.code}</span>
                      <span className="text-[9px] font-mono-cyber px-1.5 py-0.5 rounded"
                        style={{ background: `${style.color}15`, color: style.color, border: `1px solid ${style.color}30` }}>
                        {c.status}
                      </span>
                    </div>
                    {c.expires_at && (
                      <p className="text-[9px] font-mono-cyber flex items-center gap-1" style={{ color: `${style.color}60` }}>
                        <Clock className="w-2.5 h-2.5" /> expira {new Date(c.expires_at + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {c.used_by_email && (
                      <p className="text-[9px] font-mono-cyber" style={{ color: '#a855f7' }}>usado por: {c.used_by_email}</p>
                    )}
                  </div>
                  {c.status === "ativo" && (
                    <div className="flex gap-1">
                      <button onClick={() => copyCode(c.code)} className="p-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.25)' }}>
                        {copied === c.code ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                      <button onClick={() => copyLink(c.code)} className="p-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.25)' }}>
                        <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                      </button>
                    </div>
                  )}
                  <button onClick={() => deleteMut.mutate(c.id)} className="p-1.5 rounded-lg text-purple-400/30 hover:text-pink-400 hover:bg-pink-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="text-[9px] font-mono-cyber text-purple-500/30 text-center">
          // O aluno deve inserir o código durante o onboarding para ser vinculado ao seu perfil.
        </p>
      </DialogContent>
    </Dialog>
  );
}