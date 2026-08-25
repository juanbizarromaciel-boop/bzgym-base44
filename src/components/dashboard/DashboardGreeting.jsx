import React from "react";
import { CalendarDays, UserRound } from "lucide-react";

const blocked = new Set(["", "lost", "undefined", "null", "nan"]);

const firstName = (user, profileName, roleLabel) => {
  const values = [profileName, user?.display_name, user?.full_name, user?.name, user?.nome];
  const direct = values.find((value) => {
    if (typeof value !== "string") return false;
    const normalized = value.trim().toLowerCase();
    return !blocked.has(normalized) && !blocked.has(normalized.split(/\s+/)[0]);
  });
  const emailName = user?.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "";
  const roleFallback = roleLabel === "Professor / Personal" ? "Professor" : roleLabel || "Usuário";
  const fallback = blocked.has(emailName.split(/\s+/)[0]?.toLowerCase()) ? roleFallback : emailName;
  const name = (direct || fallback || roleFallback).split(/\s+/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export default function DashboardGreeting({ user, profileName, roleLabel }) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  return (
    <section className="grid grid-cols-[minmax(0,1fr)_108px] items-end gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_112px]">
      <div className="min-w-0">
        <p className="text-[16px] text-professor-muted">{greeting},</p>
        <h1 className="truncate font-semibold leading-[0.95] tracking-[-0.04em] text-professor text-3xl min-[390px]:text-3xl">{firstName(user, profileName, roleLabel)}</h1>
        <div className="mt-2.5 inline-flex h-8 items-center gap-2 rounded-full border border-app-primary/20 bg-app-primary/10 px-3 text-[10px] text-purple-200"><UserRound className="h-3.5 w-3.5" />{roleLabel}</div>
      </div>
      <div className="app-glass-card flex h-[104px] flex-col justify-center rounded-[18px] px-2 text-center">
        <div className="flex items-center justify-center gap-1 text-[10px] capitalize text-professor-muted"><CalendarDays className="h-3 w-3" />{now.toLocaleDateString("pt-BR", { weekday: "long" })}</div>
        <p className="mt-1 text-[32px] font-semibold leading-none">{now.getDate()}</p>
        <p className="mt-1 text-[10px] capitalize text-professor-muted">{now.toLocaleDateString("pt-BR", { month: "long" })}</p>
      </div>
    </section>);

}