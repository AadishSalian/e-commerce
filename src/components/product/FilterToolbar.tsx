'use client';

import { useState, useEffect, useRef } from 'react';
import { Filter, X, SlidersHorizontal, Check, AlertCircle, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/lib/mockData';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  ListingState,
  ListingStatePatch,
  getActiveFilterChips,
  FilterUIState,
} from '@/lib/scroll-restoration';

export interface FilterToolbarProps {
  state: ListingState;
  totalResults: number;
  invalidParamsNotice?: string | null;
  onClearInvalidParamsNotice?: () => void;
  onUpdateState: (patch: ListingStatePatch, isMajor?: boolean) => void;
  onResetFilters: () => void;
  isDrawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
  filterUI?: FilterUIState;
  onUpdateFilterUI?: (updater: (prev: FilterUIState) => FilterUIState) => void;
  materials?: string[];
  brands?: string[];
  colors?: string[];
}

const COMMON_MATERIALS = ['Oak', 'Walnut', 'Aluminum', 'Ceramic', 'Leather', 'Steel', 'Cotton', 'Titanium', 'Glass', 'Wool'];
const COMMON_BRANDS = ['MATTE Labs', 'Studio Line', 'Atelier', 'Monolith', 'Apex'];
const COMMON_COLORS = ['Black', 'Charcoal', 'White', 'Silver', 'Navy', 'Olive'];

