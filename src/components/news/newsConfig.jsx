export const NEWS_CATEGORIES = [
  { value: "todos", label: "Todos" },
  { value: "musculacao", label: "Musculação" },
  { value: "fitness", label: "Fitness" },
  { value: "futebol", label: "Futebol" },
  { value: "lutas", label: "Lutas" },
  { value: "corrida", label: "Corrida" },
  { value: "fisiculturismo", label: "Fisiculturismo" },
  { value: "nutricao_esportiva", label: "Nutrição esportiva" },
  { value: "saude_performance", label: "Saúde e performance" },
  { value: "eventos_esportivos", label: "Eventos esportivos" },
];

export const categoryLabel = (value) => NEWS_CATEGORIES.find(c => c.value === value)?.label || "Esporte";

export const categoryColor = (category) => ({
  musculacao: "#a855f7",
  fitness: "#10b981",
  futebol: "#22c55e",
  lutas: "#ef4444",
  corrida: "#06b6d4",
  fisiculturismo: "#f59e0b",
  nutricao_esportiva: "#84cc16",
  saude_performance: "#14b8a6",
  eventos_esportivos: "#ec4899",
}[category] || "#a855f7");

export const formatNewsDate = (dateStr) => {
  if (!dateStr) return "Data não informada";
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};