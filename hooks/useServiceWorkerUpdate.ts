import { useState, useEffect, useCallback } from 'react';

interface UpdateHookResult {
  updateAvailable: boolean;
  installUpdate: () => void;
}

const LOCAL_STORAGE_KEY = 'lastInstalledVersion';

export function useServiceWorkerUpdate(): UpdateHookResult {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Fonction pour gérer l'installation de la mise à jour
  const handleUpdate = useCallback(() => {
    if (registration?.waiting) {
      // Stocker la version qui va être installée
      if (process.env.NODE_ENV === 'production') {
        const version = sessionStorage.getItem('pendingVersion');
        if (version) {
          localStorage.setItem(LOCAL_STORAGE_KEY, version);
        }
      }
      // Déclencher la mise à jour
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // En développement, mise à jour automatique
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);
        reg.update().catch(console.error);
      });
      return;
    }

    // En production
    navigator.serviceWorker.ready.then(reg => {
      setRegistration(reg);
      
      // Vérification périodique des mises à jour
      const interval = setInterval(() => {
        reg.update().catch(console.error);
      }, 60 * 60 * 1000); // Toutes les heures

      return () => clearInterval(interval);
    });

    // Gérer le changement de contrôleur (nouvelle version activée)
    const handleControllerChange = () => {
      if (updateAvailable) {
        window.location.reload();
      }
    };

    // Gérer la détection d'une nouvelle version
    const handleNewVersion = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'UPDATE_AVAILABLE') {
        const newVersion = event.data.version;
        const lastVersion = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        // Montrer la notification uniquement si c'est une nouvelle version
        if (newVersion !== lastVersion) {
          sessionStorage.setItem('pendingVersion', newVersion);
          setUpdateAvailable(true);
        }
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleNewVersion);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleNewVersion);
    };
  }, [updateAvailable]);

  return { updateAvailable, installUpdate: handleUpdate };
}