import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, Utensils } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/shared/PageHeader";

const CATEGORIES = {
  proteina: { label: "Proteína", color: "bg-pink-500/10 border-pink-500/20 text-pink-300" },
  carboidrato: { label: "Carboidrato", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300" },
  gordura: { label: "Gordura", color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" },
  fruta: { label: "Fruta", color: "bg-orange-500/10 border-orange-500/20 text-orange-300" },
  vegetal: { label: "Vegetal", color: "bg-green-500/10 border-green-500/20 text-green-300" },
  laticinios: { label: "Laticínios", color: "bg-blue-500/10 border-blue-500/20 text-blue-300" },
  leguminosa: { label: "Leguminosa", color: "bg-amber-500/10 border-amber-500/20 text-amber-300" },
  oleaginosa: { label: "Oleaginosa", color: "bg-lime-500/10 border-lime-500/20 text-lime-300" },
  bebida: { label: "Bebida", color: "bg-purple-500/10 border-purple-500/20 text-purple-300" },
  outro: { label: "Outro", color: "bg-gray-500/10 border-gray-500/20 text-gray-300" },
};

const emptyFood = { name: "", category: "proteina", calories_per_100g: 0, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0, fiber_per_100g: 0, serving_size_g: 100 };

export default function FoodDatabase() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyFood);
  const qc = useQueryClient();

  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: () => base44.entities.Food.list() });
  const createMut = useMutation({ mutationFn: (d) => base44.entities.Food.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["foods"] }); closeDialog(); toast.success("Alimento adicionado!"); } });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => base44.entities.Food.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["foods"] }); closeDialog(); toast.success("Alimento atualizado!"); } });
  const deleteMut = useMutation({ mutationFn: (id) => base44.entities.Food.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["foods"] }); toast.success("Alimento removido!"); } });

  const openCreate = () => { setEditing(null); setForm(emptyFood); setDialogOpen(true); };
  const openEdit = (f) => { setEditing(f); setForm({ ...f }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };
  const handleSave = () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    if (editing) updateMut.mutate({ id: editing.id, d: form });
    else createMut.mutate(form);
  };

  const filtered = foods.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || f.category === filterCat;
    return matchSearch && matchCat;
  });

  const n = (v, dec = 0) => v ? (dec ? parseFloat(v).toFixed(dec) : Math.round(v)) : "-";

  return (
    <div>
      <PageHeader
        title="Alimentos"
        subtitle={`${foods.length} alimentos cadastrados`}
        action={
          <button onClick={openCreate} className="btn-neon-purple px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 tracking-wider">
            <Plus className="w-4 h-4" /> NOVO ALIMENTO
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alimento..." className="cyber-input pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="cyber-input w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
            <SelectItem value="all" className="text-white">Todas categorias</SelectItem>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-purple-500/30">
          <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-mono-cyber text-sm">// nenhum alimento encontrado</p>
          <p className="font-mono-cyber text-xs mt-1 opacity-60">// clique em "NOVO ALIMENTO" para adicionar</p>
        </div>
      ) : (
        <div>
          {/* Table header */}
          <div className="grid gap-2 px-4 py-2 text-[10px] text-purple-500/40 font-mono-cyber uppercase tracking-wider mb-1" style={{ gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 1fr auto' }}>
            <span>Alimento</span>
            <span>Categoria</span>
            <span className="text-center">Kcal</span>
            <span className="text-center">Prot</span>
            <span className="text-center">Carb</span>
            <span className="text-center">Gord</span>
            <span></span>
          </div>
          <div className="space-y-1.5">
            {filtered.map(food => {
              const cat = CATEGORIES[food.category] || CATEGORIES.outro;
              return (
                <div key={food.id} className="cyber-card rounded-xl border border-purple-900/20 hover:border-purple-500/20 transition-all">
                  <div className="grid gap-2 px-4 py-3 items-center" style={{ gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 1fr auto' }}>
                    <p className="text-sm font-medium text-white truncate">{food.name}</p>
                    <Badge className={`text-[9px] border w-fit ${cat.color}`}>{cat.label}</Badge>
                    <p className="text-sm font-cyber text-orange-400 text-center">{n(food.calories_per_100g)}</p>
                    <p className="text-sm font-cyber text-pink-400 text-center">{n(food.protein_per_100g, 1)}g</p>
                    <p className="text-sm font-cyber text-yellow-400 text-center">{n(food.carbs_per_100g, 1)}g</p>
                    <p className="text-sm font-cyber text-cyan-400 text-center">{n(food.fat_per_100g, 1)}g</p>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(food)} className="p-1.5 text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMut.mutate(food.id)} className="p-1.5 text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[10px] font-mono-cyber text-purple-500/25 py-3">// valores por 100g</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="border border-purple-900/40 text-white max-w-md" style={{ background: '#04040e' }}>
          <DialogHeader>
            <DialogTitle className="font-cyber tracking-widest text-purple-300">{editing ? "EDITAR ALIMENTO" : "NOVO ALIMENTO"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">NOME *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Frango grelhado" className="cyber-input mt-1" />
            </div>
            <div>
              <Label className="text-purple-400/60 text-xs tracking-wider">CATEGORIA</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: '#04040e', borderColor: 'rgba(168,85,247,0.3)' }}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-purple-400/60 text-[10px] tracking-wider font-mono-cyber mb-2 uppercase">Valores por 100g</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "CALORIAS (kcal)", field: "calories_per_100g", color: "text-orange-400" },
                  { label: "PROTEÍNA (g)", field: "protein_per_100g", color: "text-pink-400" },
                  { label: "CARBOIDRATO (g)", field: "carbs_per_100g", color: "text-yellow-400" },
                  { label: "GORDURA (g)", field: "fat_per_100g", color: "text-cyan-400" },
                  { label: "FIBRA (g)", field: "fiber_per_100g", color: "text-green-400" },
                  { label: "PORÇÃO PADRÃO (g)", field: "serving_size_g", color: "text-purple-400" },
                ].map(m => (
                  <div key={m.field}>
                    <Label className={`text-[10px] tracking-wider ${m.color} opacity-60`}>{m.label}</Label>
                    <Input type="number" step="0.1" value={form[m.field] || ""} onChange={e => setForm({ ...form, [m.field]: parseFloat(e.target.value) || 0 })} className="cyber-input mt-1 text-center" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10">Cancelar</Button>
            <button onClick={handleSave} className="btn-neon-purple px-4 py-2 rounded-lg text-sm font-medium" disabled={createMut.isPending || updateMut.isPending}>SALVAR</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}