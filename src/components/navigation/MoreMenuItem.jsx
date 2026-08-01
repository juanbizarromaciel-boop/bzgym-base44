import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MoreMenuItem({ item, badge, onClose }) {
  const Icon = item.icon;
  const body = <><span className="app-glass-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"><Icon className="h-5 w-5 text-purple-200" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-professor">{item.label}</span><span className="mt-0.5 block text-xs leading-snug text-professor-muted">{item.description}</span></span>{badge > 0 && <span className="rounded-full bg-app-primary px-2 py-0.5 text-[10px] font-semibold text-white">{badge > 99 ? "99+" : badge}</span>}<ChevronRight className="h-4 w-4 shrink-0 text-professor-muted" /></>;
  const className = "app-glass-card app-glass-card-interactive flex min-h-16 w-full items-center gap-3 rounded-[16px] p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary";
  if (item.action === "logout") return <button className={className} onClick={() => base44.auth.logout()}>{body}</button>;
  return <Link className={className} to={item.route} onClick={onClose}>{body}</Link>;
}