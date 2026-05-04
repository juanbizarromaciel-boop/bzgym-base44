import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ── Substance catalog ──────────────────────────────────────────
export const SUBSTANCE_CATALOG = {
  anabolizante: [
    // Testosterona
    "Testosterona",
    // Nandrolona
    "Nandrolona (Deca)",
    "Nandrolona Fenilpropionato (NPP)",
    // Trembolona
    "Trembolona",
    // Boldenona
    "Boldenona (Equipoise)",
    // Masteron
    "Drostanolona (Masteron)",
    // Primobolan
    "Metenolona (Primobolan)",
    // Orais
    "Oxandrolona (Anavar)",
    "Stanozolol (Winstrol)",
    "Metandrostenolona (Dianabol)",
    "Oximetolona (Anadrol)",
    "Turinabol (TBOL)",
    "Superdrol (Metasterona)",
    "Halotestin (Fluoximesterona)",
    "Metiltrienolona (Metil-trenbolona)",
    // Injetáveis menos comuns
    "Propionato de DHT (Androstanolona)",
    "Clostebol (Macrobin)",
    "Mesterolona (Proviron)",
    "Danazol",
    "Gestrinona",
    "Tetrahidrogestrinona (THG)",
    "MENT (Trestolona)",
    "Quinbolona",
    "Norclostebol",
    "19-Nortestosterona base",
    "Sustanon 250",
    "Omnadren",
    // DHT derivados
    "Furazabol",
    "Prostanozol",
    "Epitestosterona",
  ],
  peptideo: [
    // GH e análogos
    "HGH (Hormônio do Crescimento)",
    "HGH Fragment 176-191",
    // GHRPs
    "GHRP-2",
    "GHRP-6",
    "Ipamorelin",
    "Hexarelin",
    "Pralmorelin",
    // GHRHs
    "CJC-1295 sem DAC",
    "CJC-1295 com DAC",
    "Sermorelin",
    "Tesamorelin",
    "MOD-GRF 1-29",
    // IGF
    "IGF-1 LR3",
    "IGF-1 DES",
    "Mecasermin",
    // Melanocortinas
    "Melanotan I",
    "Melanotan II",
    "PT-141 (Bremelanotida)",
    // BPC / TB
    "BPC-157",
    "TB-500 (Timosina Beta-4)",
    // Insulinas
    "Insulina Regular (Humulin R)",
    "Insulina Lispro (Humalog)",
    "Insulina Glargina (Lantus)",
    "Insulina NPH",
    // Emagrecimento
    "Semaglutida (Ozempic/Wegovy)",
    "Tirzepatida (Mounjaro)",
    "Retatrutida",
    "AOD-9604",
    // Outros
    "Selank",
    "Semax",
    "Epitalon",
    "Follistatin 344",
    "Follistatin 315",
    "ACE-031 (Stamulumab)",
    "GDF-8 (Miostatina)",
    "DSIP (Peptídeo sono delta)",
    "Carnosina",
    "SS-31 (Elamipretida)",
    "Humanin",
  ],
  farmaco: [
    // SARMs
    "Ostarine (MK-2866)",
    "Ligandrol (LGD-4033)",
    "RAD-140 (Testolona)",
    "Andarine (S4)",
    "Cardarine (GW-501516)",
    "Ibutamoren (MK-677)",
    "YK-11",
    "S23",
    "LGD-3303",
    "AC-262536",
    // Beta-agonistas
    "Clembuterol",
    "Salbutamol (Albuterol)",
    "Formoterol",
    // Anti-estrogênios / AI
    "Anastrozol (Arimidex)",
    "Letrozol (Femara)",
    "Exemestano (Aromasin)",
    "Tamoxifeno (Nolvadex)",
    "Clomifeno (Clomid)",
    "Fulvestranto",
    "Toremifeno",
    // Anti-prolactina
    "Cabergolina",
    "Bromocriptina",
    "Pramipexol",
    // Proteção hepática
    "UDCA (Ácido Ursodesoxicólico)",
    "TUDCA",
    "Silimarina (Milk Thistle)",
    "NAC (N-Acetilcisteína)",
    // Cardiovascular
    "Carvedilol",
    "Nebivolol",
    "Losartana",
    "Telmisartana",
    "Rosuvastatina",
    "Atorvastatina",
    "Espironolactona",
    // Finasterida / 5AR
    "Finasterida",
    "Dutasterida",
    // Outros farmacológicos
    "HCG (Gonadotrofina Coriônica)",
    "hMG (Menopur)",
    "Gonadorelina",
    "Kisspeptina",
    "T3 (Liotironina / Cytomel)",
    "T4 (Levotiroxina)",
    "Metformina",
    "Berberina",
    "Modafinil",
    "GW-0742",
    "SR9009 (Stenabolic)",
    "SR9011",
    "AICAR",
    "Piruvato de creatina",
    "Dinitrofenol (DNP)",
    "Efedrina",
    "Sibutramina",
    "Diuréticos (furosemida)",
    "Dexametasona",
    "Prednisolona",
  ],
  hormonio: [
    "DHEA",
    "Pregnenolona",
    "Progesterona",
    "Estradiol",
    "Estrona",
    "Estriol",
    "Androstenediona",
    "Androstenediol",
    "Melatonina",
    "Cortisol (Hidrocortisona)",
    "Aldosterona",
    "Insulina (hormônio endógeno)",
    "Leptina recombinante",
    "Eritropoietina (EPO)",
    "Darbepoetina",
    "Teriparatida (PTH 1-34)",
  ],
};

