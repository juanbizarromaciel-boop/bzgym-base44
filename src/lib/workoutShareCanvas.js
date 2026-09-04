const loadImage = file => new Promise((resolve, reject) => {
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
  image.onerror = reject;
  image.src = url;
});

const drawCover = (ctx, image, width, height) => {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
};

const statLines = stats => [
  `${stats.exercises?.length || 0} EXERCÍCIOS`,
  `${stats.durationMinutes ? `${stats.durationMinutes} MIN` : "TREINO CONCLUÍDO"}`,
  `${Math.round(stats.volumeKg || 0).toLocaleString("pt-BR")} KG DE VOLUME`,
];

export async function createWorkoutShareImage(stats, mode, photo) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, "#05060d"); gradient.addColorStop(.55, "#17102c"); gradient.addColorStop(1, "#06232a");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1350);
  if (photo && mode !== "card") drawCover(ctx, await loadImage(photo), 1080, 1350);
  if (mode !== "photo") {
    const shade = ctx.createLinearGradient(0, 400, 0, 1350);
    shade.addColorStop(0, "rgba(5,6,13,0)"); shade.addColorStop(.6, "rgba(5,6,13,.78)"); shade.addColorStop(1, "rgba(5,6,13,.98)");
    ctx.fillStyle = shade; ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = "#67e8f9"; ctx.font = "700 34px Arial"; ctx.fillText("TREINO FINALIZADO", 76, mode === "card" ? 280 : 820);
    ctx.fillStyle = "#ffffff"; ctx.font = "800 70px Arial"; ctx.fillText((stats.name || "MEU TREINO").toUpperCase().slice(0, 24), 76, mode === "card" ? 390 : 930);
    statLines(stats).forEach((line, i) => { ctx.fillStyle = i === 2 ? "#c084fc" : "#e9d5ff"; ctx.font = "600 34px Arial"; ctx.fillText(line, 76, (mode === "card" ? 530 : 1040) + i * 66); });
    (stats.exercises || []).slice(0, 4).forEach((exercise, i) => { ctx.fillStyle = "rgba(255,255,255,.72)"; ctx.font = "400 25px Arial"; ctx.fillText(`${exercise.name}${exercise.maxLoad ? ` · ${exercise.maxLoad} kg` : ""}`, 76, (mode === "card" ? 790 : 1240) + i * 42); });
  }
  ctx.fillStyle = mode === "photo" ? "rgba(5,6,13,.72)" : "rgba(103,232,249,.85)"; ctx.fillRect(0, 0, 1080, 76);
  ctx.fillStyle = "#ffffff"; ctx.font = "800 32px Arial"; ctx.fillText("BZ GYM", 50, 50);
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .92));
}

export function downloadWorkoutImage(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a"); link.href = url; link.download = `treino-bz-${Date.now()}.jpg`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}