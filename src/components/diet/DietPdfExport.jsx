import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DietPdfExport({ plan, studentName }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      let y = 18;
      const lineH = 6;
      const margin = 16;

      const checkPage = (need = 20) => {
        if (y + need > 275) { doc.addPage(); y = 18; }
      };

      // Header
      doc.setFillColor(15, 10, 35);
      doc.rect(0, 0, w, 42, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(168, 85, 247);
      doc.text('BZ GYM', margin, y);
      y += 8;
      doc.setFontSize(14);
      doc.setTextColor(240, 230, 255);
      doc.text(plan.name || 'Plano Alimentar', margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(160, 140, 200);
      const meta = [];
      if (studentName) meta.push(`Aluno: ${studentName}`);
      if (plan.goal) meta.push(`Objetivo: ${plan.goal.toUpperCase()}`);
      meta.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
      doc.text(meta.join('  |  '), margin, y);
      y += 12;

      // Macros summary
      doc.setFillColor(20, 15, 40);
      doc.roundedRect(margin, y, w - margin * 2, 18, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.text(`${plan.total_calories || 0} kcal`, margin + 8, y + 11);
      doc.setTextColor(239, 68, 68);
      doc.text(`${plan.protein_g || 0}g prot`, margin + 45, y + 11);
      doc.setTextColor(6, 182, 212);
      doc.text(`${plan.carbs_g || 0}g carb`, margin + 78, y + 11);
      doc.setTextColor(168, 85, 247);
      doc.text(`${plan.fat_g || 0}g gord`, margin + 112, y + 11);
      y += 26;

      // Meals
      (plan.meals || []).forEach((meal, i) => {
        checkPage(30);
        // Meal header
        doc.setFillColor(25, 20, 50);
        doc.roundedRect(margin, y, w - margin * 2, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(110, 231, 183);
        doc.text(`${i + 1}. ${meal.name || `Refeição ${i + 1}`}`, margin + 4, y + 7);
        if (meal.time) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(150, 130, 190);
          doc.text(meal.time, w - margin - 25, y + 7);
        }
        if (meal.calories) {
          doc.setTextColor(245, 158, 11);
          doc.text(`${meal.calories} kcal`, w - margin - 4, y + 7, { align: 'right' });
        }
        y += 14;

        // Foods — individual items or legacy text
        const foodItems = meal.items || [];
        if (foodItems.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          foodItems.forEach(item => {
            checkPage(7);
            doc.setTextColor(220, 210, 240);
            doc.text(`• ${item.food_name}`, margin + 6, y);
            doc.setTextColor(150, 130, 190);
            const macroStr = `${item.quantity_g}g  |  ${item.calories} kcal  |  P: ${item.protein_g}g  C: ${item.carbs_g}g  G: ${item.fat_g}g`;
            doc.text(macroStr, w - margin - 2, y, { align: 'right' });
            y += lineH;
          });
        } else if (meal.foods) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(190, 175, 215);
          const lines = doc.splitTextToSize(meal.foods, w - margin * 2 - 8);
          lines.forEach(line => {
            checkPage(8);
            doc.text(line, margin + 6, y);
            y += lineH;
          });
        }
        y += 4;
      });

      // Notes
      if (plan.notes) {
        checkPage(20);
        y += 6;
        doc.setFontSize(8);
        doc.setTextColor(140, 120, 175);
        doc.text('Observações: ' + plan.notes, margin, y, { maxWidth: w - margin * 2 });
        y += 10;
      }

      // Footer
      checkPage(10);
      doc.setFontSize(7);
      doc.setTextColor(100, 80, 140);
      doc.text('Gerado por BZ GYM · Este documento é um plano auxiliar, não substitui acompanhamento profissional.', w / 2, 287, { align: 'center' });

      doc.save(`${plan.name || 'dieta'}_${studentName || 'aluno'}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF: " + e.message);
    }
    setExporting(false);
  };

  return (
    <button onClick={handleExport} disabled={exporting}
      className="p-1.5 text-purple-400/40 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
      title="Exportar PDF">
      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
    </button>
  );
}