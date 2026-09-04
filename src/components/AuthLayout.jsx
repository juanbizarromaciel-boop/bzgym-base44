import React from "react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="auth-violet">
      <header className="auth-topbar">
        <div className="auth-brand" aria-label="BZ Gym">
          <svg viewBox="0 0 52 44" aria-hidden="true">
            <path d="M5 25h9l5-10 8 18 7-14h12" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 13A19 19 0 0 1 40 9M44 15a19 19 0 0 1-31 21" fill="none" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>BZ Gym</span>
        </div>
      </header>
      <main className="auth-main">
        <section className="auth-card">
          <div className="auth-intro">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
        </section>
        {footer && <p className="auth-footer">{footer}</p>}
      </main>
      <svg className="auth-pulse" viewBox="0 0 760 150" fill="none" aria-hidden="true">
        <defs><linearGradient id="violetPulse" x1="0" x2="760"><stop stopColor="#9c6fe3" stopOpacity="0" /><stop offset=".4" stopColor="#9c6fe3" /><stop offset=".7" stopColor="#72d7ee" /><stop offset="1" stopColor="#72d7ee" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 116h170c23 0 31-38 52-38s26 23 43 23 19-57 37-57 25 95 45 95 25-89 46-89 25 34 47 34 24-10 46-10h54c24 0 23-45 43-45s29 99 50 99 24-68 45-68 19 54 42 54h89" />
      </svg>
    </div>
  );
}