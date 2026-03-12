import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Target, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";

export default function PendingStudents() {
  const qc = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list()
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno atualizado!");
    }
  });

  const pendingStudents = students.filter(s => s.active === false);
  const activeStudents = students.filter(s => s.active === true);

  const handleActivate = (student) => {
    updateMut.mutate({
      id: student.id,
      data: { ...student, active: true }
    });
  };

  return (
    <div>
      <PageHeader
        title="Novos Alunos"
        subtitle="Gerencie solicitações de cadastro"
        action={
          pendingStudents.length > 0 && (
            <Badge className="bg-pink-500/20 border border-pink-500/30 text-pink-300 text-sm">
              {pendingStudents.length} pendente{pendingStudents.length > 1 ? "s" : ""}
            </Badge>
          )
        }
      />

      {/* Pending */}
      {pendingStudents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-pink-400" />
            <h2 className="font-cyber text-sm tracking-wider text-pink-400">AGUARDANDO APROVAÇÃO</h2>
          </div>
          <div className="space-y-3">
            {pendingStudents.map(student => (
              <div
                key={student.id}
                className="cyber-card rounded-xl p-5 border border-pink-500/20 bg-pink-500/5"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                        <span className="font-cyber text-lg text-pink-400">
                          {student.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{student.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-purple-400/50 font-mono-cyber mt-0.5">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </div>
                      </div>
                    </div>

                    {student.goal && (
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-sm text-purple-300">
                          <span className="text-purple-500/50 text-xs">Objetivo:</span> {student.goal}
                        </span>
                      </div>
                    )}

                    {student.notes && (
                      <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-black/30 border border-purple-900/20">
                        <FileText className="w-3.5 h-3.5 text-purple-500/40 mt-0.5" />
                        <p className="text-xs text-purple-400/60 leading-relaxed">{student.notes}</p>
                      </div>
                    )}

                    <p className="text-[10px] text-purple-500/30 font-mono-cyber mt-2">
                      Cadastrado em {new Date(student.created_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleActivate(student)}
                    disabled={updateMut.isPending}
                    className="btn-neon-cyan px-6 py-2.5"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ativar Aluno
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingStudents.length === 0 && (
        <div className="text-center py-16 text-purple-500/30 mb-8">
          <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-mono-cyber text-sm">// nenhum aluno pendente</p>
        </div>
      )}

      {/* Active students summary */}
      {activeStudents.length > 0 && (
        <div>
          <h2 className="font-cyber text-sm tracking-wider text-purple-400/60 mb-4 uppercase">
            Alunos Ativos ({activeStudents.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeStudents.slice(0, 6).map(student => (
              <div
                key={student.id}
                className="cyber-card rounded-xl p-4 border border-purple-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <span className="font-cyber text-sm text-purple-400">
                      {student.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{student.name}</p>
                    <p className="text-xs text-purple-500/40 font-mono-cyber truncate">{student.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}