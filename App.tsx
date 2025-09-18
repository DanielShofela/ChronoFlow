import React, { useState, useMemo, useEffect } from "react";
import { format, addDays, getDayOfYear, isBefore, getDay } from 'date-fns';
import { fr } from "date-fns/locale/fr";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, BarChart3, ChevronLeft, ChevronRight, Pin, HelpCircle, Lock } from "lucide-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useServiceWorkerUpdate } from "./hooks/useServiceWorkerUpdate";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import type { Activity, CompletedSlot, ViewType } from "./types";
import { defaultActivities } from "./constants";
import { verses } from "./data/verses";
import { sampleCompletedSlots } from "./data/sample-completed-slots";
import { Clock24h } from "./components/Clock24h";
import { ActivityList } from "./components/ActivityList";
import SettingsView from "./components/SettingsView";
import StatsView from "./components/StatsView";
import { FaqView } from "./components/FaqView";
import { ThemeToggle } from "./components/ThemeToggle";
import { DailyVerse } from "./components/DailyVerse";
import { PictureInPictureClock } from "./components/PictureInPictureClock";
import { UpdateToast } from "./components/UpdateToast";
import { ConnectionStatusToast } from "./components/ConnectionStatusToast";
import { InstallPrompt } from "./components/InstallPrompt";
import { OnboardingGuide } from "./components/OnboardingGuide";
import { BottomNavBar } from "./components/BottomNavBar";
import { CookieConsent } from "./components/CookieConsent";

