import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import type { Activity } from '../types';
import { cn } from '../utils';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ActivityListProps {
  activities: Activity[];
  completedSlots: Set<string>;
  selectedDate: Date;
  onSlotToggle: (hour: number) => void;
  showActivityDetails: boolean;
}

export function ActivityList({ activities, completedSlots, selectedDate, onSlotToggle, showActivityDetails }: ActivityListProps) {
  const getSlotKey = (hour: number) => `${format(selectedDate, 'yyyy-MM-dd')}-${hour}`;
  
  // État pour gérer la visibilité des heures de chaque activité
  // Par défaut, toutes les heures sont masquées
  const [hiddenHours, setHiddenHours] = useState<{ [key: string]: boolean }>(() => {
    // Créer un objet avec tous les IDs d'activités définis à true (masqués)
    return activities.reduce((acc, activity) => {
      acc[activity.id] = true;
      return acc;
    }, {} as { [key: string]: boolean });
  });
  const { t } = useLanguage();
  
  // Fonction pour basculer la visibilité des heures d'une activité
  const toggleHoursVisibility = (activityId: string) => {
    setHiddenHours(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t.dailyActivities}</h3>
      {activities.map(activity => {
        const completedCount = activity.slots.filter(hour =>
          completedSlots.has(getSlotKey(hour))
        ).length;

        return (
          <motion.div
            key={activity.id}
            className="p-4 rounded-xl border bg-card"
            {...{
              layout: true,
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.3 },
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activity.icon}</span>
                <div>
                  <h4 className="font-medium">{activity.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {completedCount}/{activity.slots.length} {t.completed}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleHoursVisibility(activity.id)}
                  className={`p-1 transition-colors ${hiddenHours[activity.id] ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  aria-label={t.toggleVisibility}
                  title={t.toggleVisibility}
                >
                  {hiddenHours[activity.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: activity.color }}
                />
              </div>
            </div>

            <AnimatePresence>
              {showActivityDetails && (
                <motion.div
                  className="overflow-hidden"
                  {...{
                    initial: { opacity: 0, height: 0, marginTop: 0 },
                    animate: { opacity: 1, height: 'auto', marginTop: '0.75rem' },
                    exit: { opacity: 0, height: 0, marginTop: 0 },
                    transition: { duration: 0.2, ease: "easeInOut" },
                  }}
                >
                  {/* N'afficher les heures que si l'activité n'est pas masquée */}
                  {!hiddenHours[activity.id] && (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // Déterminer quels créneaux afficher en fonction de l'état du masquage
                        // Toujours afficher uniquement les créneaux sélectionnés (activity.slots)
                        let slotsToDisplay = [...activity.slots];
                        
                        // Toujours trier les créneaux par ordre croissant
                        slotsToDisplay.sort((a, b) => a - b);
                      
                      return slotsToDisplay.map(hour => {
                        const isCompleted = completedSlots.has(getSlotKey(hour));
                        const isSelected = activity.slots.includes(hour);
                        
                        // Style des boutons d'heures
                        const buttonStyle = isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-muted hover:bg-muted/80";
                        
                        return (
                          <motion.button
                            key={hour}
                            onClick={() => onSlotToggle(hour)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                              buttonStyle
                            )}
                            {...{
                              whileHover: { scale: 1.05 },
                              whileTap: { scale: 0.95 },
                            }}
                          >
                            {hour}h
                          </motion.button>
                        );
                      });
                    })()} 
                  </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}