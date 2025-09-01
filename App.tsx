import React, { useState, useMemo, useEffect } from "react";
// FIX: Removed subDays as it's not exported in the project's version of date-fns. Will use addDays with a negative value instead.
import { format, addDays, getDayOfYear } from 'date-fns';
import { fr } from "date-fns/locale/fr";
import { enUS } from "date-fns/locale/en-US";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, BarChart3, ChevronLeft, ChevronRight, Pin, Download, HelpCircle, Eye, EyeOff } from "lucide-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useLanguage } from "./hooks/useLanguage";
import type { Activity, CompletedSlot, ViewType } from "./types";
import { defaultActivities } from './constants';
import { defaultActivitiesEN } from './constantsEN';
import { verses } from "./data/verses";
import { versesEN } from "./data/versesEN";
import { Clock24h } from "./components/Clock24h";
import { ActivityList } from "./components/ActivityList";
import SettingsView from "./components/SettingsView";
import { StatsView } from "./components/StatsView";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageToggle } from "./components/LanguageToggle";
import { DailyVerse } from "./components/DailyVerse";
import { PictureInPictureClock } from "./components/PictureInPictureClock";
import { OnboardingGuide, type TourStep } from "./components/OnboardingGuide";
import { LanguageSelector } from "./components/LanguageSelector";
import { UpdateToast } from "./components/UpdateToast";
import { OfflineToast } from "./components/OfflineToast";
import { FAQView } from "./components/FAQView";

