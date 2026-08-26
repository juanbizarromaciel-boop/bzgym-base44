const ROLE_ALIASES = {
  admin: "admin",
  administrador: "admin",
  administrator: "admin",
  personal: "personal",
  personal_trainer: "personal",
  professor: "personal",
  trainer: "personal",
  user: "user",
  aluno: "user",
  student: "user",
  assinante: "assinante",
  subscriber: "assinante",
  recente: "recente",
  bloqueado: "bloqueado",
};

export function normalizeRole(role) {
  const key = String(role || "user")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  return ROLE_ALIASES[key] || "user";
}

export function getEffectiveRole(profile) {
  return normalizeRole(profile?.role);
}