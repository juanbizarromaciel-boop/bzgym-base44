import React from "react";
import { PlayCircle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ExerciseSearchModal({ exerciseName, onClose }) {
  const safeName = String(exerciseName || "").trim();
  const query = safeName
    ? `${safeName} execução correta${safeName.split(/\s+/).length <= 3 ? " musculação" : ""}`
    : "";

  const openSearch = (baseUrl) => {
    if (!query) return;
    window.open(`${baseUrl}${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Dialog open={Boolean(safeName)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="app-glass-card border-app-primary/20 bg-app-bg text-app-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pesquisar execução</DialogTitle>
          <DialogDescription className="text-app-muted">{safeName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          <button type="button" onClick={() => openSearch("https://www.google.com/search?q=")} className="app-button-secondary min-h-11 gap-2 rounded-xl px-4">
            <Search className="h-4 w-4" aria-hidden="true" /> Pesquisar no Google
          </button>
          <button type="button" onClick={() => openSearch("https://www.youtube.com/results?search_query=")} className="app-button-secondary min-h-11 gap-2 rounded-xl px-4">
            <PlayCircle className="h-4 w-4" aria-hidden="true" /> Ver vídeos no YouTube
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}