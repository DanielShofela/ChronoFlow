import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusToastProps {
  type: 'online' | 'offline';
}

export function ConnectionStatusToast({ type }: ConnectionStatusToastProps) {
  const isOnline = type === 'online';

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
        className={`flex items-center gap-3 p-4 rounded-lg text-white shadow-lg ${currentConfig.bgColor}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Icon className="w-6 h-6" />
        <div>
          <h4 className="font-bold">{currentConfig.title}</h4>
          <p className="text-sm">{currentConfig.message}</p>
        </div>
      </motion.div>
    </div>
  );
}
