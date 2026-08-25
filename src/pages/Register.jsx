import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Apple, UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleProvider = (provider) => {
    base44.auth.loginWithProvider(provider, safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="mb-6">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
            autoComplete="one-time-code"
            aria-label="Verification code"
            placeholder="000000"
            className="app-input h-11 rounded-lg text-center text-lg tracking-[0.5em]"
          />
        </div>
        <Button
          className="h-11 w-full rounded-full border-0 font-semibold text-primary-foreground"
          style={{ background: "linear-gradient(90deg, hsl(var(--app-primary)), hsl(190 70% 48%))", boxShadow: "0 10px 28px hsl(var(--app-primary) / 0.24)" }}
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="font-medium text-cyan-400 hover:underline">
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="font-medium text-cyan-400 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <div className="mb-4 space-y-2">
        <Button variant="outline" className="h-11 w-full rounded-full border-app-muted/35 bg-app-highlight/55 text-sm font-medium text-app-text hover:bg-app-highlight/80 sm:h-9" onClick={() => handleProvider("google")}>
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
        <Button variant="outline" className="h-11 w-full rounded-full border-app-muted/35 bg-app-highlight/55 text-sm font-medium text-app-text hover:bg-app-highlight/80 sm:h-9" onClick={() => handleProvider("microsoft")}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" aria-hidden="true"><path fill="currentColor" d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z" /></svg>
          Continue with Microsoft
        </Button>
        <Button variant="outline" className="h-11 w-full rounded-full border-app-muted/35 bg-app-highlight/55 text-sm font-medium text-app-text hover:bg-app-highlight/80 sm:h-9" onClick={() => handleProvider("apple")}>
          <Apple className="w-5 h-5 mr-2" />
          Continue with Apple
        </Button>
      </div>

      <div className="relative mb-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-app-surface px-3 text-app-muted">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="app-input h-11 rounded-lg pl-10 text-base sm:h-9 sm:text-sm"
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="app-input h-11 rounded-lg pl-10 text-base sm:h-9 sm:text-sm"
              required
            />
          </div>
        </div>
        <Button type="submit" className="h-11 w-full rounded-full border-0 font-semibold text-primary-foreground sm:h-9" style={{ background: "linear-gradient(90deg, hsl(var(--app-primary)), hsl(190 70% 48%))", boxShadow: "0 10px 28px hsl(var(--app-primary) / 0.24)" }} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}