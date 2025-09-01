import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

interface LanguageSelectorProps {
  onComplete: () => void;
}

export function LanguageSelector({ onComplete }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const handleLanguageSelect = (selectedLanguage: 'fr' | 'en') => {
    setLanguage(selectedLanguage);
    onComplete();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <motion.div 
        className="bg-card p-6 rounded-xl border shadow-lg max-w-md w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Choisissez votre langue / Choose your language</h2>
        <p className="text-muted-foreground mb-6 text-center">Cette sélection déterminera la langue de l'application et du tutoriel.<br />This selection will determine the language of the application and tutorial.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleLanguageSelect('fr')}
            className={`p-4 rounded-lg border-2 transition-all ${language === 'fr' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">🇫🇷</span>
              <span className="font-medium">Français</span>
            </div>
          </button>
          
          <button
            onClick={() => handleLanguageSelect('en')}
            className={`p-4 rounded-lg border-2 transition-all ${language === 'en' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">🇬🇧</span>
              <span className="font-medium">English</span>
            </div>
          </button>
        </div>
        
        <div className="mt-6 flex justify-center">
          <motion.button
            onClick={onComplete}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {language === 'fr' ? 'Continuer' : 'Continue'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}