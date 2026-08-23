import React from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function WorkoutPlansHeader({ selfManaged, onCreate }) {
  const action = <button onClick={onCreate} className="app-button-primary h-11 gap-2 rounded-xl px-4 text-sm"><Plus className="h-4 w-4" />Novo treino</button>;
  return <PageHeader title={selfManaged ? "Meus treinos" : "Treinos"} subtitle={selfManaged ? "Crie, edite e evolua seus próprios treinos" : "Monte treinos personalizados para seus alunos"} action={action} />;
}