export default function FilterToolbar({
  state,
  totalResults,
  invalidParamsNotice,
  onClearInvalidParamsNotice,
  onUpdateState,
  onResetFilters,
  isDrawerOpen,
  onOpenDrawer,
  onCloseDrawer,
  filterUI,
  onUpdateFilterUI,
  materials = COMMON_MATERIALS,
  brands = COMMON_BRANDS,
  colors = COMMON_COLORS,
}: FilterToolbarProps) {
  const [searchInput, setSearchInput] = useState(state.q || '');
  const [minPriceInput, setMinPriceInput] = useState(state.minPrice !== null ? String(state.minPrice) : '');
  const [maxPriceInput, setMaxPriceInput] = useState(state.maxPrice !== null ? String(state.maxPrice) : '');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync internal search input if external state changes
  useEffect(() => {
    setSearchInput(state.q || '');
  }, [state.q]);

  useEffect(() => {
    setMinPriceInput(state.minPrice !== null ? String(state.minPrice) : '');
  }, [state.minPrice]);

  useEffect(() => {
    setMaxPriceInput(state.maxPrice !== null ? String(state.maxPrice) : '');
  }, [state.maxPrice]);

  // Debounced search query update (300ms)
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onUpdateState({ q: val.trim(), page: 1 }, false);
    }, 300);
  };

  const handlePriceApply = () => {
    const minVal = minPriceInput ? Number(minPriceInput) : null;
    const maxVal = maxPriceInput ? Number(maxPriceInput) : null;
    if (minVal !== null && Number.isNaN(minVal)) return;
    if (maxVal !== null && Number.isNaN(maxVal)) return;
    onUpdateState({ minPrice: minVal, maxPrice: maxVal, page: 1 }, false);
  };

  const toggleMaterial = (mat: string) => {
    const exists = state.material.includes(mat);
    const updated = exists ? state.material.filter((m) => m !== mat) : [...state.material, mat];
    onUpdateState({ material: updated, page: 1 }, false);
  };

  const toggleBrand = (b: string) => {
    const exists = state.brand.includes(b);
    const updated = exists ? state.brand.filter((item) => item !== b) : [...state.brand, b];
    onUpdateState({ brand: updated, page: 1 }, false);
  };

  const toggleColor = (c: string) => {
    const exists = state.color.includes(c);
    const updated = exists ? state.color.filter((item) => item !== c) : [...state.color, c];
    onUpdateState({ color: updated, page: 1 }, false);
  };

  const toggleGroupCollapse = (groupName: string) => {
    if (!onUpdateFilterUI) return;
    onUpdateFilterUI((prev) => ({
      ...prev,
      expandedGroups: {
        ...prev.expandedGroups,
        [groupName]: !prev.expandedGroups[groupName],
      },
    }));
  };

  const toggleShowMore = (section: string) => {
    if (!onUpdateFilterUI) return;
    onUpdateFilterUI((prev) => ({
      ...prev,
      showMore: {
        ...prev.showMore,
        [section]: !prev.showMore[section],
      },
    }));
  };

  const setViewMode = (mode: 'grid' | 'list') => {
    if (!onUpdateFilterUI) return;
    onUpdateFilterUI((prev) => ({
      ...prev,
      viewMode: mode,
    }));
  };

  const activeChips = getActiveFilterChips(state);
  const hasActiveFilters = activeChips.length > 0;

  const isMaterialExpanded = filterUI?.expandedGroups?.['Material'] ?? true;
  const isPriceExpanded = filterUI?.expandedGroups?.['Price'] ?? true;
  const isBrandExpanded = filterUI?.expandedGroups?.['Brand'] ?? true;
  const showMoreMaterials = filterUI?.showMore?.['Material'] ?? false;
  const visibleMaterials = showMoreMaterials ? materials : materials.slice(0, 5);

  return (
    <div className="w-full flex flex-col gap-4 mb-8">
      {/* Notice for invalid URL parameters sanitized */}
      <AnimatePresence>
        {invalidParamsNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{invalidParamsNotice}</span>
            </div>
            {onClearInvalidParamsNotice && (
              <button
                onClick={onClearInvalidParamsNotice}
                className="p-1 hover:bg-amber-500/20 rounded-md transition-colors"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Desktop & Mobile Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-border py-4">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1 w-full md:w-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted mr-1 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {CATEGORIES.map((cat) => {
            const isActive = state.category === cat || (cat === 'All' && state.category === 'All');
            return (
              <button
                key={cat}
                onClick={() => onUpdateState({ category: cat, page: 1 }, true)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border ${
                  isActive
                    ? 'bg-[#8ed500] text-[#121212] border-[#8ed500] shadow-sm font-semibold'
                    : 'bg-surface border-transparent text-text-muted hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search, Sort, ViewMode and Drawer Trigger */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
          {/* Quick Search Input */}
          <div className="relative flex-1 md:w-56">
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-surface border border-border text-foreground text-xs px-3.5 py-2 rounded-full focus:outline-none focus:border-[#8ed500] focus:ring-1 focus:ring-[#8ed500] transition-all"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 shrink-0">
            <CustomSelect
              value={state.sort}
              onChange={(newSort) => onUpdateState({ sort: newSort, page: 1 }, false)}
              variant="pill"
              options={[
                { label: 'Newest', value: 'newest' },
                { label: 'Relevance', value: 'relevance' },
                { label: 'Price: Low to High', value: 'price-asc' },
                { label: 'Price: High to Low', value: 'price-desc' },
                { label: 'Top Rated', value: 'rating' },
              ]}
            />
          </div>

          {/* View Mode Switcher (Grid vs List) */}
          {filterUI && (
            <div className="hidden sm:flex items-center gap-1 bg-surface border border-border rounded-full p-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors ${
                  filterUI.viewMode === 'grid'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-text-muted hover:text-foreground'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors ${
                  filterUI.viewMode === 'list'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-text-muted hover:text-foreground'
                }`}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile Filters Drawer Button */}
          <button
            onClick={onOpenDrawer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface border border-border text-xs font-medium text-foreground hover:bg-surface-hover transition-colors shrink-0 md:hidden"
            aria-label="Open filter drawer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#8ed500]" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex items-center flex-wrap gap-2 pt-1 pb-2">
          <span className="text-xs text-text-muted mr-1">Active filters:</span>
          {activeChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onUpdateState(chip.removePatch, false)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-surface border border-border/80 text-foreground hover:border-[#8ed500]/60 transition-colors group"
            >
              <span>{chip.label}</span>
              <X className="w-3 h-3 text-text-muted group-hover:text-foreground transition-colors" />
            </button>
          ))}
          <button
            onClick={onResetFilters}
            className="text-xs text-accent hover:underline ml-2"
          >
            Reset all
          </button>
        </div>
      )}

      {/* Mobile & Tablet BottomSheet Filter Drawer */}
      <BottomSheet
        isOpen={isDrawerOpen}
        onClose={onCloseDrawer}
        title="Refine Collection"
      >
        <div className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto pb-8 pr-1">
          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Category</h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onUpdateState({ category: cat, page: 1 }, true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    state.category === cat
                      ? 'bg-[#8ed500] text-[#121212] font-semibold'
                      : 'bg-surface border border-border text-text-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Materials Accordion */}
          <div className="border-t border-border/50 pt-4">
            <button
              onClick={() => toggleGroupCollapse('Material')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-foreground mb-3"
            >
              <span>Material</span>
              {isMaterialExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isMaterialExpanded && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {visibleMaterials.map((mat) => {
                    const isSelected = state.material.includes(mat);
                    return (
                      <button
                        key={mat}
                        onClick={() => toggleMaterial(mat)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-surface-active border-[#8ed500] text-foreground'
                            : 'bg-surface border-border text-text-muted hover:text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-[#8ed500]" />}
                        {mat}
                      </button>
                    );
                  })}
                </div>
                {materials.length > 5 && (
                  <button
                    onClick={() => toggleShowMore('Material')}
                    className="text-xs text-accent mt-2 hover:underline"
                  >
                    {showMoreMaterials ? 'Show fewer' : `Show all (${materials.length})`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Price Range Accordion */}
          <div className="border-t border-border/50 pt-4">
            <button
              onClick={() => toggleGroupCollapse('Price')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-foreground mb-3"
            >
              <span>Price Range ($)</span>
              {isPriceExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isPriceExpanded && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-1/2 bg-surface border border-border px-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:border-[#8ed500]"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-1/2 bg-surface border border-border px-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:border-[#8ed500]"
                />
                <button
                  onClick={handlePriceApply}
                  className="px-3 py-2 bg-foreground text-background text-xs font-bold rounded-lg hover:opacity-90"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          {/* In Stock Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-border/50">
            <span className="text-sm text-foreground font-medium">In-Stock Only</span>
            <button
              onClick={() => onUpdateState({ inStock: state.inStock ? null : true, page: 1 }, false)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                state.inStock ? 'bg-[#8ed500]' : 'bg-surface border border-border'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  state.inStock ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={onResetFilters}
              className="flex-1 py-3 bg-surface border border-border text-foreground font-medium text-xs rounded-xl"
            >
              Reset Filters
            </button>
            <button
              onClick={onCloseDrawer}
              className="flex-1 py-3 bg-foreground text-background font-bold text-xs rounded-xl"
            >
              View {totalResults} Results
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
