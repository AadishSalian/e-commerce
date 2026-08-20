'use client';

import { PullToRefresh } from '@/components/ui';

export function PullToRefreshWrapper({ children }: { children: React.ReactNode }) {
  const handleRefresh = async () => {
    // dummy fetch or revalidate
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  return <PullToRefresh onRefresh={handleRefresh}>{children}</PullToRefresh>;
}
