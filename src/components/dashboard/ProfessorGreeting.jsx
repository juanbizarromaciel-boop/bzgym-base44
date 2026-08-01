import React from "react";
import { CalendarDays, UserRound } from "lucide-react";

export default function ProfessorGreeting({ user }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.full_name?.trim().split(" ")[0] || "Professor";
  const weekday = now.toLocaleDateString("pt-BR", { weekday: "long" });
  const month = now.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <section className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-lg text-muted-foreground">{greeting},</p>
        <h1 className="truncate text-4xl font-bold tracking-tight text-foreground">{firstName}</h1>
        <div className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 text-xs text-primary">
          <UserRound className="h-4 w-4" /> Professor / Personal
        </div>
      </div>
      <div className="w-28 shrink-0 rounded-2xl border border-border bg-card/70 p-3 text-center backdrop-blur-md">
        <div className="flex items-center justify-center gap-1 text-xs capitalize text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{weekday}</div>
        <p className="mt-1 text-3xl font-semibold leading-none">{now.getDate()}</p>
        <p className="mt-1 text-xs capitalize text-muted-foreground">{month}</p>
      </div>
    </section>
  );
}