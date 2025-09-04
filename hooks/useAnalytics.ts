import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'set',
      action: string,
      params?: any
    ) => void;
  }
}

export const useAnalytics = () => {
  const trackEvent = (category: string, action: string, label?: string) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
      });
    }
  };

  const trackActivities = (activities: any[]) => {
    trackEvent('Activities', 'ActivityCount', `Total: ${activities.length}`);
  };

  const trackCompletion = (activityName: string) => {
    trackEvent('Completion', 'ActivityCompleted', activityName);
  };

  const trackThemeChange = (theme: string) => {
    trackEvent('Settings', 'ThemeChanged', theme);
  };

  const trackLanguageChange = (language: string) => {
    trackEvent('Settings', 'LanguageChanged', language);
  };

  const trackTimeSpent = (activityName: string, minutes: number) => {
    trackEvent('Usage', 'TimeSpent', `${activityName}: ${minutes}min`);
  };

  const trackDailyVisit = () => {
    trackEvent('Usage', 'DailyVisit', new Date().toISOString().split('T')[0]);
  };

  useEffect(() => {
    // Track initial visit
    trackDailyVisit();
  }, []);

  return {
    trackEvent,
    trackActivities,
    trackCompletion,
    trackThemeChange,
    trackLanguageChange,
    trackTimeSpent,
    trackDailyVisit,
  };
};
