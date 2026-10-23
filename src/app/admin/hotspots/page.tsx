'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Eye,
  Edit3,
  Smartphone,
  Monitor,
  Check,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Hotspot } from '@/lib/hotspots/types';
import {
  MAX_HOTSPOTS_PER_IMAGE,
  MAX_DESCRIPTION_LENGTH,
  MIN_DISTANCE_PERCENT,
  calculateDistance,
  calculateNaturalCoordinatesFromContainer,
  calculateCoverCoordinates,
  validateHotspots,
} from '@/lib/hotspots/math';
import { MOCK_PRODUCTS, Product } from '@/lib/mockData';
import { HotspotMarker } from '@/components/product/hotspots/HotspotMarker';
import { HotspotCallout } from '@/components/product/hotspots/HotspotCallout';

export default function AdminHotspotsPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>(MOCK_PRODUCTS[0]?.id || 't-1');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [hotspotsByImage, setHotspotsByImage] = useState<Record<string, Hotspot[]>>({});
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Viewport & Preview mode state
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  // Saving & Feedback state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  const productImages = useMemo(() => {
    if (!selectedProduct) return [];
    return (
      selectedProduct.images ||
      (selectedProduct.hoverImage ? [selectedProduct.image, selectedProduct.hoverImage] : [selectedProduct.image])
    );
  }, [selectedProduct]);

  const currentImageId = productImages[selectedImageIndex] || productImages[0] || '';

  // Fetch hotspots for selected product from API
  const fetchHotspots = useCallback(async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/hotspots?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        const loadedHotspots: Hotspot[] = data.hotspots || [];
        // Group by imageId
        const map: Record<string, Hotspot[]> = {};
        loadedHotspots.forEach((h) => {
          if (!map[h.imageId]) map[h.imageId] = [];
          map[h.imageId].push(h);
        });
        setHotspotsByImage(map);
      }
    } catch (err) {
      console.error('Failed to load hotspots', err);
    }
  }, []);

  useEffect(() => {
    fetchHotspots(selectedProductId);
  }, [selectedProductId, fetchHotspots]);

  // Current list of hotspots for the active image
  const currentHotspots = useMemo(() => {
    return (hotspotsByImage[currentImageId] || []).sort((a, b) => a.order - b.order);
  }, [hotspotsByImage, currentImageId]);

  const selectedHotspot = useMemo(
    () => currentHotspots.find((h) => h.id === selectedHotspotId) || null,
    [currentHotspots, selectedHotspotId]
  );

  // Validate current image hotspots
  const validation = useMemo(() => {
    return validateHotspots(currentHotspots);
  }, [currentHotspots]);

  // Auto-select first hotspot if none selected
  useEffect(() => {
    if (currentHotspots.length > 0 && !selectedHotspotId) {
      setSelectedHotspotId(currentHotspots[0].id);
    } else if (currentHotspots.length === 0) {
      setSelectedHotspotId(null);
    }
  }, [currentHotspots, selectedHotspotId]);

  // Handle clicking on image canvas to drop a marker or select marker
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode === 'preview') return;
    if (draggingId) return; // Ignore drag end

    // Prevent if clicking on an existing marker
    if ((e.target as HTMLElement).closest('button')) return;

    if (currentHotspots.length >= MAX_HOTSPOTS_PER_IMAGE) {
      setSaveStatus({
        type: 'error',
        message: `Maximum ${MAX_HOTSPOTS_PER_IMAGE} hotspots per image reached. Restraint is key for premium design.`,
      });
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const natWidth = imgRef.current?.naturalWidth || rect.width;
    const natHeight = imgRef.current?.naturalHeight || rect.height;

    const { x, y } = calculateNaturalCoordinatesFromContainer(
      clickX,
      clickY,
      rect.width,
      rect.height,
      natWidth,
      natHeight
    );

    const newHotspot: Hotspot = {
      id: `hs-${Date.now()}`,
      productId: selectedProductId,
      imageId: currentImageId,
      x,
      y,
      title: 'Precision Detail',
      description: 'Crafted with meticulous attention to detail and premium materials.',
      order: currentHotspots.length + 1,
      link: '#details',
    };

    const nextList = [...currentHotspots, newHotspot];
    setHotspotsByImage((prev) => ({
      ...prev,
      [currentImageId]: nextList,
    }));
    setSelectedHotspotId(newHotspot.id);
  };

  // Pointer drag to reposition marker
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    if (viewMode === 'preview') return;
    e.stopPropagation();
    setDraggingId(id);
    setSelectedHotspotId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const clickY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const natWidth = imgRef.current?.naturalWidth || rect.width;
    const natHeight = imgRef.current?.naturalHeight || rect.height;

    const { x, y } = calculateNaturalCoordinatesFromContainer(
      clickX,
      clickY,
      rect.width,
      rect.height,
      natWidth,
      natHeight
    );

    setHotspotsByImage((prev) => {
      const list = prev[currentImageId] || [];
      return {
        ...prev,
        [currentImageId]: list.map((h) => (h.id === draggingId ? { ...h, x, y } : h)),
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      setDraggingId(null);
    }
  };

  // Update selected hotspot field
  const updateSelectedHotspot = (field: keyof Hotspot, value: any) => {
    if (!selectedHotspotId) return;

    setHotspotsByImage((prev) => {
      const list = prev[currentImageId] || [];
      return {
        ...prev,
        [currentImageId]: list.map((h) => {
          if (h.id === selectedHotspotId) {
            return { ...h, [field]: value };
          }
          return h;
        }),
      };
    });
  };

  // Delete hotspot
  const handleDeleteHotspot = (id: string) => {
    const nextList = currentHotspots.filter((h) => h.id !== id).map((h, i) => ({ ...h, order: i + 1 }));
    setHotspotsByImage((prev) => ({
      ...prev,
      [currentImageId]: nextList,
    }));
    if (selectedHotspotId === id) {
      setSelectedHotspotId(nextList[0]?.id || null);
    }
  };

  // Save changes to API
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      const res = await fetch('/api/admin/hotspots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: currentImageId,
          productId: selectedProductId,
          hotspots: currentHotspots,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveStatus({
          type: 'success',
          message: 'Hotspots saved successfully to catalog payload!',
        });
        setTimeout(() => setSaveStatus({ type: null, message: '' }), 4000);
      } else {
        setSaveStatus({
          type: 'error',
          message: data.error || (data.errors && data.errors[0]) || 'Failed to save',
        });
      }
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: 'error', message: 'Network error saving hotspots' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <Link href="/admin/products" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Catalog
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Feature Hotspots Authoring</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Product Hotspots Studio
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border border-accent/40 bg-accent/10 text-accent">
              Live Preview
            </span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Click on the product photography to drop markers, drag to position, and attach concise copy that justifies price.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/products/${selectedProductId}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-medium hover:bg-surface transition-colors text-text-muted hover:text-foreground"
          >
            <span>Storefront View</span>
            <ExternalLink size={13} />
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-all text-sm shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Save size={16} />
                Save Hotspots
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {saveStatus.message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm ${
            saveStatus.type === 'success'
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {saveStatus.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Proximity / Distance Warning Banner */}
      {validation.warnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <span className="font-semibold block">Marker Proximity Warning:</span>
            {validation.warnings.map((w, i) => (
              <p key={i} className="text-amber-200/90 leading-relaxed">
                {w}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Control Bar: Product & Image Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface p-4 rounded-xl border border-border">
        {/* Product Selector */}
        <div>
          <label className="block text-xs uppercase font-mono tracking-wider text-text-muted mb-1.5 font-medium">
            Select Product
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setSelectedImageIndex(0);
              setSelectedHotspotId(null);
            }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (${p.price.toFixed(2)}) — {p.category}
              </option>
            ))}
          </select>
        </div>

        {/* Image Filmstrip Selector */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs uppercase font-mono tracking-wider text-text-muted font-medium">
              Image Angle ({selectedImageIndex + 1} of {productImages.length})
            </label>
            <span className="text-xs text-text-muted">
              {currentHotspots.length} of {MAX_HOTSPOTS_PER_IMAGE} hotspots used
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {productImages.map((img, idx) => {
              const count = (hotspotsByImage[img] || []).length;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex(idx);
                    setSelectedHotspotId(null);
                  }}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImageIndex === idx ? 'border-accent ring-2 ring-accent/30' : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Angle ${idx + 1}`} fill className="object-cover" />
                  {count > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[10px] px-1 rounded-sm border border-white/20">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Canvas Area (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Canvas Mode Controls */}
          <div className="flex items-center justify-between text-xs bg-surface p-2.5 rounded-xl border border-border">
            <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'edit' ? 'bg-surface text-foreground font-semibold shadow-xs' : 'text-text-muted hover:text-foreground'
                }`}
              >
                <Edit3 size={13} />
                Edit & Position
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'preview' ? 'bg-surface text-foreground font-semibold shadow-xs' : 'text-text-muted hover:text-foreground'
                }`}
              >
                <Eye size={13} />
                Shopper Preview
              </button>
            </div>

            {viewMode === 'preview' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-md ${previewDevice === 'desktop' ? 'bg-surface text-accent' : 'text-text-muted'}`}
                    title="Desktop Preview"
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-md ${previewDevice === 'mobile' ? 'bg-surface text-accent' : 'text-text-muted'}`}
                    title="Mobile Preview"
                  >
                    <Smartphone size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-text-muted hover:text-foreground"
                >
                  Theme: {previewTheme === 'dark' ? 'Matte Dark' : 'Matte Light'}
                </button>
              </div>
            )}

            {viewMode === 'edit' && (
              <span className="text-text-muted text-[11px]">
                Click image to add marker ({currentHotspots.length}/5)
              </span>
            )}
          </div>

          {/* Image Canvas Container */}
          <div
            data-theme={previewTheme}
            className={`relative mx-auto transition-all duration-300 rounded-2xl overflow-hidden border border-border bg-black/30 ${
              previewDevice === 'mobile' && viewMode === 'preview'
                ? 'max-w-[360px] aspect-square shadow-2xl'
                : 'w-full aspect-[4/5] md:aspect-[4/3] lg:aspect-[4/5]'
            }`}
          >
            {/* The Image */}
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`relative w-full h-full select-none ${
                viewMode === 'edit' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            >
              <img
                ref={imgRef}
                src={currentImageId}
                alt={selectedProduct?.name}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />

              {/* In Edit Mode: Markers with Drag Handles and HUD coordinates */}
              {viewMode === 'edit' &&
                currentHotspots.map((h, idx) => {
                  const isSelected = h.id === selectedHotspotId;
                  const isDragging = h.id === draggingId;
                  const isClose = validation.overlappingPairs?.some((pair) => pair.includes(h.id));

                  return (
                    <div
                      key={h.id}
                      onPointerDown={(e) => handlePointerDown(h.id, e)}
                      style={{
                        left: `${h.x}%`,
                        top: `${h.y}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-grab active:cursor-grabbing z-20 ${
                        isDragging ? 'scale-110' : ''
                      }`}
                    >
                      {/* Visual Ring */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold transition-all shadow-md ${
                          isSelected
                            ? 'border-2 border-accent bg-black text-accent ring-4 ring-accent/30'
                            : isClose
                            ? 'border-2 border-amber-400 bg-amber-950/80 text-amber-300 ring-2 ring-amber-400/40'
                            : 'border-[1.5px] border-white/80 bg-black/75 text-white hover:border-accent'
                        }`}
                      >
                        {h.order || idx + 1}
                      </div>

                      {/* HUD pill badge when selected or dragging */}
                      {(isSelected || isDragging) && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded-md bg-black/90 border border-white/20 text-[10px] text-white font-mono whitespace-nowrap pointer-events-none z-30 shadow-lg">
                          {h.title || 'Marker'} ({h.x.toFixed(1)}%, {h.y.toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* In Preview Mode: Real Hotspot Layer Simulation */}
              {viewMode === 'preview' && (
                <div className="absolute inset-0 pointer-events-auto">
                  {currentHotspots.map((h, idx) => {
                    const isActive = selectedHotspotId === h.id;
                    const pos = calculateCoverCoordinates(
                      h.x,
                      h.y,
                      canvasRef.current?.clientWidth || 400,
                      canvasRef.current?.clientHeight || 500,
                      imgRef.current?.naturalWidth || 800,
                      imgRef.current?.naturalHeight || 800
                    );

                    return (
                      <React.Fragment key={h.id}>
                        <HotspotMarker
                          hotspot={h}
                          index={idx}
                          total={currentHotspots.length}
                          xPx={pos.xPx}
                          yPx={pos.yPx}
                          isActive={isActive}
                          showPulse={!selectedHotspotId}
                          onClick={() => setSelectedHotspotId(isActive ? null : h.id)}
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                          onFocus={() => setSelectedHotspotId(h.id)}
                          onBlur={() => {}}
                          onKeyDown={() => {}}
                        />

                        {isActive && (
                          <HotspotCallout
                            hotspot={h}
                            position={{
                              side: pos.yPx > 250 ? 'top' : 'bottom',
                              alignment: 'center',
                              left: Math.max(12, Math.min(pos.xPx - 140, 200)),
                              top: pos.yPx <= 250 ? pos.yPx + 14 : undefined,
                              bottom: pos.yPx > 250 ? 500 - pos.yPx + 14 : undefined,
                              arrowOffsetPx: Math.max(16, Math.min(264, pos.xPx - Math.max(12, Math.min(pos.xPx - 140, 200)))),
                              isMobileSheet: previewDevice === 'mobile',
                            }}
                            index={idx}
                            total={currentHotspots.length}
                            onClose={() => setSelectedHotspotId(null)}
                            onNext={() => {
                              const nextIdx = (idx + 1) % currentHotspots.length;
                              setSelectedHotspotId(currentHotspots[nextIdx]?.id || null);
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Inspector / Form Panel (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Hotspot List Selector */}
          <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                <Sparkles size={14} className="text-accent" />
                Hotspots on this Image ({currentHotspots.length}/{MAX_HOTSPOTS_PER_IMAGE})
              </h3>
              {currentHotspots.length < MAX_HOTSPOTS_PER_IMAGE && (
                <button
                  type="button"
                  onClick={() => {
                    const newHotspot: Hotspot = {
                      id: `hs-${Date.now()}`,
                      productId: selectedProductId,
                      imageId: currentImageId,
                      x: 50,
                      y: 50,
                      title: 'New Feature Detail',
                      description: 'Crafted with premium materials and ergonomic tolerances.',
                      order: currentHotspots.length + 1,
                      link: '#details',
                    };
                    setHotspotsByImage((prev) => ({
                      ...prev,
                      [currentImageId]: [...currentHotspots, newHotspot],
                    }));
                    setSelectedHotspotId(newHotspot.id);
                  }}
                  className="flex items-center gap-1 text-xs text-accent hover:underline font-medium cursor-pointer"
                >
                  <Plus size={13} />
                  Add Hotspot
                </button>
              )}
            </div>

            {currentHotspots.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-xs border border-dashed border-border rounded-lg">
                No hotspots on this image yet. Click anywhere on the image on the left to drop your first marker!
              </div>
            ) : (
              <div className="space-y-1.5">
                {currentHotspots.map((h, i) => {
                  const isSelected = h.id === selectedHotspotId;
                  const isClose = validation.overlappingPairs?.some((pair) => pair.includes(h.id));

                  return (
                    <div
                      key={h.id}
                      onClick={() => setSelectedHotspotId(h.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/5 text-foreground font-medium'
                          : 'border-border bg-background/50 hover:bg-background text-text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 ${
                            isSelected
                              ? 'bg-accent text-black font-bold'
                              : isClose
                              ? 'bg-amber-400 text-black font-bold'
                              : 'bg-surface border border-border text-foreground'
                          }`}
                        >
                          {h.order || i + 1}
                        </span>
                        <span className="truncate text-foreground font-medium">{h.title || 'Untitled Hotspot'}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isClose && (
                          <span title="Close proximity warning" className="text-amber-400">
                            <AlertTriangle size={13} />
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-text-muted">
                          {h.x.toFixed(0)}%, {h.y.toFixed(0)}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHotspot(h.id);
                          }}
                          className="p-1 hover:text-red-400 text-text-muted transition-colors rounded"
                          title="Delete hotspot"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Hotspot Form Inspector */}
          {selectedHotspot ? (
            <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Edit3 size={14} className="text-accent" />
                  Edit Hotspot #{selectedHotspot.order}
                </h3>
                <span className="text-[11px] font-mono text-text-muted">
                  Position: {selectedHotspot.x.toFixed(1)}% X, {selectedHotspot.y.toFixed(1)}% Y
                </span>
              </div>

              {/* Title Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-foreground">Title (3–5 words)</label>
                  <span className="text-[10px] text-text-muted">
                    {selectedHotspot.title.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <input
                  type="text"
                  value={selectedHotspot.title}
                  onChange={(e) => updateSelectedHotspot('title', e.target.value)}
                  placeholder="e.g. Brushed aluminum edge"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              {/* Description Field (Hard Limit of 120 chars) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-foreground">
                    Description (1–2 sentences)
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      selectedHotspot.description.length > 110
                        ? 'text-amber-400 font-bold'
                        : selectedHotspot.description.length >= MAX_DESCRIPTION_LENGTH
                        ? 'text-red-400 font-bold'
                        : 'text-text-muted'
                    }`}
                  >
                    {selectedHotspot.description.length} / {MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <textarea
                  value={selectedHotspot.description}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  onChange={(e) => updateSelectedHotspot('description', e.target.value)}
                  placeholder="e.g. Single block aerospace-grade alloy with bead-blasted matte finish."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Order Field */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Sequence Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={selectedHotspot.order}
                    onChange={(e) => updateSelectedHotspot('order', parseInt(e.target.value) || 1)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Anchor / Link
                  </label>
                  <input
                    type="text"
                    value={selectedHotspot.link || ''}
                    onChange={(e) => updateSelectedHotspot('link', e.target.value)}
                    placeholder="#details or /materials"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Detail Image Crop (Optional ~96px close-up) */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Detail Thumbnail Crop URL (Optional ~96px)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={selectedHotspot.detailImage || ''}
                    onChange={(e) => updateSelectedHotspot('detailImage', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                  {selectedHotspot.detailImage && (
                    <div className="w-9 h-9 rounded-md border border-border overflow-hidden shrink-0 relative">
                      <Image
                        src={selectedHotspot.detailImage}
                        alt="Crop preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Variant Targeting Checkboxes */}
              {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Target Variants (Leave empty for All Variants)
                  </label>
                  <div className="space-y-1.5 bg-background p-2.5 rounded-lg border border-border">
                    {selectedProduct.variants.map((v) => {
                      const isChecked = selectedHotspot.variantIds?.includes(v.value);
                      return (
                        <label key={v.id} className="flex items-center gap-2 text-xs text-text-muted hover:text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked || false}
                            onChange={(e) => {
                              const currentIds = selectedHotspot.variantIds || [];
                              const nextIds = e.target.checked
                                ? [...currentIds, v.value]
                                : currentIds.filter((id) => id !== v.value);
                              updateSelectedHotspot('variantIds', nextIds.length > 0 ? nextIds : undefined);
                            }}
                            className="rounded border-border text-accent focus:ring-accent"
                          />
                          <span>
                            {v.name}: <strong className="text-foreground">{v.value}</strong>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 flex justify-between items-center border-t border-border">
                <button
                  type="button"
                  onClick={() => handleDeleteHotspot(selectedHotspot.id)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                >
                  <Trash2 size={13} />
                  Delete Hotspot
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-muted text-xs">
              Select or create a hotspot on the left to edit its details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
