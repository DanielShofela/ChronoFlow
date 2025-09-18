import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, Archive, ArchiveRestore, X, Bell, BookOpen, Palette, ChevronDown, Trash } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { Activity } from '../types';
import { cn, isColorLight } from '../utils';
import { predefinedColors } from '../constants';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useTheme } from '../hooks/useTheme';
import { useCustomColors } from '../hooks/useCustomColors.ts';

type NotificationPermission = "default" | "granted" | "denied";
type PermissionState = "granted" | "prompt" | "denied";

interface SettingsViewProps {
  activities: Activity[];
  onActivitiesChange: (activities: Activity[]) => void;
  onBack: () => void;
  showVerse: boolean;
  onShowVerseChange: (show: boolean) => void;
  selectedActivity?: Activity | null;
}

const emptyActivity: Omit<Activity, 'id'> = {
  name: '',
  icon: '💡',
  color: predefinedColors[0],
  slots: [],
  days: [1, 2, 3, 4, 5],
  isRecurring: true,
  isArchived: false,
  reminderMinutes: undefined,
  specificDate: new Date().toISOString().split('T')[0],
};

const reminderOptions = [
  { value: 'none', label: 'Aucun' },
  { value: '5', label: '5 minutes avant' },
  { value: '10', label: '10 minutes avant' },
  { value: '15', label: '15 minutes avant' },
  { value: '30', label: '30 minutes avant' },
  { value: '60', label: '1 heure avant' },
];

