import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface TourStep {
  selector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingGuideProps {
  steps: TourStep[];
  onComplete: () => void;
}

export function OnboardingGuide({ steps, onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isModalStep = !step?.selector;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (isModalStep) {
      setTargetRect(null);
      return;
    }
    const handleResize = () => {
      const element = document.querySelector(step.selector);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };
    
    const timeoutId = setTimeout(handleResize, 50);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentStep, step, isModalStep]);

  const nextStep = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!targetRect || !tooltipRef.current) return {};
    
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const spacing = 16;
    
    let top = 0;
    let left = 0;
    const position = step.position || 'bottom';

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipHeight - spacing;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + spacing;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - spacing;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + spacing;
        break;
    }
    
    if (top < spacing) top = spacing;
    if (left < spacing) left = spacing;
    if (left + tooltipWidth > window.innerWidth - spacing) left = window.innerWidth - tooltipWidth - spacing;
    if (top + tooltipHeight > window.innerHeight - spacing) top = window.innerHeight - tooltipHeight - spacing;

    return { top: `${top}px`, left: `${left}px` };
  };

  const highlightStyle = targetRect ? {
    width: targetRect.width + 12,
    height: targetRect.height + 12,
    top: targetRect.top - 6,
    left: targetRect.left - 6,
    borderRadius: '0.75rem',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
    transition: 'all 0.3s ease-in-out',
  } : {
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
  };

  const tooltipStyle = isModalStep ? {
      position: 'relative' as const,
      textAlign: 'center' as const,
      maxWidth: '24rem',
      width: '100%',
  } : {
      position: 'absolute' as const,
      width: '18rem',
      ...getTooltipPosition()
  };

  return (
    <div className={`fixed inset-0 z-[100] ${isModalStep ? 'flex items-center justify-center p-4' : ''}`}>
      <motion.div
        className="absolute pointer-events-none"
        style={highlightStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        key={currentStep}
        ref={tooltipRef}
        className="z-10 p-4 rounded-lg bg-card shadow-2xl"
        style={tooltipStyle}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <h3 className={`font-bold mb-2 ${isModalStep ? 'text-xl' : 'text-lg'}`}>{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

        <div className="flex items-center justify-between mt-4">
          <button onClick={onComplete} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors">
            Passer le guide
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button onClick={prevStep} className="p-2 hover:bg-muted rounded-md transition-colors" aria-label="Étape précédente">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button onClick={nextStep} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
              {isLastStep ? 'Terminer' : 'Suivant'}
              {!isLastStep && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}