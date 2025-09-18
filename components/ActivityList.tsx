import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { PlusCircle, CheckCircle, Circle, Bell } from 'lucide-react';
import type { Activity } from '../types';
import { cn, isColorLight } from '../utils';
import { StreakFlame } from './StreakFlame';

interface ActivityListProps {
  activities: Activity[];
  completedSlots: Set<string>;
  selectedDate: Date;
  onSlotToggle: (hour: number) => void;
  onGoToSettings: (activity?: Activity) => void;
  isPastDate: boolean;
  streaks: { [key: string]: number };
  totalActivitiesCount: number;
}

export function ActivityList({
  activities,
  completedSlots,
  selectedDate,
  onSlotToggle,
  onGoToSettings,
  isPastDate,
  streaks,
  totalActivitiesCount,
}: ActivityListProps) {
  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const getSlotKey = (hour: number) => `${dateKey}-${hour}`;

  const isActivityCompleted = (activity: Activity) => {
    if (activity.slots.length === 0) return false;
    return activity.slots.every(slot => completedSlots.has(getSlotKey(slot)));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Activités du jour</h2>
        <motion.button
          onClick={() => onGoToSettings()}
          className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          whileTap={{ scale: 0.95 }}
        >
          <PlusCircle className="w-4 h-4" />
          Gérer
        </motion.button>
      </div>
      
      <AnimatePresence>
        {activities.length > 0 ? (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {activities.map((activity, index) => {
              const completed = isActivityCompleted(activity);
              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300",
                    completed ? 'bg-muted/50 border-dashed' : 'bg-card'
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <button
                        className="flex items-center gap-2 text-primary underline font-semibold hover:text-primary/80 transition-colors"
                        onClick={() => onGoToSettings(activity)}
                        aria-label={`Modifier l'activité ${activity.name}`}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        <span className="text-2xl">{activity.icon}</span>
                        <span className={cn(
                          completed && 'line-through text-muted-foreground'
                        )}>{activity.name}</span>
                      </button>
                      {activity.reminderMinutes && activity.reminderMinutes > 0 && (
                        <Bell className="w-4 h-4 text-primary" aria-label={`Rappel ${activity.reminderMinutes} minutes avant.`} />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {activity.slots.length} créneau{activity.slots.length > 1 ? 'x' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                       {completed ? (
                         <>
                           <CheckCircle className="w-5 h-5 text-green-500" />
                           {streaks[activity.id] > 0 && <StreakFlame streakCount={streaks[activity.id]} />}
                         </>
                       ) : (
                         <Circle className="w-5 h-5 text-muted-foreground" />
                       )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {activity.slots.map(hour => {
                      const isCompleted = completedSlots.has(getSlotKey(hour));
                      return (
                        <button
                          key={hour}
                          onClick={() => onSlotToggle(hour)}
                          disabled={isPastDate}
                          className={cn(
                            "h-10 w-10 text-xs font-bold rounded-md flex items-center justify-center transition-all",
                            isCompleted
                              ? isColorLight(activity.color) ? 'text-black shadow-inner' : 'text-white shadow-inner'
                              : "bg-muted hover:bg-muted/80",
                            isPastDate && !isCompleted && "opacity-50 cursor-not-allowed",
                            isPastDate && isCompleted && "opacity-80"
                          )}
                          style={{ backgroundColor: isCompleted ? activity.color : undefined }}
                          aria-label={`Marquer le créneau de ${hour}h comme ${isCompleted ? 'incomplet' : 'complet'}`}
                        >
                          {hour}h
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center py-10 border-2 border-dashed rounded-xl bg-card"
          >
            {totalActivitiesCount === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-foreground">Bienvenue !</h3>
                <p className="mt-2 text-muted-foreground">Prêt à organiser votre journée ?<br/>Créez votre première activité pour commencer.</p>
                <button
                  onClick={() => onGoToSettings()}
                  className="mt-6 inline-flex items-center gap-2 px-6 h-12 bg-primary text-primary-foreground rounded-lg font-semibold text-base hover:bg-primary/90 transition-colors"
                >
                  <PlusCircle className="w-5 h-5" />
                  Créer ma première activité
                </button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Aucune activité prévue pour aujourd'hui.</p>
                <button onClick={() => onGoToSettings()} className="mt-4 text-primary font-semibold hover:underline">
                  Ajouter une activité
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}