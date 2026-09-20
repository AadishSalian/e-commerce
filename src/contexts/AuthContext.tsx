'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
export type { User } from '@/store/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

export function useAuth() {
  return useAuthStore();
}
