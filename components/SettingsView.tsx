import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Palette, X, Pencil, Check, XCircle, GripVertical, Star, MessageSquare, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import type { Activity } from '../types';
import { cn } from '../utils';
import { predefinedColors } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

interface SettingsViewProps {
  activities: Activity[];
  onActivitiesChange: (activities: Activity[]) => void;
  onBack: () => void;
  showVerse: boolean;
  onShowVerseChange: (show: boolean) => void;
  showActivityDetails: boolean;
  onShowActivityDetailsChange: (show: boolean) => void;
}

const ActivityReorderItem = ({
  activity,
  usedColors,
  editingActivityId,
  editedActivityData,
  isEditCustomColorOpen,
  predefinedColors,
  handleStartEditing,
  deleteActivity,
  handleToggleSlot,
  handleCancelEditing,
  handleSaveChanges,
  setEditedActivityData,
  setEditIconPickerOpen,
  setEditCustomColorOpen,
  handleEditGenerateRandomColor,
}: any) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={activity}
            as="div"
            className="p-4 rounded-xl border bg-card overflow-hidden"
            dragListener={false}
            dragControls={controls}
            {...{ layout: true }}
        >
            {editingActivityId === activity.id && editedActivityData ? (
                <motion.div key={`edit-${activity.id}`} {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }} className="space-y-4">
                    <div className="flex items-center justify-between"><h4 className="font-semibold">Modifier l'activité</h4><div className="flex items-center gap-2"><button onClick={handleCancelEditing} className="p-1 hover:bg-muted rounded-full"><XCircle className="w-5 h-5 text-muted-foreground" /></button><button onClick={handleSaveChanges} className="p-1 hover:bg-muted rounded-full"><Check className="w-5 h-5 text-green-500" /></button></div></div>
                    <input type="text" placeholder="Nom de l'activité" value={editedActivityData.name} onChange={(e) => setEditedActivityData({ ...editedActivityData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Icône</label>
                        <button onClick={() => setEditIconPickerOpen(true)} className="w-full h-12 flex items-center justify-center text-3xl bg-muted rounded-lg hover:bg-muted/80 transition-colors">{editedActivityData.icon}</button>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Couleur</label>
                        <div className="grid grid-cols-6 gap-2">
                          {predefinedColors.map(color => (<button key={color} onClick={() => { setEditedActivityData({ ...editedActivityData, color }); setEditCustomColorOpen(false); }} className={cn("w-full h-8 rounded-md transition-transform transform hover:scale-110", usedColors.has(color) && activity.color !== color && 'hatched', editedActivityData.color === color && !isEditCustomColorOpen && 'ring-2 ring-primary ring-offset-2 ring-offset-background')} style={{ backgroundColor: color }} />))}
                          <button onClick={handleEditGenerateRandomColor} className={cn("w-full h-8 rounded-md flex items-center justify-center bg-muted hover:bg-muted/80", isEditCustomColorOpen && 'ring-2 ring-primary ring-offset-2 ring-offset-background')}><Palette className="w-4 h-4 text-muted-foreground" /></button>
                        </div>
                        {isEditCustomColorOpen && (<motion.div className="flex items-center gap-2 mt-2" {...{ initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } }}><input type="color" value={editedActivityData.color} onChange={(e) => setEditedActivityData({ ...editedActivityData, color: e.target.value })} className="w-10 h-10 p-1 rounded-lg border bg-background cursor-pointer" /><input type="text" value={editedActivityData.color} onChange={(e) => setEditedActivityData({ ...editedActivityData, color: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background" placeholder="#RRGGBB" /></motion.div>)}
                      </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div key={`display-${activity.id}`} {...{ initial: { opacity: 0 }, animate: { opacity: 1 } }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div onPointerDown={(e) => controls.start(e)} className="cursor-grab text-muted-foreground p-2 -ml-2" style={{ touchAction: 'none' }}>
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <span className="text-2xl">{activity.icon}</span>
                      <div><h4 className="font-medium">{activity.name}</h4><p className="text-sm text-muted-foreground">{activity.slots.length} créneaux</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activity.color }} />
                      <button onClick={() => handleStartEditing(activity)} className="p-1 text-muted-foreground hover:text-primary rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteActivity(activity.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">{Array.from({ length: 24 }, (_, i) => (
                    <button 
                      key={i}
                      onClick={() => handleToggleSlot(activity.id, i)}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium transition-colors", 
                        activity.slots.includes(i) ? "text-white" : "bg-muted hover:bg-muted/80"
                      )} 
                      style={{ backgroundColor: activity.slots.includes(i) ? activity.color : undefined }}
                    >
                      {i}h
                    </button>))}
                  </div>
                </motion.div>
            )}
        </Reorder.Item>
    );
};


export function SettingsView({ activities, onActivitiesChange, onBack, showVerse, onShowVerseChange, showActivityDetails, onShowActivityDetailsChange }: SettingsViewProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [newActivity, setNewActivity] = useState({
    name: '',
    icon: '📝',
    color: '#3b82f6',
    slots: [] as number[]
  });
  const [isIconPickerOpen, setIconPickerOpen] = useState(false);
  const [isCustomColorOpen, setCustomColorOpen] = useState(false);
  
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editedActivityData, setEditedActivityData] = useState<Activity | null>(null);
  const [isEditIconPickerOpen, setEditIconPickerOpen] = useState(false);
  const [isEditCustomColorOpen, setEditCustomColorOpen] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent'>('idle');


  const usedColors = useMemo(() => new Set(activities.map(a => a.color)), [activities]);

  const addActivity = () => {
    if (!newActivity.name.trim()) return;
    const activity: Activity = { id: Date.now().toString(), ...newActivity };
    onActivitiesChange([...activities, activity]);
    setNewActivity({ name: '', icon: '📝', color: '#3b82f6', slots: [] });
    setCustomColorOpen(false);
  };

  const deleteActivity = (id: string) => {
    onActivitiesChange(activities.filter(a => a.id !== id));
  };

  const updateActivity = (activity: Activity) => {
    onActivitiesChange(activities.map(a => a.id === activity.id ? activity : a));
  };
  
  const handleToggleSlot = (activityId: string, hour: number) => {
    onActivitiesChange(activities.map(activity => {
      if (activity.id === activityId) {
        const slots = activity.slots;
        const newSlots = slots.includes(hour)
          ? slots.filter(h => h !== hour)
          : [...slots, hour].sort((a, b) => a - b);
        return { ...activity, slots: newSlots };
      }
      return activity;
    }));
  };

  const handleGenerateRandomColor = () => {
    let randomColor;
    const allUsedColors = new Set([...usedColors, ...predefinedColors]);
    do {
      randomColor = `#${Math.floor(Math.random() * 167772215).toString(16).padStart(6, '0')}`;
    } while (allUsedColors.has(randomColor));
    setNewActivity(prev => ({ ...prev, color: randomColor }));
    setCustomColorOpen(true);
  };
  
  const handleStartEditing = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setEditedActivityData({ ...activity });
    if (!predefinedColors.includes(activity.color)) {
      setEditCustomColorOpen(true);
    } else {
      setEditCustomColorOpen(false);
    }
  };

  const handleCancelEditing = () => {
    setEditingActivityId(null);
    setEditedActivityData(null);
  };

  const handleSaveChanges = () => {
    if (editedActivityData) {
      updateActivity(editedActivityData);
    }
    handleCancelEditing();
  };
  
  const handleEditGenerateRandomColor = () => {
    if (!editedActivityData) return;
    let randomColor;
    const allUsedColors = new Set([...usedColors, ...predefinedColors]);
    do {
      randomColor = `#${Math.floor(Math.random() * 167772215).toString(16).padStart(6, '0')}`;
    } while (allUsedColors.has(randomColor));
    setEditedActivityData({ ...editedActivityData, color: randomColor });
    setEditCustomColorOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() && rating === 0) return;
    setFeedbackStatus('sending');
  
    const data = {
      rating,
      feedback: feedbackText,
    };
  
    try {
      const response = await fetch('https://formspree.io/f/movnakjb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (response.ok) {
        setFeedbackStatus('sent');
      } else {
        alert("L'envoi a échoué. Veuillez réessayer.");
        setFeedbackStatus('idle');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert("Une erreur de réseau est survenue. Veuillez vérifier votre connexion et réessayer.");
      setFeedbackStatus('idle');
    }
  };

  const resetFeedbackForm = () => {
    setFeedbackStatus('idle');
    setFeedbackText('');
    setRating(0);
    setHoverRating(0);
  };
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (isIconPickerOpen) {
      setNewActivity(prev => ({ ...prev, icon: emojiData.emoji }));
      setIconPickerOpen(false);
    } else if (isEditIconPickerOpen) {
      setEditedActivityData(prev => {
        if (!prev) return null;
        return { ...prev, icon: emojiData.emoji };
      });
      setEditIconPickerOpen(false);
    }
  };

  return (
    <motion.div
      className="space-y-8" // Increased spacing
      {...{
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
      }}
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-2xl font-bold">Gestion des activités</h2>
      </div>

      <div className="p-4 rounded-xl border bg-gradient-to-br from-card to-muted/20 space-y-4">
        <h3 className="font-semibold text-lg">Nouvelle activité</h3>
        <input type="text" placeholder="Nom de l'activité" value={newActivity.name} onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Icône</label>
            <button onClick={() => setIconPickerOpen(true)} className="w-full h-12 flex items-center justify-center text-3xl bg-muted rounded-lg hover:bg-muted/80 transition-colors">{newActivity.icon}</button>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Couleur</label>
            <div className="grid grid-cols-6 gap-2">
              {predefinedColors.map(color => (<button key={color} onClick={() => { setNewActivity({ ...newActivity, color }); setCustomColorOpen(false); }} className={cn("w-full h-8 rounded-md transition-transform transform hover:scale-110", usedColors.has(color) && 'hatched', newActivity.color === color && !isCustomColorOpen && 'ring-2 ring-primary ring-offset-2 ring-offset-background')} style={{ backgroundColor: color }} />))}
              <button onClick={handleGenerateRandomColor} className={cn("w-full h-8 rounded-md flex items-center justify-center bg-muted hover:bg-muted/80", isCustomColorOpen && 'ring-2 ring-primary ring-offset-2 ring-offset-background')}><Palette className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            {isCustomColorOpen && (<motion.div className="flex items-center gap-2 mt-2" {...{ initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } }}><input type="color" value={newActivity.color} onChange={(e) => setNewActivity({ ...newActivity, color: e.target.value })} className="w-10 h-10 p-1 rounded-lg border bg-background cursor-pointer" /><input type="text" value={newActivity.color} onChange={(e) => setNewActivity({ ...newActivity, color: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background" placeholder="#RRGGBB" /></motion.div>)}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Créneaux horaires (0h-23h)</p>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">{Array.from({ length: 24 }, (_, i) => (<button key={i} onClick={() => { const newSlots = newActivity.slots.includes(i) ? newActivity.slots.filter(h => h !== i) : [...newActivity.slots, i].sort((a, b) => a - b); setNewActivity({ ...newActivity, slots: newSlots }); }} className={cn("px-2 py-1 rounded text-xs font-medium transition-colors", newActivity.slots.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}>{i}h</button>))}</div>
        </div>
        <button onClick={addActivity} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" />Ajouter</button>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold">Mes Activités</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Maintenez l'icône ⋮⋮ pour réorganiser.</p>
        <Reorder.Group axis="y" values={activities} onReorder={onActivitiesChange} className="space-y-4">
          <AnimatePresence>
            {activities.map(activity => (
              <ActivityReorderItem
                key={activity.id}
                activity={activity}
                usedColors={usedColors}
                editingActivityId={editingActivityId}
                editedActivityData={editedActivityData}
                isEditCustomColorOpen={isEditCustomColorOpen}
                predefinedColors={predefinedColors}
                handleStartEditing={handleStartEditing}
                deleteActivity={deleteActivity}
                handleToggleSlot={handleToggleSlot}
                handleCancelEditing={handleCancelEditing}
                handleSaveChanges={handleSaveChanges}
                setEditedActivityData={setEditedActivityData}
                setEditIconPickerOpen={setEditIconPickerOpen}
                setEditCustomColorOpen={setEditCustomColorOpen}
                handleEditGenerateRandomColor={handleEditGenerateRandomColor}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      <div className="p-4 rounded-xl border bg-card">
        <h3 className="font-semibold text-lg mb-2">Préférences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div>
                  <p className="font-medium">Afficher le verset du jour</p>
                  <p className="text-sm text-muted-foreground">Affiche une citation inspirante sur l'écran d'accueil.</p>
              </div>
              <button
                  onClick={() => onShowVerseChange(!showVerse)}
                  className={cn(
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      showVerse ? 'bg-primary' : 'bg-muted'
                  )}
                  role="switch"
                  aria-checked={showVerse}
              >
                  <span className="sr-only">Activer/Désactiver le verset du jour</span>
                  <span
                      aria-hidden="true"
                      className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          showVerse ? 'translate-x-5' : 'translate-x-0'
                      )}
                  />
              </button>
          </div>
          
          <div className="flex items-center justify-between">
              <div>
                  <p className="font-medium">{showActivityDetails ? t.hideDetails : t.showDetails}</p>
                  <p className="text-sm text-muted-foreground">{showActivityDetails ? "Masque les détails des activités par défaut." : "Affiche les détails des activités par défaut."}</p>
              </div>
              <button
                  onClick={() => onShowActivityDetailsChange(!showActivityDetails)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label={showActivityDetails ? t.hideDetails : t.showDetails}
              >
                  {showActivityDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card min-h-[290px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {feedbackStatus === 'sent' ? (
            <motion.div
              key="feedback-success"
              className="text-center"
              {...{
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 },
              }}
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">Merci pour votre retour !</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Vos suggestions nous sont précieuses pour améliorer l'application.
              </p>
              <button
                onClick={resetFeedbackForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Laisser un autre avis
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="feedback-form"
              className="space-y-3"
              {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
              }}
            >
              <h3 className="font-semibold text-lg">Façonnons cette application ensemble !</h3>
              <p className="text-sm text-muted-foreground">
                Votre avis est précieux. Aidez-nous à faire de ChronoFlow l'outil parfait pour <em>vous</em>. Partagez vos idées, vos envies, ou tout ce qui pourrait améliorer votre expérience.
              </p>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={cn(
                        "w-6 h-6 transition-colors",
                        (hoverRating >= star || rating >= star)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Vos suggestions, idées ou remarques..."
                className="w-full min-h-[100px] p-3 mt-2 rounded-lg border bg-background text-sm transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                aria-label="Zone de texte pour les commentaires"
              />
              <button 
                onClick={handleFeedbackSubmit}
                disabled={feedbackStatus === 'sending' || (feedbackText.trim() === '' && rating === 0)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {feedbackStatus === 'sending' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Envoyer mes suggestions</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(isIconPickerOpen || (isEditIconPickerOpen && editedActivityData)) && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => { setIconPickerOpen(false); setEditIconPickerOpen(false); }}></div>
            <motion.div className="relative z-10" {...{ initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 } }}>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                lazyLoadEmojis={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}