export interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  slots: number[];
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