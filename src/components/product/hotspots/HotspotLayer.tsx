'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Hotspot } from '@/lib/hotspots/types';
import {
  calculateCoverCoordinates,
  computeSmartCalloutPosition,
  resolveMarkerCollisions,
} from '@/lib/hotspots/math';
import { HotspotMarker } from './HotspotMarker';
import { HotspotCallout } from './HotspotCallout';

interface HotspotLayerProps {
  hotspots?: Hotspot[];
  currentImageId: string;
  selectedVariantId?: string | null;
  isZoomed?: boolean;
  isVisible?: boolean; // Guided mode toggle state
  onToggleVisible?: () => void;
  className?: string;
}

export const HotspotLayer: React.FC<HotspotLayerProps> = ({
  hotspots = [],
  currentImageId,
  selectedVariantId,
  isZoomed = false,
  isVisible = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Image & Container layout metrics
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Active callout state
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false); // Stays open when clicked

  // Session interaction state: pulse stops after interacting with any hotspot in session
  const [hasInteracted, setHasInteracted] = useState(false);

  // Hover-intent timers
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if session previously interacted
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('matte_hotspot_interacted');
      if (stored === 'true') {
        setHasInteracted(true);
      }
    } catch {
      // Ignore in non-browser or sandbox environments
    }
  }, []);

  const markInteracted = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      try {
        sessionStorage.setItem('matte_hotspot_interacted', 'true');
      } catch {
        // Ignore
      }
    }
  }, [hasInteracted]);

  // Measure container and find parent/sibling img element
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateContainer = () => {
      if (el) {
        setContainerSize({ width: el.clientWidth, height: el.clientHeight });
      }
    };

    updateContainer();
    const resizeObserver = new ResizeObserver(updateContainer);
    resizeObserver.observe(el);

    // Look for rendered <img> to get naturalWidth / naturalHeight
    const findImage = () => {
      const img = el.parentElement?.querySelector('img') || el.querySelector('img');
      if (!img) return;

      if (img.complete && img.naturalWidth > 0) {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoaded(true);
      } else {
        const handleLoad = () => {
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          setImageLoaded(true);
        };
        const handleError = () => {
          setImageError(true);
          setImageLoaded(false);
        };
        img.addEventListener('load', handleLoad, { once: true });
        img.addEventListener('error', handleError, { once: true });
      }
    };

    findImage();
    const timer = setTimeout(findImage, 150);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [currentImageId]);

  // Filter hotspots for this image and active variant
  const activeHotspots = useMemo(() => {
    return hotspots
      .filter((h) => {
        // Match current image ID or URL
        if (h.imageId !== currentImageId) return false;
        // Variant check: empty means all variants
        if (selectedVariantId && h.variantIds && h.variantIds.length > 0) {
          return h.variantIds.includes(selectedVariantId);
        }
        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [hotspots, currentImageId, selectedVariantId]);

  // Compute rendered marker positions taking object-fit: cover into account
  const renderedPositions = useMemo(() => {
    if (!imageLoaded || imageError || containerSize.width === 0 || containerSize.height === 0) {
      return new Map();
    }

    const uncollided = activeHotspots.map((h) => {
      const pos = calculateCoverCoordinates(
        h.x,
        h.y,
        containerSize.width,
        containerSize.height,
        naturalSize.width || containerSize.width,
        naturalSize.height || containerSize.height
      );
      return { id: h.id, order: h.order, pos };
    });

    return resolveMarkerCollisions(uncollided);
  }, [activeHotspots, containerSize, naturalSize, imageLoaded, imageError]);

  // Close callout when image changes or when zoomed
  useEffect(() => {
    setActiveHotspotId(null);
    setIsPinned(false);
  }, [currentImageId, selectedVariantId, isZoomed]);

  // Handle outside click to dismiss pinned callout
  useEffect(() => {
    if (!activeHotspotId) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveHotspotId(null);
        setIsPinned(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('touchstart', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeHotspotId]);

  // Handle Escape key to close callout and restore focus to marker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeHotspotId) {
        const marker = markerRefs.current.get(activeHotspotId);
        setActiveHotspotId(null);
        setIsPinned(false);
        marker?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeHotspotId]);

  // Step to next hotspot in guided sequence
  const handleNextDetail = useCallback(() => {
    if (activeHotspots.length <= 1 || !activeHotspotId) return;
    const currentIndex = activeHotspots.findIndex((h) => h.id === activeHotspotId);
    const nextIndex = (currentIndex + 1) % activeHotspots.length;
    const nextHotspot = activeHotspots[nextIndex];
    if (nextHotspot) {
      setActiveHotspotId(nextHotspot.id);
      setIsPinned(true);
      markInteracted();
      markerRefs.current.get(nextHotspot.id)?.focus();
    }
  }, [activeHotspots, activeHotspotId, markInteracted]);

  // Arrow key navigation between markers
  const handleMarkerKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (activeHotspots.length <= 1) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (index + 1) % activeHotspots.length;
        const nextH = activeHotspots[nextIndex];
        markerRefs.current.get(nextH.id)?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (index - 1 + activeHotspots.length) % activeHotspots.length;
        const prevH = activeHotspots[prevIndex];
        markerRefs.current.get(prevH.id)?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const h = activeHotspots[index];
        if (activeHotspotId === h.id) {
          setActiveHotspotId(null);
          setIsPinned(false);
        } else {
          setActiveHotspotId(h.id);
          setIsPinned(true);
          markInteracted();
        }
      }
    },
    [activeHotspots, activeHotspotId, markInteracted]
  );

  // Hover-intent handlers (120ms enter delay, 150ms leave delay to avoid flicker)
  const handleMarkerMouseEnter = (hotspotId: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (isPinned) return;

    enterTimerRef.current = setTimeout(() => {
      setActiveHotspotId(hotspotId);
      markInteracted();
    }, 120);
  };

  const handleMarkerMouseLeave = () => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (isPinned) return;

    leaveTimerRef.current = setTimeout(() => {
      setActiveHotspotId((cur) => (isPinned ? cur : null));
    }, 150);
  };

  const handleCalloutMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleCalloutMouseLeave = () => {
    if (isPinned) return;
    leaveTimerRef.current = setTimeout(() => {
      setActiveHotspotId((cur) => (isPinned ? cur : null));
    }, 150);
  };

  const handleMarkerClick = (hotspotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markInteracted();

    if (activeHotspotId === hotspotId) {
      setActiveHotspotId(null);
      setIsPinned(false);
    } else {
      setActiveHotspotId(hotspotId);
      setIsPinned(true);
    }
  };

  // Edge cases: image failed to load or too small (< 200px) -> render nothing
  if (
    imageError ||
    !imageLoaded ||
    activeHotspots.length === 0 ||
    containerSize.width < 200 ||
    containerSize.height < 200
  ) {
    return null;
  }

  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 640 || containerSize.width < 450);
  const activeHotspot = activeHotspots.find((h) => h.id === activeHotspotId);
  const activePosition = activeHotspot ? renderedPositions.get(activeHotspot.id) : null;

  const smartCalloutPosition =
    activeHotspot && activePosition
      ? computeSmartCalloutPosition({
          markerXPx: activePosition.xPx,
          markerYPx: activePosition.yPx,
          containerWidth: containerSize.width,
          containerHeight: containerSize.height,
          cardWidth: isMobile ? 300 : 310,
          cardHeight: 140,
          isMobile,
        })
      : null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 ${
        isZoomed || !isVisible ? 'opacity-0' : 'opacity-100'
      } ${className}`}
    >
      {/* Screen Reader Accessible Details List: Guarantees info is never gated */}
      <div className="sr-only" aria-live="polite">
        <h3>Feature Details for this product view</h3>
        <ul>
          {activeHotspots.map((h, i) => (
            <li key={h.id}>
              <h4>
                Detail {h.order || i + 1}: {h.title}
              </h4>
              <p>{h.description}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Render Markers */}
      <AnimatePresence>
        {activeHotspots.map((hotspot, index) => {
          const pos = renderedPositions.get(hotspot.id);
          if (!pos) return null;

          const isActive = activeHotspotId === hotspot.id;
          const showPulse = !hasInteracted && !activeHotspotId;

          return (
            <HotspotMarker
              key={hotspot.id}
              hotspot={hotspot}
              index={index}
              total={activeHotspots.length}
              xPx={pos.xPx}
              yPx={pos.yPx}
              isActive={isActive}
              showPulse={showPulse}
              markerRef={(el) => {
                if (el) markerRefs.current.set(hotspot.id, el);
                else markerRefs.current.delete(hotspot.id);
              }}
              onClick={(e) => handleMarkerClick(hotspot.id, e)}
              onMouseEnter={() => handleMarkerMouseEnter(hotspot.id)}
              onMouseLeave={handleMarkerMouseLeave}
              onFocus={() => {
                setActiveHotspotId(hotspot.id);
                markInteracted();
              }}
              onBlur={() => {
                if (!isPinned) {
                  setActiveHotspotId(null);
                }
              }}
              onKeyDown={(e) => handleMarkerKeyDown(e, index)}
            />
          );
        })}
      </AnimatePresence>

      {/* Render Single Active Callout Card */}
      <AnimatePresence>
        {activeHotspot && smartCalloutPosition && (
          <HotspotCallout
            key={activeHotspot.id}
            hotspot={activeHotspot}
            position={smartCalloutPosition}
            index={activeHotspots.findIndex((h) => h.id === activeHotspot.id)}
            total={activeHotspots.length}
            onClose={() => {
              const marker = markerRefs.current.get(activeHotspot.id);
              setActiveHotspotId(null);
              setIsPinned(false);
              marker?.focus();
            }}
            onNext={activeHotspots.length > 1 ? handleNextDetail : undefined}
            onMouseEnter={handleCalloutMouseEnter}
            onMouseLeave={handleCalloutMouseLeave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
