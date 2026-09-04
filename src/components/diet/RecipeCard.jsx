import React from "react";
import { Flame } from "lucide-react";

export default function RecipeCard({ recipe }) {
  return (
    <article className="rounded-xl border border-emerald-500/15 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">{recipe.name}</h4>
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-orange-300"><Flame className="h-3 w-3" />{recipe.calories} kcal</span>
      </div>
      <p className="mt-2 text-[10px] text-purple-200/60">{(recipe.ingredients || []).join(" · ")}</p>
      <p className="mt-3 text-xs leading-relaxed text-purple-100/75">{recipe.preparation}</p>
      <p className="mt-3 text-[10px] text-cyan-300/70">{recipe.protein_g}g P · {recipe.carbs_g}g C · {recipe.fat_g}g G</p>
    </article>
  );
}