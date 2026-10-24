'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  Move,
  Maximize,
  Sliders,
  Eye,
  Copy,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MOCK_PRODUCTS, Product } from '@/lib/mockData';
import {
  EngravingZone,
  PersonalizationValue,
  EngravingFinishStyle,
  EngravingFont
} from '@/lib/personalization/types';
import { ENGRAVING_FONTS, CURATED_SYMBOLS, SEED_ENGRAVING_ZONES } from '@/lib/personalization/data';
import { PersonalizationService } from '@/lib/personalization/service';
import { EngravingOverlay } from '@/components/product/personalization/EngravingOverlay';

export default function AdminPersonalizationStudio() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>('a-1');
  const [allZones, setAllZones] = useState<EngravingZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Canvas interaction refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; initW: number; initH: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    initW: 0,
    initH: 0
  });

  // Test sample text state
  const [sampleText, setSampleText] = useState('ALEXANDER');
  const [activeFontId, setActiveFontId] = useState('classic-serif');

  // Load zones
  useEffect(() => {
    const loaded = PersonalizationService.getAllZones();
    setAllZones(loaded);
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  const productImages = useMemo(() => {
    return selectedProduct.images || (selectedProduct.hoverImage ? [selectedProduct.image, selectedProduct.hoverImage] : [selectedProduct.image]);
  }, [selectedProduct]);

  // Current product's zones
  const productZones = useMemo(() => {
    return allZones.filter((z) => z.productId === selectedProductId);
  }, [allZones, selectedProductId]);

  // Active editable zone
  const activeZone = useMemo(() => {
    return allZones.find((z) => z.zone_id === selectedZoneId) || productZones[0] || null;
  }, [allZones, selectedZoneId, productZones]);

  // Auto select first zone when product changes
  useEffect(() => {
    if (productZones.length > 0 && (!selectedZoneId || !productZones.some(z => z.zone_id === selectedZoneId))) {
      setSelectedZoneId(productZones[0].zone_id);
    } else if (productZones.length === 0) {
      setSelectedZoneId(null);
    }
  }, [selectedProductId, productZones, selectedZoneId]);

  // Update active zone in memory
  const updateActiveZone = (partial: Partial<EngravingZone>) => {
    if (!activeZone) return;
    const updated = { ...activeZone, ...partial };
    setAllZones((prev) => prev.map((z) => (z.zone_id === activeZone.zone_id ? updated : z)));
  };

  const updateGeometry = (partial: Partial<EngravingZone['geometry']>) => {
    if (!activeZone) return;
    updateActiveZone({
      geometry: { ...activeZone.geometry, ...partial }
    });
  };

  // Pointer drag to reposition
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!activeZone || !canvasRef.current) return;
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: activeZone.geometry.x,
      initY: activeZone.geometry.y,
      initW: activeZone.geometry.width,
      initH: activeZone.geometry.height
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Pointer drag to resize
  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!activeZone || !canvasRef.current) return;
    setIsResizing(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: activeZone.geometry.x,
      initY: activeZone.geometry.y,
      initW: activeZone.geometry.width,
      initH: activeZone.geometry.height
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current || (!isDragging && !isResizing) || !activeZone) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100;

    if (isDragging) {
      const newX = Math.max(0, Math.min(100 - activeZone.geometry.width, Number((dragStartRef.current.initX + deltaXPercent).toFixed(1))));
      const newY = Math.max(0, Math.min(100 - activeZone.geometry.height, Number((dragStartRef.current.initY + deltaYPercent).toFixed(1))));
      updateGeometry({ x: newX, y: newY });
    } else if (isResizing) {
      const newW = Math.max(8, Math.min(100 - activeZone.geometry.x, Number((dragStartRef.current.initW + deltaXPercent).toFixed(1))));
      const newH = Math.max(5, Math.min(100 - activeZone.geometry.y, Number((dragStartRef.current.initH + deltaYPercent).toFixed(1))));
      updateGeometry({ width: newW, height: newH });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleCreateNewZone = () => {
    const newZone: EngravingZone = {
      zone_id: `zone-${selectedProductId}-${Date.now().toString(36)}`,
      productId: selectedProductId,
      name: `${selectedProduct.name} Custom Engraving`,
      image_id: productImages[0],
      geometry: {
        x: 35.0,
        y: 45.0,
        width: 30.0,
        height: 12.0,
        rotation: 0,
        skewX: 0,
        skewY: 0
      },
      max_lines: 1,
      max_chars_per_line: 14,
      allowed_charset: 'LATIN_BASIC_NUMERIC_PUNCTUATION',
      charset_description: 'Latin letters, numbers, and basic punctuation.',
      fonts: ENGRAVING_FONTS,
      default_font_id: 'classic-serif',
      supports_monogram: true,
      supports_alignment: true,
      default_alignment: 'center',
      allowed_symbols: CURATED_SYMBOLS,
      finish_style: 'laser_metal',
      price_addon: 1500,
      lead_time_days: 2,
      returnable: false,
      notice: 'Precision workshop engraving.'
    };

    PersonalizationService.saveZone(newZone);
    setAllZones((prev) => [...prev, newZone]);
    setSelectedZoneId(newZone.zone_id);
    setSaveStatus('New zone created!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveToCatalog = () => {
    if (!activeZone) return;
    PersonalizationService.saveZone(activeZone);
    setSaveStatus('Zone successfully saved to catalog!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteZone = () => {
    if (!activeZone) return;
    if (confirm(`Delete zone "${activeZone.name}"?`)) {
      PersonalizationService.deleteZone(activeZone.zone_id);
      setAllZones((prev) => prev.filter((z) => z.zone_id !== activeZone.zone_id));
      setSelectedZoneId(null);
      setSaveStatus('Zone deleted.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleResetCatalog = () => {
    if (confirm('Reset all engraving zones to seed defaults?')) {
      PersonalizationService.resetToSeeds();
      setAllZones(PersonalizationService.getAllZones());
      setSaveStatus('Reset to catalog seeds.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleCopyJson = () => {
    if (!activeZone) return;
    navigator.clipboard.writeText(JSON.stringify(activeZone, null, 2));
    setSaveStatus('Copied zone JSON to clipboard!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Virtual test value
  const testValue: PersonalizationValue = {
    lines: [sampleText],
    font_id: activeFontId,
    alignment: activeZone?.default_alignment || 'center',
    zone_id: activeZone?.zone_id || ''
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Personalization & Engraving Studio
            </h1>
            <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-mono text-xs font-semibold">
              Admin Authoring
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Draw engraving zones directly on high-res product photos. What staff draws is exactly what machines engrave.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetCatalog}
            className="px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-surface text-text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            disabled={!activeZone}
            className="px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-surface text-text-muted hover:text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy JSON
          </button>
          <button
            type="button"
            onClick={handleSaveToCatalog}
            disabled={!activeZone}
            className="px-5 py-2 text-xs font-semibold bg-accent text-black rounded-xl hover:bg-accent-hover transition-colors flex items-center gap-1.5 shadow-md shadow-accent/10 disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            Save Zone
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 bg-accent/15 border border-accent/40 rounded-xl text-accent text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Canvas Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Product & Image Selection Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">Product:</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-background border border-border rounded-lg text-xs px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:border-accent"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/products/${selectedProductId}`}
                target="_blank"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                View on Storefront <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Interactive Drawing Canvas */}
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-full aspect-square bg-background rounded-2xl border border-border overflow-hidden select-none touch-none shadow-xl"
            style={{
              cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'default'
            }}
          >
            {/* Base Product Image */}
            <img
              src={activeZone?.image_id || productImages[0]}
              alt={selectedProduct.name}
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Draggable & Resizable Engraving Zone Box */}
            {activeZone && (
              <div
                className="absolute border-2 border-accent rounded-sm transition-shadow group select-none"
                style={{
                  left: `${activeZone.geometry.x}%`,
                  top: `${activeZone.geometry.y}%`,
                  width: `${activeZone.geometry.width}%`,
                  height: `${activeZone.geometry.height}%`,
                  transform: `rotate(${activeZone.geometry.rotation}deg) skewX(${activeZone.geometry.skewX || 0}deg) skewY(${activeZone.geometry.skewY || 0}deg)`,
                  transformOrigin: 'center center',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.5), inset 0 0 12px rgba(142,213,0,0.15)'
                }}
              >
                {/* Zone Label & Move Handle */}
                <div
                  onPointerDown={handlePointerDownDrag}
                  className="absolute -top-7 left-0 bg-accent text-black text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-grab active:cursor-grabbing shadow-md z-30"
                >
                  <Move className="w-3 h-3" />
                  <span>
                    X:{activeZone.geometry.x}% Y:{activeZone.geometry.y}% ({activeZone.geometry.width}×{activeZone.geometry.height}%)
                  </span>
                </div>

                {/* Bottom-right Resize Handle */}
                <div
                  onPointerDown={handlePointerDownResize}
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-accent text-black rounded-full flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-30"
                  title="Drag to resize zone"
                >
                  <Maximize className="w-2.5 h-2.5" />
                </div>

                {/* Live Real-time Text Overlay Inside the Authoring Zone */}
                <EngravingOverlay
                  zone={activeZone}
                  value={testValue}
                  isFocused={true}
                  isZoomed={false}
                />
              </div>
            )}
          </div>

          {/* Image View Selector */}
          <div className="space-y-1.5">
            <span className="text-xs text-text-muted font-medium">Select Base Product Image for Zone:</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateActiveZone({ image_id: img })}
                  className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    activeZone?.image_id === img
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  {activeZone?.image_id === img && (
                    <span className="absolute bottom-0 inset-x-0 bg-accent text-black text-[8px] font-mono font-bold text-center">
                      ZONE
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Zone Properties & Live Testing (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Zones for this Product */}
          <div className="p-4 bg-surface rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Product Zones ({productZones.length})
              </span>
              <button
                type="button"
                onClick={handleCreateNewZone}
                className="px-2.5 py-1 text-xs font-medium bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Zone
              </button>
            </div>

            {productZones.length > 0 ? (
              <div className="space-y-1.5">
                {productZones.map((z) => (
                  <div
                    key={z.zone_id}
                    onClick={() => setSelectedZoneId(z.zone_id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                      activeZone?.zone_id === z.zone_id
                        ? 'border-accent bg-accent/5 text-foreground'
                        : 'border-border bg-background hover:bg-surface-hover text-text-muted'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{z.name}</p>
                      <p className="text-[11px] text-text-muted">
                        {z.finish_style.toUpperCase()} • +${(z.price_addon / 100).toFixed(2)} • +{z.lead_time_days}d
                      </p>
                    </div>
                    {activeZone?.zone_id === z.zone_id && (
                      <span className="text-[10px] font-mono text-accent uppercase font-bold">Active</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No zones for this product yet. Click Add Zone.</p>
            )}
          </div>

          {activeZone && (
            <div className="p-5 bg-surface rounded-2xl border border-border space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-semibold text-foreground uppercase tracking-wider text-sm">
                  Zone Configuration
                </span>
                <button
                  type="button"
                  onClick={handleDeleteZone}
                  className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              {/* Zone Name */}
              <div className="space-y-1">
                <label className="text-text-muted font-medium">Zone Display Name</label>
                <input
                  type="text"
                  value={activeZone.name}
                  onChange={(e) => updateActiveZone({ name: e.target.value })}
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              {/* Geometry Adjustments */}
              <div className="space-y-3 p-3 bg-background rounded-xl border border-border">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block">
                  Fine-tune Geometry & Angles
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-text-muted block text-[11px]">Rotation ({activeZone.geometry.rotation}°)</label>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={activeZone.geometry.rotation}
                      onChange={(e) => updateGeometry({ rotation: parseFloat(e.target.value) })}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted block text-[11px]">Skew X ({activeZone.geometry.skewX || 0}°)</label>
                    <input
                      type="range"
                      min="-25"
                      max="25"
                      value={activeZone.geometry.skewX || 0}
                      onChange={(e) => updateGeometry({ skewX: parseFloat(e.target.value) })}
                      className="w-full accent-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Process Finish & Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-text-muted font-medium">Finish Style</label>
                  <select
                    value={activeZone.finish_style}
                    onChange={(e) => updateActiveZone({ finish_style: e.target.value as EngravingFinishStyle })}
                    className="w-full bg-background border border-border px-2.5 py-2 rounded-lg text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="laser_metal">Laser on Metal</option>
                    <option value="debossed_leather">Debossed Leather</option>
                    <option value="engraved_wood">Engraved Wood</option>
                    <option value="foil_emboss">Foil Emboss</option>
                    <option value="embroidery">Embroidery Stitch</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted font-medium">Price Add-On ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={(activeZone.price_addon / 100).toFixed(2)}
                    onChange={(e) => updateActiveZone({ price_addon: Math.round(parseFloat(e.target.value || '0') * 100) })}
                    className="w-full bg-background border border-border px-3 py-2 rounded-lg text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Charset & Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-text-muted font-medium">Max Lines</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={activeZone.max_lines}
                    onChange={(e) => updateActiveZone({ max_lines: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-background border border-border px-3 py-2 rounded-lg text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-text-muted font-medium">Max Chars Per Line</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={activeZone.max_chars_per_line}
                    onChange={(e) => updateActiveZone({ max_chars_per_line: parseInt(e.target.value, 10) || 10 })}
                    className="w-full bg-background border border-border px-3 py-2 rounded-lg text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Live Preview Sample Input */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-text-muted font-medium block">Live Sample Text Test</label>
                <input
                  type="text"
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-foreground font-medium focus:outline-none focus:border-accent"
                  placeholder="Type test text..."
                />

                <div className="flex gap-1.5 flex-wrap pt-1">
                  {ENGRAVING_FONTS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFontId(f.id)}
                      className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                        activeFontId === f.id
                          ? 'border-accent bg-accent/15 text-accent font-semibold'
                          : 'border-border bg-background text-text-muted hover:text-foreground'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
