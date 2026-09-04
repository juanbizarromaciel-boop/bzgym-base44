import { drawBrandMark, drawCover, fitText, workoutMetrics } from "@/lib/workoutShareDrawing";

const WIDTH = 1080;
const HEIGHT = 1350;
const title = stats => (stats.name || "MEU TREINO").toUpperCase().slice(0, 28);

function drawBackdrop(ctx, photo, emphasis = "bottom") {
  if (photo) drawCover(ctx, photo, 0, 0, WIDTH, HEIGHT);
  else {
    const base = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    base.addColorStop(0, "#171426");
    base.addColorStop(0.5, "#090a10");
    base.addColorStop(1, "#020306");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  const shade = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  const stops = emphasis === "top"
    ? [[0, "rgba(0,0,0,.82)"], [.45, "rgba(0,0,0,.2)"], [1, "rgba(0,0,0,.5)"]]
    : emphasis === "center"
      ? [[0, "rgba(0,0,0,.48)"], [.35, "rgba(0,0,0,.3)"], [.72, "rgba(0,0,0,.34)"], [1, "rgba(0,0,0,.58)"]]
      : [[0, "rgba(0,0,0,.42)"], [.48, "rgba(0,0,0,.12)"], [1, "rgba(0,0,0,.88)"]];
  stops.forEach(([stop, color]) => shade.addColorStop(stop, color));
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawHeading(ctx, stats, x, y, align = "left") {
  ctx.textAlign = align;
  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.font = "700 22px Arial";
  ctx.fillText("TREINO CONCLUÍDO", x, y);
  ctx.fillStyle = "#ffffff";
  fitText(ctx, title(stats), 900, 66);
  ctx.fillText(title(stats), x, y + 78);
  ctx.textAlign = "left";
}

function drawMetric(ctx, metric, x, y, align = "left") {
  ctx.textAlign = align;
  ctx.fillStyle = "rgba(255,255,255,.66)";
  ctx.font = "700 19px Arial";
  ctx.fillText(metric.label, x, y);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 47px Arial";
  ctx.fillText(metric.value, x, y + 58);
  ctx.textAlign = "left";
}

function topStats(ctx, stats, photo) {
  drawBackdrop(ctx, photo, "top");
  drawBrandMark(ctx, 58, 48);
  drawHeading(ctx, stats, 58, 238);
  workoutMetrics(stats).forEach((metric, index) => drawMetric(ctx, metric, 58 + index * 338, 402));
}

function centerStats(ctx, stats, photo) {
  drawBackdrop(ctx, photo, "center");
  drawBrandMark(ctx, 58, 48);
  drawHeading(ctx, stats, 540, 480, "center");
  workoutMetrics(stats).forEach((metric, index) => drawMetric(ctx, metric, 540, 665 + index * 128, "center"));
}

function bottomStats(ctx, stats, photo) {
  drawBackdrop(ctx, photo, "bottom");
  drawBrandMark(ctx, 58, 48);
  drawHeading(ctx, stats, 58, 1010);
  workoutMetrics(stats).forEach((metric, index) => drawMetric(ctx, metric, 58 + index * 338, 1180));
}

function sideStats(ctx, stats, photo) {
  drawBackdrop(ctx, photo, "center");
  const side = ctx.createLinearGradient(0, 0, 650, 0);
  side.addColorStop(0, "rgba(0,0,0,.86)");
  side.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, 720, HEIGHT);
  drawBrandMark(ctx, 58, 48);
  drawHeading(ctx, stats, 58, 380);
  workoutMetrics(stats).forEach((metric, index) => drawMetric(ctx, metric, 58, 575 + index * 170));
}

export function drawWorkoutTemplate(ctx, template, stats, photo) {
  if (template === "photo_stats") return topStats(ctx, stats, photo);
  if (template === "neon_pulse") return centerStats(ctx, stats, photo);
  if (template === "editorial") return bottomStats(ctx, stats, photo);
  return sideStats(ctx, stats, photo);
}