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

export function FAQViewEN({ onBack }: { onBack: () => void }) {
  const [openItems, setOpenItems] = React.useState<Record<number, boolean>>({
    0: true, // First item open by default
  });

  const faqItems = [
    {
      question: "How to use the floating clock (Picture-in-Picture)?",
      answer: "Click on the pin icon in the toolbar to activate the floating clock. A small window will appear and remain visible even when you're working on other applications. To disable it, click on the pin icon again or close the floating window."
    },
    {
      question: "How to add a new activity?",
      answer: "Click on the settings icon, then in the 'Add an activity' section, enter the name, choose an icon and a color, select the desired time slots, then click on 'Add'."
    },
    {
      question: "How to mark a time slot as completed?",
      answer: "You can click directly on the corresponding segment in the 24h clock, or use the time slot buttons in the activity list. Completed slots are marked with a checkmark."
    },
    {
      question: "How to view my statistics?",
      answer: "Click on the chart icon in the toolbar to access the statistics view. You'll find information about your daily, weekly, and monthly productivity."
    },
    {
      question: "How to change the day?",
      answer: "Use the left and right arrows next to the date to navigate between days. You can view and modify your activities for any date."
    },
    {
      question: "How to customize my activities?",
      answer: "In the settings view (gear icon), you can change the order of activities by dragging them, change their colors and icons by clicking on the edit button, or delete them with the trash button."
    },
    {
      question: "How to install the application on my device?",
      answer: "ChronoFlow is a Progressive Web App (PWA). On most browsers, you'll see an 'Install' button in the toolbar. Click on it to install the application on your device and use it offline."
    },
    {
      question: "Is the data saved if I close my browser?",
      answer: "Yes, all your data is stored locally on your device and persists even if you close your browser. However, if you clear your browser data, your activities and statistics will be lost."
    },
    {
      question: "How to enable or disable the daily verse?",
      answer: "In the settings view (gear icon), scroll down to the 'Daily Verse' section and use the switch to enable or disable this feature."
    },
    {
      question: "How to change the application theme?",
      answer: "Click on the sun/moon icon in the toolbar to toggle between light and dark themes. The application also respects your system theme preferences."
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
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">Help and FAQ</h2>
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
        <h3 className="text-lg font-semibold mb-4">Do you have other questions?</h3>
        <p className="text-muted-foreground mb-4">
          If you can't find the answer to your question, feel free to contact us via the feedback form in the application settings.
        </p>
      </div>
    </motion.div>
  );
}