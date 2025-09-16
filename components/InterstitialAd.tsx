import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GoogleAd } from './GoogleAd';

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  slot: string;
}

export function InterstitialAd({ isOpen, onClose, slot }: InterstitialAdProps) {
  const [canClose, setCanClose] = useState(false);

  // Permettre la fermeture après 5 secondes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setCanClose(true);
      }, 5000);

      return () => {
        clearTimeout(timer);
        setCanClose(false);
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg bg-card rounded-xl shadow-xl border p-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {canClose && (
              <button
                onClick={onClose}
                className="absolute top-2 right-2 p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Fermer la publicité"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <div className="pt-4">
              <GoogleAd
                slot={slot}
                format="rectangle"
                style={{ display: 'block', textAlign: 'center', marginInline: 'auto' }}
              />
            </div>
            
            {canClose && (
              <div className="mt-4 text-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fermer la publicité
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}