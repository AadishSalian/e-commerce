'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Bell, Fingerprint, Shield } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';

const VAPID_PUBLIC = 'BESTfY0xd1ywct3nY8pv0Q2CLGQDuRXEN626yWSPJy5q0MPVfRTw4MJ83veT0_jvH2H8nfdU9aBdaj_7FzlN4Xw';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setPushEnabled(!!sub);
        });
      });
    }
  }, []);

  const handlePushToggle = async () => {
    setIsSubscribing(true);
    try {
      if (pushEnabled) {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
        success('Push notifications disabled');
      } else {
        // Subscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subscription,
            userId: user?.id || 'mock-user-id'
          })
        });

        setPushEnabled(true);
        success('Push notifications enabled!');
      }
    } catch (err) {
      console.error(err);
      error('Failed to change push notification settings');
    }
    setIsSubscribing(false);
  };

  const handleSetupPasskey = async () => {
    try {
      // 1. Get options from server
      const resp = await fetch('/api/auth/webauthn/register');
      const options = await resp.json();
      
      if (!options.challenge) throw new Error('Failed to get options');
      
      // We will override user info so it matches the current user
      options.user.name = user?.email || 'user@example.com';
      options.user.displayName = user?.name || 'User';

      // 2. Pass options to browser authenticator
      const authResp = await startRegistration({ optionsJSON: options });

      // 3. Send response back to server
      const verificationResp = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: authResp,
          userId: user?.id || 'mock-user-id'
        }),
      });

      const verificationResult = await verificationResp.json();
      
      if (verificationResult.verified) {
        success('Passkey setup successful! You can now use biometric login.');
      } else {
        error('Passkey verification failed');
      }
    } catch (err) {
      console.error(err);
      error('Failed to setup passkey. Make sure you are using a supported device.');
    }
  };

  return (
    <div className="min-h-screen pt-8 md:pt-4 pb-12 px-4 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">App Settings & Security</h1>
      
      <div className="grid gap-6">
        {/* Push Notifications Section */}
        <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Push Notifications</h3>
              <p className="text-sm text-text-muted mt-1">Get updates on your orders, price drops, and restocks directly on your device.</p>
            </div>
          </div>
          <button 
            onClick={handlePushToggle}
            disabled={isSubscribing}
            className={`px-6 py-2.5 rounded-full font-medium transition-colors ${pushEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-foreground text-background hover:bg-foreground/90'}`}
          >
            {isSubscribing ? 'Updating...' : pushEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        {/* Biometrics Section */}
        <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Biometric Login (Passkey)</h3>
              <p className="text-sm text-text-muted mt-1">Use Face ID, Touch ID, or Windows Hello for a faster, passwordless login experience.</p>
            </div>
          </div>
          <button 
            onClick={handleSetupPasskey}
            className="px-6 py-2.5 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 shrink-0"
          >
            Setup Passkey
          </button>
        </div>
      </div>
    </div>
  );
}
