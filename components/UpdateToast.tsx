import React from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, Check } from 'lucide-react';

interface UpdateToastProps {
  onClose: () => void;
}

export function UpdateToast({ onClose }: UpdateToastProps) {
  const [updating, setUpdating] = React.useState(false);
  const [updateComplete, setUpdateComplete] = React.useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    
    try {
      // Déclencher la mise à jour via le hook useServiceWorkerUpdate
      const event = new CustomEvent('apply-update');
      window.dispatchEvent(event);

      setUpdateComplete(true);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
      setUpdating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200]">
      <motion.div
        className="flex items-center justify-between gap-4 pl-4 pr-2 py-3 rounded-lg bg-card border shadow-lg"
        {...{
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9 },
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/icon-192x192.png" alt="ChronoFlow icon" className="w-8 h-8 rounded-md" />
            <div className="flex flex-col">
              <span className="font-semibold">Mise à jour disponible</span>
              <span className="text-sm text-muted-foreground">Une nouvelle version est disponible</span>
            </div>
          </div>
          
          <button
            onClick={handleUpdate}
            disabled={updating || updateComplete}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {updating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mise à jour...</span>
              </>
            ) : updateComplete ? (
              <>
                <Check className="w-4 h-4" />
                <span>Terminé !</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Mettre à jour</span>
              </>
            )}
          </button>
        </div>

        <button 
          onClick={() => {
            const version = sessionStorage.getItem('pendingVersion');
            if (version) {
              localStorage.setItem('lastIgnoredUpdateVersion', version);
            }
            onClose();
          }} 
          className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0" 
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}