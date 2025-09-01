import React from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface UpdateToastProps {
  onClose: () => void;
  onReload?: () => void;
}

export function UpdateToast({ onClose, onReload }: UpdateToastProps) {
  const { t } = useLanguage();
  
  return (
    <div className="fixed bottom-4 right-4 z-[200]">
      <motion.div
        className="flex items-center justify-between gap-4 pl-3 pr-2 py-2 rounded-lg bg-stone-800 text-stone-200 shadow-lg"
        {...{
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9 },
        }}
      >
        <div className="flex items-center gap-3">
          <img src="/icon-192x192.png" alt="ChronoFlow icon" className="w-6 h-6 rounded-md" />
          <span className="font-semibold text-sm">{t.updateAvailable}</span>
        </div>
        <div className="flex items-center gap-1">
          {onReload && (
            <button 
              onClick={onReload} 
              className="p-1 rounded-full hover:bg-stone-700 transition-colors flex-shrink-0 text-green-400" 
              aria-label={t.reload}
              title={t.reload}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-stone-700 transition-colors flex-shrink-0" 
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}