import React from "react";
import { AlertCircle } from "lucide-react";

export default function DashboardErrorState({ onRetry }) {
  return <div className="mx-auto flex min-h-[55vh] max-w-[430px] items-center justify-center px-4"><div className="app-glass-card w-full rounded-[20px] p-6 text-center"><AlertCircle className="mx-auto h-7 w-7 text-amber-300" /><h2 className="mt-3 text-sm font-semibold">Não foi possível carregar a dashboard.</h2><p className="mt-1 text-[11px] text-professor-muted">Verifique sua conexão e tente novamente.</p><button onClick={onRetry} className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Tentar novamente</button></div></div>;
}