import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChefHat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RecipeCard from "@/components/diet/RecipeCard";

export default function RecipeSuggestions({ plan }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const foods = (plan.meals || []).flatMap(meal => (meal.items || []).map(item => `${item.food_name} (${item.quantity_g}g)`));
  const generate = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie 3 receitas simples em português usando exclusivamente combinações destes alimentos e suas quantidades disponíveis: ${foods.join(", ")}. Pode usar água e temperos sem calorias. Informe ingredientes, preparo curto e macros aproximados por receita.`,
        response_json_schema: { type: "object", properties: { recipes: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ingredients: { type: "array", items: { type: "string" } }, preparation: { type: "string" }, calories: { type: "number" }, protein_g: { type: "number" }, carbs_g: { type: "number" }, fat_g: { type: "number" } }, required: ["name", "ingredients", "preparation", "calories", "protein_g", "carbs_g", "fat_g"] } } }, required: ["recipes"] }
      });
      setRecipes(result.recipes || []);
    } catch { toast.error("Não foi possível preparar as sugestões agora."); }
    finally { setLoading(false); }
  };
  if (!foods.length) return null;
  return <section className="app-glass-card rounded-2xl p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] tracking-[.2em] text-emerald-300/60">RECEITAS SUGERIDAS</p><h3 className="mt-1 text-base font-semibold text-white">Ideias com o que você tem</h3></div><button onClick={generate} disabled={loading} className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4" />}{loading ? "Preparando..." : recipes.length ? "Novas ideias" : "Ver receitas"}</button></div>{recipes.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-3">{recipes.map((recipe, index) => <RecipeCard key={`${recipe.name}-${index}`} recipe={recipe} />)}</div>}</section>;
}