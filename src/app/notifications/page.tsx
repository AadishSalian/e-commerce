import { Metadata } from 'next';
import { getUserNotifications } from '@/lib/notifications/service';
import { NotificationsPageClient } from './NotificationsPageClient';

export const metadata: Metadata = {
  title: 'Notifications | MATTE.',
  description: 'Your real order updates, price drops, and restock notifications.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NotificationsPage() {
  // Server-side initial data fetch for fast, accessible initial paint and no-JS fallback
  const initialData = getUserNotifications('usr-demo-1', {
    category: 'all',
    limit: 20,
  });

  return <NotificationsPageClient initialData={initialData} />;
}
