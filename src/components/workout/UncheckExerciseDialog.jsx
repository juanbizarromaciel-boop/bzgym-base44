import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, RotateCcw } from "lucide-react";

export default function UncheckExerciseDialog({ open, exerciseName, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          className="relative w-full max-w-sm rounded-2xl border overflow-hidden z-10"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'linear-gradient(145deg, #0a0a1e, #05050d)',
            borderColor: 'rgba(251,191,36,0.45)',
            boxShadow: '0 0 60px rgba(251,191,36,0.2), 0 0 120px rgba(251,191,36,0.08), inset 0 0 30px rgba(251,191,36,0.05)'
          }}>
          {/* Top scanline */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.9), transparent)' }} />
          {/* Corner */}
          <div className="absolute top-0 left-0 w-3 h-3"
            style={{ borderTop: '2px solid rgba(251,191,36,0.8)', borderLeft: '2px solid rgba(251,191,36,0.8)' }} />
          <div className="absolute bottom-0 right-0 w-3 h-3"
            style={{ borderBottom: '2px solid rgba(251,191,36,0.5)', borderRight: '2px solid rgba(251,191,36,0.5)' }} />

          <div className="p-7 text-center">
            {/* Icon */}
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'radial-gradient(circle, rgba(251,191,36,0.18), rgba(251,191,36,0.05))',
                border: '1.5px solid rgba(251,191,36,0.45)',
                boxShadow: '0 0 30px rgba(251,191,36,0.3)'
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>
              <AlertTriangle className="w-8 h-8" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.9))' }} />
            </motion.div>

            {/* Title */}
            <p className="text-[10px] font-mono-cyber tracking-[0.35em] uppercase mb-2"
              style={{ color: 'rgba(251,191,36,0.6)', textShadow: '0 0 8px rgba(251,191,36,0.5)' }}>
              ⚠ Confirmar Desmarcação
            </p>
            <h3 className="font-cyber text-xl text-white tracking-wider mb-3"
              style={{ textShadow: '0 0 15px rgba(251,191,36,0.4)' }}>
              Desmarcar Exercício?
            </h3>

            {/* Exercise name */}
            <div className="mb-5 px-4 py-3 rounded-xl border"
              style={{
                borderColor: 'rgba(251,191,36,0.3)',
                background: 'rgba(251,191,36,0.08)',
              }}>
              <p className="text-sm font-bold text-white truncate">{exerciseName}</p>
              <p className="text-[10px] font-mono-cyber mt-1" style={{ color: 'rgba(251,191,36,0.6)' }}>
                O log registrado será mantido, mas o exercício voltará ao estado pendente.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={onCancel}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold tracking-widest transition-all border"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  borderColor: 'rgba(168,85,247,0.4)',
                  background: 'rgba(168,85,247,0.1)',
                  color: 'rgba(168,85,247,0.9)'
                }}>
                <X className="w-4 h-4" />
                Cancelar
              </motion.button>
              <motion.button
                onClick={onConfirm}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold tracking-widest transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.15))',
                  border: '1px solid rgba(251,191,36,0.6)',
                  color: '#fbbf24',
                  boxShadow: '0 0 20px rgba(251,191,36,0.3)'
                }}>
                <RotateCcw className="w-4 h-4" />
                Desmarcar
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}