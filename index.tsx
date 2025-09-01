
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Configuration de la vérification périodique des mises à jour du service worker
const intervalMS = 60 * 60 * 1000; // Vérifier toutes les heures

const updateSW = registerSW({
  onRegisteredSW(swUrl, r) {
    r && setInterval(async () => {
      if (r.installing || !navigator) return;

      // Vérifier si l'utilisateur est en ligne
      if (('connection' in navigator) && !navigator.onLine) return;

      // Vérifier les mises à jour du service worker
      try {
        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: {
            'cache': 'no-store',
            'cache-control': 'no-cache',
          },
        });

        if (resp?.status === 200) {
          // Si une mise à jour est disponible, stocker cette information dans localStorage
          // pour l'afficher même lorsque l'utilisateur est hors ligne et après redémarrage
          localStorage.setItem('swUpdate', 'true');
          sessionStorage.setItem('swUpdate', 'true');
          await r.update();
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
      }
    }, intervalMS);
  }
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);