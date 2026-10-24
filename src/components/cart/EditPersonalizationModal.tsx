'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Sparkles, Check, Clock, ShieldAlert } from 'lucide-react';
import { CartItem, useCartStore } from '@/store/useCartStore';
import { PersonalizationService } from '@/lib/personalization/service';
import {
  EngravingZone,
  PersonalizationValue,
  PersonalizationCartProperty,
  EngravingFont
} from '@/lib/personalization/types';
import { formatSpelledOutText } from '@/lib/personalization/validation';
import { EngravingOverlay } from '@/components/product/personalization/EngravingOverlay';
import { PersonalizationPanel } from '@/components/product/personalization/PersonalizationPanel';

interface EditPersonalizationModalProps {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPersonalizationModal({
  item,
  isOpen,
  onClose
}: EditPersonalizationModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const { updatePersonalization } = useCartStore();

  const [zone, setZone] = useState<EngravingZone | null>(null);
  const [value, setValue] = useState<PersonalizationValue | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (item && item.personalization) {
      const foundZone = PersonalizationService.getZoneById(item.personalization.zone_id);
      setZone(foundZone);
      setValue({
        lines: item.personalization.lines,
        font_id: item.personalization.font_id,
        alignment: item.personalization.alignment,
        icon_id: item.personalization.icon_id,
        monogram_mode: item.personalization.monogram_mode,
        foil_color: item.personalization.foil_color,
        zone_id: item.personalization.zone_id,
        variant_id: item.selectedVariant
      });
    }
  }, [item]);

  if (!item || !item.personalization || !zone || !value) return null;

  const handleSave = () => {
    const font: EngravingFont =
      zone.fonts.find((f) => f.id === value.font_id) || zone.fonts[0];
    const cleanedLines = value.lines.map((l) => l.trim()).filter(Boolean);
    const formatted = cleanedLines.join(' / ');

    const updatedProp: PersonalizationCartProperty = {
      ...item.personalization!,
      lines: cleanedLines,
      formattedText: formatted,
      font_id: font.id,
      font_label: font.label,
      alignment: value.alignment,
      icon_id: value.icon_id,
      icon_glyph: value.icon_id,
      monogram_mode: value.monogram_mode,
      foil_color: value.foil_color,
      spelledOutText: formatSpelledOutText(formatted)
    };

    updatePersonalization(item.cartId, updatedProp);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12 }
            }
            transition={{ duration: 0.22 }}
            className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Workshop Inscription Editor
                </span>
                <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                  Edit Personalization for {item.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-6">
              {/* Product Visual with Live Updated Overlay */}
              <div className="relative w-full aspect-[16/10] bg-background rounded-xl border border-border overflow-hidden">
                <img
                  src={zone.image_id || item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <EngravingOverlay
                  zone={zone}
                  value={value}
                  selectedVariantValue={item.selectedVariant}
                  isFocused={isFocused}
                />
              </div>

              {/* Personalization Configurator Inputs */}
              <PersonalizationPanel
                zone={zone}
                value={value}
                onChange={setValue}
                onFocusChange={setIsFocused}
                selectedVariantValue={item.selectedVariant}
                isOpen={true}
                onToggleOpen={() => {}}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent" />
                Edits apply to all {item.quantity} unit{item.quantity > 1 ? 's' : ''} in this line
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 rounded-xl text-sm font-semibold bg-accent text-black hover:bg-accent-hover transition-colors shadow-md shadow-accent/10 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Update Inscription
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
