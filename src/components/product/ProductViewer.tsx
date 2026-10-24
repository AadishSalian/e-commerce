'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/lib/mockData';
import { Maximize2, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { HotspotLayer, ExploreDetailsToggle } from './hotspots';
import { EngravingOverlay } from './personalization/EngravingOverlay';
import { EngravingZone, PersonalizationValue } from '@/lib/personalization/types';

const ModelViewerWrapper = dynamic(() => import('./ModelViewerWrapper'), { ssr: false });

type ProductViewerProps = {
  product: Product;
  selectedVariant?: string | null;
  personalizationZone?: EngravingZone | null;
  personalizationValue?: PersonalizationValue | null;
  isPersonalizationFocused?: boolean;
  isPersonalizing?: boolean;
};

export default function ProductViewer({
  product,
  selectedVariant,
  personalizationZone,
  personalizationValue,
  isPersonalizationFocused = false,
  isPersonalizing = false
}: ProductViewerProps) {
  const images = product.images || (product.hoverImage ? [product.image, product.hoverImage] : [product.image]);
  const has360 = product.spinImages && product.spinImages.length > 0;

  const [activeIndex, setActiveIndex] = useState(0);
  const [is360Mode, setIs360Mode] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [spinIndex, setSpinIndex] = useState(0);

  // Hotspots visibility state (Guided mode - remembered for session)
  const [showHotspots, setShowHotspots] = useState(true);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('matte_hotspots_visible');
      if (saved !== null) {
        setShowHotspots(saved === 'true');
      }
    } catch {
      // Ignore in non-browser/SSR
    }
  }, []);

  const handleToggleHotspots = () => {
    setShowHotspots((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('matte_hotspots_visible', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Find index of image where engraving zone is placed
  const zoneImageIndex = useMemo(() => {
    if (!personalizationZone) return -1;
    const idx = images.findIndex((img) => img === personalizationZone.image_id);
    return idx >= 0 ? idx : 0;
  }, [personalizationZone, images]);

  // Current image's hotspots count (taking variant into account)
  const currentImageHotspots = useMemo(() => {
    const currentImg = images[activeIndex];
    return (product.hotspots || []).filter((h) => {
      if (h.imageId !== currentImg) return false;
      if (selectedVariant && h.variantIds && h.variantIds.length > 0) {
        return h.variantIds.includes(selectedVariant);
      }
      return true;
    });
  }, [product.hotspots, images, activeIndex, selectedVariant]);

  // Zoom state
  const [isHovering, setIsHovering] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState('0% 0%');
  const imageRef = useRef<HTMLDivElement>(null);

  // 360 Spin state
  const dragContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (is360Mode || !imageRef.current) return;

    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setBackgroundPosition(`${x}% ${y}%`);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!is360Mode) return;
    setIsDragging(true);
    setStartX(e.clientX);
    dragContainerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !is360Mode || !product.spinImages) return;

    const deltaX = e.clientX - startX;
    const sensitivity = 5;

    if (Math.abs(deltaX) > sensitivity) {
      const change = deltaX > 0 ? -1 : 1;
      let newIndex = (spinIndex + change) % product.spinImages.length;
      if (newIndex < 0) newIndex = product.spinImages.length - 1;

      setSpinIndex(newIndex);
      setStartX(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Has custom text entered
  const hasPersonalizationText = Boolean(
    personalizationValue &&
      personalizationValue.lines.some((l) => l.trim().length > 0)
  );

  // Accessible dynamic alt text
  const dynamicAltText = useMemo(() => {
    if (personalizationZone && hasPersonalizationText && personalizationValue) {
      const font = personalizationZone.fonts.find(
        (f) => f.id === personalizationValue.font_id
      );
      const text = personalizationValue.lines.filter(Boolean).join(' ');
      return `${product.name} personalized with "${text}" in ${font?.label || 'custom font'}`;
    }
    return product.name;
  }, [product.name, personalizationZone, hasPersonalizationText, personalizationValue]);

  // Is the current view showing the zone?
  const isViewingZoneImage =
    personalizationZone &&
    (images[activeIndex] === personalizationZone.image_id ||
      (zoneImageIndex >= 0 && activeIndex === zoneImageIndex));

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 h-full relative">
      {/* Thumbnails (Desktop) */}
      <div className="hidden md:flex flex-col gap-3 w-20 lg:w-24 overflow-y-auto no-scrollbar">
        {has360 && (
          <button
            onClick={() => {
              setIs360Mode(true);
              setIs3DMode(false);
            }}
            className={`w-full h-24 shrink-0 rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center gap-1 transition-colors ${
              is360Mode
                ? 'border-accent text-accent bg-accent/5'
                : 'border-border text-text-muted hover:border-text-muted'
            }`}
          >
            <RotateCcw size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">360° View</span>
          </button>
        )}
        {images.map((img, idx) => {
          const isZoneImg = personalizationZone && img === personalizationZone.image_id;
          return (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex(idx);
                setIs360Mode(false);
                setIs3DMode(false);
              }}
              className={`relative w-full h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                !is360Mode && !is3DMode && activeIndex === idx
                  ? 'border-accent opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${product.name} view ${idx + 1}`}
                className="w-full h-full object-cover"
                width={800}
                height={800}
              />
              {isZoneImg && isPersonalizing && (
                <span className="absolute bottom-1 right-1 bg-accent text-black text-[9px] font-mono px-1 rounded font-bold shadow-sm">
                  ENGRAVE
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Swipeable Gallery */}
      <div className="md:hidden relative w-[calc(100%+2rem)] aspect-square -mx-4 border-y border-border overflow-hidden">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory w-full h-full hide-scrollbar"
          style={{ scrollbarWidth: 'none' }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const idx = Math.round(el.scrollLeft / el.clientWidth);
            if (activeIndex !== idx) setActiveIndex(idx);
          }}
        >
          {images.map((img, idx) => {
            const isZoneImg = personalizationZone && img === personalizationZone.image_id;
            return (
              <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                <Image
                  src={img}
                  alt={isZoneImg && hasPersonalizationText ? dynamicAltText : `${product.name} view ${idx + 1}`}
                  className="w-full h-full object-cover"
                  width={800}
                  height={800}
                />

                {/* Hotspot Layer for Mobile Slide */}
                {activeIndex === idx && (
                  <HotspotLayer
                    hotspots={product.hotspots}
                    currentImageId={img}
                    selectedVariantId={selectedVariant}
                    isVisible={showHotspots}
                  />
                )}

                {/* Live Engraving Overlay on Mobile */}
                {isZoneImg && personalizationZone && personalizationValue && (
                  <EngravingOverlay
                    zone={personalizationZone}
                    value={personalizationValue}
                    selectedVariantValue={selectedVariant}
                    isFocused={isPersonalizationFocused}
                    isZoomed={false}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Quick jump to engraving view if user is on another slide */}
        {personalizationZone && isPersonalizing && !isViewingZoneImage && (
          <button
            type="button"
            onClick={() => setActiveIndex(zoneImageIndex >= 0 ? zoneImageIndex : 0)}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur-md border border-accent text-accent text-xs rounded-full font-medium shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preview on front view</span>
          </button>
        )}

        {/* Explore details toggle pill (Mobile) */}
        {currentImageHotspots.length > 0 && (
          <div className="absolute top-3 left-3 z-20">
            <ExploreDetailsToggle
              isVisible={showHotspots}
              count={currentImageHotspots.length}
              onToggle={handleToggleHotspots}
            />
          </div>
        )}

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === idx ? 'w-4 bg-foreground' : 'w-1.5 bg-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Viewer area (Desktop) */}
      <div className="hidden md:flex flex-col flex-1 h-full">
        <div className="relative w-full aspect-square lg:aspect-[4/5] bg-surface rounded-2xl overflow-hidden border border-border">
          {/* Quick jump to engraving view button on desktop */}
          {personalizationZone && isPersonalizing && !isViewingZoneImage && (
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => setActiveIndex(zoneImageIndex >= 0 ? zoneImageIndex : 0)}
                className="flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-md border border-accent/60 text-accent text-xs rounded-full font-medium shadow-md hover:bg-background transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preview on engraving view</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Explore details toggle button (Desktop) */}
          {!isHovering && !is3DMode && !is360Mode && currentImageHotspots.length > 0 && (
            <div className="absolute top-4 left-4 z-20">
              <ExploreDetailsToggle
                isVisible={showHotspots}
                count={currentImageHotspots.length}
                onToggle={handleToggleHotspots}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            {is3DMode && product.modelUrl ? (
              <motion.div
                key="3d-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-surface"
              >
                <ModelViewerWrapper
                  src={product.modelUrl}
                  iosSrc={product.iosModelUrl}
                  alt={product.name}
                />
              </motion.div>
            ) : is360Mode && product.spinImages ? (
              <motion.div
                key="360-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 select-none"
                style={{
                  cursor: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'/><path d='M3 3v5h5'/></svg>") 16 16, ew-resize`
                }}
                ref={dragContainerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <Image
                  src={product.spinImages[spinIndex]}
                  alt="360 view"
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                  width={800}
                  height={800}
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-lg pointer-events-none text-sm font-medium">
                  <RotateCcw size={16} className="text-foreground" />
                  <span className="text-foreground">Drag to Rotate</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`image-${activeIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
                style={{
                  cursor:
                    isHovering && !isPersonalizing
                      ? 'crosshair'
                      : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/><line x1='11' y1='8' x2='11' y2='14'/><line x1='8' y1='11' x2='14' y2='11'/></svg>") 16 16, zoom-in`
                }}
                ref={imageRef}
                onMouseEnter={() => {
                  if (!isPersonalizing) setIsHovering(true);
                }}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                onClick={() => {
                  if (!isPersonalizing) setIsHovering(!isHovering);
                }}
              >
                {/* Normal Image */}
                <Image
                  src={images[activeIndex]}
                  alt={isViewingZoneImage && hasPersonalizationText ? dynamicAltText : product.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isHovering && !isPersonalizing ? 'opacity-0' : 'opacity-100'
                  }`}
                  width={800}
                  height={800}
                />

                {/* Zoomed Image Overlay (disabled during active personalization to avoid misalignment) */}
                {!isPersonalizing && (
                  <div
                    className={`absolute inset-0 w-full h-full bg-no-repeat transition-opacity duration-300 pointer-events-none ${
                      isHovering ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      backgroundImage: `url(${images[activeIndex]})`,
                      backgroundPosition: backgroundPosition,
                      backgroundSize: '250%'
                    }}
                  />
                )}

                {!isHovering && !isPersonalizing && (
                  <div className="absolute top-4 right-4 p-2 bg-background/50 backdrop-blur-md rounded-full pointer-events-none text-text-muted">
                    <Maximize2 size={20} />
                  </div>
                )}

                {/* Feature Hotspot Layer (Image-Synced with object-fit: cover) */}
                <HotspotLayer
                  hotspots={product.hotspots}
                  currentImageId={images[activeIndex]}
                  selectedVariantId={selectedVariant}
                  isZoomed={isHovering && !isPersonalizing}
                  isVisible={showHotspots}
                />

                {/* Live Engraving Overlay Layer */}
                {isViewingZoneImage && personalizationZone && personalizationValue && (
                  <EngravingOverlay
                    zone={personalizationZone}
                    value={personalizationValue}
                    selectedVariantValue={selectedVariant}
                    isFocused={isPersonalizationFocused}
                    isZoomed={isHovering && !isPersonalizing}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Honest caption beneath preview */}
        {personalizationZone && isPersonalizing && isViewingZoneImage && (
          <p className="text-[11px] text-text-muted/70 text-center mt-2.5">
            Preview is a close digital representation. Final engraving may vary slightly in depth and tone.
          </p>
        )}
      </div>
    </div>
  );
}
