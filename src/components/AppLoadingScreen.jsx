import React from "react";

export default function AppLoadingScreen({ message = "Preparando sua experiência" }) {
  return (
    <main className="premium-app-shell fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-6 text-app-text">
      <section className="flex w-full max-w-sm flex-col items-center text-center" aria-live="polite">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border border-app-primary/15 border-t-app-primary" />
          <div className="absolute inset-3 animate-pulse rounded-full border border-app-primary/20 bg-app-primary/5" />
          <span className="relative text-2xl font-black italic tracking-[-0.08em] text-app-text">BZ</span>
        </div>
        <h1 className="mt-6 text-lg font-semibold tracking-tight">BZ Gym System</h1>
        <p className="mt-2 text-sm text-app-muted">{message}</p>
        <div className="mt-6 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-app-primary" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-app-primary/60 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-app-primary/30 [animation-delay:300ms]" />
        </div>
      </section>
    </main>
  );
}