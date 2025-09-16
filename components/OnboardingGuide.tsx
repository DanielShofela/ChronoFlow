import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, Palette, Clock } from 'lucide-react';

interface OnboardingGuideProps {
  onClose: (dontShowAgain: boolean) => void;
}

const features = [
  {
    icon: Clock,
    title: "Visualisez votre journée",
    description: "L'horloge 24h vous offre un aperçu unique de votre emploi du temps."
  },
  {
    icon: Palette,
    title: "Planifiez avec style",
    description: "Créez des activités personnalisées avec des couleurs et des icônes uniques."
  },
  {
    icon: BarChart3,
    title: "Suivez vos progrès",
    description: "Analysez vos habitudes et restez motivé grâce aux statistiques détaillées."
  }
];

export function OnboardingGuide({ onClose }: OnboardingGuideProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onClose(dontShowAgain)}></div>
        <motion.div
          className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-2xl bg-card border shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="text-center">
            <h2 id="onboarding-title" className="text-2xl font-bold text-foreground">
              Bienvenue sur ChronoFlow !
            </h2>
            <p className="mt-2 text-muted-foreground">
              Votre nouvel outil pour maîtriser votre temps et atteindre vos objectifs.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={() => onClose(dontShowAgain)}
              className="w-full h-12 px-6 bg-primary text-primary-foreground rounded-lg font-semibold text-base hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              Commencer
            </button>
            <div className="mt-4 flex items-center justify-center">
              <input
                type="checkbox"
                id="dont-show-again"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="dont-show-again" className="ml-2 block text-sm text-muted-foreground">
                Ne plus afficher ce message
              </label>
            </div>
          </div>
          
          <button
            onClick={() => onClose(dontShowAgain)}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
