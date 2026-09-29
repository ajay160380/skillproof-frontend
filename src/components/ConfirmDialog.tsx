import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    button: 'bg-seal hover:bg-seal/90',
    icon: '⚠️',
  },
  warning: {
    button: 'bg-amber-500 hover:bg-amber-600',
    icon: '⚡',
  },
  info: {
    button: 'bg-brand-primary hover:bg-brand-primary/90',
    icon: 'ℹ️',
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onCancel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            <div className="text-2xl mb-2">{styles.icon}</div>
            <h3 className="font-serif text-xl text-white mb-2">{title}</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-6">{message}</p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-mono uppercase tracking-wider text-white rounded-lg transition-all ${styles.button} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
