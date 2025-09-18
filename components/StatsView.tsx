import React, { useMemo, useState, useEffect } from 'react';
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
import { ArrowLeft, Trophy } from 'lucide-react';
import { StreakFlame } from './StreakFlame';
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

const StatCard = ({ title, value, className }: { title: string; value: string | number; className?: string }) => (
  <div className={cn("p-4 rounded-xl border bg-card", className)}>
    <p className="text-sm text-muted-foreground break-words min-h-[2.5rem]">{title}</p>
    <p className="text-2xl font-bold break-words">{value}</p>
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

export default function StatsView({ activities, completedSlots, selectedDate, onBack }: StatsViewProps) {
  const [period, setPeriod] = useState<Period>('day');
  const [isLoading, setIsLoading] = useState(true);
  
  const options = useMemo(() => ({ locale: fr }), []);
  
    // Calcul des records et des séries
    const records = useMemo(() => {
      const activityStreaks: { [key: string]: number } = {};
      const activityBestDays: { [key: string]: { date: Date; count: number } } = {};

      activities.forEach(activity => {
        if (activity.isArchived) return;

        // Calculer les meilleurs jours
        const activitySlots = completedSlots.filter(slot => 
          activity.slots.includes(slot.hour)
        );

        const slotsByDate = activitySlots.reduce((acc, slot) => {
          const date = slot.date;
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        if (Object.keys(slotsByDate).length > 0) {
          const bestDate = Object.entries(slotsByDate).reduce((max, [date, count]) => 
            count > (max[1] || 0) ? [date, count] : max
          , ['', 0]);

          activityBestDays[activity.id] = {
            date: new Date(bestDate[0]),
            count: bestDate[1]
          };
        }

        // Calculer les séries
        let currentStreak = 0;
        let date = startOfDay(selectedDate);
        
        for (let i = 0; i < 365; i++) {
          const dateStr = format(date, 'yyyy-MM-dd');
          const daySlots = activitySlots.filter(slot => slot.date === dateStr);
          
          if (daySlots.length === activity.slots.length) {
            currentStreak++;
          } else {
            break;
          }
          
          date = subDays(date, 1);
        }

        if (currentStreak > 0) {
          activityStreaks[activity.id] = currentStreak;
        }
      });

      return {
        activityStreaks,
        activityBestDays
      };
    }, [activities, completedSlots, selectedDate]);

    const stats = useMemo(() => {
      let interval: Interval;
      let periodTitle: string;
      let trendChartType: 'bar' | 'line' = 'line';    if (period === 'week') {
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

    // Calculer le nombre de créneaux planifiés dans l'intervalle
    const totalPlanned = activities.reduce((sum, activity) => {
      if (activity.isArchived) {
        return sum;
      }

      // Pour les activités récurrentes
      if (activity.isRecurring ?? true) {
        const daysInInterval = eachDayOfInterval(interval);
        return sum + daysInInterval.reduce((daySum, date) => {
          const dayOfWeek = getDay(date);
          if (activity.days?.includes(dayOfWeek)) {
            return daySum + activity.slots.length;
          }
          return daySum;
        }, 0);
      }
      // Pour les activités ponctuelles
      else if (activity.specificDate) {
        const specificDate = new Date(activity.specificDate);
        if (isWithinInterval(specificDate, interval)) {
          return sum + activity.slots.length;
        }
      }
      return sum;
    }, 0);

    const totalCompleted = periodCompletedSlots.length;
    const overallCompletion = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

    const activityStats = activities
      .filter(activity => !activity.isArchived)
      .map(activity => {
        // Créneaux planifiés pour cette activité dans l'intervalle
        let planned = 0;
        if (activity.isRecurring ?? true) {
          const daysInInterval = eachDayOfInterval(interval);
          planned = daysInInterval.reduce((daySum, date) => {
            const dayOfWeek = getDay(date);
            if (activity.days?.includes(dayOfWeek)) {
              return daySum + activity.slots.length;
            }
            return daySum;
          }, 0);
        } else if (activity.specificDate) {
          const specificDate = new Date(activity.specificDate);
          if (isWithinInterval(specificDate, interval)) {
            planned = activity.slots.length;
          }
        }

        // Créneaux complétés pour cette activité dans l'intervalle
        const completed = periodCompletedSlots.filter(slot => 
          activity.slots.includes(slot.hour)
        ).length;

        return {
          id: activity.id,
          name: activity.name,
          color: activity.color,
          planned,
          completed
        };
      });

    const pieData = activityStats
      .filter(stat => stat.completed > 0)
      .map(stat => {
        const activity = activities.find(a => a.id === stat.id);
        return {
          name: `${activity?.icon} ${activity?.name}`,
          value: stat.completed,
          color: stat.color
        };
      });

    let mostFrequentActivity = 'Aucune';
    if (activityStats.length > 0) {
      const mostFrequent = activityStats.reduce((max, current) =>
        current.completed > max.completed ? current : max
      );
      const activity = activities.find(a => a.id === mostFrequent.id);
      mostFrequentActivity = mostFrequent.completed > 0 ? `${activity?.icon} ${activity?.name}` : 'Aucune';
    }

    const generateTrendData = () => {
      if (period === 'week') {
        return eachDayOfInterval(interval).map(day => ({
          name: format(day, 'eee', options),
          Réalisé: periodCompletedSlots.filter(s => s.date === format(day, 'yyyy-MM-dd')).length
        }));
      } else if (period === 'month') {
        return eachDayOfInterval(interval).map(day => ({
          name: format(day, 'd'),
          Réalisé: periodCompletedSlots.filter(s => s.date === format(day, 'yyyy-MM-dd')).length
        }));
      } else if (period === 'year') {
        return eachMonthOfInterval(interval).map(month => ({
          name: format(month, 'MMM', options),
          Réalisé: periodCompletedSlots.filter(s => s.date.startsWith(format(month, 'yyyy-MM'))).length
        }));
      } else {
        return activityStats.filter(stat => stat.completed > 0).map(stat => {
          const activity = activities.find(a => a.id === stat.id);
          return {
            name: `${activity?.icon} ${activity?.name}`,
            Réalisé: stat.completed
          };
        });
      }
    };

    // Données pour le graphique comparatif
    const comparisonData = activityStats
      .filter(stat => stat.planned > 0 || stat.completed > 0)
      .map(stat => {
        const activity = activities.find(a => a.id === stat.id);
        return {
          name: `${activity?.icon} ${activity?.name}`,
          Prévu: stat.planned,
          Réalisé: stat.completed
        };
      });

    return {
      periodTitle,
      totalPlanned,
      totalCompleted,
      overallCompletion,
      mostFrequentActivity,
      pieData,
      trendChartType,
      trendData: generateTrendData(),
      comparisonData,
    };
  }, [period, selectedDate, activities, completedSlots, options]);

  useEffect(() => {
    if (stats) {
      setIsLoading(false);
    }
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
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

      {hasData ? (
        <div className="space-y-6">
          {/* Stats cards en haut */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <StatCard title="Créneaux planifiés" value={stats.totalPlanned} />
              </div>
              <div className="flex-1">
                <StatCard title="Créneaux complétés" value={stats.totalCompleted} />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <StatCard title="Taux de complétion" value={`${stats.overallCompletion}%`} />
              </div>
              <div className="flex-1">
                <StatCard title="Activité la plus fréquente" value={stats.mostFrequentActivity} />
              </div>
            </div>
          </div>

          {/* Charts dans l'ordre demandé */}
          <div className="space-y-6">
            {/* 1. Graphique circulaire */}
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

            {/* 2. Graphique comparatif Planifié vs Réalisé */}
            {stats.comparisonData.length > 0 && (
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="text-lg font-semibold mb-4">Planifié vs Réalisé</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.comparisonData}>
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

            {/* 3. Graphique de tendance */}
            {stats.trendData.length > 0 && (
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="text-lg font-semibold mb-4">Tendance {stats.periodTitle.toLowerCase()}</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {stats.trendChartType === 'line' ? (
                      <LineChart data={stats.trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Réalisé" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
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

            {/* 4. Records et meilleurs séries */}
            <div className="p-6 rounded-xl border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Records</h3>
              </div>
              
              <div className="space-y-4">
                {activities
                  .filter(activity => !activity.isArchived && 
                    (records.activityStreaks[activity.id] || records.activityBestDays[activity.id]))
                  .map(activity => (
                    <motion.div
                      key={activity.id}
                      className="p-4 rounded-xl border bg-muted space-y-2"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{activity.icon}</span>
                        <h4 className="font-semibold">{activity.name}</h4>
                      </div>
                      
                      <div className="space-y-1">
                        {records.activityStreaks[activity.id] && (
                          <div className="flex items-center gap-2">
                            <StreakFlame streakCount={records.activityStreaks[activity.id]} />
                            <p className="text-sm">
                              <span className="text-muted-foreground">Série actuelle :</span>{' '}
                              <span className="font-medium">{records.activityStreaks[activity.id]} jours</span>
                            </p>
                          </div>
                        )}
                        {records.activityBestDays[activity.id] && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Meilleur jour :</span>{' '}
                            <span className="font-medium">
                              {format(records.activityBestDays[activity.id].date, 'dd MMM yyyy', options)} (
                              {records.activityBestDays[activity.id].count} créneaux)
                            </span>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      ) : (
        <NoDataPlaceholder />
      )}
    </motion.div>
  );
}