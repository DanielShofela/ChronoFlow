import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import type { Activity } from '../types';
import { GroupSelectionBubble } from './GroupSelectionBubble';

// Durée du maintien pour activer la sélection (en ms)
const LONG_PRESS_DURATION = 500;

interface Clock24hProps {
  activities: Activity[];
  completedSlots: Set<string>;
  selectedDate: Date;
  onSlotToggle: (hour: number) => void;
  currentTime: Date;
  isPastDate: boolean;
}

export function Clock24h({ activities, completedSlots, selectedDate, onSlotToggle, currentTime, isPastDate }: Clock24hProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(380);
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [groupSelectionStart, setGroupSelectionStart] = useState<number | null>(null);
  const [lastTouchedHour, setLastTouchedHour] = useState<number | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const [showGroupBubble, setShowGroupBubble] = useState(false);

  // Fonction pour sélectionner une plage d'heures
  const selectHourRange = useCallback((startHour: number, endHour: number) => {
    const minHour = Math.min(startHour, endHour);
    const maxHour = Math.max(startHour, endHour);
    
    for (let hour = minHour; hour <= maxHour; hour++) {
      if (!completedSlots.has(getSlotKey(hour))) {
        onSlotToggle(hour);
      }
    }
  }, [completedSlots, onSlotToggle]);

  // Fonction pour déclencher la vibration
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width } = entries[0].contentRect;
        // Set min and max size for the clock for optimal viewing
        const newSize = Math.max(250, Math.min(width, 420));
        setSize(newSize);
      }
    });

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const center = size / 2;
  
  const activityRadius = size * 0.37; // ~140 on 380px
  const tickStartRadius = size * 0.38; // ~145 on 380px
  const tickEndRadius = size * 0.41; // ~155 on 380px
  const numberRadius = size * 0.45; // ~170 on 380px
  const clockHandLength = size * 0.37; // ~140 on 380px
  const innerRadius = size * 0.18; // ~70 on 380px

  const getSlotKey = (hour: number) => `${format(selectedDate, 'yyyy-MM-dd')}-${hour}`;

  const getSectorPath = (hour: number) => {
    const startAngle = ((hour - 6) * 15 - 0.5) * (Math.PI / 180);
    const endAngle = (((hour + 1) - 6) * 15 - 0.5) * (Math.PI / 180);
    
    const x1 = center + activityRadius * Math.cos(startAngle);
    const y1 = center + activityRadius * Math.sin(startAngle);
    const x2 = center + activityRadius * Math.cos(endAngle);
    const y2 = center + activityRadius * Math.sin(endAngle);
    
    const ix1 = center + innerRadius * Math.cos(startAngle);
    const iy1 = center + innerRadius * Math.sin(startAngle);
    const ix2 = center + innerRadius * Math.cos(endAngle);
    const iy2 = center + innerRadius * Math.sin(endAngle);

    return `M ${ix1} ${iy1} L ${x1} ${y1} A ${activityRadius} ${activityRadius} 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 0 0 ${ix1} ${iy1} Z`;
  };

  const getActivityForHour = (hour: number) => {
    return activities.find(activity => activity.slots.includes(hour));
  };

  const isCompleted = (hour: number) => {
    return completedSlots.has(getSlotKey(hour));
  };
  
  const showClockHand = isToday(selectedDate);
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const handAngle = ((currentHour + currentMinute / 60) - 6) * 15;

  return (
    <div className="relative w-full h-auto flex justify-center" ref={containerRef}>
      <GroupSelectionBubble
        show={showGroupBubble}
        startHour={groupSelectionStart || 0}
        endHour={lastTouchedHour}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation={size * 0.009} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Clock face background */}
        <circle cx={center} cy={center} r={activityRadius + (size * 0.052)} fill="hsl(var(--muted))" />
        <circle cx={center} cy={center} r={activityRadius + (size * 0.047)} fill="hsl(var(--background))" />
        
        {/* Secteurs horaires */}
        <g>
          {Array.from({ length: 24 }, (_, i) => {
            const activity = getActivityForHour(i);
            const completed = isCompleted(i);
            
            return (
              <motion.g
                key={i}
                className={!isPastDate ? 'cursor-pointer touch-none' : 'cursor-not-allowed touch-none'}
                onClick={!isPastDate && !('ontouchstart' in window) ? () => onSlotToggle(i) : undefined}
                onTouchStart={(e) => {
                  if (isPastDate) return;
                  e.preventDefault();
                  const hour = i;
                  setLastTouchedHour(hour);
                  setGroupSelectionStart(hour);
                  longPressTimer.current = window.setTimeout(() => {
                    vibrate();
                    setIsSelectionActive(true);
                    setShowGroupBubble(true);
                    onSlotToggle(hour);
                  }, LONG_PRESS_DURATION);
                }}
                onTouchMove={(e) => {
                  if (isPastDate || !isSelectionActive || groupSelectionStart === null) return;
                  e.preventDefault();
                  const touch = e.touches[0];
                  const element = document.elementFromPoint(touch.clientX, touch.clientY);
                  const hourElement = element?.closest('g[data-hour]');
                  if (hourElement) {
                    const hour = parseInt(hourElement.getAttribute('data-hour') || '', 10);
                    if (!isNaN(hour) && hour !== lastTouchedHour) {
                      setLastTouchedHour(hour);
                      selectHourRange(groupSelectionStart, hour);
                    }
                  }
                }}
                onTouchEnd={() => {
                  if (isPastDate) return;
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                  setIsSelectionActive(false);
                  setShowGroupBubble(false);
                  setGroupSelectionStart(null);
                  setLastTouchedHour(null);
                }}
                onTouchCancel={() => {
                  if (isPastDate) return;
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                  setIsSelectionActive(false);
                  setShowGroupBubble(false);
                  setGroupSelectionStart(null);
                  setLastTouchedHour(null);
                }}
                data-hour={i}
                {...{ whileHover: !isPastDate ? { scale: 1.03 } : {} }}
                style={{ transformOrigin: 'center center' }}
              >
                <path
                  d={getSectorPath(i)}
                  fill={activity ? activity.color : 'hsl(var(--muted))'}
                  fillOpacity={completed ? 1 : (activity ? 0.4 : 0.2)}
                  stroke={'hsl(var(--background))'}
                  strokeWidth="2"
                  style={{
                    ...showClockHand && i === currentHour ? { filter: 'url(#glow)' } : {},
                    ...(isSelectionActive && i === lastTouchedHour) ? { filter: 'brightness(1.2)' } : {}
                  }}
                />
              </motion.g>
            );
          })}
        </g>

        {/* Traits de graduation et numéros */}
        <g className="pointer-events-none">
          {Array.from({ length: 24 }, (_, i) => {
            const angle = ((i - 6) * 15) * (Math.PI / 180);
            const isMajorTick = i % 3 === 0;
            const startR = isMajorTick ? tickStartRadius - (size * 0.013) : tickStartRadius;
            const x1 = center + startR * Math.cos(angle);
            const y1 = center + startR * Math.sin(angle);
            const x2 = center + tickEndRadius * Math.cos(angle);
            const y2 = center + tickEndRadius * Math.sin(angle);
            
            const numX = center + numberRadius * Math.cos(angle);
            const numY = center + numberRadius * Math.sin(angle);
            
            return (
              <g key={`tick-${i}`}>
                <line
                  x1={x1} y1={y1}
                  x2={x2} y2={y2}
                  className="stroke-muted-foreground"
                  strokeWidth={isMajorTick ? "2" : "1"}
                />
                {isMajorTick && (
                  <text
                    x={numX} y={numY}
                    textAnchor="middle" dominantBaseline="middle"
                    className="font-bold fill-foreground"
                    style={{ fontSize: Math.max(8, size * 0.037) }} // ~14px on 380px
                  >
                    {i}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        
        {/* Central display */}
        <g className="pointer-events-none">
          <circle cx={center} cy={center} r={size * 0.17} fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="1" />
          {showClockHand ? (
             <text textAnchor="middle" dominantBaseline="central" className="fill-foreground">
                <tspan x={center} y={center - (size * 0.021)} className="font-bold tracking-tighter" style={{ fontSize: Math.max(24, size * 0.095) }}>{format(currentTime, 'HH:mm')}</tspan>
                <tspan x={center} y={center + (size * 0.047)} className="font-medium uppercase text-muted-foreground" style={{ fontSize: Math.max(8, size * 0.037) }}>{format(currentTime, 'eee dd MMM', { locale: fr })}</tspan>
            </text>
          ) : (
            <text textAnchor="middle" dominantBaseline="central" className="fill-foreground">
                <tspan x={center} y={center} className="font-semibold uppercase" style={{ fontSize: Math.max(12, size * 0.047) }}>{format(selectedDate, 'eee dd MMM', { locale: fr })}</tspan>
            </text>
          )}
        </g>
        
        {/* Clock Hand */}
        {showClockHand && (
            <g transform={`rotate(${handAngle} ${center} ${center})`}>
              <line
                x1={center} y1={center}
                x2={center + clockHandLength} y2={center}
                className="stroke-primary"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx={center} cy={center} r={size * 0.01} className="fill-primary" />
            </g>
        )}
      </svg>
    </div>
  );
}