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
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="bg-card text-card-foreground rounded-lg p-4 mb-3 shadow-lg max-w-xs"
        >
          <p className="text-sm font-medium">
            {t.installDescription || "📱 Installez ChronoFlow pour un accès rapide et une meilleure expérience ! Travaillez même hors connexion."}
          </p>
        </motion.div>
        <motion.button
          onClick={handleInstallClick}
          className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90"
          aria-label="Installer l'application"
          title="Installer ChronoFlow sur votre appareil"
          initial={{ scale: 1 }}
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 4px 6px rgba(0, 0, 0, 0.1)",
              "0 10px 15px rgba(59, 130, 246, 0.3)",
              "0 4px 6px rgba(0, 0, 0, 0.1)"
            ]
          }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 2
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-sm sm:text-base font-medium">
            {installPromptEvent ? t.install || 'Installer' : t.install || 'Installer'}
          </span>
        </motion.button>
      </div>
    </AnimatePresence>
  );
}
