import React from 'react';
import { Home, BarChart3, Settings, HelpCircle } from 'lucide-react';
import type { ViewType } from '../types';
import { cn } from '../utils';

interface BottomNavBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const navItems = [
  { view: 'main' as ViewType, label: 'Accueil', icon: Home },
  { view: 'stats' as ViewType, label: 'Stats', icon: BarChart3 },
  { view: 'settings' as ViewType, label: 'Activités', icon: Settings },
  { view: 'faq' as ViewType, label: 'Aide', icon: HelpCircle },
];

export function BottomNavBar({ currentView, onNavigate }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-card border-t z-40 md:hidden">
      <div className="max-w-7xl mx-auto h-full flex">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-nav-inactive hover:text-nav-active transition-colors relative"
            aria-current={currentView === item.view ? 'page' : undefined}
          >
            <item.icon className={cn("w-6 h-6", currentView === item.view && "text-nav-active")} />
            <span className={cn("text-sm font-medium", currentView === item.view && "text-nav-active")}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
