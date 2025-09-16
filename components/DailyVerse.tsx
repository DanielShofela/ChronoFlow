import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import type { Verse } from '../types';

interface DailyVerseProps {
  verse: Verse;
}

export function DailyVerse({ verse }: DailyVerseProps) {
  if (!verse) return null;

  return (
    <motion.div
      className="mt-8 p-4 rounded-xl border bg-card text-center relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Quote className="absolute top-2 left-2 w-8 h-8 text-muted-foreground/20 transform -translate-x-1/4 -translate-y-1/4" />
      <p className="text-base italic text-foreground">"{verse.text}"</p>
      <p className="text-sm font-medium text-muted-foreground mt-2">- {verse.author}</p>
      <Quote className="absolute bottom-2 right-2 w-8 h-8 text-muted-foreground/20 transform translate-x-1/4 translate-y-1/4 rotate-180" />
    </motion.div>
  );
}