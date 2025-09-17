export interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  slots: number[];
  days: number[]; // Used for weekly recurring activities
  isArchived?: boolean;
  reminderMinutes?: number;
  isRecurring?: boolean; // True for weekly, false for single-date
  specificDate?: string; // 'yyyy-MM-dd' for single-date activities
}

export interface CompletedSlot {
  date: string;
  hour: number;
}

export type ViewType = 'main' | 'settings' | 'stats' | 'faq';

export interface Verse {
  text: string;
  author: string;
}
