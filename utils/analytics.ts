// Déclaration pour TypeScript
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}

// Événements personnalisés pour l'application
export const AnalyticsEvents = {
  VIEW_CHANGE: 'view_change',
  ACTIVITY_CREATE: 'activity_create',
  ACTIVITY_UPDATE: 'activity_update',
  ACTIVITY_ARCHIVE: 'activity_archive',
  SLOT_COMPLETE: 'slot_complete',
  SLOT_UNCOMPLETE: 'slot_uncomplete',
  THEME_TOGGLE: 'theme_toggle',
  PIP_TOGGLE: 'pip_toggle',
  PWA_INSTALL: 'pwa_install',
  DAILY_VERSE_TOGGLE: 'daily_verse_toggle',
  NOTIFICATION_PERMISSION: 'notification_permission',
  ONBOARDING_COMPLETE: 'onboarding_complete'
} as const;

// Fonction utilitaire pour envoyer des événements à GA
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Fonction pour suivre les changements de page/vue
export const trackPageView = (viewId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-VGB5GGBJND', {
      page_path: `/${viewId}`,
    });
  }
};