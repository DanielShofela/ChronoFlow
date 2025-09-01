import React, { useState, useMemo, useEffect } from "react";
// FIX: Removed subDays as it's not exported in the project's version of date-fns. Will use addDays with a negative value instead.
import { format, addDays, getDayOfYear } from 'date-fns';
import { fr } from "date-fns/locale/fr";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, BarChart3, ChevronLeft, ChevronRight, Pin, Download, HelpCircle } from "lucide-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Activity, CompletedSlot, ViewType } from "./types";
import { defaultActivities } from "./constants";
import { verses } from "./data/verses";
import { Clock24h } from "./components/Clock24h";
import { ActivityList } from "./components/ActivityList";
import { SettingsView } from "./components/SettingsView";
import { StatsView } from "./components/StatsView";
import { ThemeToggle } from "./components/ThemeToggle";
import { DailyVerse } from "./components/DailyVerse";
import { PictureInPictureClock } from "./components/PictureInPictureClock";
import { OnboardingGuide, type TourStep } from "./components/OnboardingGuide";
import { UpdateToast } from "./components/UpdateToast";
import { OfflineToast } from "./components/OfflineToast";
import { FAQView } from "./components/FAQView";

const tourSteps: TourStep[] = [
  {
    selector: '', // No selector for a welcome modal
    title: "Bienvenue sur ChronoFlow !",
    content: "Suivez ce guide rapide pour découvrir comment tirer le meilleur parti de votre nouvel outil de gestion du temps.",
  },
  {
    selector: '[data-tour-id="clock"]',
    title: "Votre journée en un coup d'œil",
    content: "Chaque segment de l'horloge représente une heure, colorée selon l'activité que vous avez planifiée. Cliquez sur un segment pour le marquer comme complété.",
    position: 'right',
  },
  {
    selector: '[data-tour-id="activity-list"]',
    title: 'La liste de vos activités',
    content: "Retrouvez ici le détail de vos activités. Vous pouvez aussi marquer les créneaux comme complétés directement depuis cette liste.",
    position: 'left',
  },
  {
    selector: '[data-tour-id="settings-button"]',
    title: 'Personnalisez votre journée',
    content: "Les activités par défaut ne sont que des suggestions. Cliquez ici pour créer les vôtres, changer les couleurs, les icônes et définir vos propres créneaux.",
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="stats-button"]',
    title: 'Suivez vos progrès',
    content: 'Visualisez vos statistiques pour rester motivé et ajuster votre routine. Analysez vos journées, semaines, mois et même années !',
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="date-nav"]',
    title: 'Voyagez dans le temps',
    content: 'Utilisez ces flèches pour naviguer entre les jours. Pratique pour consulter ou compléter une journée passée.',
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="pin-button"]',
    title: 'Horloge flottante',
    content: "Activez l'horloge flottante pour garder un œil sur votre temps même lorsque vous travaillez sur d'autres applications. L'horloge restera visible en mode Picture-in-Picture.",
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="theme-toggle"]',
    title: 'Adaptez l\'interface',
    content: "Passez du mode clair au mode sombre d'un simple clic pour un confort visuel optimal.",
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="faq-button"]',
    title: 'Besoin d\'aide ?',
    content: "Consultez notre FAQ pour obtenir des réponses à vos questions et mieux comprendre toutes les fonctionnalités de ChronoFlow.",
    position: 'bottom',
  },
  {
    selector: '', // No selector for the final modal
    title: 'Vous êtes prêt !',
    content: "C'est tout pour le moment. Il est temps de vous approprier l'outil et de construire la journée qui vous ressemble. Bonnes découvertes !",
  },
];


export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', defaultActivities);
  const [completedSlots, setCompletedSlots] = useLocalStorage<CompletedSlot[]>('completedSlots', []);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showVerse, setShowVerse] = useLocalStorage<boolean>('showVerse', true);
  const [isPipEnabled, setPipEnabled] = useState(false);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('hasSeenTour', false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled) {
        setIsPipSupported(true);
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

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
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
    return verses[dayOfYear % verses.length];
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
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
              <span className="px-3 py-1 text-sm font-medium whitespace-nowrap">{format(selectedDate, 'dd MMMM yyyy', { locale: fr })}</span>
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
        {!hasSeenTour && currentView === 'main' && (
            <OnboardingGuide steps={tourSteps} onComplete={() => setHasSeenTour(true)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOffline && <OfflineToast />}
      </AnimatePresence>
      <AnimatePresence>
      {showUpdateToast && <UpdateToast onClose={() => setShowUpdateToast(false)} />}
      </AnimatePresence>
    </div>
  );
}
