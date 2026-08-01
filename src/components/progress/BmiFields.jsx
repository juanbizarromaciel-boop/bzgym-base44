import React from "react";
import { Label } from "@/components/ui/label";

export const getBmiClass = (bmi) => bmi < 18.5 ? "Abaixo do peso" : bmi < 25 ? "Peso adequado" : bmi < 30 ? "Sobrepeso" : bmi < 35 ? "Obesidade grau I" : bmi < 40 ? "Obesidade grau II" : "Obesidade grau III";

export default function BmiFields({ weight, height, onHeightChange }) {
  const meters = Number(height) / 100;
  const bmi = Number(weight) > 0 && meters > 0 ? Number(weight) / (meters * meters) : 0;
  return <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3"><Label className="text-xs text-cyan-300">Altura (cm) *</Label><input type="number" min="1" step="0.1" value={height} onChange={e => onHeightChange(e.target.value)} className="cyber-input mt-1 w-full rounded-lg px-3 py-2 text-sm text-white" placeholder="Ex: 175" />{bmi > 0 && <div className="mt-3 flex items-center justify-between border-t border-cyan-500/10 pt-3"><span className="text-xs text-muted-foreground">IMC calculado</span><span className="font-semibold text-cyan-300">{bmi.toFixed(2)} · {getBmiClass(bmi)}</span></div>}</div>;
}