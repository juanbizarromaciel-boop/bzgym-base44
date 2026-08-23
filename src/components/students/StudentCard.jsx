import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Pencil, Phone, Trash2, UserCircle } from "lucide-react";

export default function StudentCard({ student, goal, goalClass, onEdit, onDelete }) {
  return <article className="app-glass-card app-glass-card-interactive group rounded-[18px] p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><div className="app-glass-icon flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full">{student.photo_url ? <img src={student.photo_url} alt={student.name} className="h-full w-full object-cover" /> : <UserCircle className="h-6 w-6 text-app-primary" />}</div><div className="min-w-0"><h3 className="truncate font-semibold text-app-text">{student.name}</h3>{student.goal && <Badge className={`${goalClass} mt-1 border text-xs`}>{goal}</Badge>}</div></div>
      <div className="flex gap-1 opacity-70 transition-opacity group-hover:opacity-100"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-300" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button></div>
    </div>
    <div className="space-y-1.5 text-xs text-app-muted">{student.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{student.email}</div>}{student.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{student.phone}</div>}</div>
  </article>;
}