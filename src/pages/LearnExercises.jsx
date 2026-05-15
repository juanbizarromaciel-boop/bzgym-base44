import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Search, Dumbbell, BookOpen, ChevronDown, ChevronUp, FileText, Image, Film } from "lucide-react";

const MUSCLE_LABELS = {
  peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
  triceps: "Tríceps", pernas: "Pernas", gluteos: "Glúteos",
  abdomen: "Abdômen", panturrilha: "Panturrilha", antebraco: "Antebraço",
  cardio: "Cardio", outro: "Outro"
};

const MUSCLE_COLORS = {
  peito: "#ec4899", costas: "#06b6d4", ombros: "#a855f7", biceps: "#c084fc",
  triceps: "#818cf8", pernas: "#f472b6", gluteos: "#fb7185",
  abdomen: "#22d3ee", panturrilha: "#67e8f9", antebraco: "#d8b4fe",
  cardio: "#ef4444", outro: "#6b7280"
};

const MUSCLE_OPTIONS = Object.entries(MUSCLE_LABELS);

const MUSCLE_DEFAULTS = {
  peito: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
  costas: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&q=80",
  ombros: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
  biceps: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
  triceps: "https://images.unsplash.com/photo-1530822847156-5df684ec5105?w=400&q=80",
  pernas: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&q=80",
  gluteos: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  abdomen: "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400&q=80",
  panturrilha: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&q=80",
  cardio: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80",
  outro: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
};

function isYouTubeEmbed(url) { return url?.includes("youtube.com/embed/"); }
function isVideo(url) { return url?.match(/\.(mp4|webm)(\?|$)/i); }
function fixWikimediaUrl(url) {
  if (!url) return url;
  const match = url.match(/Special:Redirect\/file\/(.+)$/i);
  if (match) return `https://commons.wikimedia.org/wiki/Special:FilePath/${match[1]}`;
  return url;
}

