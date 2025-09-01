import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Language, translations } from '../translations';

export function useLanguage() {
  const [language, setLanguage] = useLocalStorage<Language>('language', 'fr');
  const [t, setT] = useState(translations[language]);

  useEffect(() => {
    setT(translations[language]);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
    // Recharger la page pour appliquer la traduction à tous les textes
    window.location.reload();
  };

  return { language, setLanguage, toggleLanguage, t };
}