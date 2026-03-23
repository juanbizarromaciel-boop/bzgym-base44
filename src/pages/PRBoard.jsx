import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Trophy, Upload, X, Camera, Video, Medal, Crown } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MODALITIES = [
  { value: "1rm", label: "1 Rep", desc: "Força máxima absoluta" },
  { value: "3rm", label: "3 Reps", desc: "Força máxima de 3" },
  { value: "6rm", label: "6 Reps", desc: "Força de resistência" },
];

const MODALITY_COLORS = {
  "1rm": { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.35)", text: "#fbbf24" },
  "3rm": { bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.35)", text: "#c084fc" },
  "6rm": { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.35)", text: "#22d3ee" },
};

const RANK_ICONS = [Crown, Medal, Trophy];
const RANK_COLORS = ["#fbbf24", "#9ca3af", "#cd7c2b"];

export default function PRBoard() {
  const [activeTab, setActiveTab] = useState("mural");
  const [activeModality, setActiveModality] = useState("1rm");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({ exercise_name: "", modality: "1rm", load_kg: "", notes: "" });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaTypeState, setMediaTypeState] = useState("photo");
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);

  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== 'admin') {
        base44.entities.Student.list().then(students => {
          const s = students.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
          setStudent(s);
        });
      }
    }).catch(() => {});
  }, []);

  const { data: allPRs = [] } = useQuery({ queryKey: ["prs"], queryFn: () => base44.entities.PRRecord.list("-date", 200) });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => base44.entities.Student.list() });
  const { data: exercises = [] } = useQuery({ queryKey: ["exercises"], queryFn: () => base44.entities.Exercise.list() });

  const createPR = useMutation({
    mutationFn: (data) => base44.entities.PRRecord.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prs"] });
      toast.success("PR registrado! 🏆");
      setForm({ exercise_name: "", modality: "1rm", load_kg: "", notes: "" });
      setMediaFile(null);
      setMediaPreview(null);
    },
  });

  const exerciseNames = useMemo(() => {
    const fromEx = exercises.map(e => e.name);
    const fromPRs = allPRs.map(p => p.exercise_name);
    return [...new Set([...fromEx, ...fromPRs])].filter(Boolean).sort();
  }, [exercises, allPRs]);

  // Group PRs by modality → exercise → top by load
  const ranking = useMemo(() => {
    const byModality = {};
    MODALITIES.forEach(m => { byModality[m.value] = {}; });

    allPRs.forEach(pr => {
      if (!byModality[pr.modality]) return;
      const key = pr.exercise_name;
      if (!byModality[pr.modality][key]) byModality[pr.modality][key] = [];
      byModality[pr.modality][key].push(pr);
    });

    // Sort each exercise list by load desc
    Object.keys(byModality).forEach(mod => {
      Object.keys(byModality[mod]).forEach(ex => {
        byModality[mod][ex].sort((a, b) => b.load_kg - a.load_kg);
      });
    });

    return byModality;
  }, [allPRs]);

  const getStudentName = (studentId) => students.find(s => s.id === studentId)?.name || "Atleta";
  const getStudentPhoto = (studentId) => students.find(s => s.id === studentId)?.photo_url || null;

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setMediaTypeState(isVideo ? "video" : "photo");
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const handleSubmit = async () => {
    if (!form.exercise_name || !form.load_kg || !mediaFile) {
      toast.error("Preencha todos os campos e adicione uma foto/vídeo");
      return;
    }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
    const studentId = user?.role === 'admin' ? (student?.id || "") : (student?.id || "");
    createPR.mutate({
      student_id: studentId,
      exercise_name: form.exercise_name,
      modality: form.modality,
      load_kg: parseFloat(form.load_kg),
      media_url: file_url,
      media_type: mediaTypeState,
      notes: form.notes,
      date: new Date().toISOString().split("T")[0],
    });
    setUploading(false);
  };

  const openMedia = (pr) => {
    setSelectedMedia(pr);
    setMediaDialogOpen(true);
  };

  const currentRanking = ranking[activeModality] || {};
  const modColor = MODALITY_COLORS[activeModality];

  return (
    <div>
      <PageHeader title="Mural de PRs" subtitle="Personal Records · Ranking" />

      {/* Tabs */}
      <div className="flex rounded-xl border border-purple-900/30 overflow-hidden mb-6 w-full sm:w-fit">
        {[
          { id: "mural", label: "🏆 Ranking / Mural" },
          { id: "registrar", label: "⚡ Bater PR" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-5 py-2.5 text-sm font-mono-cyber tracking-wider transition-all ${
              activeTab === tab.id
                ? "bg-purple-500/20 text-purple-300 border-r border-purple-900/30"
                : "text-purple-500/40 hover:text-purple-400 hover:bg-purple-500/5"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== REGISTRAR PR TAB ===== */}
      {activeTab === "registrar" && (
        <div className="max-w-lg">
          <div className="cyber-card rounded-xl p-6 border border-purple-900/20 space-y-5">
            <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase">// Novo Record Pessoal</p>

            {/* Modalidade */}
            <div>
              <label className="text-xs text-purple-400/60 font-mono-cyber uppercase tracking-wider mb-2 block">Modalidade</label>
              <div className="flex gap-2">
                {MODALITIES.map(m => {
                  const c = MODALITY_COLORS[m.value];
                  const active = form.modality === m.value;
                  return (
                    <button key={m.value} onClick={() => setForm(f => ({ ...f, modality: m.value }))}
                      className="flex-1 py-2.5 rounded-lg border text-xs font-cyber tracking-wider transition-all"
                      style={active ? { background: c.bg, borderColor: c.border, color: c.text, boxShadow: `0 0 12px ${c.border}` }
                        : { background: 'transparent', borderColor: 'rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.4)' }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercício */}
            <div>
              <label className="text-xs text-purple-400/60 font-mono-cyber uppercase tracking-wider mb-2 block">Exercício</label>
              <Input
                list="exercises-list"
                value={form.exercise_name}
                onChange={e => setForm(f => ({ ...f, exercise_name: e.target.value }))}
                placeholder="Nome do exercício"
                className="cyber-input"
              />
              <datalist id="exercises-list">
                {exerciseNames.map(name => <option key={name} value={name} />)}
              </datalist>
            </div>

            {/* Carga */}
            <div>
              <label className="text-xs text-purple-400/60 font-mono-cyber uppercase tracking-wider mb-2 block">Carga (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.load_kg}
                onChange={e => setForm(f => ({ ...f, load_kg: e.target.value }))}
                placeholder="Ex: 100"
                className="cyber-input"
              />
            </div>

            {/* Mídia */}
            <div>
              <label className="text-xs text-purple-400/60 font-mono-cyber uppercase tracking-wider mb-2 block">Foto ou Vídeo (obrigatório)</label>
              <label className="block w-full cursor-pointer">
                <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" />
                {!mediaPreview ? (
                  <div className="border-2 border-dashed border-purple-500/20 hover:border-purple-500/40 rounded-xl p-8 text-center transition-all">
                    <div className="flex justify-center gap-3 mb-2">
                      <Camera className="w-6 h-6 text-purple-500/40" />
                      <Video className="w-6 h-6 text-purple-500/40" />
                    </div>
                    <p className="text-sm text-purple-400/40 font-mono-cyber">Clique para adicionar foto ou vídeo</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden">
                    {mediaTypeState === "photo"
                      ? <img src={mediaPreview} alt="PR" className="w-full max-h-60 object-cover rounded-xl" />
                      : <video src={mediaPreview} className="w-full max-h-60 rounded-xl" controls />
                    }
                    <button
                      onClick={(e) => { e.preventDefault(); setMediaFile(null); setMediaPreview(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Observações */}
            <div>
              <label className="text-xs text-purple-400/60 font-mono-cyber uppercase tracking-wider mb-2 block">Observações (opcional)</label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: com cinto, pausa, etc."
                className="cyber-input"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={uploading || createPR.isPending}
              className="w-full btn-neon-purple py-3.5 rounded-xl font-cyber tracking-widest flex items-center justify-center gap-2"
            >
              {uploading || createPR.isPending
                ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                : <><Upload className="w-4 h-4" /> REGISTRAR PR</>
              }
            </button>
          </div>

          {/* Mini ranking below form */}
          <div className="mt-8">
            <p className="text-[10px] font-mono-cyber text-purple-500/40 tracking-[0.2em] uppercase mb-4">// seus PRs recentes</p>
            <div className="space-y-2">
              {allPRs.filter(p => p.student_id === student?.id).slice(0, 5).map(pr => {
                const c = MODALITY_COLORS[pr.modality] || MODALITY_COLORS["1rm"];
                return (
                  <div key={pr.id} onClick={() => openMedia(pr)}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:border-purple-500/30 transition-all"
                    style={{ borderColor: 'rgba(168,85,247,0.15)', background: 'rgba(0,0,0,0.3)' }}>
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      {pr.media_type === "photo"
                        ? <img src={pr.media_url} alt="PR" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-purple-900/30 flex items-center justify-center"><Video className="w-4 h-4 text-purple-400" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{pr.exercise_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="text-[10px]" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                          {MODALITIES.find(m => m.value === pr.modality)?.label}
                        </Badge>
                        <span className="text-xs text-purple-500/40 font-mono-cyber">{format(new Date(pr.date), "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                    <p className="font-cyber text-lg" style={{ color: c.text }}>{pr.load_kg}<span className="text-xs opacity-60">kg</span></p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== MURAL TAB ===== */}
      {activeTab === "mural" && (
        <div>
          {/* Modality selector */}
          <div className="flex gap-2 mb-6">
            {MODALITIES.map(m => {
              const c = MODALITY_COLORS[m.value];
              const active = activeModality === m.value;
              return (
                <button key={m.value} onClick={() => setActiveModality(m.value)}
                  className="flex-1 py-3 rounded-xl border text-sm font-cyber tracking-wider transition-all"
                  style={active
                    ? { background: c.bg, borderColor: c.border, color: c.text, boxShadow: `0 0 16px ${c.border}` }
                    : { background: 'transparent', borderColor: 'rgba(168,85,247,0.12)', color: 'rgba(168,85,247,0.35)' }}>
                  <div>{m.label}</div>
                  <div className="text-[10px] font-mono-cyber mt-0.5 opacity-70">{m.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Ranking per exercise */}
          {Object.keys(currentRanking).length === 0 ? (
            <div className="text-center py-16 text-purple-500/20">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-mono-cyber text-sm">// nenhum PR registrado ainda</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(currentRanking).map(([exName, prs]) => (
                <div key={exName} className="cyber-card rounded-xl border border-purple-900/20 overflow-hidden">
                  <div className="px-5 py-3 border-b border-purple-900/20 flex items-center gap-3">
                    <Trophy className="w-4 h-4" style={{ color: modColor.text }} />
                    <h3 className="font-cyber text-sm tracking-widest text-white uppercase">{exName}</h3>
                    <Badge className="ml-auto text-[10px]" style={{ background: modColor.bg, border: `1px solid ${modColor.border}`, color: modColor.text }}>
                      {MODALITIES.find(m => m.value === activeModality)?.label}
                    </Badge>
                  </div>
                  <div className="divide-y divide-purple-900/15">
                    {prs.slice(0, 10).map((pr, idx) => {
                      const RankIcon = RANK_ICONS[idx] || Trophy;
                      const rankColor = RANK_COLORS[idx] || "rgba(168,85,247,0.5)";
                      return (
                        <div
                          key={pr.id}
                          onClick={() => openMedia(pr)}
                          className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-white/5 transition-all"
                        >
                          {/* Rank */}
                          <div className="w-8 flex-shrink-0 text-center">
                            {idx < 3
                              ? <RankIcon className="w-5 h-5 mx-auto" style={{ color: rankColor }} />
                              : <span className="font-cyber text-sm" style={{ color: 'rgba(168,85,247,0.3)' }}>#{idx + 1}</span>
                            }
                          </div>

                          {/* Student avatar + name */}
                          <div className="flex flex-col items-center gap-1 w-14 flex-shrink-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: 'rgba(168,85,247,0.25)' }}>
                              {getStudentPhoto(pr.student_id)
                                ? <img src={getStudentPhoto(pr.student_id)} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-purple-900/30 flex items-center justify-center text-purple-400 font-cyber text-lg">{getStudentName(pr.student_id)[0]}</div>
                              }
                            </div>
                            <p className="text-[9px] font-mono-cyber text-white/50 truncate w-14 text-center">{getStudentName(pr.student_id)}</p>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{getStudentName(pr.student_id)}</p>
                            <p className="text-xs text-purple-500/40 font-mono-cyber">
                              {format(new Date(pr.date), "dd 'de' MMM yyyy", { locale: ptBR })}
                            </p>
                            {pr.notes && <p className="text-xs text-purple-400/30 mt-0.5 truncate">{pr.notes}</p>}
                          </div>

                          {/* Load */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-cyber text-xl" style={{ color: idx === 0 ? rankColor : modColor.text }}>
                              {pr.load_kg}
                            </p>
                            <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.35)' }}>kg</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media Dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="border-purple-500/30 p-0 overflow-hidden max-w-xl" style={{ background: '#04040e' }}>
          {selectedMedia && (
            <div>
              {selectedMedia.media_type === "photo"
                ? <img src={selectedMedia.media_url} alt="PR" className="w-full max-h-[70vh] object-contain" />
                : <video src={selectedMedia.media_url} controls autoPlay className="w-full max-h-[70vh]" />
              }
              <div className="p-4 border-t border-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-cyber text-white text-sm">{getStudentName(selectedMedia.student_id)}</p>
                    <p className="text-xs text-purple-400/40 font-mono-cyber">{selectedMedia.exercise_name}</p>
                    {selectedMedia.notes && <p className="text-xs text-purple-400/30 mt-1">{selectedMedia.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-cyber text-2xl" style={{ color: MODALITY_COLORS[selectedMedia.modality]?.text }}>
                      {selectedMedia.load_kg}kg
                    </p>
                    <Badge className="text-[10px]" style={{
                      background: MODALITY_COLORS[selectedMedia.modality]?.bg,
                      border: `1px solid ${MODALITY_COLORS[selectedMedia.modality]?.border}`,
                      color: MODALITY_COLORS[selectedMedia.modality]?.text
                    }}>
                      {MODALITIES.find(m => m.value === selectedMedia.modality)?.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}