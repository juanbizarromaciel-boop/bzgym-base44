export const loadSharePhoto = file => new Promise((resolve, reject) => {
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
  image.onerror = reject;
  image.src = url;
});

export function drawCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

export function roundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

export function drawBrandMark(ctx, x, y, dark = false) {
  ctx.save();
  ctx.translate(x, y);
  const gradient = ctx.createLinearGradient(0, 0, 84, 84);
  gradient.addColorStop(0, "#a855f7"); gradient.addColorStop(1, "#22d3ee");
  roundedRect(ctx, 0, 0, 84, 84, 23, gradient, "rgba(255,255,255,.22)");
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(22, 20); ctx.lineTo(22, 64); ctx.bezierCurveTo(64, 68, 66, 43, 25, 43); ctx.bezierCurveTo(59, 43, 58, 17, 22, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(55, 21); ctx.lineTo(72, 21); ctx.lineTo(50, 63); ctx.lineTo(72, 63); ctx.stroke();
  ctx.fillStyle = dark ? "#11111b" : "#ffffff"; ctx.font = "800 30px Arial"; ctx.letterSpacing = "5px"; ctx.fillText("BZ GYM", 106, 53);
  ctx.restore();
}

export function fitText(ctx, text, maxWidth, startSize, weight = 800) {
  let size = startSize;
  do { ctx.font = `${weight} ${size}px Arial`; size -= 2; } while (ctx.measureText(text).width > maxWidth && size > 26);
}

export const workoutMetrics = stats => [
  { label: "EXERCÍCIOS", value: String(stats.exercises?.length || 0) },
  { label: "DURAÇÃO", value: stats.durationMinutes ? `${stats.durationMinutes} MIN` : "CONCLUÍDO" },
  { label: "VOLUME", value: `${Math.round(stats.volumeKg || 0).toLocaleString("pt-BR")} KG` },
];