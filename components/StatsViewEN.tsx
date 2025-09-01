import React, { useMemo, useState } from 'react';
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Activity, CompletedSlot } from '../types';
import { cn } from '../utils';

interface Interval {
  start: Date;
  end: Date;
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
    No data for this period
  </div>
);

export function StatsViewEN({ activities, completedSlots, selectedDate, onBack }: StatsViewProps) {
  const [period, setPeriod] = useState<Period>('day');

  const stats = useMemo(() => {
    const options = { locale: enUS };
    let interval: Interval;
    let periodTitle: string;
    let trendChartType: 'bar' | 'line' = 'bar';

    // Manual implementation for 'en' locale (Monday start).
    const getStartOfWeek = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const start = new Date(d.setDate(diff));
      start.setHours(0, 0, 0, 0);
      return start;
    };

    switch (period) {
      case 'week':
        interval = { start: getStartOfWeek(selectedDate), end: endOfWeek(selectedDate, options) };
        periodTitle = `Week of ${format(interval.start, 'MMM d')} to ${format(interval.end, 'MMM d, yyyy', options)}`;
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
        interval = { start: selectedDate, end: selectedDate };
        periodTitle = format(selectedDate, 'MMMM d, yyyy', options);
        break;
    }

    const periodCompletedSlots = completedSlots.filter(slot => {
        const [year, month, day] = slot.date.split('-').map(Number);
        const slotDate = new Date(year, month - 1, day);
        return isWithinInterval(slotDate, interval);
    });
    const daysInPeriod = differenceInCalendarDays(interval.end, interval.start) + 1;
    const dailyPlanned = activities.reduce((sum, act) => sum + act.slots.length, 0);
    const totalPlanned = daysInPeriod * dailyPlanned;
    const totalCompleted = periodCompletedSlots.length;
    const overallCompletion = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

    const activityStats = activities.map(activity => {
      const planned = activity.slots.length * daysInPeriod;
      const completed = periodCompletedSlots.filter(slot => {
        const activityForSlot = activities.find(a => a.slots.includes(slot.hour));
        return activityForSlot?.id === activity.id;
      }).length;
      return { id: activity.id, name: activity.name, color: activity.color, planned, completed };
    });

    const completedCounts: { [key: string]: number } = {};
    periodCompletedSlots.forEach(slot => {
      const activityForSlot = activities.find(a => a.slots.includes(slot.hour));
      if (activityForSlot) {
        completedCounts[activityForSlot.id] = (completedCounts[activityForSlot.id] || 0) + 1;
      }
    });
    
    let mostFrequentActivity = 'None';
    if(Object.keys(completedCounts).length > 0) {
      const mostFrequentActivityId = Object.keys(completedCounts).reduce((a, b) => completedCounts[a] > completedCounts[b] ? a : b);
      mostFrequentActivity = activities.find(a => a.id === mostFrequentActivityId)?.name || 'None';
    }
    
    const pieData = activityStats.filter(stat => stat.completed > 0).map(stat => ({ name: stat.name, value: stat.completed, color: stat.color }));
    const barData = activityStats.map(stat => ({ name: stat.name, Planned: stat.planned, Completed: stat.completed }));

    let trendData: { name: string; Completed: number }[] = [];
    if (period === 'week') {
      trendData = eachDayOfInterval(interval).map(day => ({ name: format(day, 'EEE', options), Completed: periodCompletedSlots.filter(s => s.date === format(day, 'yyyy-MM-dd')).length }));
    } else if (period === 'month') {
      trendData = eachDayOfInterval(interval).map(day => ({ name: format(day, 'd'), Completed: periodCompletedSlots.filter(s => s.date === format(day, 'yyyy-MM-dd')).length }));
    } else if (period === 'year') {
      trendData = eachMonthOfInterval(interval).map(month => ({ name: format(month, 'MMM', options), Completed: periodCompletedSlots.filter(s => s.date.startsWith(format(month, 'yyyy-MM'))).length }));
    } else { // Day
       trendData = activities.map(act => ({ name: act.name, Completed: act.slots.filter(h => periodCompletedSlots.some(s => s.hour === h)).length })).filter(d => d.Completed > 0);
    }
    
    return { periodTitle, totalPlanned, totalCompleted, overallCompletion, mostFrequentActivity, pieData, barData, trendData, trendChartType };
  }, [activities, completedSlots, selectedDate, period]);

  const periods: { key: Period, label: string }[] = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <motion.div
      className="space-y-6"
      {...{
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"><ArrowLeft className="w-5 h-5" /></button>
          <h2 className="text-2xl font-bold">Statistics: {stats.periodTitle}</h2>
        </div>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg self-end sm:self-center">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn("px-3 py-1 text-sm font-medium rounded-md transition-colors whitespace-nowrap", period === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Time completed" value={`${stats.totalCompleted}h`} />
        <StatCard title="Time planned" value={`${stats.totalPlanned}h`} />
        <StatCard title="% Completion" value={`${stats.overallCompletion}%`} />
        <StatCard title="Main activity" value={stats.mostFrequentActivity} />
      </div>

      <div className="p-6 rounded-xl border bg-card">
        <h3 className="text-lg font-semibold mb-4">Trend over period</h3>
        {stats.trendData.length > 0 && stats.totalCompleted > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            {period === 'month' ? (
                <LineChart data={stats.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Hours" />
                </LineChart>
            ) : (
                <BarChart data={stats.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                    <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Hours" />
                </BarChart>
            )}
          </ResponsiveContainer>
        ) : <NoDataPlaceholder />}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Distribution of completed time</h3>
          {stats.pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {stats.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}h`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoDataPlaceholder />}
        </div>

        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-lg font-semibold mb-4">Planned vs Completed by activity</h3>
          {stats.barData.some(d => d.Planned > 0 || d.Completed > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.barData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={50} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="Planned" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          ) : <NoDataPlaceholder />}
        </div>
      </div>
    </motion.div>
  );
}