import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusToastProps {
  status: 'online' | 'offline' | null;
  show: boolean;
  onClose: () => void;
}

export function ConnectionStatusToast({ status, show, onClose }: ConnectionStatusToastProps) {
  if (!status || !show) return null;
  
  const isOnline = status === 'online';

  const config = {
    online: {
      icon: Wifi,
      title: 'Connexion rétablie',
      message: 'Vous êtes de nouveau en ligne.',
      bgColor: 'bg-emerald-500',
    },
    offline: {
      icon: WifiOff,
      title: 'Mode hors ligne activé',
      message: "L'application reste entièrement fonctionnelle.",
      bgColor: 'bg-amber-500',
    },
  };

  const currentConfig = isOnline ? config.online : config.offline;
  const Icon = currentConfig.icon;

  return (
    <div className="fixed bottom-4 left-4 z-[200]">
      <motion.div
        role="alert"
        className={`flex items-center justify-between gap-3 p-4 rounded-lg text-white shadow-lg ${currentConfig.bgColor}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6" />
          <div>
            <h4 className="font-bold">{currentConfig.title}</h4>
            <p className="text-sm">{currentConfig.message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/10 rounded-full transition-colors"
          aria-label="Fermer la notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}
