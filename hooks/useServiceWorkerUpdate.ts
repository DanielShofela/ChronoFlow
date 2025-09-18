import { useState, useEffect } from 'react';

interface UpdateHookResult {
  updateAvailable: boolean;
  installUpdate: () => void;
}

export function useServiceWorkerUpdate(): UpdateHookResult {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      // Surveiller les mises à jour du service worker
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);
        
        // Vérifier les mises à jour toutes les heures
        const interval = setInterval(() => {
          reg.update().catch(console.error);
        }, 60 * 60 * 1000);

        // Nettoyer l'intervalle
        return () => clearInterval(interval);
      });

      // Écouter les événements de mise à jour
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Ne pas recharger si c'est la première activation
        if (updateAvailable) {
          window.location.reload();
        }
      });

      // Écouter la disponibilité des mises à jour
      window.addEventListener('sw-update-available', () => {
        setUpdateAvailable(true);
      });
    }
  }, [updateAvailable]);

  const installUpdate = () => {
    if (registration?.waiting) {
      // Envoyer un message au Service Worker en attente pour qu'il prenne le contrôle
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return { updateAvailable, installUpdate };
}