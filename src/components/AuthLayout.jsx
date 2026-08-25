import React from "react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app-bg text-app-text">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 31%, hsl(var(--app-primary) / 0.18), transparent 23%), radial-gradient(circle at 57% 29%, hsl(190 70% 48% / 0.14), transparent 25%)" }}
      />
      <header className="relative z-10 flex h-[76px] items-center justify-center border-b border-app-primary/15 bg-app-bg/80 backdrop-blur-xl">
        <div className="flex items-center gap-3" aria-label="BZ Gym">
          <svg viewBox="0 0 52 44" className="h-10 w-12" aria-hidden="true">
            <path d="M5 25h9l5-10 8 18 7-14h12" fill="none" stroke="hsl(var(--app-primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 13A19 19 0 0 1 40 9M44 15a19 19 0 0 1-31 21" fill="none" stroke="hsl(190 70% 48%)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-2xl font-bold tracking-tight">BZ Gym</span>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-76px)] flex-col items-center px-4 pb-32 pt-[46px]">
        <section className="app-glass-card w-full max-w-[340px] rounded-[24px] border-app-primary/25 px-6 pb-6 pt-7" style={{ boxShadow: "0 -18px 70px hsl(var(--app-primary) / 0.16), 30px -10px 75px hsl(190 70% 48% / 0.1), 0 24px 55px hsl(240 50% 2% / 0.5)" }}>
          <div className="mb-4 text-center">
            <h1 className="text-[27px] font-bold leading-tight tracking-tight text-app-text">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-app-muted">{subtitle}</p>}
          </div>
          {children}
        </section>
        {footer && <p className="relative z-10 mt-12 text-center text-sm text-app-text">{footer}</p>}
      </main>

      <svg className="pointer-events-none absolute bottom-0 left-1/2 h-28 w-[560px] max-w-none -translate-x-1/2 opacity-50" viewBox="0 0 680 120" fill="none" aria-hidden="true">
        <defs><linearGradient id="auth-pulse" x1="0" x2="680" gradientUnits="userSpaceOnUse"><stop stopColor="hsl(var(--app-primary))" stopOpacity="0" /><stop offset="0.42" stopColor="hsl(var(--app-primary))" /><stop offset="0.7" stopColor="hsl(190 70% 48%)" /><stop offset="1" stopColor="hsl(190 70% 48%)" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 95h150c20 0 26-30 45-30s22 18 36 18 17-45 31-45 22 77 38 77 21-72 39-72 21 27 39 27 20-8 39-8h46c20 0 19-36 36-36s24 80 42 80 20-55 38-55 16 44 35 44h96" stroke="url(#auth-pulse)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}