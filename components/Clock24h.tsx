import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import type { Activity } from '../types';

interface Clock24hProps {
  activities: Activity[];
  completedSlots: Set<string>;
  selectedDate: Date;
  onSlotToggle: (hour: number) => void;
  currentTime: Date;
}

export function Clock24h({ activities, completedSlots, selectedDate, onSlotToggle, currentTime }: Clock24hProps) {
  const size = 380; // Increased size for better visuals
  const center = size / 2;
  
  const activityRadius = 140;
  const tickStartRadius = 145;
  const tickEndRadius = 155;
  const numberRadius = 170;
  const clockHandLength = 140;

  const getSlotKey = (hour: number) => `${format(selectedDate, 'yyyy-MM-dd')}-${hour}`;

  const getSectorPath = (hour: number) => {
    const startAngle = ((hour - 6) * 15 - 0.5) * (Math.PI / 180); // Add small gap
    const endAngle = (((hour + 1) - 6) * 15 - 0.5) * (Math.PI / 180); // Add small gap
    
    const x1 = center + activityRadius * Math.cos(startAngle);
    const y1 = center + activityRadius * Math.sin(startAngle);
    const x2 = center + activityRadius * Math.cos(endAngle);
    const y2 = center + activityRadius * Math.sin(endAngle);
    
    // Path for a sector of a ring (donut)
    const innerRadius = 70;
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
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Clock face background */}
        <circle cx={center} cy={center} r={activityRadius + 20} fill="hsl(var(--muted))" />
        <circle cx={center} cy={center} r={activityRadius + 18} fill="hsl(var(--background))" />
        
        {/* Secteurs horaires */}
        <g>
          {Array.from({ length: 24 }, (_, i) => {
            const activity = getActivityForHour(i);
            const completed = isCompleted(i);
            
            return (
              <motion.g
                key={i}
                className="cursor-pointer"
                onClick={() => onSlotToggle(i)}
                {...{ whileHover: { scale: 1.03 } }}
                style={{ transformOrigin: 'center center' }}
              >
                <path
                  d={getSectorPath(i)}
                  fill={activity ? activity.color : 'hsl(var(--muted))'}
                  fillOpacity={completed ? 1 : (activity ? 0.4 : 0.2)}
                  stroke={'hsl(var(--background))'}
                  strokeWidth="2"
                  style={showClockHand && i === currentHour ? { filter: 'url(#glow)' } : {}}
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
            const startR = isMajorTick ? tickStartRadius - 5 : tickStartRadius;
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
                    className="text-sm font-bold fill-foreground"
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
          <circle cx={center} cy={center} r="65" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="1" />
          {showClockHand ? (
             <text textAnchor="middle" dominantBaseline="central" className="fill-foreground">
                <tspan x={center} y={center - 8} className="text-4xl font-bold tracking-tighter">{format(currentTime, 'HH:mm')}</tspan>
                <tspan x={center} y={center + 18} className="text-sm font-medium uppercase text-muted-foreground">{format(currentTime, 'eee dd MMM', { locale: fr })}</tspan>
            </text>
          ) : (
            <text textAnchor="middle" dominantBaseline="central" className="fill-foreground">
                <tspan x={center} y={center} className="text-lg font-semibold uppercase">{format(selectedDate, 'eee dd MMM', { locale: fr })}</tspan>
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
              <circle cx={center} cy={center} r="4" className="fill-primary" />
            </g>
        )}
      </svg>
    </div>
  );
}