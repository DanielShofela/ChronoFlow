import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

interface InstallPromptProps {
  onInstall: () => void;
}

export function InstallPrompt({ onInstall }: InstallPromptProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <motion.button
        onClick={onInstall}
        className="flex items-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
        title="Installer l'application"
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Download className="w-5 h-5" />
        <span className="font-semibold text-base">Installer</span>
      </motion.button>
    </div>
  );
}