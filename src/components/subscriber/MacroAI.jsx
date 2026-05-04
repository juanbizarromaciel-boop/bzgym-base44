import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Search } from "lucide-react";

export default function MacroAI() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Informe os macronutrientes de "${query}" por 100g e por uma porção típica.
Retorne APENAS um JSON com esta estrutura exata:
{
  "food": "nome do alimento",
  "portion": "porção típica (ex: 1 unidade, 1 xícara, 100g)",
  "per100g": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0 },
  "perPortion": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0 },
  "portionGrams": 0
}
Todos os valores numéricos em número (não string). Sem texto adicional.`,
      response_json_schema: {
        type: "object",
        properties: {
          food: { type: "string" },
          portion: { type: "string" },
          per100g: { type: "object", properties: { calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, fiber: { type: "number" } } },
          perPortion: { type: "object", properties: { calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, fiber: { type: "number" } } },
          portionGrams: { type: "number" }
        }
      }
    });
    setResult(res);
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") search(); };

  const MacroBar = ({ label, value, color, unit = "g" }) => (
    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'rgba(168,85,247,0.07)' }}>
      <span className="text-xs text-purple-300/50 font-mono-cyber">{label}</span>
      <span className="text-sm font-semibold" style={{ color }}>{value}{unit}</span>
    </div>
  );

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(168,85,247,0.2)', background: 'rgba(8,4,22,0.7)' }}>
      {/* Search */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(168,85,247,0.12)' }}>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ex: banana, arroz cozido, frango grelhado..."
            className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
            style={{ background: '#1a1030', border: '1px solid rgba(168,85,247,0.3)', color: '#ffffff', caretColor: '#c084fc' }}
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
            style={{
              background: loading || !query.trim() ? 'rgba(168,85,247,0.05)' : 'rgba(168,85,247,0.2)',
              border: `1px solid ${loading || !query.trim() ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.45)'}`,
              color: loading || !query.trim() ? 'rgba(168,85,247,0.3)' : '#edd9ff',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            }}>
            {loading
              ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              : <><Sparkles className="w-4 h-4" />Ver</>
            }
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cyber text-white tracking-wide capitalize">{result.food}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Per 100g */}
            <div className="rounded-lg p-3 border" style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.15)' }}>
              <p className="text-[10px] font-mono-cyber text-purple-400/50 tracking-widest mb-2">POR 100g</p>
              <MacroBar label="Calorias" value={result.per100g?.calories ?? '—'} color="#f97316" unit="kcal" />
              <MacroBar label="Proteína" value={result.per100g?.protein ?? '—'} color="#22d3ee" />
              <MacroBar label="Carboidrato" value={result.per100g?.carbs ?? '—'} color="#a78bfa" />
              <MacroBar label="Gordura" value={result.per100g?.fat ?? '—'} color="#f472b6" />
              <MacroBar label="Fibra" value={result.per100g?.fiber ?? '—'} color="#86efac" />
            </div>

            {/* Per portion */}
            <div className="rounded-lg p-3 border" style={{ background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.15)' }}>
              <p className="text-[10px] font-mono-cyber text-cyan-400/50 tracking-widest mb-2 truncate">
                {result.portion || 'POR PORÇÃO'} {result.portionGrams ? `(${result.portionGrams}g)` : ''}
              </p>
              <MacroBar label="Calorias" value={result.perPortion?.calories ?? '—'} color="#f97316" unit="kcal" />
              <MacroBar label="Proteína" value={result.perPortion?.protein ?? '—'} color="#22d3ee" />
              <MacroBar label="Carboidrato" value={result.perPortion?.carbs ?? '—'} color="#a78bfa" />
              <MacroBar label="Gordura" value={result.perPortion?.fat ?? '—'} color="#f472b6" />
              <MacroBar label="Fibra" value={result.perPortion?.fiber ?? '—'} color="#86efac" />
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-8">
          <Search className="w-8 h-8 mx-auto mb-2 text-purple-500/20" />
          <p className="text-xs font-mono-cyber" style={{ color: 'rgba(168,85,247,0.3)' }}>
            // pesquise qualquer alimento
          </p>
        </div>
      )}
    </div>
  );
}