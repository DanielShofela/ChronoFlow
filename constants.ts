import type { Activity } from './types';

export const defaultActivities: Activity[] = [
  { id: '1', name: 'Sommeil', icon: '😴', color: '#8b5cf6', slots: [0, 1, 2, 3, 4, 5] },
  { id: '2', name: 'Travail', icon: '💼', color: '#3b82f6', slots: [9, 10, 11, 12, 13, 14, 15, 16] },
  { id: '3', name: 'Sport', icon: '🏃', color: '#10b981', slots: [17] },
  { id: '4', name: 'Culture', icon: '📚', color: '#6366f1', slots: [18, 19, 20] },
  { id: '5', name: 'Ménage', icon: '🧹', color: '#64748b', slots: [7, 8] },
  { id: '6', name: 'Faith', icon: '🧘', color: '#ef4444', slots: [6, 21, 22, 23] }
];

export const predefinedColors = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#ec4899', '#f97316', '#84cc16', '#06b6d4', '#d946ef', '#64748b'
];