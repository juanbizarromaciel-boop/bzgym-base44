import { drawBrandMark, drawCover, fitText, roundedRect, workoutMetrics } from "@/lib/workoutShareDrawing";

const title = stats => (stats.name || "MEU TREINO").toUpperCase().slice(0, 28);
const fillBackground = (ctx, colors) => {
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  colors.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1350);
};
const drawMetricCards = (ctx, stats, y, theme = "violet") => {
  workoutMetrics(stats).forEach((metric, index) => {
    const x = 62 + index * 326;
    const accent = theme === "cyan" ? "#22d3ee" : index === 1 ? "#22d3ee" : "#c084fc";
    roundedRect(ctx, x, y, 302, 154, 26, "rgba(255,255,255,.055)", `${accent}55`);
    ctx.fillStyle = "rgba(255,255,255,.52)"; ctx.font = "700 20px Arial"; ctx.fillText(metric.label, x + 24, y + 43);
    ctx.fillStyle = accent; ctx.font = "800 36px Arial"; ctx.fillText(metric.value, x + 24, y + 103);
  });
};
const drawExercises = (ctx, stats, x, y, color = "rgba(255,255,255,.66)") => {
  (stats.exercises || []).slice(0, 4).forEach((exercise, index) => {
    ctx.fillStyle = color; ctx.font = "500 24px Arial";
    ctx.fillText(`${String(index + 1).padStart(2, "0")}  ${exercise.name}${exercise.maxLoad ? `  ·  ${exercise.maxLoad} kg` : ""}`.slice(0, 48), x, y + index * 45);
  });
};

function photoStats(ctx, stats, photo) {
  fillBackground(ctx, [[0, "#080711"], [1, "#15102a"]]);
  drawCover(ctx, photo, 0, 0, 1080, 790);
  const shade = ctx.createLinearGradient(0, 210, 0, 850);
  shade.addColorStop(0, "rgba(5,6,13,.04)"); shade.addColorStop(.72, "rgba(5,6,13,.46)"); shade.addColorStop(1, "#080711");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, 1080, 880);
  drawBrandMark(ctx, 62, 54);
  roundedRect(ctx, 62, 686, 310, 54, 27, "rgba(8,7,17,.66)", "rgba(34,211,238,.46)");
  ctx.fillStyle = "#67e8f9"; ctx.font = "700 21px Arial"; ctx.fillText("TREINO FINALIZADO", 88, 721);
  ctx.fillStyle = "#ffffff"; fitText(ctx, title(stats), 950, 68); ctx.fillText(title(stats), 62, 855);
  drawMetricCards(ctx, stats, 925);
  ctx.fillStyle = "rgba(255,255,255,.34)"; ctx.font = "500 21px Arial"; ctx.fillText("CONSISTÊNCIA CONSTRÓI RESULTADOS", 62, 1280);
}

function neonPulse(ctx, stats) {
  fillBackground(ctx, [[0, "#05060d"], [.5, "#201044"], [1, "#052b34"]]);
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) { ctx.strokeStyle = `rgba(${80 + i * 20},85,247,${.18 - i * .018})`; ctx.beginPath(); ctx.arc(820, 300, 120 + i * 48, 0, Math.PI * 2); ctx.stroke(); }
  drawBrandMark(ctx, 62, 54);
  ctx.fillStyle = "#67e8f9"; ctx.font = "700 23px Arial"; ctx.fillText("PERFORMANCE / 01", 64, 260);
  ctx.fillStyle = "#ffffff"; fitText(ctx, title(stats), 930, 92); ctx.fillText(title(stats), 62, 390);
  ctx.fillStyle = "rgba(192,132,252,.12)"; ctx.font = "900 330px Arial"; ctx.fillText(String(stats.exercises?.length || 0), 620, 700);
  drawMetricCards(ctx, stats, 700, "cyan");
  drawExercises(ctx, stats, 66, 970);
  ctx.fillStyle = "#c084fc"; ctx.fillRect(62, 1245, 956, 4);
  ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.font = "600 20px Arial"; ctx.fillText("MAIS FORTE A CADA SESSÃO", 62, 1290);
}

function editorial(ctx, stats) {
  fillBackground(ctx, [[0, "#07080c"], [1, "#11131b"]]);
  ctx.fillStyle = "#22d3ee"; ctx.fillRect(0, 0, 22, 1350);
  drawBrandMark(ctx, 68, 58);
  ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.font = "700 22px Arial"; ctx.fillText("WORKOUT RECORD  /  BZ 001", 68, 270);
  ctx.fillStyle = "#ffffff"; fitText(ctx, title(stats), 890, 108); ctx.fillText(title(stats), 68, 430);
  const volume = Math.round(stats.volumeKg || 0).toLocaleString("pt-BR");
  ctx.fillStyle = "#c084fc"; ctx.font = "900 180px Arial"; ctx.fillText(volume, 62, 685);
  ctx.fillStyle = "rgba(255,255,255,.52)"; ctx.font = "700 28px Arial"; ctx.fillText("KG DE VOLUME TOTAL", 72, 740);
  ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.beginPath(); ctx.moveTo(68, 800); ctx.lineTo(1018, 800); ctx.stroke();
  drawExercises(ctx, stats, 70, 880, "rgba(255,255,255,.78)");
  const metrics = workoutMetrics(stats);
  ctx.fillStyle = "#67e8f9"; ctx.font = "800 34px Arial"; ctx.fillText(`${metrics[0].value} EXERCÍCIOS  ·  ${metrics[1].value}`, 68, 1245);
}

function violetGlass(ctx, stats) {
  fillBackground(ctx, [[0, "#090716"], [.52, "#29154c"], [1, "#071d27"]]);
  const glow = ctx.createRadialGradient(820, 260, 0, 820, 260, 520);
  glow.addColorStop(0, "rgba(168,85,247,.48)"); glow.addColorStop(1, "rgba(168,85,247,0)"); ctx.fillStyle = glow; ctx.fillRect(300, 0, 780, 800);
  drawBrandMark(ctx, 62, 54);
  roundedRect(ctx, 54, 230, 972, 1000, 52, "rgba(255,255,255,.055)", "rgba(255,255,255,.16)");
  ctx.fillStyle = "#67e8f9"; ctx.font = "700 22px Arial"; ctx.fillText("SESSÃO CONCLUÍDA", 104, 330);
  ctx.fillStyle = "#ffffff"; fitText(ctx, title(stats), 850, 78); ctx.fillText(title(stats), 104, 450);
  drawMetricCards(ctx, stats, 540);
  roundedRect(ctx, 100, 770, 880, 340, 34, "rgba(3,6,18,.34)", "rgba(103,232,249,.2)");
  ctx.fillStyle = "rgba(255,255,255,.38)"; ctx.font = "700 19px Arial"; ctx.fillText("RESUMO DO TREINO", 138, 832);
  drawExercises(ctx, stats, 138, 895, "rgba(255,255,255,.74)");
  ctx.fillStyle = "#c084fc"; ctx.font = "700 22px Arial"; ctx.fillText("FEITO É MELHOR QUE PERFEITO.", 104, 1170);
}

export function drawWorkoutTemplate(ctx, template, stats, photo) {
  if (template === "photo_stats") return photoStats(ctx, stats, photo);
  if (template === "neon_pulse") return neonPulse(ctx, stats);
  if (template === "editorial") return editorial(ctx, stats);
  return violetGlass(ctx, stats);
}