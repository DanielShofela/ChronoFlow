import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/privacy-policy.md')
      .then(response => response.text())
      .then(text => {
        // Convertir le texte Markdown en HTML basique
        const htmlContent = text
          .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6">$1</h1>')
          .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
          .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
          .replace(/^\- (.*$)/gm, '<li class="ml-4 mb-2">$1</li>')
          .replace(/\n\n/g, '</p><p class="mb-4">');
        setContent(htmlContent);
      })
      .catch(error => console.error('Erreur lors du chargement de la politique de confidentialité:', error));
  }, []);

  return (
    <motion.div
      className="container mx-auto py-8 px-4 max-w-3xl"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack} 
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Politique de Confidentialité</h1>
      </div>

      <div className="p-6 rounded-xl border bg-card">
        <div 
          className="prose prose-sm md:prose-base dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              const customEvent = new CustomEvent('navigate', { detail: { view: 'faq' } });
              window.dispatchEvent(customEvent);
            }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Nous Contacter
          </button>
        </div>
      </div>
    </motion.div>
  );
}