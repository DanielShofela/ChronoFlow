import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <motion.button
      onClick={toggleLanguage}
      className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
      aria-label={`Switch to ${language === 'fr' ? 'English' : 'French'}`}
      {...{ whileTap: { scale: 0.95 } }}
    >
      <span className="font-semibold text-sm">
        {language === 'fr' ? 'EN' : 'FR'}
      </span>
    </motion.button>
  );
}