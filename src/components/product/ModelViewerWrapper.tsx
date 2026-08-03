'use client';

import { useEffect } from 'react';

// We just need to import the library on the client side so it registers the custom element
const ModelViewerElement = () => {
  useEffect(() => {
    import('@google/model-viewer').catch(console.error);
  }, []);

  return null;
};

type ModelViewerWrapperProps = {
  src: string;
  iosSrc?: string;
  alt: string;
};

export default function ModelViewerWrapper({ src, iosSrc, alt }: ModelViewerWrapperProps) {
  return (
    <div className="w-full h-full relative">
      <ModelViewerElement />
      {/* @ts-expect-error - Custom element */}
      <model-viewer
        src={src}
        ios-src={iosSrc}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      >
        <button
          slot="ar-button"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full font-medium shadow-lg hover:scale-105 transition-transform"
        >
          View in your space
        </button>
      {/* @ts-expect-error - Custom element */}
      </model-viewer>
    </div>
  );
}
