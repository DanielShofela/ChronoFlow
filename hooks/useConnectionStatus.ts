import { useState, useEffect, useCallback } from 'react';

interface ConnectionHookResult {
  isOnline: boolean;
  showToast: boolean;
}

export function useConnectionStatus(): ConnectionHookResult {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showToast, setShowToast] = useState(false);

  const handleOnline = useCallback(() => {
    if (!isOnline) { // Ne montrer le toast que si on était hors ligne avant
      setShowToast(true);
      setIsOnline(true);
      // Cacher le toast après 3 secondes
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setIsOnline(true);
    }
  }, [isOnline]);

  const handleOffline = useCallback(() => {
    if (isOnline) { // Ne montrer le toast que si on était en ligne avant
      setShowToast(true);
      setIsOnline(false);
      // Cacher le toast après 3 secondes
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setIsOnline(false);
    }
  }, [isOnline]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, showToast };
}