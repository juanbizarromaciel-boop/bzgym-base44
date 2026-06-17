import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, UserCircle, Search, Link2, Link2Off, UserCog, Shield, Loader2, ChevronDown, ChevronUp, RefreshCw, Palette } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import AdminThemeManager from "@/components/themes/AdminThemeManager";
import { toast } from "sonner";

export default function PersonalManagement() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [linkDialog, setLinkDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPersonalEmail, setSelectedPersonalEmail] = useState("");
  const [expandedPersonal, setExpandedPersonal] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const personals = allUsers.filter(u => u.role === "personal" || u.role === "admin");
  const unlinkedStudents = students.filter(s => !s.personal_id);

  const updateStudentMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-students"] });
      setLinkDialog(false);
      setSelectedStudent(null);
      setSelectedPersonalEmail("");
      toast.success("Vínculo atualizado!");
    },
  });

  const updateUserRoleMut = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Cargo atualizado!");
    },
  });

  const handleLink = () => {
    if (!selectedStudent) return;
    updateStudentMut.mutate({
      id: selectedStudent.id,
      data: { ...selectedStudent, personal_id: selectedPersonalEmail || null },
    });
  };

  const handleUnlink = (student) => {
    updateStudentMut.mutate({
      id: student.id,
      data: { ...student, personal_id: null },
    });
  };

  const openLinkDialog = (student) => {
    setSelectedStudent(student);
    setSelectedPersonalEmail(student.personal_id || "");
    setLinkDialog(true);
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-14 h-14 text-purple-500/20" />
        <p className="font-cyber text-lg text-purple-400/50 tracking-widest">ACESSO RESTRITO</p>
        <p className="text-sm text-purple-500/30 font-mono-cyber">// somente administradores</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gestão de Personais"
        subtitle="Vincule alunos a personais e gerencie cargos"
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/50" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="cyber-input pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Gestão de Cargos ────────────────── */}
        <div className="cyber-card rounded-xl border border-purple-900/25 overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-900/15 flex items-center gap-2"
            style={{ background: 'rgba(168,85,247,0.04)' }}>
            <UserCog className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-semibold text-white">Usuários e Cargos</p>
            <span className="ml-auto text-[10px] font-mono-cyber text-purple-500/40">{allUsers.length} usuários</span>
          </div>
          <div className="divide-y divide-purple-900/10 max-h-96 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-purple-400" /></div>
            ) : filteredUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-purple-500/3 transition-all">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-4 h-4 text-purple-400/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.full_name || u.email}</p>
                  <p className="text-[10px] font-mono-cyber text-purple-500/40 truncate">{u.email}</p>
                </div>
                <Select
                  value={u.role || "user"}
                  onValueChange={role => {
                    if (u.email === user?.email && role !== "admin") {
                      toast.error("Você não pode remover seu próprio cargo de admin.");
                      return;
                    }
                    updateUserRoleMut.mutate({ id: u.id, role });
                  }}
                >
                  <SelectTrigger className="w-28 h-7 text-[11px] border-purple-900/30 bg-purple-500/5 text-purple-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                    <SelectItem value="admin" className="text-purple-300 text-xs">Admin</SelectItem>
                    <SelectItem value="personal" className="text-cyan-300 text-xs">Personal</SelectItem>
                    <SelectItem value="assinante" className="text-emerald-300 text-xs">Assinante</SelectItem>
                    <SelectItem value="user" className="text-white text-xs">Aluno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-purple-500/30 font-mono-cyber text-xs py-8">// nenhum usuário encontrado</p>
            )}
          </div>
        </div>

        {/* ── Alunos Sem Vínculo ────────────────── */}
        <div className="cyber-card rounded-xl border border-yellow-900/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-yellow-900/15 flex items-center gap-2"
            style={{ background: 'rgba(234,179,8,0.03)' }}>
            <Link2Off className="w-4 h-4 text-yellow-400/60" />
            <p className="text-sm font-semibold text-white">Alunos sem Personal</p>
            <span className="ml-auto text-[10px] font-mono-cyber text-yellow-500/40">{unlinkedStudents.length} alunos</span>
          </div>
          <div className="divide-y divide-purple-900/10 max-h-96 overflow-y-auto">
            {unlinkedStudents.length === 0 ? (
              <div className="text-center py-8">
                <Link2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/30" />
                <p className="text-xs text-emerald-400/50 font-mono-cyber">// todos os alunos têm personal</p>
              </div>
            ) : unlinkedStudents.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-yellow-500/3 transition-all">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  {s.photo_url
                    ? <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                    : <UserCircle className="w-4 h-4 text-yellow-400/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.name}</p>
                  <p className="text-[10px] font-mono-cyber text-purple-500/40 truncate">{s.email || "sem email"}</p>
                </div>
                <button onClick={() => openLinkDialog(s)}
                  className="text-[10px] font-mono-cyber px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:scale-105"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#22d3ee' }}>
                  <Link2 className="w-3 h-3" /> VINCULAR
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Personais com seus alunos ────────────────────────────────── */}
      <div className="mt-6">
        <p className="text-[10px] font-mono-cyber uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(192,132,252,0.55)' }}>
          ▸ personais e seus alunos
        </p>
        <div className="space-y-3">
          {personals.length === 0 && (
            <div className="cyber-card rounded-xl border border-purple-900/20 p-8 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-purple-500/20" />
              <p className="text-sm font-mono-cyber text-purple-500/30">// nenhum personal cadastrado</p>
              <p className="text-xs text-purple-500/20 mt-1">Altere o cargo de um usuário para "Personal" acima</p>
            </div>
          )}
          {personals.map(personal => {
            const myStudents = students.filter(s => s.personal_id === personal.email);
            const isOpen = expandedPersonal === personal.id;
            return (
              <div key={personal.id} className="cyber-card rounded-xl border border-cyan-900/20 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-cyan-500/3 transition-all"
                  onClick={() => setExpandedPersonal(isOpen ? null : personal.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"
                      style={{ boxShadow: '0 0 12px rgba(6,182,212,0.1)' }}>
                      <UserCog className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm">{personal.full_name || personal.email}</p>
                      <p className="text-[10px] font-mono-cyber text-cyan-500/40 mt-0.5">{personal.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono-cyber px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}>
                      {myStudents.length} aluno{myStudents.length !== 1 ? "s" : ""}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-purple-500/30" /> : <ChevronDown className="w-4 h-4 text-purple-500/30" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-cyan-900/15 divide-y divide-purple-900/8">
                    {myStudents.length === 0 && (
                      <p className="text-center text-xs text-purple-500/30 font-mono-cyber py-6">// nenhum aluno vinculado</p>
                    )}
                    {myStudents.map(s => (
                      <div key={s.id} className="flex items-center gap-3 px-6 py-3 hover:bg-purple-500/3 transition-all">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-500/10 border border-purple-500/15 flex items-center justify-center flex-shrink-0">
                          {s.photo_url
                            ? <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                            : <UserCircle className="w-3.5 h-3.5 text-purple-400/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{s.name}</p>
                          <p className="text-[10px] font-mono-cyber text-purple-500/40 truncate">{s.email || "sem email"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openLinkDialog(s)}
                            className="text-[10px] font-mono-cyber px-2 py-1 rounded-lg transition-all hover:scale-105"
                            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}>
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleUnlink(s)}
                            className="text-[10px] font-mono-cyber px-2 py-1 rounded-lg transition-all hover:scale-105"
                            style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', color: '#f472b6' }}>
                            <Link2Off className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="px-6 py-3">
                      <button
                        onClick={() => { setSelectedStudent(null); setSelectedPersonalEmail(personal.email); setLinkDialog(true); }}
                        className="text-[10px] font-mono-cyber flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                        style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)', color: '#22d3ee' }}>
                        <Link2 className="w-3 h-3" /> Adicionar aluno a este personal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Gerenciar Temas ──────────────────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.4), transparent)" }} />
          <p className="text-[9px] uppercase tracking-[0.28em] font-bold font-mono-cyber whitespace-nowrap"
            style={{ color: "#a855f7", textShadow: "0 0 6px #a855f7" }}>
            Gerenciar Temas dos Usuários
          </p>
          <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, rgba(168,85,247,0.4), transparent)" }} />
        </div>
        <div className="cyber-card rounded-xl border border-purple-900/20 p-5">
          <AdminThemeManager />
        </div>
      </div>

      {/* ── Link Dialog ──────────────────────────────────────────── */}
      <Dialog open={linkDialog} onOpenChange={v => { if (!v) { setLinkDialog(false); setSelectedStudent(null); setSelectedPersonalEmail(""); } }}>
        <DialogContent className="border border-cyan-900/30 text-white max-w-sm" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-cyan-300 flex items-center gap-2">
              <Link2 className="w-4 h-4" /> VINCULAR ALUNO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Select student if not pre-selected */}
            {!selectedStudent && (
              <div>
                <p className="text-[10px] font-mono-cyber text-purple-500/50 uppercase tracking-widest mb-1">Aluno</p>
                <Select onValueChange={id => setSelectedStudent(students.find(s => s.id === id))}>
                  <SelectTrigger className="cyber-input"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedStudent && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-900/25 bg-purple-500/5">
                <UserCircle className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{selectedStudent.name}</p>
                  <p className="text-[10px] font-mono-cyber text-purple-500/40">{selectedStudent.email}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] font-mono-cyber text-purple-500/50 uppercase tracking-widest mb-1">Personal Responsável</p>
              <Select value={selectedPersonalEmail} onValueChange={setSelectedPersonalEmail}>
                <SelectTrigger className="cyber-input">
                  <SelectValue placeholder="Selecione o personal" />
                </SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  <SelectItem value={null} className="text-purple-400/50 text-xs">— Sem personal (desvincular) —</SelectItem>
                  {personals.map(p => (
                    <SelectItem key={p.id} value={p.email} className="text-white">{p.full_name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button onClick={() => { setLinkDialog(false); setSelectedStudent(null); setSelectedPersonalEmail(""); }}
              className="px-4 py-2 rounded-lg text-sm border border-purple-900/30 text-purple-400/50 hover:bg-purple-500/5 transition-all">
              Cancelar
            </button>
            <button
              onClick={handleLink}
              disabled={!selectedStudent || updateStudentMut.isPending}
              className="btn-neon-cyan px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 flex items-center gap-2"
            >
              {updateStudentMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              CONFIRMAR
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}