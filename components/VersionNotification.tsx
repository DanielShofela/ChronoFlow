import React, { useEffect, useState } from 'react';

export const VersionNotification = () => {
  const [isLatestVersion, setIsLatestVersion] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Vérifie si le service worker est en attente d'activation
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('controllerchange', () => {
          // Un nouveau service worker a pris le contrôle
          setIsLatestVersion(true);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000); // Cache la notification après 5 secondes
        });
      });
    }
  }, []);

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      {isLatestVersion ? (
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Application à jour!</span>
        </div>
      ) : null}
    </div>
  );
};
