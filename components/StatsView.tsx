import React, { useMemo, useState } from 'react';
import {
  addDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDay,
  isWithinInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

export function StatsView({ activities, completedSlots, selectedDate, onBack }: StatsViewProps) {
  const [period, setPeriod] = useState<Period>('day');

  const stats = useMemo(() => {
    const options = { locale: fr };
    let interval: Interval;
    let periodTitle: string;
    let trendChartType: 'bar' | 'line' = 'bar';

    const getStartOfWeek = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      start.setHours(0, 0, 0, 0);
      return start;
    };

    switch (period) {
      case 'week':
        interval = { start: getStartOfWeek(selectedDate), end: endOfWeek(selectedDate, options) };
        periodTitle = `Semaine du ${format(interval.start, 'd MMM')} au ${format(interval.end, 'd MMM yyyy', options)}`;
        break;
      case 'month':
        interval = { start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), end: endOfMonth(selectedDate) };
        periodTitle = format(selectedDate, 'MMMM yyyy', options);
        trendChartType = 'line';
        break;
      case 'year':
        interval = { start: new Date(selectedDate.getFullYear(), 0, 1), end: endOfYear(selectedDate) };
        periodTitle = format(selectedDate, 'yyyy', options);
        break;
      case 'day':
      default:
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        interval = { start: startOfDay, end: endOfDay };
        periodTitle = format(selectedDate, 'dd MMMM yyyy', options);
        break;
    }

    const periodCompletedSlots = completedSlots.filter(slot => {
        const [year, month, day] = slot.date.split('-').map(Number);
        const slotDate = new Date(year, month - 1, day);
        return isWithinInterval(slotDate, interval);
    });
    
    const periodDays = eachDayOfInterval(interval);
    
    const totalPlanned = periodDays.reduce((total, day) => {
      const dayOfWeek = getDay(day);
      const dateKey = format(day, 'yyyy-MM-dd');
      const plannedForThisDay = activities
        .filter(act => {
          if (act.isArchived) return false;
          const isRecurring = act.isRecurring ?? true;
          if (isRecurring) {
            return act.days?.includes(dayOfWeek);
          }
          return act.specificDate === dateKey;
        })
        .reduce((sum, act) => sum + act.slots.length, 0);
      return total + plannedForThisDay;
    }, 0);

    const totalCompleted = periodCompletedSlots.length;
    const overallCompletion = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

    const activityStats = activities.filter(a => !a.isArchived).map(activity => {
      const planned = periodDays.reduce((total, day) => {
        const dayOfWeek = getDay(day);
        const dateKey = format(day, 'yyyy-MM-dd');
        const isRecurring = activity.isRecurring ?? true;
        let isPlanned = false;
        if (isRecurring) {
          isPlanned = activity.days?.includes(dayOfWeek);
        } else {
          isPlanned = activity.specificDate === dateKey;
        }

        if (isPlanned) {
            return total + activity.slots.length;
        }
        return total;
      }, 0);
      
      const completed = periodCompletedSlots.filter(slot => {
         const activityForSlot = activities.find(a => a.id === activity.id && a.slots.includes(slot.hour));
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
    
    const pieData = activityStats.filter(stat => stat.completed > 0).map(stat => ({ name: stat.name, value: stat.completed, color: stat.color }));
    const barData = activityStats.filter(s => s.planned > 0 || s.completed > 0).map(stat => ({ name: stat.name, Prévu: stat.planned, Réalisé: stat.completed }));

    let trendData: { name: string; Réalisé: number }[] = [];
    if (period === 'week') {
      trendData = eachDayOfInterval(interval).map(day => ({ name: format(day, 'eee', options), Réalisé: periodCompletedSlots.filter(s => s.date === format(day, 'yyyy-MM-dd')).length }));
    } else if (period === 'month') {
      trendData = eachDayOfInterval(interval).map(day => ({ name: format(day, 'd'), Réalisé: periodCompletedSlots.filter(s => s.date === format(day, 'yyyy-MM-dd')).length }));
    } else if (period === 'year') {
      trendData = eachMonthOfInterval(interval).map(month => ({ name: format(month, 'MMM', options), Réalisé: periodCompletedSlots.filter(s => s.date.startsWith(format(month, 'yyyy-MM'))).length }));
    } else { // Day
       trendData = activities.filter(a => !a.isArchived).map(act => ({ name: act.name, Réalisé: act.slots.filter(h => periodCompletedSlots.some(s => s.hour === h && s.date === format(selectedDate, 'yyyy-MM-dd'))).length })).filter(d => d.Réalisé > 0);
    }
    
    const completedSlotsByActivityAndDate = activities.reduce((acc, activity) => {
        acc[activity.id] = new Set<string>();
        return acc;
    }, {} as Record<string, Set<string>>);

    completedSlots.forEach(slot => {
        const activityForSlot = activities.find(a => a.slots.includes(slot.hour));
        if (activityForSlot) {
            completedSlotsByActivityAndDate[activityForSlot.id].add(slot.date);
        }
    });
    
    const isActivityCompletedOnDate = (activity: Activity, date: Date, completedDates: Set<string>): boolean => {
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!completedDates.has(dateKey)) return false; // Basic check first
      if (activity.slots.length === 0) return true; // Or false based on definition
      
      const completedSlotsForDay = completedSlots.filter(cs => cs.date === dateKey);
      const activitySlotsCompleted = completedSlotsForDay.filter(cs => activity.slots.includes(cs.hour));
      
      return activitySlotsCompleted.length >= activity.slots.length;
    };

    const streakData = activities
      .filter(act => !act.isArchived)
      .map(activity => {
        const completedDates = new Set(completedSlots.filter(cs => {
            const actForSlot = activities.find(a => a.id === activity.id);
            return actForSlot && actForSlot.slots.includes(cs.hour);
        }).map(cs => cs.date));
        
        // Current Streak Calculation
        let currentStreak = 0;
        let dateToCheck = new Date(selectedDate);
        for (let i = 0; i < 365 * 5; i++) { // Look back max 5 years
            const dateKey = format(dateToCheck, 'yyyy-MM-dd');
            const dayOfWeek = getDay(dateToCheck);
            const isRecurring = activity.isRecurring ?? true;
            let isPlanned = false;
            if(isRecurring) {
                isPlanned = activity.days.includes(dayOfWeek);
            } else {
                isPlanned = activity.specificDate === dateKey;
            }

            if (isPlanned) {
                if (isActivityCompletedOnDate(activity, dateToCheck, completedDates)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
            dateToCheck = addDays(dateToCheck, -1);
        }

        // Longest Streak Calculation
        let longestStreak = 0;
        let localCurrentStreak = 0;
        const sortedDates = Array.from(completedDates).map(d => new Date(d)).sort((a,b) => a.getTime() - b.getTime());
        if(sortedDates.length > 0){
             const allDaysInRange = eachDayOfInterval({ start: sortedDates[0], end: new Date() });
             for(const day of allDaysInRange){
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayOfWeek = getDay(day);
                const isRecurring = activity.isRecurring ?? true;
                let isPlanned = false;
                 if(isRecurring) {
                    isPlanned = activity.days.includes(dayOfWeek);
                } else {
                    isPlanned = activity.specificDate === dateKey;
                }
                
                if (isPlanned) {
                    if (isActivityCompletedOnDate(activity, day, completedDates)) {
                        localCurrentStreak++;
                    } else {
                        localCurrentStreak = 0; // Reset streak if a planned day is missed
                    }
                }
                longestStreak = Math.max(longestStreak, localCurrentStreak);
             }
        }

        return { id: activity.id, name: activity.name, current: currentStreak, longest: longestStreak };
    });
    
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
  }, [period, selectedDate, activities, completedSlots]);

  if (!stats) return null;
  const hasData = stats.totalCompleted > 0;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-2xl font-bold">Statistiques</h2>
      </div>
      
       <div className="p-2 rounded-lg bg-muted inline-flex items-center gap-1">
        {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-4 py-1.5 text-sm font-semibold rounded-md capitalize transition-colors", period === p ? 'bg-background shadow-sm' : 'hover:bg-background/50')}>
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
            </button>
        ))}
      </div>
      
      <p className="font-semibold text-muted-foreground">{stats.periodTitle}</p>
      
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Temps prévu" value={`${stats.totalPlanned}h`} />
            <StatCard title="Temps réalisé" value={`${stats.totalCompleted}h`} />
            <StatCard title="Complétion" value={`${stats.overallCompletion}%`} />
            <StatCard title="Activité principale" value={stats.mostFrequentActivity} />
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border bg-card">
              <h3 className="font-semibold mb-4">Répartition du temps réalisé</h3>
              {hasData ? (
                 <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    {/* @fix: Add 'any' type to destructured props to fix TypeScript errors. */}
                    <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} animationDuration={500} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return percent > 0.05 ? (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">{`${(percent * 100).toFixed(0)}%`}</text>) : null;
                    }}>
                      {stats.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip animationDuration={200} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => [`${value}h`, 'Temps réalisé']} />
                    <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize: '12px'}}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <NoDataPlaceholder />}
            </div>
            
            <div className="p-4 rounded-xl border bg-card">
              <h3 className="font-semibold mb-4">Performance par activité</h3>
               {hasData ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.barData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} unit="h" />
                        <Tooltip animationDuration={200} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} cursor={{fill: 'hsl(var(--muted))'}}/>
                        <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize: '12px'}}/>
                        <Bar dataKey="Prévu" fill="#a1a1aa" radius={[4, 4, 0, 0]} animationDuration={500} />
                        <Bar dataKey="Réalisé" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={500} />
                    </BarChart>
                </ResponsiveContainer>
               ) : <NoDataPlaceholder />}
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-6 p-4 rounded-xl border bg-card">
              <h3 className="font-semibold mb-4">Tendance de complétion</h3>
              {hasData ? (
                <ResponsiveContainer width="100%" height={300}>
                    {stats.trendChartType === 'line' ? (
                        <LineChart data={stats.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} unit="h" allowDecimals={false} />
                            <Tooltip animationDuration={200} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                            <Line type="monotone" dataKey="Réalisé" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} animationDuration={500} />
                        </LineChart>
                    ) : (
                         <BarChart data={stats.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} unit="h" allowDecimals={false} />
                            <Tooltip animationDuration={200} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} cursor={{fill: 'hsl(var(--muted))'}}/>
                            <Bar dataKey="Réalisé" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={500} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
              ) : <NoDataPlaceholder />}
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-6 p-4 rounded-xl border bg-card">
              <h3 className="font-semibold mb-4">Séries d'activités</h3>
              <div className="space-y-3">
                  {stats.streakData.filter(s => s.current > 0 || s.longest > 0).length > 0 ? (
                    stats.streakData
                        .filter(s => s.current > 0 || s.longest > 0)
                        .sort((a,b) => b.current - a.current || b.longest - a.longest)
                        .map(streak => (
                            <div key={streak.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="font-medium">{streak.name}</span>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5" title="Série actuelle">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        <span className="font-semibold">{streak.current} j</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground" title="Meilleure série">
                                        <Trophy className="w-4 h-4" />
                                        <span className="font-semibold">{streak.longest} j</span>
                                    </div>
                                </div>
                            </div>
                        ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Commencez à compléter des activités pour voir vos séries !</p>
                  )}
              </div>
          </motion.div>

      </motion.div>
    </motion.div>
  );
}