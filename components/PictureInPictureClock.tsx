import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns'; // Suppression de l'import inutile de 'fr'
import { fr as frLocale } from 'date-fns/locale';
import type { Activity } from '../types';
import { useTheme } from '../hooks/useTheme';

interface PictureInPictureClockProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  activities: Activity[];
  currentTime: Date;
}

const drawClock = (
  ctx: CanvasRenderingContext2D,
  size: number,
  theme: string,
  activities: Activity[],
  currentTime: Date
) => {
  const center = size / 2;
  const activityRadius = size * 0.42;
  const innerRadius = size * 0.15;
  const dateCircleRadius = size * 0.20; // Réduit de 0.25 à 0.20

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#18181b' : '#ffffff';
  const fgColor = isDark ? '#f4f4f5' : '#18181b';
  const mutedColor = isDark ? '#52525b' : '#d4d4d8';
  const handColor = '#2563eb';
  const strokeColor = isDark ? '#27272a' : '#e4e4e7';

  // Fond
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Cercle externe avec ombre et contour
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(center, center, activityRadius, 0, 2 * Math.PI);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Marques des heures
  for (let hour = 0; hour < 24; hour++) {
    const angle = ((hour - 6) * 15) * (Math.PI / 180);
    const markerLength = hour % 3 === 0 ? 10 : 5;
    
    ctx.beginPath();
    ctx.moveTo(
      center + Math.cos(angle) * (activityRadius - markerLength),
      center + Math.sin(angle) * (activityRadius - markerLength)
    );
    ctx.lineTo(
      center + Math.cos(angle) * activityRadius,
      center + Math.sin(angle) * activityRadius
    );
    ctx.strokeStyle = isDark ? '#71717a' : '#71717a'; // Même couleur pour les deux modes
    ctx.lineWidth = hour % 3 === 0 ? 2.5 : 1.5;
    ctx.stroke();
  }

  // Arcs des activités
  ctx.lineCap = 'butt';
  for (let hour = 0; hour < 24; hour++) {
    const activity = activities.find(a => a.slots.includes(hour));
    const startAngle = ((hour - 6) * 15 - 0.5) * (Math.PI / 180);
    const endAngle = (((hour + 1) - 6) * 15 - 0.5) * (Math.PI / 180);

    ctx.beginPath();
    ctx.arc(center, center, (activityRadius + innerRadius) / 2, startAngle, endAngle);
    ctx.lineWidth = (activityRadius - innerRadius) * 0.8; // Augmenté pour couvrir plus d'espace
    ctx.strokeStyle = activity ? activity.color : 'transparent';
    ctx.stroke();
  }

  // Ajout des numéros des heures
  ctx.font = `${size * 0.045}px system-ui, sans-serif`; // Police légèrement plus petite
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isDark ? '#f4f4f5' : '#18181b';

  for (let hour = 0; hour < 24; hour += 3) {
    const angle = ((hour - 6) * 15) * (Math.PI / 180);
    const radius = activityRadius + 25; // Augmenté de 15 à 25 pour plus d'espacement
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    
    ctx.fillText(
      hour.toString(),
      x,
      y
    );
  }

  // Aiguille
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const handAngle = ((currentHour + currentMinute / 60) - 6) * 15 * (Math.PI / 180);

  // Aiguille principale - plus fine et droite
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(handAngle);
  
  // Ligne simple et fine pour l'aiguille
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(activityRadius - 30, 0);
  ctx.strokeStyle = handColor;
  ctx.lineWidth = 2; // Épaisseur réduite
  ctx.lineCap = 'round';
  ctx.stroke();
  
  ctx.restore();

  // Point central plus petit et discret
  ctx.beginPath();
  ctx.arc(center, center, 3, 0, 2 * Math.PI);
  ctx.fillStyle = handColor;
  ctx.fill();

  // Cercle externe du point central pour un meilleur effet visuel
  ctx.beginPath();
  ctx.arc(center, center, 4.5, 0, 2 * Math.PI);
  ctx.strokeStyle = isDark ? '#27272a' : '#e4e4e7';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cercle interne plus petit et plus net
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, dateCircleRadius, 0, 2 * Math.PI);
  ctx.fillStyle = bgColor;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.strokeStyle = isDark ? '#27272a' : '#e4e4e7';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Centre avec date et heure
  const timeString = format(currentTime, 'HH:mm');
  const dayString = format(currentTime, 'EEE d MMM', { locale: frLocale }).toUpperCase(); // Changé toLowerCase() en toUpperCase()

  ctx.textAlign = 'center';
  
  // Heure au centre
  ctx.fillStyle = fgColor;
  ctx.font = `bold ${size * 0.09}px system-ui, sans-serif`;
  ctx.fillText(timeString, center, center - size * 0.015);

  // Date sous l'heure
  ctx.font = `${size * 0.035}px system-ui, sans-serif`;
  ctx.fillStyle = isDark ? '#a1a1aa' : '#71717a';
  ctx.fillText(dayString, center, center + size * 0.05);
};


export function PictureInPictureClock({ isEnabled, onToggle, activities, currentTime }: PictureInPictureClockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { theme } = useTheme();

  // Augmentons la taille pour une meilleure netteté
  const size = 512; // Changé de 256 à 512

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Désactiver la transparence
    if (!ctx) return;

    // Activation de l'anticrénelage
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const intervalId = setInterval(() => {
      drawClock(ctx, size, theme, activities, new Date());
    }, 1000);

    drawClock(ctx, size, theme, activities, currentTime);

    return () => clearInterval(intervalId);
  }, [theme, activities, currentTime, size]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !document.pictureInPictureEnabled) return;

    const enterPip = async () => {
      try {
        if (!video.srcObject) {
          video.srcObject = canvas.captureStream();
          await video.play();
        }
        if (document.pictureInPictureElement !== video) {
          await video.requestPictureInPicture();
        }
      } catch (error) {
        console.error("Failed to enter PiP mode:", error);
        onToggle(false);
      }
    };

    const exitPip = async () => {
      if (document.pictureInPictureElement) {
        try {
          await document.exitPictureInPicture();
        } catch (error) {
          console.error("Failed to exit PiP mode:", error);
        }
      }
    };

    if (isEnabled) {
      enterPip();
    } else {
      exitPip();
    }
    
    const onLeavePip = () => onToggle(false);
    video.addEventListener('leavepictureinpicture', onLeavePip);
    
    return () => {
      video.removeEventListener('leavepictureinpicture', onLeavePip);
    };

  }, [isEnabled, onToggle]);

  const isDark = theme === 'dark';

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none', opacity: 0 }}>
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          background: isDark ? '#18181b' : '#ffffff'
        }} 
      />
      <video 
        ref={videoRef} 
        muted 
        playsInline 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          background: isDark ? '#18181b' : '#ffffff'
        }} 
      />
    </div>
  );
}