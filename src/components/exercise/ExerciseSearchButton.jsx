import React from "react";
import { Search } from "lucide-react";

export default function ExerciseSearchButton({ exerciseName, onSearch }) {
  const safeName = String(exerciseName || "").trim();

  return (
    <button
      type="button"
      onClick={() => safeName && onSearch(safeName)}
      disabled={!safeName}
      aria-label={`Pesquisar execução de ${safeName || "exercício"}`}
      title={`Pesquisar execução de ${safeName || "exercício"}`}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-purple-500/40 transition-colors hover:bg-cyan-500/10 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Search className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}