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
    <div className="group bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition-all">
      <div className="flex items-start gap-3">
        {showActions && (
          <div className="text-gray-600 mt-1 cursor-grab">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              #{index + 1}
            </span>
            <h4 className="font-semibold text-white truncate">{exercise.exercise_name}</h4>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="bg-gray-800/80 border-gray-600 text-gray-300 text-xs">
              {exercise.sets}x{exercise.reps}
            </Badge>
            {exercise.load_kg > 0 && (
              <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs">
                {exercise.load_kg}kg
              </Badge>
            )}
            {exercise.rest_seconds > 0 && (
              <Badge variant="outline" className="bg-gray-800/80 border-gray-600 text-gray-400 text-xs">
                {exercise.rest_seconds}s rest
              </Badge>
            )}
            {tech !== "normal" && (
              <Badge className={`${techniqueColors[tech]} border text-xs`}>
                {techniqueLabels[tech]}
              </Badge>
            )}
          </div>

          {exercise.technique_details && (
            <p className="text-xs text-gray-500 italic">{exercise.technique_details}</p>
          )}
          {exercise.notes && (
            <p className="text-xs text-gray-500 mt-1">{exercise.notes}</p>
          )}
        </div>

        {showActions && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700" onClick={() => onEdit(index)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => onRemove(index)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}