export const ESTER_OPTIONS = [
  { value: "propionato",              label: "Propionato",               halfLife: "~0.8 dias" },
  { value: "acetato",                 label: "Acetato",                  halfLife: "~0.5 dias" },
  { value: "fenilpropionato",         label: "Fenilpropionato",          halfLife: "~1.5 dias" },
  { value: "isocaproato",             label: "Isocaproato",              halfLife: "~4 dias" },
  { value: "enantato",                label: "Enantato",                 halfLife: "~4.5 dias" },
  { value: "cipionato",               label: "Cipionato",                halfLife: "~5 dias" },
  { value: "hexaidrobenzilcarbonato", label: "Hexaidrobenzilcarbonato",  halfLife: "~6 dias" },
  { value: "decanoato",               label: "Decanoato",                halfLife: "~7.5 dias" },
  { value: "laurato",                 label: "Laurato",                  halfLife: "~9 dias" },
  { value: "buciclato",               label: "Buciclato",                halfLife: "~20 dias" },
  { value: "undecanoato",             label: "Undecanoato",              halfLife: "~21 dias" },
  { value: "base",                    label: "Base (sem éster)",         halfLife: "~1 dia" },
  { value: "suspensao",               label: "Suspensão aquosa",         halfLife: "~1-2 dias" },
  { value: "sem_ester",               label: "Sem Éster / Oral",         halfLife: "varia" },
];

export const CATEGORY_LABELS = {
  anabolizante: "Anabolizante",
  peptideo: "Peptídeo",
  farmaco: "Farmacológico",
  hormonio: "Hormônio",
  outro: "Outro",
};

const FREQ_OPTIONS = [
  { value: "1x_semana",          label: "1x por semana" },
  { value: "2x_semana",          label: "2x por semana" },
  { value: "3x_semana",          label: "3x por semana" },
  { value: "dia_sim_dia_nao",    label: "Dia sim, dia não" },
  { value: "diario",             label: "Diário" },
  { value: "2x_dia",             label: "2x por dia" },
  { value: "conforme_necessario",label: "Conforme necessário" },
];

const ROUTE_OPTIONS = [
  { value: "intramuscular", label: "Intramuscular (IM)" },
  { value: "subcutaneo",    label: "Subcutâneo (SC)" },
  { value: "oral",          label: "Oral" },
  { value: "topico",        label: "Tópico" },
  { value: "intravenoso",   label: "Intravenoso (IV)" },
];

const UNIT_OPTIONS = [
  { value: "mg",  label: "mg" },
  { value: "mcg", label: "mcg" },
  { value: "ui",  label: "UI" },
  { value: "iu",  label: "IU" },
  { value: "ml",  label: "ml" },
];

