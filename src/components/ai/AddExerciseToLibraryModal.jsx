import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle, PlusCircle, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

const MUSCLE_OPTIONS = [
  ['peito', 'Peito'], ['costas', 'Costas'], ['ombros', 'Ombros'],
  ['biceps', 'Bíceps'], ['triceps', 'Tríceps'], ['pernas', 'Pernas'],
  ['gluteos', 'Glúteos'], ['abdomen', 'Abdômen'], ['panturrilha', 'Panturrilha'],
  ['antebraco', 'Antebraço'], ['cardio', 'Cardio'], ['outro', 'Outro'],
];

const selectStyle = {
  background: 'rgba(4,3,14,0.95)',
  border: '1px solid rgba(168,85,247,0.35)',
  color: '#edd9ff',
  borderRadius: '6px',
  padding: '8px 12px',
  width: '100%',
  fontSize: '0.875rem',
};

export default function AddExerciseToLibraryModal({ exercise, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    muscle_group: 'outro',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState(null); // { id, name }
  const [checked, setChecked] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState(null); // 'update' | 'new'

  useEffect(() => {
    if (!exercise) return;
    setForm({
      name: exercise.exerciseName || exercise.exercise_name || '',
      muscle_group: exercise.muscle_group || 'outro',
      description: exercise.notes || '',
    });
    setDuplicate(null);
    setChecked(false);
    setDuplicateAction(null);
  }, [exercise]);

  // Check for duplicates when name changes
  useEffect(() => {
    if (!form.name.trim()) return;
    const check = async () => {
      const all = await base44.entities.Exercise.list();
      const lower = form.name.toLowerCase().trim();
      const found = all.find(e =>
        e.name?.toLowerCase().trim() === lower ||
        e.name?.toLowerCase().trim().includes(lower) ||
        lower.includes(e.name?.toLowerCase().trim() || '')
      );
      setDuplicate(found || null);
      setChecked(true);
    };
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [form.name]);

  const handleSave = async (action = duplicateAction) => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    try {
      if (action === 'update' && duplicate) {
        await base44.entities.Exercise.update(duplicate.id, {
          muscle_group: form.muscle_group,
          description: form.description,
        });
        toast.success(`Exercício "${form.name}" atualizado na biblioteca!`);
      } else {
        const saveName = action === 'new'
          ? `${form.name} (variação)`
          : form.name;
        await base44.entities.Exercise.create({
          name: saveName,
          muscle_group: form.muscle_group,
          description: form.description,
        });
        toast.success(`Exercício "${saveName}" adicionado à biblioteca!`);
      }
      onSaved(form.name);
      onClose();
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setSaving(false);
  };

  if (!exercise) return null;

  return (
    <Dialog open={!!exercise} onOpenChange={onClose}>
      <DialogContent className="max-w-md" style={{ background: 'rgba(8,5,22,0.98)', border: '1px solid rgba(168,85,247,0.3)', color: '#f0e6ff' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-200">
            <PlusCircle className="w-5 h-5 text-purple-400" />
            Adicionar à Biblioteca
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <label className="text-xs font-mono-cyber mb-1.5 block" style={{ color: 'rgba(192,132,252,0.6)' }}>NOME DO EXERCÍCIO</label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="cyber-input"
              placeholder="Nome do exercício"
            />
          </div>

          {/* Muscle group */}
          <div>
            <label className="text-xs font-mono-cyber mb-1.5 block" style={{ color: 'rgba(192,132,252,0.6)' }}>GRUPO MUSCULAR</label>
            <select value={form.muscle_group} onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))} style={selectStyle}>
              {MUSCLE_OPTIONS.map(([k, v]) => (
                <option key={k} value={k} style={{ background: '#09060f', color: '#edd9ff' }}>{v}</option>
              ))}
            </select>
          </div>

          {/* Description / instructions */}
          <div>
            <label className="text-xs font-mono-cyber mb-1.5 block" style={{ color: 'rgba(192,132,252,0.6)' }}>INSTRUÇÃO / OBSERVAÇÕES (opcional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Instruções de execução, observações técnicas..."
              className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(4,2,14,0.8)', border: '1px solid rgba(168,85,247,0.2)', color: '#f0e6ff', caretColor: '#a855f7' }}
            />
          </div>

          {/* Duplicate warning */}
          {checked && duplicate && !duplicateAction && (
            <div className="rounded-xl p-4 border" style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-300">Exercício já existe</p>
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(253,224,71,0.7)' }}>
                "{duplicate.name}" já está cadastrado. Deseja atualizar ou criar uma variação?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDuplicateAction('update')}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1" />Atualizar
                </button>
                <button onClick={() => setDuplicateAction('new')}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                  <PlusCircle className="w-3.5 h-3.5 inline mr-1" />Nova variação
                </button>
                <button onClick={onClose}
                  className="px-3 py-2 rounded-lg text-xs transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(196,181,224,0.6)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Action buttons — shown when no duplicate OR after duplicate action chosen */}
          {(!duplicate || duplicateAction) && (
            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(196,181,224,0.6)' }}>
                Cancelar
              </button>
              <button onClick={() => handleSave(duplicateAction)} disabled={saving || !form.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#e9d5ff', boxShadow: '0 0 14px rgba(168,85,247,0.15)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                {duplicateAction === 'update' ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}