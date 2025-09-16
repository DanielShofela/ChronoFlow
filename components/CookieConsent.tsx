import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const handleAccept = () => {
    trackEvent('cookie_consent', { action: 'accept' });
    onAccept();
  };

  const handleDecline = () => {
    trackEvent('cookie_consent', { action: 'decline' });
    onDecline();
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
    >
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm">
          <p>
            Nous utilisons des cookies et des outils d'analyse pour améliorer votre expérience. 
            En continuant à utiliser ChronoFlow, vous acceptez notre{' '}
            <button 
              onClick={() => {
                const customEvent = new CustomEvent('navigate', { detail: { view: 'privacy' } });
                window.dispatchEvent(customEvent);
              }}
              className="text-primary hover:underline inline-block"
            >
              politique de confidentialité
            </button>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Accepter
          </button>
        </div>
      </div>
    </motion.div>
  );
}