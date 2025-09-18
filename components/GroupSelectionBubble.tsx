import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripHorizontal } from 'lucide-react';

interface GroupSelectionBubbleProps {
  show: boolean;
  startHour: number;
  endHour: number | null;
}

export function GroupSelectionBubble({ show, startHour, endHour }: GroupSelectionBubbleProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <GripHorizontal className="w-4 h-4" />
            <span className="font-medium">
              Sélection groupée : {startHour}h
              {endHour !== null && endHour !== startHour && ` → ${endHour}h`}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}