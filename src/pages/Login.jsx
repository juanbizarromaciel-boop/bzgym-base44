import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Apple, LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleProvider = (provider) => {
    base44.auth.loginWithProvider(provider, returnTo);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-app-bg text-app-text">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 31%, hsl(var(--app-primary) / 0.18), transparent 23%), radial-gradient(circle at 57% 29%, hsl(190 70% 48% / 0.14), transparent 25%)",
        }}
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

      <main className="relative z-10 flex min-h-[calc(100vh-76px)] flex-col items-center justify-start px-4 pb-8 pt-[46px]">
        <section className="app-glass-card w-full max-w-[304px] rounded-[24px] border-app-primary/25 px-6 pb-3 pt-7" style={{ boxShadow: "0 -18px 70px hsl(var(--app-primary) / 0.16), 30px -10px 75px hsl(190 70% 48% / 0.1), 0 24px 55px hsl(240 50% 2% / 0.5)" }}>
          <div className="mb-4 text-center">
            <h1 className="text-[27px] font-bold leading-none tracking-tight text-app-text">Welcome back</h1>
            <p className="mt-1 text-sm text-app-muted">Log in to your account</p>
          </div>

          <div className="mb-4 space-y-2">
            <Button
              variant="outline"
              className="h-11 w-full rounded-full sm:h-9 border-app-primary/70 bg-app-highlight/55 text-sm font-medium text-app-text hover:bg-app-highlight/80"
              style={{ boxShadow: "0 0 18px hsl(var(--app-primary) / 0.16), inset 0 1px 0 hsl(0 0% 100% / 0.08)" }}
              onClick={() => handleProvider("google")}
            >
              <GoogleIcon className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
            <Button variant="outline" className="h-11 w-full rounded-full sm:h-9 border-app-muted/35 bg-app-highlight/55 text-sm font-medium text-app-text hover:bg-app-highlight/80" onClick={() => handleProvider("microsoft")}>
              <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" aria-hidden="true"><path fill="currentColor" d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z" /></svg>
              Continue with Microsoft
            </Button>
            <Button variant="outline" className="h-11 w-full rounded-full sm:h-9 border-app-muted/35 bg-app-highlight/55 text-sm font-medium text-app-text hover:bg-app-highlight/80" onClick={() => handleProvider("apple")}>
              <Apple className="mr-2 h-5 w-5" />
              Continue with Apple
            </Button>
          </div>

          <div className="relative mb-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-app-muted/20" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-app-surface px-3 text-app-muted">or</span></div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-app-text">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="app-input h-11 rounded-lg pl-10 text-base sm:h-9 sm:text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-app-text">Password</Label>
                <Link to="/forgot-password" className="text-xs text-app-muted transition-colors hover:text-app-primary">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="app-input h-11 rounded-lg pl-10 text-base sm:h-9 sm:text-sm"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-full sm:h-9 border-0 font-semibold text-primary-foreground shadow-lg"
              style={{ background: "linear-gradient(90deg, hsl(var(--app-primary)), hsl(190 70% 48%))", boxShadow: "0 10px 28px hsl(var(--app-primary) / 0.24)" }}
              disabled={loading}
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logging in...</> : "Log in"}
            </Button>
          </form>
        </section>

        <p className="relative z-10 mt-12 text-center text-sm text-app-text">
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="font-medium text-cyan-400 hover:underline"
          >
            Create one
          </Link>
        </p>
      </main>

      <svg className="pointer-events-none absolute bottom-0 left-1/2 h-28 w-[560px] max-w-none -translate-x-1/2 opacity-50" viewBox="0 0 680 120" fill="none" aria-hidden="true">
        <defs><linearGradient id="login-pulse" x1="0" x2="680" gradientUnits="userSpaceOnUse"><stop stopColor="hsl(var(--app-primary))" stopOpacity="0" /><stop offset="0.42" stopColor="hsl(var(--app-primary))" /><stop offset="0.7" stopColor="hsl(190 70% 48%)" /><stop offset="1" stopColor="hsl(190 70% 48%)" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 95h150c20 0 26-30 45-30s22 18 36 18 17-45 31-45 22 77 38 77 21-72 39-72 21 27 39 27 20-8 39-8h46c20 0 19-36 36-36s24 80 42 80 20-55 38-55 16 44 35 44h96" stroke="url(#login-pulse)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}