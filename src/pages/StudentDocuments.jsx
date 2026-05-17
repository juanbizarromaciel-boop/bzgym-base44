import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Image, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function StudentDocuments() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const [formData, setFormData] = useState({
    document_type: "foto_progresso",
    title: "",
    document_date: "",
    notes: "",
    file: null
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

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", selectedStudent || student?.id],
    queryFn: () => base44.entities.StudentDocument.list("-created_date", 100),
    enabled: !!(selectedStudent || student?.id)
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.StudentDocument.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento enviado");
      handleCloseDialog();
    }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.StudentDocument.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento excluído");
    }
  });

  const handleOpenDialog = () => {
    setFormData({
      document_type: "foto_progresso",
      title: "",
      document_date: new Date().toISOString().split('T')[0],
      notes: "",
      file: null
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async () => {
    const studentId = user?.role === "admin" ? selectedStudent : student?.id;
    if (!studentId) {
      toast.error("Selecione um aluno");
      return;
    }

    if (!formData.file) {
      toast.error("Selecione um arquivo");
      return;
    }

    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });

      const data = {
        student_id: studentId,
        document_type: formData.document_type,
        file_url,
        title: formData.title,
        document_date: formData.document_date,
        notes: formData.notes
      };

      createMut.mutate(data);
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const documentTypeLabels = {
    foto_perfil: "Foto de Perfil",
    foto_progresso: "Foto de Progresso",
    exame_sangue: "Exame de Sangue",
    bioimpedancia: "Bioimpedância",
    raio_x: "Raio-X",
    ressonancia: "Ressonância",
    atestado_medico: "Atestado Médico",
    outro: "Outro"
  };

  const filteredDocuments = documents.filter(d => {
    if (user?.role === "admin") {
      return selectedStudent ? d.student_id === selectedStudent : true;
    } else {
      return d.student_id === student?.id;
    }
  });

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div className="space-y-6">
      {/* Custom Cyber Header */}
      <div className="mb-8 relative">
        {/* Top decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }} />
        
        {/* Main header content */}
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, #a855f7, #06b6d4)', borderRadius: '2px', boxShadow: '0 0 12px rgba(168,85,247,0.6)' }} />
              <h1 className="text-3xl font-black font-cyber tracking-wider" style={{ color: '#ffffff', textShadow: '0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.3)' }}>
                DOCUMENTOS
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ paddingLeft: '14px' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7, 0 0 16px rgba(168,85,247,0.6)' }} />
              <p className="text-sm font-mono-cyber tracking-wide" style={{ color: 'rgba(168,85,247,0.8)', textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
                Gerenciar fotos de progresso, exames e bioimpedâncias
              </p>
            </div>
          </div>

          <Button onClick={handleOpenDialog} className="btn-neon-purple relative px-5 py-3 rounded-xl font-medium tracking-wider flex items-center gap-2 overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.25))' }} />
            <Upload className="w-5 h-5 relative z-10" style={{ color: '#a855f7', filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' }} />
            <span className="text-sm font-bold relative z-10" style={{ color: '#ffffff', textShadow: '0 0 8px rgba(168,85,247,0.5)' }}>ENVIAR DOCUMENTO</span>
          </Button>
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(6,182,212,0.8), rgba(168,85,247,0.6), transparent)' }} />
      </div>

      {user?.role === "admin" && (
        <div className="cyber-card p-4 rounded-xl">
          <Label className="text-purple-300 text-xs mb-2 block">Selecionar Aluno</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="cyber-input">
              <SelectValue placeholder="Escolha um aluno" />
            </SelectTrigger>
            <SelectContent>
              {students.filter(s => s.active).map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full cyber-card p-12 rounded-xl text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-purple-500/30" />
            <p className="text-purple-400/50 text-sm">Nenhum documento encontrado</p>
          </div>
        ) : (
          filteredDocuments.map(doc => (
            <div key={doc.id} className="cyber-card p-4 rounded-xl">
              {isImage(doc.file_url) ? (
                <div className="w-full h-48 mb-3 rounded-lg overflow-hidden bg-black/40 border border-purple-500/20">
                  <img src={doc.file_url} alt={doc.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-48 mb-3 rounded-lg bg-purple-500/5 border border-purple-500/20 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-purple-500/40" />
                </div>
              )}

              <div className="space-y-2">
                <Badge className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 text-[10px]">
                  {documentTypeLabels[doc.document_type]}
                </Badge>

                {doc.title && (
                  <p className="text-white text-sm font-medium">{doc.title}</p>
                )}

                {doc.document_date && (
                  <p className="text-purple-400/60 text-xs">
                    {new Date(doc.document_date).toLocaleDateString("pt-BR")}
                  </p>
                )}

                {doc.notes && (
                  <p className="text-purple-300/70 text-xs line-clamp-2">{doc.notes}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => window.open(doc.file_url, "_blank")}
                    size="sm"
                    className="flex-1 btn-neon-cyan text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Ver/Baixar
                  </Button>
                  <Button
                    onClick={() => deleteMut.mutate(doc.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0a16] border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cyber text-purple-300">Enviar Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-purple-300 text-xs">Tipo de Documento</Label>
              <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
                <SelectTrigger className="cyber-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Título (opcional)</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="cyber-input mt-1"
                placeholder="Ex: Bioimpedância Janeiro 2026"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Data do Documento</Label>
              <Input
                type="date"
                value={formData.document_date}
                onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
                className="cyber-input mt-1"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Arquivo</Label>
              <Input
                type="file"
                onChange={handleFileChange}
                className="cyber-input mt-1"
                accept="image/*,.pdf"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-xs">Observações (opcional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="cyber-input mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={uploading || createMut.isPending}
              className="w-full btn-neon-purple"
            >
              {uploading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}