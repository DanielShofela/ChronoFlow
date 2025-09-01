import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Wifi, X, RefreshCw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface OfflineToastProps {
  isOffline: boolean;
  hasUpdate: boolean;
  onClose: () => void;
}

export function OfflineToast({ isOffline, hasUpdate, onClose }: OfflineToastProps) {
  const { t } = useLanguage();
  return (
    <div className="fixed bottom-4 left-4 z-[200]">
      <motion.div
        className={`flex items-center gap-3 p-4 rounded-lg shadow-lg ${isOffline ? 'bg-amber-500' : 'bg-green-500'} text-white`}
        {...{
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9 },
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          {isOffline ? <WifiOff className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
          <div>
            <h4 className="font-bold">{isOffline ? t.offlineMode : t.onlineMode}</h4>
            <p className="text-sm">
              {isOffline ? t.offlineDescription : t.onlineDescription}
              {isOffline && hasUpdate && (
                <span className="block mt-1 flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" />
                  {t.updateAvailableOffline}
                </span>
              )}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0" 
          aria-label={t.close}
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}