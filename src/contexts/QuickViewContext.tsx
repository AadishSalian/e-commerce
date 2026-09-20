'use client';

import React from 'react';
import { useQuickViewStore } from '@/store/useQuickViewStore';

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useQuickView() {
  return useQuickViewStore();
}
