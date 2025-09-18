import { useState, useEffect } from 'react';
import { LOCAL_STORAGE_KEYS } from '../constants';

export interface UseCustomColorsReturn {
  customColors: string[];
  addCustomColor: (color: string) => void;
  removeCustomColor: (color: string) => void;
  isCustomColorDeleted: (color: string) => boolean;
}

export function useCustomColors(): UseCustomColorsReturn {
  const [customColors, setCustomColors] = useState<string[]>(() => {
    const savedColors = localStorage.getItem(LOCAL_STORAGE_KEYS.customColors);
    return savedColors ? JSON.parse(savedColors) : [];
  });

  const [deletedColors, setDeletedColors] = useState<string[]>(() => {
    const savedDeleted = localStorage.getItem(LOCAL_STORAGE_KEYS.deletedCustomColors);
    return savedDeleted ? JSON.parse(savedDeleted) : [];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.customColors, JSON.stringify(customColors));
  }, [customColors]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.deletedCustomColors, JSON.stringify(deletedColors));
  }, [deletedColors]);

  const addCustomColor = (color: string) => {
    if (!customColors.includes(color)) {
      setCustomColors(prev => [...prev, color]);
    }
  };

  const removeCustomColor = (color: string) => {
    setCustomColors(prev => prev.filter(c => c !== color));
    setDeletedColors(prev => [...prev, color]);
  };

  const isCustomColorDeleted = (color: string) => deletedColors.includes(color);

  return {
    customColors,
    addCustomColor,
    removeCustomColor,
    isCustomColorDeleted,
  };
}