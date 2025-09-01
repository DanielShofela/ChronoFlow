import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function OfflineToast() {
  return (
    <div className="fixed bottom-4 left-4 z-[200]">
      <motion.div
        className="flex items-center gap-3 p-4 rounded-lg bg-amber-500 text-white shadow-lg"
        {...{
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9 },
        }}
      >
        <WifiOff className="w-6 h-6" />
        <div>
          <h4 className="font-bold">Mode hors ligne activé</h4>
          <p className="text-sm">L'application reste entièrement fonctionnelle.</p>
        </div>
      </motion.div>
    </div>
  );
}