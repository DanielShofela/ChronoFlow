import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-4 px-6 flex items-center justify-between text-left font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-md"
      >
        <span>{question}</span>
        {isOpen ? <Minus className="w-5 h-5 flex-shrink-0" /> : <Plus className="w-5 h-5 flex-shrink-0" />}
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      >
        <div className="py-4 px-6 text-muted-foreground">
          {answer}
        </div>
      </motion.div>
    </div>
  );
}

export function FAQView({ onBack }: { onBack: () => void }) {
  const [openItems, setOpenItems] = React.useState<Record<number, boolean>>({
    0: true, // First item open by default
  });

  const faqItems = [
    {
      question: "Comment utiliser l'horloge flottante (Picture-in-Picture) ?",
      answer: "Cliquez sur l'icône d'épingle dans la barre d'outils pour activer l'horloge flottante. Une petite fenêtre apparaîtra et restera visible même lorsque vous travaillez sur d'autres applications. Pour la désactiver, cliquez à nouveau sur l'icône d'épingle ou fermez la fenêtre flottante."
    },
    {
      question: "Comment ajouter une nouvelle activité ?",
      answer: "Cliquez sur l'icône des paramètres, puis dans la section 'Ajouter une activité', renseignez le nom, choisissez une icône et une couleur, sélectionnez les créneaux horaires souhaités, puis cliquez sur 'Ajouter'."
    },
    {
      question: "Comment marquer un créneau horaire comme terminé ?",
      answer: "Vous pouvez cliquer directement sur le segment correspondant dans l'horloge 24h, ou utiliser les boutons de créneau horaire dans la liste des activités. Les créneaux terminés sont marqués d'une coche."
    },
    {
      question: "Comment consulter mes statistiques ?",
      answer: "Cliquez sur l'icône de graphique dans la barre d'outils pour accéder à la vue des statistiques. Vous y trouverez des informations sur votre productivité quotidienne, hebdomadaire et mensuelle."
    },
    {
      question: "Comment changer de jour ?",
      answer: "Utilisez les flèches gauche et droite à côté de la date pour naviguer entre les jours. Vous pouvez consulter et modifier vos activités pour n'importe quelle date."
    },
    {
      question: "Comment personnaliser mes activités ?",
      answer: "Dans la vue des paramètres (icône d'engrenage), vous pouvez modifier l'ordre des activités en les faisant glisser, changer leurs couleurs et icônes en cliquant sur le bouton d'édition, ou les supprimer avec le bouton de corbeille."
    },
    {
      question: "Comment installer l'application sur mon appareil ?",
      answer: "ChronoFlow est une Progressive Web App (PWA). Sur la plupart des navigateurs, vous verrez un bouton 'Installer' dans la barre d'outils. Cliquez dessus pour installer l'application sur votre appareil et l'utiliser hors ligne."
    },
    {
      question: "Les données sont-elles sauvegardées si je ferme mon navigateur ?",
      answer: "Oui, toutes vos données sont stockées localement sur votre appareil et persistent même si vous fermez votre navigateur. Cependant, si vous effacez les données de votre navigateur, vos activités et statistiques seront perdues."
    },
    {
      question: "Comment activer ou désactiver le verset du jour ?",
      answer: "Dans la vue des paramètres (icône d'engrenage), faites défiler jusqu'à la section 'Verset du jour' et utilisez le commutateur pour activer ou désactiver cette fonctionnalité."
    },
    {
      question: "Comment changer le thème de l'application ?",
      answer: "Cliquez sur l'icône de soleil/lune dans la barre d'outils pour basculer entre les thèmes clair et sombre. L'application respecte également les préférences de thème de votre système."
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <motion.div
      className="space-y-6"
      {...{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">Aide et FAQ</h2>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {faqItems.map((item, index) => (
          <FAQItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={!!openItems[index]}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>

      <div className="p-6 rounded-xl border bg-card">
        <h3 className="text-lg font-semibold mb-4">Vous avez d'autres questions ?</h3>
        <p className="text-muted-foreground mb-4">
          Si vous ne trouvez pas la réponse à votre question, n'hésitez pas à nous contacter via le formulaire de feedback dans les paramètres de l'application.
        </p>
      </div>
    </motion.div>
  );
}