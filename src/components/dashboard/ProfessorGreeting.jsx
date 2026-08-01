import React from "react";
import { CalendarDays, UserRound } from "lucide-react";

const blockedNames = new Set(["", "lost", "undefined", "null", "nan"]);

const resolveFirstName = (user) => {
  const candidates = [user?.display_name, user?.full_name, user?.name, user?.nome];
  const direct = candidates.find(value => typeof value === "string" && !blockedNames.has(value.trim().toLowerCase()));
  const emailName = user?.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  const emailFirst = emailName?.split(/\s+/)[0] || "";
  const resolved = direct || (!blockedNames.has(emailFirst.toLowerCase()) ? emailName : "Professor");
  const first = resolved.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
};

export default function ProfessorGreeting({ user }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = resolveFirstName(user);
  const weekday = now.toLocaleDateString("pt-BR", { weekday: "long" });
  const month = now.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_108px] items-end gap-4 min-[390px]:grid-cols-[minmax(0,1fr)_118px]">
      <div className="min-w-0">
        <p className="text-[17px] text-professor-muted">{greeting},</p>
        <h1 className="truncate text-[44px] font-semibold leading-[0.95] tracking-[-0.04em] text-professor min-[390px]:text-[50px]">{firstName}</h1>
        <div className="mt-3 inline-flex h-8 items-center gap-2 rounded-full border border-professor-border/35 bg-professor-border/10 px-3 text-[11px] text-purple-300"><UserRound className="h-3.5 w-3.5" /> Professor / Personal</div>
      </div>
      <div className="rounded-[18px] border border-white/10 bg-professor-card/70 px-3 py-3 text-center backdrop-blur-xl">
        <div className="flex items-center justify-center gap-1 text-[10px] capitalize text-professor-muted"><CalendarDays className="h-3 w-3" />{weekday}</div>
        <p className="mt-1 text-[32px] font-semibold leading-none">{now.getDate()}</p>
        <p className="mt-1 text-[11px] capitalize text-professor-muted">{month}</p>
      </div>
    </section>
  );
}