export default function App() {
  const { t, language } = useLanguage();
  const dateLocale = language === 'fr' ? fr : enUS;
  const [showActivityDetails, setShowActivityDetails] = useLocalStorage('showActivityDetails', true);
  
  const tourSteps: TourStep[] = [
  {
    selector: '', // No selector for a welcome modal
    title: t.tourWelcomeTitle,
    content: t.tourWelcomeContent,
  },
  {
    selector: '[data-tour-id="clock"]',
    title: t.tourClockTitle,
    content: t.tourClockContent,
    position: 'right',
  },
  {
    selector: '[data-tour-id="activity-list"]',
    title: t.tourActivityListTitle,
    content: t.tourActivityListContent,
    position: 'left',
  },
  {
    selector: '[data-tour-id="settings-button"]',
    title: t.tourSettingsTitle,
    content: t.tourSettingsContent,
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="stats-button"]',
    title: t.tourStatsTitle,
    content: t.tourStatsContent,
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="date-nav"]',
    title: t.tourDateNavTitle,
    content: t.tourDateNavContent,
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="pin-button"]',
    title: t.tourPinTitle,
    content: t.tourPinContent,
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="theme-toggle"]',
    title: t.tourThemeTitle,
    content: t.tourThemeContent,
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="faq-button"]',
    title: t.tourFaqTitle,
    content: t.tourFaqContent,
    position: 'bottom',
  },
  {
    selector: '', // No selector for the final modal
    title: t.tourFinishTitle,
    content: t.tourFinishContent,
  },
];


  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', language === 'fr' ? defaultActivities : defaultActivitiesEN);
  const [completedSlots, setCompletedSlots] = useLocalStorage<CompletedSlot[]>('completedSlots', []);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showVerse, setShowVerse] = useLocalStorage<boolean>('showVerse', true);
  const [isPipEnabled, setPipEnabled] = useState(false);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('hasSeenTour', false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useLocalStorage('hasSelectedLanguage', false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isOnlineToast, setIsOnlineToast] = useState(false);

  const reloadApp = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled) {
        setIsPipSupported(true);
    }
    
    const handleSWUpdate = () => {
      // Vérifier si une mise à jour est disponible, en utilisant localStorage pour la persistance
      // même après un redémarrage de l'application en mode hors ligne
      const hasStoredUpdate = localStorage.getItem('swUpdate') || sessionStorage.getItem('swUpdate');
      
      if (hasStoredUpdate) {
        console.log('Mise à jour détectée via localStorage/sessionStorage');
        setShowUpdateToast(true);
        setHasUpdate(true);
        
        // Ne pas supprimer l'indicateur de mise à jour si l'utilisateur est hors ligne
        // pour qu'il puisse être notifié même après un redémarrage de l'application
        if (navigator.onLine) {
          localStorage.removeItem('swUpdate');
          sessionStorage.removeItem('swUpdate');
        }
        
        setTimeout(() => setShowUpdateToast(false), 5000);
      }
    };
    
    // Gestionnaire pour l'événement personnalisé de mise à jour du service worker
    const handleSWUpdateAvailable = () => {
      console.log('Événement de mise à jour du service worker reçu');
      setShowUpdateToast(true);
      setHasUpdate(true);
      setTimeout(() => setShowUpdateToast(false), 5000);
    };
    
    handleSWUpdate(); // Vérifier au chargement initial
    window.addEventListener('load', handleSWUpdate);
    window.addEventListener('sw-update-available', handleSWUpdateAvailable);
    
    // Nettoyage des écouteurs d'événements
    return () => {
      window.removeEventListener('load', handleSWUpdate);
      window.removeEventListener('sw-update-available', handleSWUpdateAvailable);
    };


    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
        setInstallPromptEvent(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineToast(true);
      setIsOnlineToast(false);
    };
    
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineToast(true);
      setIsOnlineToast(true);
      setTimeout(() => setShowOfflineToast(false), 5000);
    };
    
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

  const completedSlotsSet = useMemo(() => {
    return new Set(completedSlots.map(slot => `${slot.date}-${slot.hour}`));
  }, [completedSlots]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for the clock hand
    return () => clearInterval(timer);
  }, []);

  const handleSlotToggle = (hour: number) => {
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

  // FIX: Replaced subDays with addDays(..., -1) to fix missing export error.
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
    } else {
      console.log('User dismissed the install prompt');
    }
    setInstallPromptEvent(null);
  };

  const todayStats = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const totalPlanned = activities.reduce((sum, activity) => sum + activity.slots.length, 0);
    const totalCompleted = activities.reduce((sum, activity) =>
      sum + activity.slots.filter(hour => completedSlotsSet.has(`${dateKey}-${hour}`)).length, 0
    );
    return { totalPlanned, totalCompleted };
  }, [activities, completedSlotsSet, selectedDate]);

  const verseOfTheDay = useMemo(() => {
    const dayOfYear = getDayOfYear(new Date());
    return language === 'fr' 
      ? verses[dayOfYear % verses.length]
      : versesEN[dayOfYear % versesEN.length];
  }, [language]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {!hasSelectedLanguage && (
        <LanguageSelector onComplete={() => setHasSelectedLanguage(true)} />
      )}
      <div className="container mx-auto p-4 max-w-7xl">
        <motion.header
          className="flex flex-col sm:flex-row items-center justify-between mb-8 p-4 rounded-2xl bg-card border shadow-sm"
          {...{
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="flex items-center gap-3">
              <img src="/icon-192x192.png" alt="ChronoFlow" className="w-8 h-8 rounded-md" />
              <h1 className="text-2xl font-bold">ChronoFlow</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
            <div data-tour-id="date-nav" className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button onClick={handlePreviousDay} className="p-2 hover:bg-background rounded-md transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <span className="px-3 py-1 text-sm font-medium whitespace-nowrap">{format(selectedDate, 'dd MMMM yyyy', { locale: dateLocale })}</span>
              <button onClick={handleNextDay} className="p-2 hover:bg-background rounded-md transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2">
				<AnimatePresence>
					{installPromptEvent && (
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							transition={{ type: 'spring', stiffness: 400, damping: 25 }}
						>
							<button
								onClick={handleInstallClick}
								className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
								aria-label="Installer l'application"
								title="Installer l'application"
							>
								<Download className="w-5 h-5" />
								<span className="hidden sm:inline text-sm font-medium">Installer</span>
							</button>
						</motion.div>
					)}
				</AnimatePresence>

                <button data-tour-id="settings-button" onClick={() => setCurrentView('settings')} className="p-2 hover:bg-muted rounded-md transition-colors"><Settings className="w-5 h-5" /></button>
                <button data-tour-id="stats-button" onClick={() => setCurrentView('stats')} className="p-2 hover:bg-muted rounded-md transition-colors"><BarChart3 className="w-5 h-5" /></button>
                {isPipSupported && (
                  <button 
                    data-tour-id="pin-button"
                    onClick={() => setPipEnabled(p => !p)} 
                    className={`p-2 rounded-md transition-colors ${isPipEnabled ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
                    aria-label="Toggle Picture-in-Picture Clock"
                    title="Afficher/Cacher l'horloge flottante"
                  >
                      <Pin className="w-5 h-5" />
                  </button>
                )}
                <button 
                  data-tour-id="faq-button"
                  onClick={() => setCurrentView('faq')}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  aria-label="Aide et FAQ"
                  title="Aide et FAQ"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <div data-tour-id="theme-toggle">
                  <ThemeToggle />
                </div>
                <LanguageToggle />
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
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <motion.div
                    data-tour-id="clock"
                    className="lg:col-span-3 flex flex-col items-center justify-center p-6 rounded-2xl border bg-card shadow-sm"
                  >
                    <h2 className="text-xl font-semibold mb-4 text-foreground">
                      Horloge 24h
                    </h2>
                    <Clock24h
                      activities={activities}
                      completedSlots={completedSlotsSet}
                      selectedDate={selectedDate}
                      onSlotToggle={handleSlotToggle}
                      currentTime={currentTime}
                    />
                  </motion.div>
                  <div data-tour-id="activity-list" className="lg:col-span-2">
                    <ActivityList
                activities={activities}
                completedSlots={completedSlotsSet}
                selectedDate={selectedDate}
                onSlotToggle={handleSlotToggle}
                showActivityDetails={showActivityDetails}
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
                    <p className="text-sm text-muted-foreground">{language === 'fr' ? 'Temps prévu' : 'Planned time'}</p>
                    <p className="text-2xl font-bold">{todayStats.totalPlanned}h</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-card text-center">
                    <p className="text-sm text-muted-foreground">{language === 'fr' ? 'Temps réalisé' : 'Completed time'}</p>
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
                showActivityDetails={showActivityDetails}
                onShowActivityDetailsChange={setShowActivityDetails}
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
              <FAQView
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
          activities={activities}
          currentTime={currentTime}
        />
      )}
      <AnimatePresence>
        {!hasSeenTour && hasSelectedLanguage && currentView === 'main' && (
            <OnboardingGuide steps={tourSteps} onComplete={() => setHasSeenTour(true)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showOfflineToast && (
          <OfflineToast 
            isOffline={isOffline} 
            hasUpdate={hasUpdate} 
            onClose={() => setShowOfflineToast(false)}
            onReload={reloadApp}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
      {showUpdateToast && <UpdateToast onClose={() => setShowUpdateToast(false)} onReload={reloadApp} />}
      </AnimatePresence>
    </div>
  );
}
