import React from "react";
import { LockKeyhole, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StudentAccessBlocked() {
  return <main className="premium-app-shell flex min-h-screen items-center justify-center p-5 text-app-text">
    <section className="app-glass-card w-full max-w-md rounded-3xl p-8 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
        <LockKeyhole className="h-9 w-9 text-red-300" />
      </div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Acesso pausado</p>
      <h1 className="mb-3 text-2xl font-bold">Seu acesso está bloqueado</h1>
      <p className="mb-7 text-sm leading-relaxed text-app-muted">Entre em contato com seu Personal Trainer para solicitar a reativação do seu acesso ao aplicativo.</p>
      <button onClick={() => base44.auth.logout("/login")} className="app-button-secondary h-11 w-full gap-2 rounded-xl text-sm">
        <LogOut className="h-4 w-4" /> Sair da conta
      </button>
    </section>
  </main>;
}