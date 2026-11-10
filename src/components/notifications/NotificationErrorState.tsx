'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface NotificationErrorStateProps {
  onRetry: () => void;
  isLoading?: boolean;
}

export function NotificationErrorState({ onRetry, isLoading = false }: NotificationErrorStateProps) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2 mx-3 my-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Couldn’t refresh latest updates.</span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isLoading}
        className="flex items-center gap-1 font-semibold text-foreground hover:underline cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Retry</span>
      </button>
    </div>
  );
}
