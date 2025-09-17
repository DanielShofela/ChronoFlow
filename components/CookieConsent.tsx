import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface CookieConsentProps {
  onShowPrivacyPolicy: () => void;
}

export function CookieConsent({ onShowPrivacyPolicy }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [cookieConsent, setCookieConsent] = useLocalStorage<boolean | null>('cookieConsent', null);

  useEffect(() => {
    // La bannière s'affiche si le consentement n'a pas encore été donné
    if (cookieConsent === null) {
      setIsVisible(true);
    }
  }, [cookieConsent]);

  const handleAccept = () => {
    setCookieConsent(true);
    setIsVisible(false);
    // Update Google consent
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).updateConsent({
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
      });
    }
  };

  const handleDecline = () => {
    setCookieConsent(false);
    setIsVisible(false);
    // Keep consent denied
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).updateConsent({
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="sticky bottom-14 left-0 right-0 z-50 bg-card border-t shadow-lg md:bottom-0"
        >
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-sm text-foreground">
              <p>
                Nous utilisons des cookies pour améliorer votre expérience.
                En continuant à utiliser notre application, vous acceptez notre utilisation des cookies.{' '}
                <button
                  onClick={onShowPrivacyPolicy}
                  className="text-primary hover:underline focus:outline-none"
                >
                  Politique de confidentialité
                </button>
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
              >
                Accepter
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
