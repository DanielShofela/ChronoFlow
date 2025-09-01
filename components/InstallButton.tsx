import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton() {
  const { t } = useLanguage();
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
      
      if (document.referrer.includes('android-app://')) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      console.log('App installed');
      setInstallPromptEvent(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Bouton d\'installation cliqué');
    console.log('installPromptEvent disponible:', !!installPromptEvent);
    
    if (installPromptEvent) {
      try {
        console.log('Déclenchement du prompt d\'installation...');
        await installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        console.log(`Résultat de l'installation: ${outcome}`);
        
        if (outcome === 'accepted') {
          setIsInstalled(true);
          console.log('Installation acceptée');
        } else {
          console.log('Installation refusée');
        }
        setInstallPromptEvent(null);
      } catch (error) {
        console.error('Erreur lors de l\'installation:', error);
      }
    } else {
      console.log('Tentative d\'installation directe...');
      // Essayer de déclencher l'installation même sans prompt event
      try {
        // Vérifier si on peut déclencher l'installation via d'autres méthodes
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          console.log('Service Worker disponible, tentative d\'installation...');
          // L'installation se fera automatiquement si les conditions sont remplies
        }
      } catch (error) {
        console.error('Impossible de déclencher l\'installation:', error);
      }
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          aria-label="Installer l'application"
          title="Installer ChronoFlow sur votre appareil"
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">
            {installPromptEvent ? 'Installer' : 'Installer l\'app'}
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
