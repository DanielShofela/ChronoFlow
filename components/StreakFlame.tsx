import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakFlameProps {
  streakCount: number;
}

interface StreakStyle {
  textColor: string;
  glowFilter: string;
}

// Function to get styles based on streak count
const getStreakStyle = (count: number): StreakStyle => {
  if (count >= 180) { // Approx. 6 months - Intense Black Violet
    return {
      textColor: 'text-violet-400',
      glowFilter: 'drop-shadow(0 0 4px #4c1d95) drop-shadow(0 0 10px #7c3aed)',
    };
  }
  if (count >= 30) {
    return {
      textColor: 'text-blue-500',
      glowFilter: 'drop-shadow(0 0 3px #60a5fa) drop-shadow(0 0 8px #3b82f6)',
    };
  }
  if (count >= 7) {
    return {
      textColor: 'text-cyan-400',
      glowFilter: 'drop-shadow(0 0 3px #67e8f9) drop-shadow(0 0 8px #06b6d4)',
    };
  }
  // Base streak for 2-6 days
  return {
    textColor: 'text-orange-500',
    glowFilter: 'drop-shadow(0 0 3px #fb923c) drop-shadow(0 0 8px #ef4444)',
  };
};

export function StreakFlame({ streakCount }: StreakFlameProps) {
  // Flame should only appear for streaks of 2 days or more.
  if (streakCount < 2) {
    return null;
  }

  const { textColor, glowFilter } = getStreakStyle(streakCount);

  return (
    <motion.div
      className="flex items-center gap-1"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      title={`${streakCount} jours de suite !`}
    >
      <span className={`font-bold text-sm ${textColor}`}>
        {streakCount}
      </span>
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ filter: glowFilter }} // Apply the glow using CSS filter
      >
        <Flame className={`w-4 h-4 ${textColor}`} />
      </motion.div>
    </motion.div>
  );
}
