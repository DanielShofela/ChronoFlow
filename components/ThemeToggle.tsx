import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="relative flex h-8 w-16 cursor-pointer items-center rounded-full p-1 transition-colors shadow-sm border duration-300 bg-background"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      {...{ whileTap: { scale: 0.95 } }}
    >
      <span className="sr-only">Toggle color mode</span>

      <motion.div
        className="absolute z-20 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-md"
        {...{
          initial: false,
          animate: {
            x: theme === 'dark' ? 32 : 2,
          },
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
          },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            {...{
              initial: { opacity: 0, rotate: -90, scale: 0.5 },
              animate: { opacity: 1, rotate: 0, scale: 1 },
              exit: { opacity: 0, rotate: 90, scale: 0.5 },
              transition: { duration: 0.2 },
            }}
          >
            {theme === 'light' ? (
              <Sun className="size-4 text-primary-foreground" />
            ) : (
              <Moon className="size-4 text-primary-foreground" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}