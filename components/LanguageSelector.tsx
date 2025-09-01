import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

interface LanguageSelectorProps {
  onComplete: () => void;
}

export function LanguageSelector({ onComplete }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const handleSelectLanguage = (selectedLanguage: 'fr' | 'en') => {
    setLanguage(selectedLanguage);
    onComplete();
    // Pas besoin de recharger la page ici car c'est la première sélection
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-card border shadow-sm rounded-xl p-6 w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Choisissez votre langue / Choose your language</h2>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleSelectLanguage('fr')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${language === 'fr' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'}`}
            >
              <div className="text-center">
                <span className="text-2xl mb-2 block">🇫🇷</span>
                <h3 className="font-medium">Français</h3>
              </div>
            </button>
            <button
              onClick={() => handleSelectLanguage('en')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${language === 'en' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'}`}
            >
              <div className="text-center">
                <span className="text-2xl mb-2 block">🇬🇧</span>
                <h3 className="font-medium">English</h3>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}