// Fonction utilitaire pour le tracking GA4
const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      ...eventParams,
      timestamp: new Date().toISOString()
    });
  }
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', defaultActivities);
  const [completedSlots, setCompletedSlots] = useLocalStorage<CompletedSlot[]>('completedSlots', sampleCompletedSlots);
  const [dailyPlans, setDailyPlans] = useLocalStorage<{ [date: string]: Activity[] }>('dailyPlans', {});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showVerse, setShowVerse] = useLocalStorage<boolean>('showVerse', true);
  const [isPipEnabled, setPipEnabled] = useState(false);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const { updateAvailable, installUpdate } = useServiceWorkerUpdate();
  const { isOnline, showToast: showConnectionToast } = useConnectionStatus();
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [connectionStatusToast, setConnectionStatusToast] = useState<'online' | 'offline' | null>(null);
  const [showOnboarding, setShowOnboarding] = useLocalStorage('showOnboarding', true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // State for reminders
  const [sentReminders, setSentReminders] = useState(new Set<string>());
  const [todayString, setTodayString] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Effect for PWA installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstallPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    // Migration for activities that don't have the `days` or `isRecurring` property
    if (activities.length > 0 && activities.some(a => a.days === undefined || typeof a.isRecurring === 'undefined')) {
      setActivities(prevActivities => 
        prevActivities.map(a => ({
          ...a,
          days: a.days ?? [0, 1, 2, 3, 4, 5, 6], // Default to all days
          isRecurring: a.isRecurring ?? true, // Default to recurring
        }))
      );
    }
  }, [activities, setActivities]);

  const startOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  
  const isPastDate = useMemo(() => {
      return isBefore(selectedDate, startOfToday());
  }, [selectedDate]);

  const completedSlotsSet = useMemo(() => {
    return new Set(completedSlots.map(slot => `${slot.date}-${slot.hour}`));
  }, [completedSlots]);

  const activitiesForSelectedDate = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    const sortActivities = (activitiesToSort: Activity[]): Activity[] => {
      if (!activitiesToSort) {
        return [];
      }
      return [...activitiesToSort].sort((a, b) => {
        // An activity is completed if all its slots for the day are completed.
        const isACompleted = a.slots.length > 0 && a.slots.every(slot => completedSlotsSet.has(`${dateKey}-${slot}`));
        const isBCompleted = b.slots.length > 0 && b.slots.every(slot => completedSlotsSet.has(`${dateKey}-${slot}`));

        // `false` (0) comes before `true` (1), so incomplete activities are first.
        return Number(isACompleted) - Number(isBCompleted);
      });
    };

    // If the date is in the past and a snapshot exists, use it and sort it.
    if (isPastDate && dailyPlans[dateKey] !== undefined) {
        return sortActivities(dailyPlans[dateKey]);
    }

    const dayOfWeek = getDay(selectedDate);
    const filteredActivities = activities.filter(a => {
        if (a.isArchived) {
            return false;
        }
        const isRecurring = a.isRecurring ?? true; 
        
        if (isRecurring) {
            return a.days?.includes(dayOfWeek);
        } else {
            return a.specificDate === dateKey;
        }
    });

    return sortActivities(filteredActivities);

  }, [activities, selectedDate, dailyPlans, isPastDate, completedSlotsSet]);

  // This useEffect creates a "snapshot" of a past day's plan the first time it's viewed.
  // This ensures that subsequent changes to activities don't alter the history.
  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    
    // If the selected date is in the past AND it doesn't have a snapshot yet, create one.
    if (isPastDate && dailyPlans[dateKey] === undefined) {
        const dayOfWeek = getDay(selectedDate);
        const planToSave = activities.filter(a => {
            if (a.isArchived) {
              return false;
            }
            const isRecurring = a.isRecurring ?? true;
            if (isRecurring) {
                return a.days?.includes(dayOfWeek);
            } else {
                return a.specificDate === dateKey;
            }
        });
        
        setDailyPlans(prevPlans => ({
            ...prevPlans,
            [dateKey]: planToSave
        }));
    }
  }, [selectedDate, activities, dailyPlans, setDailyPlans, isPastDate]);

    // Helper to check if an activity was fully completed on a given date
    const isActivityCompletedOnDate = (activity: Activity, date: Date, slotsSet: Set<string>): boolean => {
      const dateKey = format(date, 'yyyy-MM-dd');
      if (activity.slots.length === 0) {
        return false;
      }
      return activity.slots.every(slot => slotsSet.has(`${dateKey}-${slot}`));
    };

    const activityStreaks = useMemo(() => {
        const streaks: { [key: string]: number } = {};

        activities.forEach(activity => {
            if (activity.isArchived) {
                streaks[activity.id] = 0;
                return;
            }

            let currentStreak = 0;
            let dateToCheck = new Date(selectedDate);

            // Look back a reasonable number of days (e.g., 365)
            for (let i = 0; i < 365; i++) {
                const dayOfWeek = getDay(dateToCheck);
                const dateKey = format(dateToCheck, 'yyyy-MM-dd');

                const isRecurring = activity.isRecurring ?? true;
                let isPlanned = false;
                if (isRecurring) {
                    isPlanned = activity.days?.includes(dayOfWeek);
                } else {
                    isPlanned = activity.specificDate === dateKey;
                }

                // Si l'activité est récurrente, on continue de compter les jours consécutifs
                // où l'activité était planifiée et complétée
                if (isPlanned) {
                    if (isActivityCompletedOnDate(activity, dateToCheck, completedSlotsSet)) {
                        currentStreak++;
                    } else {
                        // Break the streak if a planned day was not completed
                        break;
                    }
                } else {
                    // Pour les activités non récurrentes, on s'arrête si on dépasse leur date spécifique
                    if (!isRecurring && dateKey < activity.specificDate) {
                        break;
                    }
                    // Pour les activités récurrentes, on ignore les jours non planifiés
                    // sans rompre la série (ne pas incrémenter, juste continuer)
                }

                dateToCheck = addDays(dateToCheck, -1);
            }
            streaks[activity.id] = currentStreak;
        });

        return streaks;
    }, [activities, selectedDate, completedSlotsSet]);

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatusToast('online');
      // Réinitialiser après 5 secondes
      setTimeout(() => setConnectionStatusToast(null), 5000);
    };
    
    const handleOffline = () => {
      setConnectionStatusToast('offline');
      // Garde la notification offline visible
    };

    if (typeof document !== 'undefined') {
      if ('pictureInPictureEnabled' in document && document.pictureInPictureEnabled) {
        setIsPipSupported(true);
      }
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

      // Vérifier l'état de la connexion au chargement initial
      const isOnline = navigator.onLine;
      setConnectionStatusToast(isOnline ? 'online' : 'offline');
      if (isOnline) {
        // Si en ligne au démarrage, masquer après 5 secondes
        setTimeout(() => setConnectionStatusToast(null), 5000);
      }
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Vérifie les mises à jour du service worker
    const checkForUpdates = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Écouteur pour détecter une nouvelle version en attente
          registration.addEventListener('waiting', (event) => {
            setShowUpdateToast(true);
          });

          // Force une vérification de mise à jour
          await registration.update();

          // Vérifie si une mise à jour est déjà en attente
          if (registration.waiting) {
            setShowUpdateToast(true);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification des mises à jour:', error);
        }
      }
    };

    // Écoute les messages du service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        // Vérifie si cette version a déjà été ignorée
        const lastIgnoredVersion = localStorage.getItem('lastIgnoredUpdateVersion');
        if (lastIgnoredVersion !== event.data.version) {
          setShowUpdateToast(true);
          // Stocke la version pour référence
          sessionStorage.setItem('pendingVersion', event.data.version);
        }
      }
    };

    // Vérifie les mises à jour toutes les 30 minutes
    const updateCheckInterval = setInterval(checkForUpdates, 30 * 60 * 1000);
    
    // Vérifie au chargement
    checkForUpdates();

    // Écoute les messages du service worker
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      clearInterval(updateCheckInterval);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };


    // Écoute les messages du service worker
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      clearInterval(updateCheckInterval);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  useEffect(() => {
    if (connectionStatusToast) {
        const timer = setTimeout(() => {
            setConnectionStatusToast(null);
        }, 4000); // Hide after 4 seconds
        return () => clearTimeout(timer);
    }
  }, [connectionStatusToast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for the clock hand
    return () => clearInterval(timer);
  }, []);

  // Effect to clear sent reminders when the day changes (for long-running sessions)
  useEffect(() => {
    const timer = setInterval(() => {
      const newTodayString = format(new Date(), 'yyyy-MM-dd');
      if (newTodayString !== todayString) {
        setTodayString(newTodayString);
        setSentReminders(new Set()); // New day, clear reminders
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [todayString]);

  // Effect for handling reminders
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const checkReminders = () => {
      const now = new Date();
      const currentDayOfWeek = getDay(now);
      const dateKey = format(now, 'yyyy-MM-dd');

      const activitiesWithReminders = activities.filter(a => {
        if (a.isArchived || !a.reminderMinutes || a.reminderMinutes <= 0) {
          return false;
        }
        
        const isRecurring = a.isRecurring ?? true;
        if (isRecurring) {
          return a.days?.includes(currentDayOfWeek);
        }
        return a.specificDate === dateKey;
      });

      activitiesWithReminders.forEach(activity => {
        activity.slots.forEach(hour => {
          const reminderKey = `${todayString}-${activity.id}-${hour}`;
          if (sentReminders.has(reminderKey)) {
            return; // Reminder already sent for this slot today
          }

          const slotTime = new Date();
          slotTime.setHours(hour, 0, 0, 0);

          const reminderTime = new Date(slotTime.getTime() - (activity.reminderMinutes as number) * 60000);

          if (
            now.getHours() === reminderTime.getHours() &&
            now.getMinutes() === reminderTime.getMinutes()
          ) {
            // eslint-disable-next-line no-new
            new Notification('ChronoFlow Rappel', {
              body: `L'activité "${activity.name}" commence dans ${activity.reminderMinutes} minutes.`,
              icon: '/icon-192x192.png',
              tag: reminderKey, // Tag prevents duplicates if check runs multiple times in the same minute
            });

            setSentReminders(prev => new Set(prev).add(reminderKey));
          }
        });
      });
    };

    const intervalId = setInterval(checkReminders, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [activities, sentReminders, todayString]);


  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setInstallPromptEvent(null);
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        ...eventParams,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSlotToggle = (hour: number) => {
    if (isPastDate) {
      return;
    }
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${hour}`;

    const isCompleting = !completedSlotsSet.has(slotKey);
    if (isCompleting) {
      setCompletedSlots([...completedSlots, { date: dateKey, hour }]);
      // Tracking de complétion d'activité
      const activity = activitiesForSelectedDate.find(a => 
        a.slots.includes(hour)
      );
      if (activity) {
        trackEvent('activity_completed', {
          activity_name: activity.name,
          activity_id: activity.id,
          time_slot: hour,
          date: dateKey
        });
      }
    } else {
      setCompletedSlots(completedSlots.filter(slot =>
        !(slot.date === dateKey && slot.hour === hour)
      ));
      // Tracking d'annulation de complétion
      const activity = activitiesForSelectedDate.find(a => 
        a.slots.includes(hour)
      );
      if (activity) {
        trackEvent('activity_uncompleted', {
          activity_name: activity.name,
          activity_id: activity.id,
          time_slot: hour,
          date: dateKey
        });
      }
    }
  };

  const handlePreviousDay = () => {
    const newDate = addDays(selectedDate, -1);
    setSelectedDate(newDate);
    trackEvent('date_navigation', {
      direction: 'previous',
      new_date: format(newDate, 'yyyy-MM-dd'),
      is_past_date: isBefore(newDate, startOfToday())
    });
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    trackEvent('date_navigation', {
      direction: 'next',
      new_date: format(newDate, 'yyyy-MM-dd'),
      is_past_date: isBefore(newDate, startOfToday())
    });
  };

  const todayStats = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const totalPlanned = activitiesForSelectedDate.reduce((sum, activity) => sum + activity.slots.length, 0);
    const totalCompleted = activitiesForSelectedDate.reduce((sum, activity) =>
      sum + activity.slots.filter(hour => completedSlotsSet.has(`${dateKey}-${hour}`)).length, 0
    );
    return { totalPlanned, totalCompleted };
  }, [activitiesForSelectedDate, completedSlotsSet, selectedDate]);

  const verseOfTheDay = useMemo(() => {
    const dayOfYear = getDayOfYear(new Date());
    return verses[dayOfYear % verses.length];
  }, []);

  const handleOnboardingClose = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      setShowOnboarding(false);
    }
    // This will hide it for the session regardless. 
    // If the user checked the box, useLocalStorage persists it.
    setShowOnboarding(false);
  };


  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {showOnboarding && <OnboardingGuide onClose={handleOnboardingClose} />}
            <div className="container mx-auto px-4 pt-2 pb-0 max-w-7xl flex flex-col flex-grow">
        <motion.header
          className="flex flex-col sm:flex-row items-center justify-between mb-6 p-2 rounded-2xl bg-card border shadow-sm"
          {...{
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <h1 className="text-2xl font-bold">
              <button
                onClick={() => setCurrentView('main')}
                className="transition-colors hover:text-primary focus:outline-none flex items-center"
                aria-label="Retour à l'accueil"
              >
                <img src="/icon_header.png" alt="ChronoFlow" className="h-16 w-auto" />
              </button>
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button onClick={handlePreviousDay} className="p-2 hover:bg-background rounded-md transition-colors" aria-label="Jour précédent"><ChevronLeft className="w-5 h-5" /></button>
              <span className="px-3 py-1 text-sm font-medium whitespace-nowrap">{format(selectedDate, 'dd MMMM yyyy', { locale: fr })}</span>
              <button onClick={handleNextDay} className="p-2 hover:bg-background rounded-md transition-colors" aria-label="Jour suivant"><ChevronRight className="w-5 h-5" /></button>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
                <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-muted rounded-md transition-colors" aria-label="Activités et Paramètres"><Settings className="w-5 h-5" /></button>
                <button onClick={() => setCurrentView('stats')} className="p-2 hover:bg-muted rounded-md transition-colors" aria-label="Statistiques"><BarChart3 className="w-5 h-5" /></button>
                <button onClick={() => setCurrentView('faq')} className="p-2 hover:bg-muted rounded-md transition-colors" aria-label="Aide"><HelpCircle className="w-5 h-5" /></button>
                {isPipSupported && (
                  <button 
                    onClick={() => setPipEnabled(p => !p)} 
                    className={`p-2 rounded-md transition-colors ${isPipEnabled ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
                    aria-label="Afficher/Cacher l'horloge flottante"
                    title="Afficher/Cacher l'horloge flottante"
                  >
                      <Pin className="w-5 h-5" />
                  </button>
                )}
                <ThemeToggle />
            </div>
             {/* Mobile quick actions */}
            <div className="flex md:hidden items-center gap-2">
               {isPipSupported && (
                  <button 
                    onClick={() => setPipEnabled(p => !p)} 
                    className={`p-2 rounded-md transition-colors ${isPipEnabled ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
                    aria-label="Afficher/Cacher l'horloge flottante"
                    title="Afficher/Cacher l'horloge flottante"
                  >
                      <Pin className="w-5 h-5" />
                  </button>
                )}
              <ThemeToggle />
            </div>
          </div>
        </motion.header>

        <main>
          <AnimatePresence mode="wait">
            {currentView === 'main' && (
              <motion.div
                key="main"
                {...{
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                }}
              >
                {isPastDate && (
                  <motion.div
                    className="flex items-center gap-3 p-3 mb-6 text-sm rounded-lg bg-muted text-muted-foreground border"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Mode lecture seule : les jours passés ne peuvent pas être modifiés.</span>
                  </motion.div>
                )}
                {/* AdSense Banner */}
                <div className="w-full mb-4">
                  <ins className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client="ca-pub-4849274785502619"
                    data-ad-slot="1234567890"
                    data-ad-format="auto"
                    data-full-width-responsive="true">
                  </ins>
                  <script>
                    (adsbygoogle = window.adsbygoogle || []).push({});
                  </script>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <motion.div
                    className="lg:col-span-3 flex flex-col items-center justify-center p-6 rounded-2xl border bg-card shadow-sm"
                  >
                    <h2 className="text-xl font-semibold mb-4 text-foreground">
                      Horloge 24h
                    </h2>
                    <Clock24h
                      activities={activitiesForSelectedDate}
                      completedSlots={completedSlotsSet}
                      selectedDate={selectedDate}
                      onSlotToggle={handleSlotToggle}
                      currentTime={currentTime}
                      isPastDate={isPastDate}
                    />
                  </motion.div>
                  <div className="lg:col-span-2">
                    <ActivityList
                      activities={activitiesForSelectedDate}
                      completedSlots={completedSlotsSet}
                      selectedDate={selectedDate}
                      onSlotToggle={handleSlotToggle}
                      onGoToSettings={(activity) => {
                        setSelectedActivity(activity || null);
                        setCurrentView('settings');
                      }}
                      isPastDate={isPastDate}
                      streaks={activityStreaks}
                      totalActivitiesCount={activities.length}
                    />
                  </div>
                </div>
                 <motion.div 
                  className="grid grid-cols-2 gap-4 mt-8"
                  {...{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.5, delay: 0.2 },
                  }}
                >
                  <div className="p-4 rounded-xl border bg-card text-center">
                    <p className="text-sm text-muted-foreground">Temps prévu</p>
                    <p className="text-2xl font-bold">{todayStats.totalPlanned}h</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-card text-center">
                    <p className="text-sm text-muted-foreground">Temps réalisé</p>
                    <p className="text-2xl font-bold">{todayStats.totalCompleted}h</p>
                  </div>
                </motion.div>
                {showVerse && <DailyVerse verse={verseOfTheDay} />}
              </motion.div>
            )}

            {currentView === 'settings' && (
              <SettingsView
                activities={activities}
                onActivitiesChange={setActivities}
                onBack={() => {
                  setCurrentView('main');
                  setSelectedActivity(null);
                }}
                showVerse={showVerse}
                onShowVerseChange={setShowVerse}
                selectedActivity={selectedActivity}
              />
            )}

            {currentView === 'stats' && (
              <StatsView
                activities={activities}
                completedSlots={completedSlots}
                selectedDate={selectedDate}
                onBack={() => setCurrentView('main')}
              />
            )}
            
            {currentView === 'faq' && (
              <FaqView
                onBack={() => setCurrentView('main')}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
      {isPipSupported && (
        <PictureInPictureClock
          isEnabled={isPipEnabled}
          onToggle={setPipEnabled}
          activities={activitiesForSelectedDate}
          currentTime={currentTime}
        />
      )}
      <ConnectionStatusToast
        isOnline={isOnline}
        show={showConnectionToast}
      />
      <UpdateToast
        show={updateAvailable && isOnline}
        onUpdate={installUpdate}
        autoUpdate={false}
      />
      <AnimatePresence>
        {!isStandalone && installPromptEvent && (
          <InstallPrompt onInstall={handleInstallClick} />
        )}
      </AnimatePresence>
      <BottomNavBar currentView={currentView} onNavigate={setCurrentView} />
      <CookieConsent onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)} />
      <AnimatePresence>
        {showPrivacyPolicy && <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />}
      </AnimatePresence>
    </div>
  );
}