import { loadSharePhoto } from "@/lib/workoutShareDrawing";
import { drawWorkoutTemplate } from "@/lib/workoutShareTemplates";

export async function createWorkoutShareImage(stats, template, photo) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  const image = template === "photo_stats" && photo ? await loadSharePhoto(photo) : null;
  drawWorkoutTemplate(ctx, template, stats, image);
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .94));
}

export function downloadWorkoutImage(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `treino-bz-${Date.now()}.jpg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}