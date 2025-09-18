import type { Activity } from './types';

export const defaultActivities: Activity[] = [];

export const predefinedColors = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#ec4899', '#f97316', '#84cc16', '#06b6d4', '#d946ef', '#64748b'
];

export const LOCAL_STORAGE_KEYS = {
  customColors: 'chronoflow:custom-colors',
  deletedCustomColors: 'chronoflow:deleted-custom-colors',
};