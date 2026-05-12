import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

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

function isYouTubeEmbed(url) {
  return url?.includes("youtube.com/embed/");
}

function isVideo(url) {
  return url?.match(/\.(mp4|webm)(\?|$)/i);
}

function getYouTubeEmbed(url) {
  if (!url) return null;
  // Already an embed URL
  if (url.includes("youtube.com/embed/")) return url;
  // Watch URL or youtu.be
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/**
 * Renders exercise media: YouTube embed, MP4/WEBM video, image, or GIF.
 * Priority: video_url (if video/youtube) → image_url → video_url as image (legacy) → muscle default
 */
export default function ExerciseMediaDisplay({ exercise, maxHeight = 220, className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [defaultFailed, setDefaultFailed] = useState(false);

  const videoUrl = exercise?.video_url;
  const imageUrl = exercise?.image_url;
  const fallbackUrl = MUSCLE_DEFAULTS[exercise?.muscle_group] || MUSCLE_DEFAULTS.outro;

  // 1. YouTube embed (video_url is a youtube link)
  const youtubeEmbed = getYouTubeEmbed(videoUrl);
  if (youtubeEmbed) {
    return (
      <div className={`rounded-xl overflow-hidden border border-purple-900/20 bg-black/30 ${className}`}
        style={{ aspectRatio: '16/9', maxHeight }}>
        <iframe src={youtubeEmbed} className="w-full h-full" allowFullScreen title={exercise?.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      </div>
    );
  }

  // 2. Direct video file (mp4/webm)
  if (isVideo(videoUrl)) {
    return (
      <div className={`rounded-xl overflow-hidden border border-purple-900/20 bg-black/30 ${className}`}>
        <video src={videoUrl} controls className="w-full object-contain" style={{ maxHeight }} />
      </div>
    );
  }

  // 3. Image (image_url → video_url as legacy image → muscle default)
  const primaryUrl = imageUrl || (videoUrl && !isYouTubeEmbed(videoUrl) && !isVideo(videoUrl) ? videoUrl : null);
  const displayUrl = (!imgFailed && primaryUrl) ? primaryUrl : (!defaultFailed ? fallbackUrl : null);

  if (!displayUrl) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-purple-900/15 ${className}`}
        style={{ minHeight: 100, background: 'rgba(168,85,247,0.03)' }}>
        <ImageIcon className="w-6 h-6 text-purple-600/25" />
        <p className="text-[10px] font-mono-cyber" style={{ color: 'rgba(168,85,247,0.3)' }}>Nenhuma mídia cadastrada.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-purple-900/20 bg-black/30 ${className}`}>
      <img
        src={displayUrl}
        alt={exercise?.name}
        className="w-full object-contain"
        style={{ maxHeight }}
        onError={() => {
          if (!imgFailed && primaryUrl) setImgFailed(true);
          else setDefaultFailed(true);
        }}
      />
    </div>
  );
}