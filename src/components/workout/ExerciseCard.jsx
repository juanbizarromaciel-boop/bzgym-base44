import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, GripVertical, Eye, X, Video, AlertCircle } from "lucide-react";

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

function getYoutubeEmbed(url) {
  if (!url) return null;
  if (url.includes("youtube.com/embed/")) return url + (url.includes("?") ? "&autoplay=1" : "?autoplay=1");
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  return null; // not a youtube URL
}

function isVideoFile(url) {
  return url?.match(/\.(mp4|webm|ogg)(\?|$)/i);
}

export default function ExerciseCard({ exercise, index, onEdit, onRemove, showActions = true, videoUrl }) {
  const tech = exercise.technique || "normal";
  const [showVideoConfirm, setShowVideoConfirm] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const resolvedVideoUrl = videoUrl || exercise.video_url;
  const embedUrl = getYoutubeEmbed(resolvedVideoUrl);
  const isDirectVideo = !embedUrl && isVideoFile(resolvedVideoUrl);

  return (
    <>
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

          <div className="flex gap-1 items-center">
            {/* Eye / Video button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-purple-500/30 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              title="Ver vídeo"
              onClick={() => setShowVideoConfirm(true)}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>

            {showActions && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10" onClick={() => onEdit(index)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-400/40 hover:text-pink-400 hover:bg-pink-500/10" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm (inline) */}
      {showDeleteConfirm && (
        <div className="rounded-xl p-4 border border-pink-500/30 bg-pink-500/5 -mt-1">
          <p className="text-xs text-pink-300 mb-3 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Remover <strong>{exercise.exercise_name}</strong> do treino?
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 rounded-lg text-xs border border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10 transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => { onRemove(index); setShowDeleteConfirm(false); }}
              className="flex-1 py-1.5 rounded-lg text-xs bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30 transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      )}

      {/* Video confirm */}
      {showVideoConfirm && !showVideo && (
        <div className="rounded-xl p-4 border border-cyan-500/20 bg-cyan-500/5 -mt-1">
          <p className="text-xs text-cyan-300 mb-3 flex items-center gap-2">
            <Video className="w-3.5 h-3.5 flex-shrink-0" />
            Ver vídeo de <strong>{exercise.exercise_name}</strong>?
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowVideoConfirm(false)} className="flex-1 py-1.5 rounded-lg text-xs border border-purple-900/40 text-purple-400/60 hover:bg-purple-500/10 transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => { setShowVideoConfirm(false); setShowVideo(true); }}
              className="flex-1 py-1.5 rounded-lg text-xs bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
            >
              Ver vídeo
            </button>
          </div>
        </div>
      )}

      {/* Video player inline */}
      {showVideo && (
        <div className="rounded-xl border border-cyan-500/20 bg-black overflow-hidden -mt-1">
          <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-900/30">
            <span className="text-xs text-cyan-400 font-mono-cyber">{exercise.exercise_name}</span>
            <button onClick={() => setShowVideo(false)} className="p-1 rounded hover:bg-purple-500/10 transition-colors">
              <X className="w-4 h-4 text-purple-400/60" />
            </button>
          </div>
          {embedUrl ? (
            <div className="relative w-full" style={{paddingBottom: '56.25%'}}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
          ) : isDirectVideo ? (
            <video
              src={resolvedVideoUrl}
              controls
              autoPlay
              className="w-full"
              style={{ maxHeight: '60vh' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Video className="w-8 h-8 text-purple-500/20" />
              <p className="text-xs text-purple-500/40 font-mono-cyber text-center">
                // nenhum vídeo cadastrado para este exercício
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}