export default function SubstanceFormFields({ form, onChange, onToggleDay }) {
  const categorySubstances = SUBSTANCE_CATALOG[form.category] || [];

  return (
    <div className="space-y-4">
      {/* Category */}
      <div>
        <Label className="text-purple-300 text-xs">Categoria</Label>
        <Select value={form.category} onValueChange={(v) => onChange("category", v)}>
          <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Substance — select from catalog OR free text */}
      {form.category ? (
        <div>
          <Label className="text-purple-300 text-xs">Substância *</Label>
          <Select value={form.substance} onValueChange={(v) => onChange("substance", v)}>
            <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecione a substância" /></SelectTrigger>
            <SelectContent className="max-h-64">
              {categorySubstances.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
              <SelectItem value="__custom__">Outro (digitar manualmente)</SelectItem>
            </SelectContent>
          </Select>
          {(form.substance === "__custom__" || (!categorySubstances.includes(form.substance) && form.substance && form.substance !== "__custom__")) && (
            <Input
              className="cyber-input mt-2"
              placeholder="Digite o nome da substância"
              value={form.substance === "__custom__" ? "" : form.substance}
              onChange={(e) => onChange("substance", e.target.value)}
            />
          )}
        </div>
      ) : (
        <div>
          <Label className="text-purple-300 text-xs">Substância *</Label>
          <Input value={form.substance} onChange={(e) => onChange("substance", e.target.value)} className="cyber-input mt-1" placeholder="Ex: Testosterona, Clembuterol..." />
        </div>
      )}

      {/* Ester */}
      <div>
        <Label className="text-purple-300 text-xs">Éster</Label>
        <Select value={form.ester} onValueChange={(v) => onChange("ester", v)}>
          <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecione o éster (se aplicável)" /></SelectTrigger>
          <SelectContent>
            {ESTER_OPTIONS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label} <span className="text-muted-foreground text-xs ml-1">t½ {e.halfLife}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Via de administração */}
      <div>
        <Label className="text-purple-300 text-xs">Via de Administração</Label>
        <Select value={form.application_route} onValueChange={(v) => onChange("application_route", v)}>
          <SelectTrigger className="cyber-input mt-1"><SelectValue placeholder="Selecione a via" /></SelectTrigger>
          <SelectContent>
            {ROUTE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Dosagem semanal + unidade */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Label className="text-purple-300 text-xs">Dosagem Total / semana</Label>
          <Input type="number" value={form.dosage_mg_per_week} onChange={(e) => onChange("dosage_mg_per_week", e.target.value)} className="cyber-input mt-1" placeholder="Ex: 500" />
        </div>
        <div>
          <Label className="text-purple-300 text-xs">Unidade</Label>
          <Select value={form.dosage_unit || "mg"} onValueChange={(v) => onChange("dosage_unit", v)}>
            <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dosagem por aplicação */}
      <div>
        <Label className="text-purple-300 text-xs">Dosagem por Aplicação</Label>
        <Input type="number" value={form.dosage_mg_per_application} onChange={(e) => onChange("dosage_mg_per_application", e.target.value)} className="cyber-input mt-1" placeholder="Ex: 250" />
      </div>

      {/* Frequência */}
      <div>
        <Label className="text-purple-300 text-xs">Frequência de Aplicação</Label>
        <Select value={form.application_frequency} onValueChange={(v) => onChange("application_frequency", v)}>
          <SelectTrigger className="cyber-input mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FREQ_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Days of week */}
      <div>
        <Label className="text-purple-300 text-xs">Dias de Aplicação (opcional)</Label>
        <div className="flex gap-1.5 mt-2">
          {DAY_NAMES.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onToggleDay(i)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                (form.application_days || []).includes(i)
                  ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                  : "border-purple-500/20 bg-black/20 text-purple-400/50 hover:border-purple-500/40"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Local */}
      <div>
        <Label className="text-purple-300 text-xs">Local de Aplicação</Label>
        <Input value={form.application_site} onChange={(e) => onChange("application_site", e.target.value)} className="cyber-input mt-1" placeholder="Ex: Glúteo, Deltoide..." />
      </div>

      {/* Observações */}
      <div>
        <Label className="text-purple-300 text-xs">Observações</Label>
        <Textarea value={form.notes} onChange={(e) => onChange("notes", e.target.value)} className="cyber-input mt-1" rows={2} />
      </div>
    </div>
  );
}