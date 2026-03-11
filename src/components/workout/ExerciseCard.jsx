import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, GripVertical } from "lucide-react";

const techniqueLabels = {
  normal: "Normal",
  cluster: "Cluster",
  rest_pause: "Rest-Pause",
  drop_set: "Drop Set",
  super_set: "Super Set",
  giant_set: "Giant Set",
  piramidal: "Pirâmide",
  fst7: "FST-7",
  myo_reps: "Myo Reps",
  tempo_controlado: "Tempo Controlado",
};

const techniqueColors = {
  normal: "bg-gray-700 text-gray-300",
  cluster: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  rest_pause: "bg-red-500/20 text-red-400 border-red-500/30",
  drop_set: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  super_set: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  giant_set: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  piramidal: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  fst7: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  myo_reps: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  tempo_controlado: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

export default function ExerciseCard({ exercise, index, onEdit, onRemove, showActions = true }) {
  const tech = exercise.technique || "normal";

  return (
    <div className="group rounded-xl p-4 border border-purple-900/20 hover:border-purple-500/25 transition-all" style={{background: 'rgba(0,0,0,0.5)'}}>
      <div className="flex items-start gap-3">
        {showActions && (
          <div className="text-purple-600/30 mt-1 cursor-grab hover:text-purple-400/50">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-cyber text-purple-500/40 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-900/30">
              #{index + 1}
            </span>
            <h4 className="font-semibold text-white truncate">{exercise.exercise_name}</h4>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <Badge className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono-cyber">
              {exercise.sets}x{exercise.reps}
            </Badge>
            {exercise.load_kg > 0 && (
              <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
                {exercise.load_kg}kg
              </Badge>
            )}
            {exercise.rest_seconds > 0 && (
              <Badge className="bg-purple-900/30 border border-purple-900/40 text-purple-400/60 text-xs font-mono-cyber">
                {exercise.rest_seconds}s
              </Badge>
            )}
            {tech !== "normal" && (
              <Badge className={`${techniqueColors[tech]} border text-xs`}>
                {techniqueLabels[tech]}
              </Badge>
            )}
          </div>

          {exercise.technique_details && (
            <p className="text-xs text-purple-400/40 italic font-mono-cyber">{exercise.technique_details}</p>
          )}
          {exercise.notes && (
            <p className="text-xs text-purple-400/30 mt-1">{exercise.notes}</p>
          )}
        </div>

        {showActions && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10" onClick={() => onEdit(index)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10" onClick={() => onRemove(index)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}