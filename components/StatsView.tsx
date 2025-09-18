import React, { useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDay,
  isWithinInterval,
  startOfDay,
  subDays,
} from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Trophy } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { Activity, CompletedSlot } from '../types';
import { cn } from '../utils';

interface Interval {
  start: Date | number;
  end: Date | number;
}

interface StatsViewProps {
  activities: Activity[];
  completedSlots: CompletedSlot[];
  selectedDate: Date;
  onBack: () => void;
}

type Period = 'day' | 'week' | 'month' | 'year';

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="p-4 rounded-xl border bg-card">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="text-2xl font-bold truncate">{value}</p>
  </div>
);

const NoDataPlaceholder = () => (
  <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
    Aucune donnée pour cette période
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

export default function StatsView({ activities, completedSlots, selectedDate, onBack }: StatsViewProps) {
  const [period, setPeriod] = useState<Period>('day');
  const options = { locale: fr };

  const stats = useMemo(() => {
    let interval: Interval;
    let periodTitle: string;
    let trendChartType: 'bar' | 'line' = 'line';

    if (period === 'week') {
      interval = {
        start: startOfDay(selectedDate),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      };
      periodTitle = "Cette semaine";
    } else if (period === 'month') {
      interval = {
        start: startOfDay(selectedDate),
        end: endOfMonth(selectedDate),
      };
      periodTitle = "Ce mois";
    } else if (period === 'year') {
      interval = {
        start: startOfDay(selectedDate),
        end: endOfYear(selectedDate),
      };
      periodTitle = "Cette année";
    } else {
      interval = {
        start: startOfDay(selectedDate),
        end: startOfDay(selectedDate),
      };
      periodTitle = format(selectedDate, 'dd MMMM yyyy', options);
      trendChartType = 'bar';
    }

    const periodCompletedSlots = completedSlots.filter(slot =>
      isWithinInterval(new Date(slot.date), interval)
    );

    const totalPlanned = activities.reduce((sum, activity) => {
      if (activity.isArchived) return sum;

      if (activity.isRecurring) {
        return sum + activity.slots.length;
      } else {
        if (isWithinInterval(new Date(activity.specificDate as string), interval)) {
          return sum + activity.slots.length;
        }
      }
      return sum;
    }, 0);

    const totalCompleted = periodCompletedSlots.length;
    const overallCompletion = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

    const activityStats = activities.map(activity => {
      const slots = activity.slots;
      if (activity.isArchived || slots.length === 0) {
        return { id: activity.id, name: activity.name, color: activity.color, planned: 0, completed: 0 };
      }

      const planned = slots.length;
      const completed = slots.filter(hour => {
        const activityForSlot = activities.find(a => 
           !a.isArchived && a.slots.includes(hour) && a.id === activity.id
        );
        return !!activityForSlot;
      }).length;

      return { id: activity.id, name: activity.name, color: activity.color, planned, completed };
    });

    const completedCounts: { [key: string]: number } = {};
    periodCompletedSlots.forEach(slot => {
       const activity = activities.find(a => !a.isArchived && a.slots.includes(slot.hour));
       if(activity) {
         completedCounts[activity.id] = (completedCounts[activity.id] || 0) + 1;
       }
    });
    
    let mostFrequentActivity = 'Aucune';
    if(Object.keys(completedCounts).length > 0) {
      const mostFrequentActivityId = Object.keys(completedCounts).reduce((a, b) => completedCounts[a] > completedCounts[b] ? a : b);
      mostFrequentActivity = activities.find(a => a.id === mostFrequentActivityId)?.name || 'Aucune';
    }
    
    const pieData = activityStats.filter(stat => stat.completed > 0).map(stat => ({ 
      name: stat.name, 
      value: stat.completed, 
      color: stat.color 
    }));

    const barData = activityStats
      .filter(s => s.planned > 0 || s.completed > 0)
      .map(stat => ({ 
        name: stat.name, 
        Prévu: stat.planned, 
        Réalisé: stat.completed 
    }));

    let trendData: { name: string; Réalisé: number }[] = [];
    if (period === 'week') {
      trendData = eachDayOfInterval(interval).map(day => ({ 
        name: format(day, 'eee', options), 
        Réalisé: periodCompletedSlots.filter(s => s.date === format(day, 'yyyy-MM-dd')).length 
      }));
    } else if (period === 'month') {
      trendData = eachDayOfInterval(interval).map(day => ({ 
        name: format(day, 'd'), 
        Réalisé: periodCompletedSlots.filter(s => s.date === format(day, 'yyyy-MM-dd')).length 
      }));
    } else if (period === 'year') {
      trendData = eachMonthOfInterval(interval).map(month => ({ 
        name: format(month, 'MMM', options), 
        Réalisé: periodCompletedSlots.filter(s => s.date.startsWith(format(month, 'yyyy-MM'))).length 
      }));
    } else {
       trendData = activities
        .filter(a => !a.isArchived)
        .map(act => ({ 
          name: act.name, 
          Réalisé: act.slots.filter(h => periodCompletedSlots.some(s => s.hour === h && s.date === format(selectedDate, 'yyyy-MM-dd'))).length 
        }))
        .filter(d => d.Réalisé > 0);
    }

    // Calculate streaks
    const streakData = activities.map(activity => {
      if (activity.isArchived) {
        return { id: activity.id, name: activity.name, current: 0, longest: 0 };
      }

      let currentStreak = 0;
      let longestStreak = 0;
      let checkDate = startOfDay(new Date());

      for (let i = 0; i < 365; i++) {
        const dateKey = format(checkDate, 'yyyy-MM-dd');
        const dayOfWeek = getDay(checkDate);
        const isRecurring = activity.isRecurring ?? true;
        
        let isPlanned = false;
        if (isRecurring) {
          isPlanned = activity.days?.includes(dayOfWeek) ?? false;
        } else {
          isPlanned = activity.specificDate === dateKey;
        }

        if (isPlanned) {
          const isCompleted = activity.slots.every(slot => {
            return completedSlots.some(cs => cs.date === dateKey && cs.hour === slot);
          });

          if (isCompleted) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            break;
          }
        }
        checkDate = subDays(checkDate, 1);
      }

      return {
        id: activity.id,
        name: activity.name,
        current: currentStreak,
        longest: longestStreak
      };
    }).sort((a, b) => b.current - a.current);

    return {
      periodTitle,
      totalPlanned,
      totalCompleted,
      overallCompletion,
      mostFrequentActivity,
      pieData,
      barData,
      trendData,
      trendChartType,
      streakData
    };
  }, [period, selectedDate, activities, completedSlots, options]);

  if (!stats) {
    return null;
  }

  const hasData = stats.totalCompleted > 0;

  return (
    <motion.div
      className="space-y-6 pb-20"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">Statistiques</h2>
      </div>

      <div className="p-2 rounded-lg bg-muted inline-flex items-center gap-1">
        {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-3 py-1 rounded-md transition-colors",
              period === p ? "bg-background shadow-sm" : "hover:bg-background/50"
            )}
          >
            {p === 'day' ? 'Jour' :
             p === 'week' ? 'Semaine' :
             p === 'month' ? 'Mois' : 'Année'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Créneaux planifiés"
          value={stats.totalPlanned}
        />
        <StatCard
          title="Créneaux complétés"
          value={stats.totalCompleted}
        />
        <StatCard
          title="Taux de complétion"
          value={`${stats.overallCompletion}%`}
        />
        <StatCard
          title="Activité la plus fréquente"
          value={stats.mostFrequentActivity}
        />
      </div>

      {hasData ? (
        <div className="space-y-6">
          {/* Affichage des séries */}
          {stats.streakData.length > 0 && (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {stats.streakData.map(streak => (
                streak.current > 0 && (
                  <motion.div
                    key={streak.id}
                    className="p-4 rounded-xl border bg-card"
                    variants={itemVariants}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{streak.name}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-amber-500" title="Série actuelle">
                          <Flame className="w-4 h-4" />
                          <span>{streak.current}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-500" title="Plus longue série">
                          <Trophy className="w-4 h-4" />
                          <span>{streak.longest}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </motion.div>
          )}

          {/* Graphique circulaire */}
          {stats.pieData.length > 0 && (
            <div className="p-6 rounded-xl border bg-card">
              <h3 className="text-lg font-semibold mb-4">Répartition des activités</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Graphique en barres */}
          {stats.barData.length > 0 && (
            <div className="p-6 rounded-xl border bg-card">
              <h3 className="text-lg font-semibold mb-4">Planifié vs Réalisé</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Prévu" fill="#94a3b8" />
                    <Bar dataKey="Réalisé" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Graphique de tendance */}
          {stats.trendData.length > 0 && (
            <div className="p-6 rounded-xl border bg-card">
              <h3 className="text-lg font-semibold mb-4">Tendance</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {stats.trendChartType === 'line' ? (
                    <LineChart data={stats.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Réalisé" stroke="#22c55e" />
                    </LineChart>
                  ) : (
                    <BarChart data={stats.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Réalisé" fill="#22c55e" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <NoDataPlaceholder />
      )}
    </motion.div>
  );
}