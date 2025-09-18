import { useState, useEffect, useCallback, useRef } from 'react';

interface ConnectionHookResult {
  isOnline: boolean;
  showToast: boolean;
  status: 'online' | 'offline' | null;
}

export function useConnectionStatus(): ConnectionHookResult {
  // En mode développement, on considère toujours que l'app est en ligne
  const isDev = process.env.NODE_ENV === 'development';
  const [isOnline, setIsOnline] = useState(isDev ? true : navigator.onLine);
  const [showToast, setShowToast] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | null>(null);
  const isFirstMount = useRef(true);
  const toastTimer = useRef<number | null>(null);

  // Fonction utilitaire pour gérer le timer du toast
  const clearToastTimer = useCallback(() => {
    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
  }, []);

  // Fonction pour afficher le toast
  const showNotification = useCallback((newStatus: 'online' | 'offline') => {
    clearToastTimer();
    setStatus(newStatus);
    setShowToast(true);
    toastTimer.current = window.setTimeout(() => {
      setShowToast(false);
    }, 3000);
  }, [clearToastTimer]);

  const handleOnline = useCallback(() => {
    if (isDev) return;

    setIsOnline(true);
    // Ne pas afficher de notification au premier chargement ou si on était déjà en ligne
    if (!isFirstMount.current && !isOnline) {
      showNotification('online');
    }
  }, [isDev, isOnline, showNotification]);

  const handleOffline = useCallback(() => {
    if (isDev) return;

    setIsOnline(false);
    // Toujours montrer la notification de perte de connexion (sauf au premier chargement)
    if (!isFirstMount.current) {
      showNotification('offline');
    }
  }, [isDev, showNotification]);

  useEffect(() => {
    // En développement, on ne fait rien
    if (isDev) return;

    // Ne pas montrer de notification au premier montage
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearToastTimer();
    };
  }, [handleOnline, handleOffline, clearToastTimer, isDev]);

  return { isOnline, showToast, status };
}