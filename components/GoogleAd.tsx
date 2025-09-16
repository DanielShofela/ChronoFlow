import React, { useEffect, useRef } from 'react';

interface AdProps {
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  slot?: string;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function GoogleAd({ format = 'auto', slot, style, className }: AdProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('Error loading AdSense ad:', err);
    }
  }, []);

  if (!slot) {
    console.warn('AdSense slot ID is required');
    return null;
  }

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client="ca-pub-4849274785502619"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}