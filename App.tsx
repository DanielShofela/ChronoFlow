import React, { useState, useMemo, useEffect } from "react";
import { format, addDays, getDayOfYear, isBefore, getDay } from 'date-fns';
import { fr } from "date-fns/locale/fr";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, BarChart3, ChevronLeft, ChevronRight, Pin, HelpCircle, Lock } from "lucide-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Activity, CompletedSlot, ViewType } from "./types";
import { defaultActivities } from "./constants";
import { verses } from "./data/verses";
import { sampleCompletedSlots } from "./data/sample-completed-slots";
import { Clock24h } from "./components/Clock24h";
import { ActivityList } from "./components/ActivityList";
import { SettingsView } from "./components/SettingsView";
import { StatsView } from "./components/StatsView";
import { FaqView } from "./components/FaqView";
import { ThemeToggle } from "./components/ThemeToggle";
import { DailyVerse } from "./components/DailyVerse";
import { PictureInPictureClock } from "./components/PictureInPictureClock";
import { UpdateToast } from "./components/UpdateToast";
import { ConnectionStatusToast } from "./components/ConnectionStatusToast";
import { InstallPrompt } from "./components/InstallPrompt";
import { OnboardingGuide } from "./components/OnboardingGuide";
import { BottomNavBar } from "./components/BottomNavBar";
import GoogleAd from "./components/GoogleAd";

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', defaultActivities);
  const [completedSlots, setCompletedSlots] = useLocalStorage<CompletedSlot[]>('completedSlots', sampleCompletedSlots);
  const [dailyPlans, setDailyPlans] = useLocalStorage<{ [date: string]: Activity[] }>('dailyPlans', {});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showVerse, setShowVerse] = useLocalStorage<boolean>('showVerse', true);
  const [isPipEnabled, setPipEnabled] = useState(false);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [connectionStatusToast, setConnectionStatusToast] = useState<'online' | 'offline' | null>(null);
  const [showOnboarding, setShowOnboarding] = useLocalStorage('showOnboarding', true);
  
  // State for reminders
  const [sentReminders, setSentReminders] = useState(new Set<string>());
  const [todayString, setTodayString] = useState(() => format(new Date(), 'yyyy-MM-dd'));

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
      if (!activitiesToSort) return [];
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
        if (a.isArchived) return false;
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
            if (a.isArchived) return false;
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
      if (activity.slots.length === 0) return false;
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

                if (isPlanned) {
                    if (isActivityCompletedOnDate(activity, dateToCheck, completedSlotsSet)) {
                        currentStreak++;
                    } else {
                        // Break the streak if a planned day was not completed
                        break;
                    }
                }
                // If not planned, continue to the previous day without breaking the streak.

                dateToCheck = addDays(dateToCheck, -1);
            }
            streaks[activity.id] = currentStreak;
        });

        return streaks;
    }, [activities, selectedDate, completedSlotsSet]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
        if ('pictureInPictureEnabled' in document && document.pictureInPictureEnabled) {
            setIsPipSupported(true);
        }
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }
    
    const handleSWUpdate = () => {
      // This is a custom event fired from the service worker registration
      // See vite.config.ts and the PWA plugin documentation for more info
      if (sessionStorage.getItem('swUpdate')) {
        setShowUpdateToast(true);
        sessionStorage.removeItem('swUpdate');
        setTimeout(() => setShowUpdateToast(false), 5000);
      }
    };
    handleSWUpdate(); // Check on initial load
    window.addEventListener('load', handleSWUpdate);


    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
        setInstallPromptEvent(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const handleOffline = () => setConnectionStatusToast('offline');
    const handleOnline = () => setConnectionStatusToast('online');
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('load', handleSWUpdate);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
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
        if (a.isArchived || !a.reminderMinutes || a.reminderMinutes <= 0) return false;
        
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


  const handleSlotToggle = (hour: number) => {
    if (isPastDate) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${hour}`;

    if (completedSlotsSet.has(slotKey)) {
      setCompletedSlots(completedSlots.filter(slot =>
        !(slot.date === dateKey && slot.hour === hour)
      ));
    } else {
      setCompletedSlots([...completedSlots, { date: dateKey, hour }]);
    }
  };

  const handlePreviousDay = () => setSelectedDate(addDays(selectedDate, -1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  
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
      <div className="container mx-auto p-4 max-w-7xl pb-24 md:pb-4">
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
                      onGoToSettings={() => setCurrentView('settings')}
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
                onBack={() => setCurrentView('main')}
                showVerse={showVerse}
                onShowVerseChange={setShowVerse}
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
      <AnimatePresence>
        {connectionStatusToast && <ConnectionStatusToast type={connectionStatusToast} />}
      </AnimatePresence>
      <AnimatePresence>
        {showUpdateToast && <UpdateToast onClose={() => setShowUpdateToast(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {!isStandalone && installPromptEvent && (
          <InstallPrompt onInstall={handleInstallClick} />
        )}
      </AnimatePresence>
      <div className="w-full max-w-7xl mx-auto px-4 mb-4">
        <GoogleAd />
      </div>
      <BottomNavBar currentView={currentView} onNavigate={setCurrentView} />
    </div>
  );
}