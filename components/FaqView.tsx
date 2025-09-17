import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Send, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { cn } from '../utils';

interface FaqViewProps {
  onBack: () => void;
}

const faqData = [
  {
    question: "À quoi correspond la flamme (🔥) et ses différentes couleurs ?",
    answer: "La flamme représente votre série de jours consécutifs où vous avez complété une activité. Plus votre série est longue, plus la flamme devient impressionnante ! Les paliers sont : Chaude (2+ jours), Constante (7+ jours), d'Habitude (30+ jours), et de Maîtrise (180+ jours)."
  },
  {
    question: "Comment ajouter ou modifier une activité ?",
    answer: "Allez dans les Paramètres (icône ⚙️). Utilisez le formulaire pour ajouter une nouvelle activité ou cliquez sur le crayon (✏️) sur une activité existante pour la modifier. Vous pouvez y définir son nom, son icône, sa couleur, ses horaires et sa récurrence."
  },
  {
    question: "Comment créer une activité pour une seule date au lieu qu'elle se répète ?",
    answer: "Lors de la création ou de la modification d'une activité, sous la section 'Répétition', sélectionnez 'Date unique'. Un calendrier apparaîtra pour vous permettre de choisir la date exacte de l'activité."
  },
  {
    question: "Où puis-je trouver mes activités archivées ?",
    answer: "Allez dans les Paramètres (icône ⚙️). Vous y trouverez des onglets pour basculer entre vos activités 'Actives' et 'Archivées'. Dans l'onglet 'Archivées', vous pouvez désarchiver ou supprimer définitivement une activité."
  },
  {
    question: "Comment puis-je activer les rappels pour une activité ?",
    answer: "Lors de la création ou modification d'une activité, utilisez le menu déroulant 'Rappel' pour choisir quand vous souhaitez être notifié. Assurez-vous d'avoir autorisé les notifications pour l'application dans les Préférences des Paramètres."
  },
  {
    question: "Pourquoi mes activités terminées se déplacent-elles en bas de la liste ?",
    answer: "Pour vous aider à vous concentrer sur ce qu'il reste à faire, toute activité dont tous les créneaux de la journée sont complétés est automatiquement déplacée en bas de la liste."
  },
  {
    question: "Comment consulter mes statistiques ?",
    answer: "Cliquez sur l'icône de graphique (📊) dans la navigation pour accéder à la page des statistiques. Vous pourrez y visualiser vos données par jour, semaine, mois ou année."
  },
  {
    question: "Comment utiliser l'horloge flottante (Picture-in-Picture) ?",
    answer: "Cliquez sur l'icône en forme de punaise (📌) dans l'en-tête (sur ordinateur). Cela affichera une mini-horloge dans une fenêtre flottante, vous permettant de suivre votre journée tout en utilisant d'autres applications."
  },
  {
    question: "Comment installer l'application sur mon appareil ?",
    answer: "Si un bouton 'Installer' apparaît en bas à droite, cliquez dessus. Sinon, cherchez l'option 'Ajouter à l'écran d'accueil' dans le menu de votre navigateur. Cela permet une utilisation hors ligne et un accès rapide."
  },
  {
    question: "Les données sont-elles sauvegardées si je ferme mon navigateur ?",
    answer: "Oui, toutes vos activités et vos créneaux complétés sont automatiquement sauvegardés dans le stockage local de votre navigateur. Vous retrouverez tout à votre prochaine visite."
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
};

export function FaqView({ onBack }: FaqViewProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  useEffect(() => {
    if (submitStatus === 'success' || submitStatus === 'error') {
      const timer = setTimeout(() => setSubmitStatus('idle'), 4000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };
  
  const handleSubmitFeedback = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData();
    formData.append('rating', String(rating));
    formData.append('feedback', feedback);

    try {
      const response = await fetch('https://formspree.io/f/movnakjb', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFeedback('');
        setRating(0);
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error("Feedback submission failed:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <motion.div
      className="space-y-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">Aide et FAQ</h2>
      </div>

      <motion.div
        className="border rounded-lg bg-card overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {faqData.map((item, index) => (
          <motion.div layout key={index} className="border-b last:border-b-0" variants={itemVariants}>
            <button
              onClick={() => handleToggle(index)}
              className="w-full p-4 flex justify-between items-center text-left hover:bg-muted/50 transition-colors"
              aria-expanded={expandedIndex === index}
            >
              <h3 className="text-base font-medium pr-4">{item.question}</h3>
              <div className="relative w-5 h-5 flex-shrink-0">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={expandedIndex === index ? 'minus' : 'plus'}
                    initial={{ rotate: -45, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 45, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    {expandedIndex === index ?
                      <Minus className="w-5 h-5 text-primary" /> :
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    }
                  </motion.div>
                </AnimatePresence>
              </div>
            </button>
            <AnimatePresence>
              {expandedIndex === index && (
                <motion.div
                  className="overflow-hidden"
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: { opacity: 1, height: 'auto' },
                    collapsed: { opacity: 0, height: 0 },
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <p className="px-4 pb-4 text-muted-foreground leading-relaxed">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="p-6 rounded-xl border bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + faqData.length * 0.05 }}
      >
        <h3 className="font-semibold text-lg">Évaluez l'application</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Votre avis nous est précieux pour améliorer ChronoFlow.
        </p>
        <form onSubmit={handleSubmitFeedback}>
           <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Note</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  className="p-1"
                  aria-label={`Donner ${star} étoiles`}
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-colors",
                      (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/50'
                    )}
                  />
                </motion.button>
              ))}
            </div>
          </div>
          
          <textarea
            name="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Laissez un avis (facultatif)..."
            className="w-full h-28 p-3 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
            disabled={isSubmitting}
            aria-label="Zone de texte pour l'avis"
          />
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 gap-3 min-h-[44px]">
             <AnimatePresence mode="wait">
                <motion.div
                    key={submitStatus}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full sm:w-auto"
                >
                    {submitStatus === 'success' && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                            <CheckCircle className="w-5 h-5" />
                            <span>Merci ! Votre avis a bien été envoyé.</span>
                        </div>
                    )}
                    {submitStatus === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            <span>L'envoi a échoué.</span>
                             <button type="button" onClick={() => handleSubmitFeedback()} className="ml-2 underline font-semibold">Réessayer</button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
            <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className={cn(
                  "w-full sm:w-auto h-11 px-6 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90",
                  isSubmitting && "bg-primary/80"
                )}
            >
                {isSubmitting ? (
                    <>
                        <motion.div
                            className="w-4 h-4 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Envoi...</span>
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        <span>Envoyer l'avis</span>
                    </>
                )}
            </button>
          </div>
        </form>
      </motion.div>

    </motion.div>
  );
}