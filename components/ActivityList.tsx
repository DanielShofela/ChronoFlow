import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import type { Activity } from '../types';
import { cn } from '../utils';
import { useLanguage } from '../hooks/useLanguage';

interface ActivityListProps {
  activities: Activity[];
  completedSlots: Set<string>;
  selectedDate: Date;
  onSlotToggle: (hour: number) => void;
  showActivityDetails: boolean;
}

export function ActivityList({ activities, completedSlots, selectedDate, onSlotToggle, showActivityDetails }: ActivityListProps) {
  const getSlotKey = (hour: number) => `${format(selectedDate, 'yyyy-MM-dd')}-${hour}`;
  const [expandedActivities, setExpandedActivities] = useState<{ [key: string]: boolean }>({});
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Activités du jour</h3>
      {activities.map(activity => {
        const completedCount = activity.slots.filter(hour =>
          completedSlots.has(getSlotKey(hour))
        ).length;
        const isExpanded = expandedActivities[activity.id] ?? false;

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
                    {completedCount}/{activity.slots.length} complétés
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedActivities(prev => ({ ...prev, [activity.id]: !isExpanded }))}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={isExpanded ? t.hideDetails : t.showDetails}
                >
                  {isExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: activity.color }}
                />
              </div>
            </div>

            <AnimatePresence>
              {(isExpanded || showActivityDetails) && (
                <motion.div
                  className="overflow-hidden"
                  {...{
                    initial: { opacity: 0, height: 0, marginTop: 0 },
                    animate: { opacity: 1, height: 'auto', marginTop: '0.75rem' },
                    exit: { opacity: 0, height: 0, marginTop: 0 },
                    transition: { duration: 0.2, ease: "easeInOut" },
                  }}
                >
                  <div className="flex flex-wrap gap-2">
                    {activity.slots.map(hour => {
                      const isCompleted = completedSlots.has(getSlotKey(hour));

                      return (
                        <motion.button
                          key={hour}
                          onClick={() => onSlotToggle(hour)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                            isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-muted hover:bg-muted/80"
                          )}
                          {...{
                            whileHover: { scale: 1.05 },
                            whileTap: { scale: 0.95 },
                          }}
                        >
                          {hour}h
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}