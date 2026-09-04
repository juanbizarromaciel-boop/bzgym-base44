import React, { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WorkoutFeedbackDialog({ title, value, onChange, label, iconOnly = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        className={iconOnly
          ? "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-purple-500/40 transition-colors hover:bg-purple-500/10 hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
          : "flex items-center gap-1.5 text-xs text-purple-400/50 transition-colors hover:text-purple-300"}
      >
        <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
        {!iconOnly && <span>{value ? "Editar observação do treino" : label}</span>}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="app-glass-card border-app-primary/25 text-app-text sm:max-w-md">
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Escreva seu parecer (opcional)"
            maxLength={1000}
            rows={5}
            className="app-input w-full resize-none p-3 text-sm outline-none"
          />
          <button type="button" onClick={() => setOpen(false)} className="app-button-primary rounded-lg py-2.5 text-sm">Salvar parecer</button>
        </DialogContent>
      </Dialog>
    </>
  );
}