const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function ActivityForm({
  activity,
  onSave,
  onCancel,
}: {
  activity: Activity | null;
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Omit<Activity, 'id'>>(() => {
    if (activity) {
      return {
        ...emptyActivity,
        ...activity,
        isRecurring: activity.isRecurring ?? true,
        specificDate: activity.specificDate || new Date().toISOString().split('T')[0],
      };
    }
    return emptyActivity;
  });
  
  const { theme } = useTheme();
  const { customColors, addCustomColor, removeCustomColor, isCustomColorDeleted } = useCustomColors();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorInput, setShowColorInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartHour, setDragStartHour] = useState<number | null>(null);
  const [customColorInput, setCustomColorInput] = useState('');
  const [colorToDelete, setColorToDelete] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const lastTouchedHour = useRef<number | null>(null);

  // Fonction utilitaire pour mettre à jour les créneaux
  const updateSlots = (startHour: number, endHour: number) => {
    const start = Math.min(startHour, endHour);
    const end = Math.max(startHour, endHour);
    const newSlots = new Set(formData.slots);
    const shouldAdd = !formData.slots.includes(startHour);
    
    for (let h = start; h <= end; h++) {
      if (shouldAdd) {
        newSlots.add(h);
      } else {
        newSlots.delete(h);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      slots: Array.from(newSlots).sort((a, b) => a - b),
    }));
  };

  // Gestion des événements souris
  const handleSlotMouseDown = (hour: number) => {
    setIsDragging(true);
    setDragStartHour(hour);
    toggleSlot(hour);
  };

  const handleSlotMouseEnter = (hour: number) => {
    if (isDragging && dragStartHour !== null) {
      updateSlots(dragStartHour, hour);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartHour(null);
  };

  // Gestion des événements tactiles
  const handleTouchStart = (hour: number) => {
    setDragStartHour(hour);
    lastTouchedHour.current = hour;
    toggleSlot(hour);
  };

  const handleTouchMove = (e: React.TouchEvent, hour: number) => {
    e.preventDefault(); // Empêche le défilement pendant le glissement
    if (dragStartHour !== null && lastTouchedHour.current !== hour) {
      lastTouchedHour.current = hour;
      updateSlots(dragStartHour, hour);
    }
  };

  const handleTouchEnd = () => {
    setDragStartHour(null);
    lastTouchedHour.current = null;
  };

  // Gestionnaire d'événements unifié pour le glissement
  const getSlotHandlers = (hour: number) => ({
    onMouseDown: () => handleSlotMouseDown(hour),
    onMouseEnter: () => handleSlotMouseEnter(hour),
    onTouchStart: () => handleTouchStart(hour),
    onTouchMove: (e: React.TouchEvent) => handleTouchMove(e, hour),
    onTouchEnd: handleTouchEnd,
  });

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiPickerRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'reminderMinutes' ? (value === 'none' ? undefined : Number(value)) : value }));
  };

  const toggleSlot = (hour: number) => {
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.includes(hour)
        ? prev.slots.filter(s => s !== hour)
        : [...prev.slots, hour].sort((a, b) => a - b),
    }));
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort(),
    }));
  };
  
  const selectDayPreset = (preset: 'week' | 'weekend') => {
    if (preset === 'week') {
      setFormData(prev => ({ ...prev, days: [1,2,3,4,5] }));
    } else {
      setFormData(prev => ({ ...prev, days: [0,6] }));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const activityToSave: Activity = {
      ...formData,
      id: activity ? activity.id : `user-${Date.now()}`,
    };
    onSave(activityToSave);
  };
  
  const isRecurring = formData.isRecurring ?? true;
  const isCustomColor = !predefinedColors.includes(formData.color);

  return (
    <>
      <AnimatePresence>
        {colorToDelete && (
          <ConfirmationDialog
            isOpen={!!colorToDelete}
            title="Supprimer la couleur personnalisée"
            message="Cette couleur sera conservée pour les activités existantes mais ne sera plus disponible pour les nouvelles activités. Êtes-vous sûr de vouloir continuer ?"
            confirmText="Supprimer"
            onConfirm={() => {
              removeCustomColor(colorToDelete);
              setColorToDelete(null);
            }}
            onClose={() => setColorToDelete(null)}
          />
        )}
      </AnimatePresence>
      
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-card border shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{activity ? 'Modifier' : 'Nouvelle'} activité</h3>
            <button type="button" onClick={onCancel} className="p-1 rounded-full hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          
           <div>
              <label htmlFor="name" className="text-sm font-medium">Nom de l'activité</label>
              <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Sport, Lecture..."
                  className="mt-1 w-full h-11 px-3 border rounded-lg bg-background"
                  required
              />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Icône (emoji)</label>
                 <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(p => !p)}
                        className="w-full h-11 px-3 border rounded-lg bg-background flex items-center text-left"
                        aria-haspopup="dialog"
                    >
                      <span className="text-2xl">{formData.icon}</span>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute z-20 mt-2" ref={emojiPickerRef}>
                        <EmojiPicker
                           onEmojiClick={(emojiObject) => {
                                setFormData(prev => ({ ...prev, icon: emojiObject.emoji }));
                                setShowEmojiPicker(false);
                            }}
                           theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                           searchPlaceholder="Rechercher..."
                           width="100%"
                        />
                      </div>
                    )}
                 </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Couleur</label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={cn("w-8 h-8 rounded-full border-2 transition-transform", 
                        !isCustomColor && formData.color === color ? 'border-primary scale-110' : 'border-transparent')}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    ></button>
                  ))}
                  
                  {customColors.map(color => (
                    <div key={color} className="relative group">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={cn("w-8 h-8 rounded-full border-2 transition-transform", 
                          isCustomColor && formData.color === color ? 'border-primary scale-110' : 'border-transparent')}
                        style={{ backgroundColor: color }}
                        aria-label={`Select custom color ${color}`}
                      ></button>
                      <button
                        type="button"
                        onClick={() => setColorToDelete(color)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Delete custom color ${color}`}
                      >
                        <Trash className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setShowColorInput(true)}
                    className="w-8 h-8 rounded-full border-2 border-border hover:border-muted-foreground flex items-center justify-center"
                    aria-label="Add custom color"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              
              {showColorInput && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      placeholder="#000000"
                      className="w-full h-9 px-3 border rounded-lg bg-background pr-12"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={customColorInput || '#000000'}
                        onChange={(e) => setCustomColorInput(e.target.value)}
                        className="w-7 h-7"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (/^#[0-9A-Fa-f]{6}$/.test(customColorInput)) {
                        addCustomColor(customColorInput);
                        setFormData(prev => ({ ...prev, color: customColorInput }));
                        setCustomColorInput('');
                        setShowColorInput(false);
                      }
                    }}
                    className="h-9 px-3 font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowColorInput(false);
                      setCustomColorInput('');
                    }}
                    className="h-9 px-2 font-medium rounded-lg hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Répétition</label>
             <div className="mt-2 grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted">
               <button type="button" onClick={() => setFormData(p => ({...p, isRecurring: true}))} className={cn("px-3 py-2 text-sm font-semibold rounded-md", isRecurring && "bg-background shadow-sm")}>Hebdomadaire</button>
               <button type="button" onClick={() => setFormData(p => ({...p, isRecurring: false}))} className={cn("px-3 py-2 text-sm font-semibold rounded-md", !isRecurring && "bg-background shadow-sm")}>Date unique</button>
             </div>
          </div>
          
          <AnimatePresence mode="wait">
            {isRecurring ? (
              <motion.div key="weekly" initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="space-y-4 overflow-hidden">
                <label className="text-sm font-medium">Jours de la semaine</label>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => selectDayPreset('week')} className="h-10 text-sm font-semibold rounded-lg bg-muted hover:bg-muted/80">Semaine</button>
                    <button type="button" onClick={() => selectDayPreset('weekend')} className="h-10 text-sm font-semibold rounded-lg bg-muted hover:bg-muted/80">Weekend</button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {dayLabels.map((label, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={cn("h-10 font-bold rounded-lg transition-colors", formData.days.includes(index) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80')}
                    >{label}</button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="single" initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="space-y-2 overflow-hidden">
                <label htmlFor="specificDate" className="text-sm font-medium">Date</label>
                <input
                    id="specificDate"
                    name="specificDate"
                    type="date"
                    value={formData.specificDate}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border rounded-lg bg-background"
                    required
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div>
            <label className="text-sm font-medium">Créneaux horaires (0-23h)</label>
            <div className="mt-2 grid grid-cols-6 sm:grid-cols-12 gap-2">
              {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                <button
                  key={hour}
                  type="button"
                  {...getSlotHandlers(hour)}
                  className={cn(
                    "h-10 text-sm font-bold rounded-lg transition-colors select-none touch-none",
                    formData.slots.includes(hour) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  )}
                >{hour}</button>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="reminderMinutes" className="text-sm font-medium">Rappel</label>
            <div className="relative mt-1">
                <select
                    id="reminderMinutes"
                    name="reminderMinutes"
                    value={formData.reminderMinutes ?? 'none'}
                    onChange={handleInputChange}
                    className="w-full h-11 pl-3 pr-8 appearance-none border rounded-lg bg-background"
                >
                    {reminderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="h-11 px-6 font-semibold rounded-lg border hover:bg-muted">Annuler</button>
            <button type="submit" className="h-11 px-6 font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Sauvegarder</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
    </>
  );
}

export default function SettingsView({
  activities,
  onActivitiesChange,
  onBack,
  showVerse,
  onShowVerseChange,
  selectedActivity,
}: SettingsViewProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(selectedActivity || null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [showForm, setShowForm] = useState(activities.length === 0 || !!selectedActivity);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | PermissionState>('default');

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then(permissionStatus => {
        setNotificationPermission(permissionStatus.state);
        permissionStatus.onchange = () => {
          setNotificationPermission(permissionStatus.state);
        };
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
    });
  };

  const handleSaveActivity = (activityToSave: Activity) => {
    const exists = activities.some(a => a.id === activityToSave.id);
    if (exists) {
      onActivitiesChange(activities.map(a => a.id === activityToSave.id ? activityToSave : a));
    } else {
      onActivitiesChange([...activities, activityToSave]);
    }
    setEditingActivity(null);
    setShowForm(false);
  };

  const handleArchive = (activity: Activity) => {
    onActivitiesChange(activities.map(a => a.id === activity.id ? {...a, isArchived: true} : a));
  };

  const handleUnarchive = (activity: Activity) => {
    onActivitiesChange(activities.map(a => a.id === activity.id ? {...a, isArchived: false} : a));
  };

  const handleDelete = () => {
    if (!activityToDelete) return;
    onActivitiesChange(activities.filter(a => a.id !== activityToDelete.id));
    setActivityToDelete(null);
  };

  const activeActivities = activities.filter(a => !a.isArchived);
  const archivedActivities = activities.filter(a => a.isArchived);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-2xl font-bold">Activités et Paramètres</h2>
      </div>

      <AnimatePresence>
        {showForm && (
          <ActivityForm 
            activity={editingActivity}
            onSave={handleSaveActivity}
            onCancel={() => { setShowForm(false); setEditingActivity(null); }}
          />
        )}
      </AnimatePresence>

      <div className="p-6 rounded-xl border bg-card">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Gérer les activités</h3>
            {notificationPermission === 'granted' && (
              <Bell className="w-4 h-4 text-primary" aria-label="Les notifications sont activées" />
            )}
          </div>
          <motion.button 
            onClick={() => { setEditingActivity(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 h-10 bg-primary text-primary-foreground rounded-lg font-semibold text-sm"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" /> Ajouter
          </motion.button>
        </div>

        <div className="mt-4 border-b">
          <div className="flex space-x-4">
            <button onClick={() => setView('active')} className={cn("px-3 py-2 font-medium text-sm", view === 'active' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Actives ({activeActivities.length})</button>
            <button onClick={() => setView('archived')} className={cn("px-3 py-2 font-medium text-sm", view === 'archived' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Archivées ({archivedActivities.length})</button>
          </div>
        </div>

        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {(view === 'active' ? activeActivities : archivedActivities).map(activity => (
                <div key={activity.id} className="p-3 flex items-center justify-between rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{activity.icon}</span>
                    <span className="font-medium">{activity.name}</span>
                    {activity.reminderMinutes && activity.reminderMinutes > 0 && (
                      <Bell className="w-4 h-4 text-primary" aria-label={`Rappel ${activity.reminderMinutes} minutes avant.`} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {view === 'active' ? (
                      <>
                        <button onClick={() => { setEditingActivity(activity); setShowForm(true); }} className="p-2 hover:bg-background rounded-md"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleArchive(activity)} className="p-2 hover:bg-background rounded-md"><Archive className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleUnarchive(activity)} className="p-2 hover:bg-background rounded-md"><ArchiveRestore className="w-4 h-4" /></button>
                        <button onClick={() => setActivityToDelete(activity)} className="p-2 text-destructive hover:bg-destructive/10 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {(view === 'active' && activeActivities.length === 0) && <p className="text-center text-muted-foreground py-4">Aucune activité active.</p>}
              {(view === 'archived' && archivedActivities.length === 0) && <p className="text-center text-muted-foreground py-4">Aucune activité archivée.</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 rounded-xl border bg-card">
        <h3 className="text-lg font-semibold mb-4">Préférences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground"/>
              <span className="font-medium">Notifications de rappel</span>
            </div>
            {notificationPermission === 'granted' && <span className="text-sm text-green-600 font-medium">Activées</span>}
            {notificationPermission === 'denied' && <span className="text-sm text-destructive font-medium">Bloquées</span>}
            {(notificationPermission === 'default' || notificationPermission === 'prompt') && <button onClick={requestNotificationPermission} className="text-sm font-semibold text-primary hover:underline">Activer</button>}
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-muted-foreground"/>
              <span className="font-medium">Afficher le verset du jour</span>
            </div>
            <button
              onClick={() => onShowVerseChange(!showVerse)}
              className={cn("relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out", showVerse ? 'bg-primary' : 'bg-muted-foreground/50')}
            >
              <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", showVerse ? 'translate-x-5' : 'translate-x-0')} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmationDialog 
        isOpen={!!activityToDelete}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer l'activité"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'activité "${activityToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />
    </motion.div>
  );
}
