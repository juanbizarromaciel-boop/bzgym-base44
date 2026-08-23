import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WorkoutSelectors({ students, plans, studentId, planId, onStudent, onPlan }) {
  return <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2"><Select value={studentId} onValueChange={onStudent}><SelectTrigger className="app-input"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger><SelectContent>{students.map(student => <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>)}</SelectContent></Select><Select value={planId} onValueChange={onPlan}><SelectTrigger className="app-input"><SelectValue placeholder="Selecione o treino" /></SelectTrigger><SelectContent>{plans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}</SelectContent></Select></div>;
}