import React from "react";

export default function AccountLoadError() {
  return (
    <main className="fixed inset-0 flex items-center justify-center bg-app-bg p-4 text-app-text">
      <section className="app-glass-card w-full max-w-md rounded-2xl p-6 text-center">
        <h1 className="text-xl font-semibold">Não foi possível carregar sua conta</h1>
        <p className="mt-2 text-sm text-app-muted">Atualize a página para tentar novamente.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="app-button-primary mt-5 h-11 rounded-xl px-5"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}