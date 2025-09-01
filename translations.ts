// Translations for ChronoFlow

export type Language = 'fr' | 'en';

type TranslationKeys = {
  // Common
  appName: string;
  install: string;
  back: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  close: string;
  showDetails: string;
  hideDetails: string;
  
  // Offline/Online status
  offlineMode: string;
  offlineDescription: string;
  onlineMode: string;
  onlineDescription: string;
  updateAvailable: string;
  updateAvailableOffline: string;
  
  // Navigation
  settings: string;
  statistics: string;
  faq: string;
  
  // Tour steps
  tourWelcomeTitle: string;
  tourWelcomeContent: string;
  tourClockTitle: string;
  tourClockContent: string;
  tourActivityListTitle: string;
  tourActivityListContent: string;
  tourSettingsTitle: string;
  tourSettingsContent: string;
  tourStatsTitle: string;
  tourStatsContent: string;
  tourDateNavTitle: string;
  tourDateNavContent: string;
  tourPinTitle: string;
  tourPinContent: string;
  tourThemeTitle: string;
  tourThemeContent: string;
  tourFaqTitle: string;
  tourFaqContent: string;
  tourFinishTitle: string;
  tourFinishContent: string;
  tourSkip: string;
  tourNext: string;
  tourPrevious: string;
  tourFinish: string;
};

type Translations = {
  [key in Language]: TranslationKeys;
};

export const translations: Translations = {
  fr: {
    // Common
    appName: 'ChronoFlow',
    install: 'Installer',
    back: 'Retour',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    showDetails: 'Afficher les détails',
    hideDetails: 'Masquer les détails',
    
    // Offline/Online status
    offlineMode: 'Mode hors ligne activé',
    offlineDescription: "L'application reste entièrement fonctionnelle.",
    onlineMode: 'Connexion rétablie',
    onlineDescription: 'Vous êtes de nouveau connecté à Internet.',
    updateAvailable: 'Mise à jour disponible',
    updateAvailableOffline: 'Une mise à jour sera installée lorsque vous serez en ligne.',
    
    // Navigation
    settings: 'Paramètres',
    statistics: 'Statistiques',
    faq: 'FAQ',
    
    // Tour steps
    tourWelcomeTitle: 'Bienvenue sur ChronoFlow !',
    tourWelcomeContent: 'Suivez ce guide rapide pour découvrir comment tirer le meilleur parti de votre nouvel outil de gestion du temps.',
    tourClockTitle: "Votre journée en un coup d'œil",
    tourClockContent: "Chaque segment de l'horloge représente une heure, colorée selon l'activité que vous avez planifiée. Cliquez sur un segment pour le marquer comme complété.",
    tourActivityListTitle: 'La liste de vos activités',
    tourActivityListContent: "Retrouvez ici le détail de vos activités. Vous pouvez aussi marquer les créneaux comme complétés directement depuis cette liste.",
    tourSettingsTitle: 'Personnalisez votre journée',
    tourSettingsContent: "Les activités par défaut ne sont que des suggestions. Cliquez ici pour créer les vôtres, changer les couleurs, les icônes et définir vos propres créneaux.",
    tourStatsTitle: 'Suivez vos progrès',
    tourStatsContent: 'Visualisez vos statistiques pour rester motivé et ajuster votre routine. Analysez vos journées, semaines, mois et même années !',
    tourDateNavTitle: 'Voyagez dans le temps',
    tourDateNavContent: 'Utilisez ces flèches pour naviguer entre les jours. Pratique pour consulter ou compléter une journée passée.',
    tourPinTitle: 'Horloge flottante',
    tourPinContent: "Activez l'horloge flottante pour garder un œil sur votre temps même lorsque vous travaillez sur d'autres applications. L'horloge restera visible en mode Picture-in-Picture.",
    tourThemeTitle: 'Adaptez l\'interface',
    tourThemeContent: "Passez du mode clair au mode sombre d'un simple clic pour un confort visuel optimal.",
    tourFaqTitle: 'Besoin d\'aide ?',
    tourFaqContent: "Consultez notre FAQ pour obtenir des réponses à vos questions et mieux comprendre toutes les fonctionnalités de ChronoFlow.",
    tourFinishTitle: 'Vous êtes prêt !',
    tourFinishContent: "C'est tout pour le moment. Il est temps de vous approprier l'outil et de construire la journée qui vous ressemble. Bonnes découvertes !",
    tourSkip: 'Passer le guide',
    tourNext: 'Suivant',
    tourPrevious: 'Précédent',
    tourFinish: 'Terminer',
  },
  en: {
    // Common
    appName: 'ChronoFlow',
    install: 'Install',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    showDetails: 'Show details',
    hideDetails: 'Hide details',
    
    // Offline/Online status
    offlineMode: 'Offline mode activated',
    offlineDescription: 'The application remains fully functional.',
    onlineMode: 'Connection restored',
    onlineDescription: 'You are connected to the Internet again.',
    updateAvailable: 'Update available',
    updateAvailableOffline: 'An update will be installed when you are online.',
    
    // Navigation
    settings: 'Settings',
    statistics: 'Statistics',
    faq: 'FAQ',
    
    // Tour steps
    tourWelcomeTitle: 'Welcome to ChronoFlow!',
    tourWelcomeContent: 'Follow this quick guide to discover how to get the most out of your new time management tool.',
    tourClockTitle: 'Your day at a glance',
    tourClockContent: 'Each segment of the clock represents an hour, colored according to the activity you have planned. Click on a segment to mark it as completed.',
    tourActivityListTitle: 'Your activity list',
    tourActivityListContent: 'Find the details of your activities here. You can also mark slots as completed directly from this list.',
    tourSettingsTitle: 'Customize your day',
    tourSettingsContent: 'The default activities are just suggestions. Click here to create your own, change colors, icons and define your own slots.',
    tourStatsTitle: 'Track your progress',
    tourStatsContent: 'Visualize your statistics to stay motivated and adjust your routine. Analyze your days, weeks, months and even years!',
    tourDateNavTitle: 'Travel through time',
    tourDateNavContent: 'Use these arrows to navigate between days. Useful for viewing or completing a past day.',
    tourPinTitle: 'Floating clock',
    tourPinContent: 'Enable the floating clock to keep an eye on your time even when working on other applications. The clock will remain visible in Picture-in-Picture mode.',
    tourThemeTitle: 'Adapt the interface',
    tourThemeContent: 'Switch from light to dark mode with a simple click for optimal visual comfort.',
    tourFaqTitle: 'Need help?',
    tourFaqContent: 'Check our FAQ to get answers to your questions and better understand all the features of ChronoFlow.',
    tourFinishTitle: 'You are ready!',
    tourFinishContent: "That's it for now. It's time to make the tool your own and build the day that suits you. Happy discoveries!",
    tourSkip: 'Skip guide',
    tourNext: 'Next',
    tourPrevious: 'Previous',
    tourFinish: 'Finish',
  }
};