import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const APP_ID = 'ca-app-pub-4849274785502619~4182252467';
const AD_UNIT_ID = 'ca-pub-4849274785502619/2105047170';

export function NativeAdBanner() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Initialisation de l'annonce native
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('Error initializing native ad:', error);
    }
  }, []);

  return (
    <div className="w-full sticky bottom-14 md:bottom-0 bg-card border-t md:border-none">
      <div className="container mx-auto px-4">
        <div ref={adRef}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={AD_UNIT_ID}
            data-ad-slot="foot1"
            data-ad-format="fluid"
            data-ad-layout-key="-fb+5w+4e-db+86"
          />
        </div>
      </div>
    </div>
  );
}