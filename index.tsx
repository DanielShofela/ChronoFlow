
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Configuration de la vérification périodique des mises à jour du service worker
const intervalMS = 60 * 1000; // Vérifier toutes les minutes pour le développement, à ajuster en production

const updateSW = registerSW({
  // Activer les mises à jour immédiates
  immediate: true,
  // Callback lorsqu'une mise à jour est disponible
  onNeedRefresh() {
    console.log('Une mise à jour est disponible!');
    // Stocker l'information de mise à jour disponible
    localStorage.setItem('swUpdate', 'true');
    sessionStorage.setItem('swUpdate', 'true');
    // Déclencher un événement personnalisé pour informer l'application
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  },
  // Callback lorsque le service worker est prêt pour le mode hors ligne
  onOfflineReady() {
    console.log('L\'application est prête pour le mode hors ligne');
  },
  // Callback lorsque le service worker est enregistré
  onRegisteredSW(swUrl, r) {
    console.log('Service Worker enregistré à:', swUrl);
    // Vérification périodique des mises à jour
    r && setInterval(async () => {
      if (r.installing || !navigator) return;

      // Vérifier si l'utilisateur est en ligne
      if (('connection' in navigator) && !navigator.onLine) return;

      // Vérifier les mises à jour du service worker
      try {
        console.log('Vérification des mises à jour...');
        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: {
            'cache': 'no-store',
            'cache-control': 'no-cache',
          },
        });

        if (resp?.status === 200) {
          console.log('Mise à jour potentielle détectée, vérification...');
          // Forcer la mise à jour du service worker
          const updateResult = await r.update();
          console.log('Résultat de la mise à jour:', updateResult);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
      }
    }, intervalMS);
  },
  // Callback en cas d'erreur d'enregistrement
  onRegisterError(error) {
    console.error('Erreur lors de l\'enregistrement du service worker:', error);
  }
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);