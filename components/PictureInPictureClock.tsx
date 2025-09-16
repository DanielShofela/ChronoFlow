import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
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
  const activityRadius = size * 0.4;
  const innerRadius = size * 0.25;

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#18181b' : '#ffffff';
  const fgColor = isDark ? '#f4f4f5' : '#18181b';
  const mutedColor = isDark ? '#3f3f46' : '#e4e4e7';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  ctx.lineCap = 'butt';
  for (let hour = 0; hour < 24; hour++) {
    const activity = activities.find(a => a.slots.includes(hour));
    const startAngle = ((hour - 6) * 15 - 0.5) * (Math.PI / 180);
    const endAngle = (((hour + 1) - 6) * 15 - 0.5) * (Math.PI / 180);

    ctx.beginPath();
    ctx.arc(center, center, (activityRadius + innerRadius) / 2, startAngle, endAngle);
    ctx.lineWidth = activityRadius - innerRadius;
    ctx.strokeStyle = activity ? activity.color : mutedColor;
    ctx.stroke();
  }

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const handAngle = ((currentHour + currentMinute / 60) - 6) * 15 * (Math.PI / 180);

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(handAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(activityRadius - 5, 0);
  ctx.strokeStyle = fgColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(center, center, innerRadius - 2, 0, 2 * Math.PI);
  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.fillStyle = fgColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${size * 0.18}px sans-serif`;
  ctx.fillText(format(currentTime, 'HH:mm'), center, center);
};


export function PictureInPictureClock({ isEnabled, onToggle, activities, currentTime }: PictureInPictureClockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { theme } = useTheme();

  const size = 256;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none', opacity: 0 }}>
      <canvas ref={canvasRef} width={size} height={size} />
      <video ref={videoRef} muted playsInline />
    </div>
  );
}