function ExerciseCard({ exercise }) {
  const [expanded, setExpanded] = useState(false);
  const [mediaTab, setMediaTab] = useState("photo"); // "photo" | "video"
  const muscleColor = MUSCLE_COLORS[exercise.muscle_group] || "#6b7280";

  // image_url = GIF/foto. video_url = YouTube/MP4/WEBM somente se for vídeo real
  const imageUrl = fixWikimediaUrl(exercise.image_url);
  const rawVideoUrl = exercise.video_url;
  const isRealVideo = isYouTubeEmbed(rawVideoUrl) || isVideo(rawVideoUrl);
  const hasImage = !!imageUrl;
  const hasVideo = !!rawVideoUrl && isRealVideo;
  const hasDesc = !!exercise.description;

  // Thumbnail: prefer image_url (GIF), then muscle default
  const thumbUrl = imageUrl || MUSCLE_DEFAULTS[exercise.muscle_group];

  return (
    <div
      className="rounded-2xl border transition-all duration-300 overflow-hidden"
      style={{
        background: expanded ? 'rgba(10,6,28,0.95)' : 'rgba(8,5,20,0.8)',
        borderColor: expanded ? `${muscleColor}40` : 'rgba(168,85,247,0.12)',
        boxShadow: expanded ? `0 0 30px ${muscleColor}12, 0 4px 20px rgba(0,0,0,0.4)` : '0 2px 12px rgba(0,0,0,0.3)'
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-purple-500/3"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Thumbnail */}
        <div
          className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border"
          style={{ background: `${muscleColor}12`, borderColor: `${muscleColor}30` }}
        >
          <img
            src={thumbUrl}
            alt={exercise.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div className="w-full h-full items-center justify-center" style={{ display: 'none' }}>
            <Dumbbell className="w-6 h-6" style={{ color: `${muscleColor}80` }} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{exercise.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-[10px] font-mono-cyber px-2 py-0.5 rounded-full"
              style={{ background: `${muscleColor}15`, border: `1px solid ${muscleColor}35`, color: muscleColor }}
            >
              {MUSCLE_LABELS[exercise.muscle_group] || exercise.muscle_group}
            </span>
            {hasDesc && (
              <span className="text-[10px] text-purple-400/40 font-mono-cyber flex items-center gap-1">
                <FileText className="w-2.5 h-2.5" /> descrição
              </span>
            )}
            {hasImage && (
              <span className="text-[10px] text-cyan-400/40 font-mono-cyber flex items-center gap-1">
                <Image className="w-2.5 h-2.5" /> gif
              </span>
            )}
            {hasVideo && (
              <span className="text-[10px] text-pink-400/40 font-mono-cyber flex items-center gap-1">
                <Film className="w-2.5 h-2.5" /> vídeo
              </span>
            )}
          </div>
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0 text-purple-500/30">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-5 border-t border-purple-900/15 pt-4 space-y-4">

          {/* Media section */}
          <>
            {/* Tabs — only when both image and video exist */}
            {hasImage && hasVideo && (
              <div className="flex gap-2">
                <button onClick={() => setMediaTab("photo")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono-cyber transition-all"
                  style={mediaTab === "photo"
                    ? { background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#e9d5ff' }
                    : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.4)' }}>
                  <Image className="w-3 h-3" /> GIF
                </button>
                <button onClick={() => setMediaTab("video")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono-cyber transition-all"
                  style={mediaTab === "video"
                    ? { background: 'rgba(6,182,212,0.18)', border: '1px solid rgba(6,182,212,0.45)', color: '#67e8f9' }
                    : { background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.12)', color: 'rgba(103,232,249,0.4)' }}>
                  <Film className="w-3 h-3" /> Vídeo
                </button>
              </div>
            )}

            {/* GIF / Image — always show unless user selected video tab */}
            {hasImage && mediaTab !== "video" && (
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: `${muscleColor}25`, background: 'rgba(0,0,0,0.4)' }}>
                <img
                  src={imageUrl}
                  alt={exercise.name}
                  className="w-full object-contain"
                  style={{ maxHeight: 320 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Muscle default — if no image and no video selected */}
            {!hasImage && !hasVideo && (
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: `${muscleColor}25`, background: 'rgba(0,0,0,0.4)' }}>
                <img
                  src={MUSCLE_DEFAULTS[exercise.muscle_group] || MUSCLE_DEFAULTS.outro}
                  alt={exercise.name}
                  className="w-full object-contain"
                  style={{ maxHeight: 320 }}
                />
              </div>
            )}

            {/* Video — only when video tab selected or only video exists */}
            {hasVideo && (mediaTab === "video" || !hasImage) && (
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(6,182,212,0.25)', background: 'rgba(0,0,0,0.4)' }}>
                {isYouTubeEmbed(rawVideoUrl) ? (
                  <div style={{ aspectRatio: '16/9' }}>
                    <iframe src={rawVideoUrl} className="w-full h-full" allowFullScreen title={exercise.name} />
                  </div>
                ) : (
                  <video src={rawVideoUrl} controls className="w-full" style={{ maxHeight: 320 }} />
                )}
              </div>
            )}
          </>

          {/* Description */}
          {hasDesc ? (
            <div
              className="rounded-xl p-4 border-l-2"
              style={{ background: 'rgba(168,85,247,0.04)', borderLeftColor: `${muscleColor}60` }}
            >
              <p className="text-[10px] font-mono-cyber uppercase tracking-widest mb-2" style={{ color: `${muscleColor}80` }}>
                Como executar
              </p>
              <p className="text-sm text-purple-200/70 leading-relaxed">{exercise.description}</p>
            </div>
          ) : (
            <p className="text-xs text-purple-500/30 font-mono-cyber italic text-center py-2">
              // sem descrição disponível ainda
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function LearnExercises() {
  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("all");

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => base44.entities.Exercise.list()
  });

  const filtered = exercises.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = filterMuscle === "all" || e.muscle_group === filterMuscle;
    return matchSearch && matchMuscle;
  });

  const groupedByMuscle = MUSCLE_OPTIONS.reduce((acc, [key]) => {
    const items = filtered.filter(e => e.muscle_group === key);
    if (items.length > 0) acc[key] = items;
    return acc;
  }, {});

  const withoutGroup = filtered.filter(e => !MUSCLE_LABELS[e.muscle_group]);

  return (
    <div>
      {/* Hero Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 0 20px rgba(168,85,247,0.15)' }}>
            <BookOpen className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="font-cyber text-2xl text-white tracking-widest"
              style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
              APRENDA OS EXERCÍCIOS
            </h1>
            <p className="text-[11px] font-mono-cyber text-purple-500/50 mt-0.5">
              // {exercises.length} exercícios disponíveis · clique para ver detalhes e GIFs
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar exercício..."
            className="cyber-input pl-10 text-sm"
          />
        </div>

        {/* Muscle group filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMuscle("all")}
            className="px-3 py-1.5 rounded-full text-xs font-mono-cyber transition-all"
            style={filterMuscle === "all"
              ? { background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#e9d5ff' }
              : { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(192,132,252,0.45)' }}
          >
            Todos ({exercises.length})
          </button>
          {MUSCLE_OPTIONS.map(([key, label]) => {
            const count = exercises.filter(e => e.muscle_group === key).length;
            if (count === 0) return null;
            const color = MUSCLE_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => setFilterMuscle(key)}
                className="px-3 py-1.5 rounded-full text-xs font-mono-cyber transition-all"
                style={filterMuscle === key
                  ? { background: `${color}22`, border: `1px solid ${color}70`, color: color }
                  : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(200,180,240,0.4)' }}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Grouped by muscle */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-8">
          {filterMuscle === "all" ? (
            Object.entries(groupedByMuscle).map(([key, items]) => {
              const color = MUSCLE_COLORS[key];
              return (
                <div key={key}>
                  {/* Section title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <h2 className="font-cyber text-xs tracking-[0.3em] uppercase" style={{ color: `${color}cc` }}>
                      {MUSCLE_LABELS[key]}
                    </h2>
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}30, transparent)` }} />
                    <span className="text-[10px] font-mono-cyber" style={{ color: `${color}60` }}>{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-2">
              {filtered.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
            </div>
          )}
          {withoutGroup.length > 0 && (
            <div className="space-y-2">
              {withoutGroup.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
            </div>
          )}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 text-purple-500/30">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-mono-cyber text-sm">// nenhum exercício encontrado</p>
        </div>
      )}
    </div>
  );
}