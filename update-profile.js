const fs = require('fs');

const profilePath = 'src/app/profile/page.tsx';
let content = fs.readFileSync(profilePath, 'utf8');

// Add imports
const importsToAdd = `
import { Fingerprint } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';

const VAPID_PUBLIC = 'BESTfY0xd1ywct3nY8pv0Q2CLGQDuRXEN626yWSPJy5q0MPVfRTw4MJ83veT0_jvH2H8nfdU9aBdaj_7FzlN4Xw';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
`;
content = content.replace("import { MOCK_PRODUCTS } from '@/lib/mockData';", "import { MOCK_PRODUCTS } from '@/lib/mockData';\n" + importsToAdd);

// Add hooks
const hooksToAdd = `
  const { error } = useToast();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
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
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
        success('Push notifications disabled');
      } else {
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
      const resp = await fetch('/api/auth/webauthn/register');
      const options = await resp.json();
      
      if (!options.challenge) throw new Error('Failed to get options');
      
      options.user.name = user?.email || 'user@example.com';
      options.user.displayName = user?.name || 'User';

      const authResp = await startRegistration({ optionsJSON: options });

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
`;
content = content.replace("const [isSaving, setIsSaving] = useState(false);", "const [isSaving, setIsSaving] = useState(false);\n" + hooksToAdd);


// Update Security tab UI
const newSecurityUI = `
                  <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 md:p-8 border-b border-border">
                      <h3 className="text-xl font-bold text-foreground mb-1">Change Password</h3>
                      <p className="text-sm text-text-muted">Update your password associated with your account.</p>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-md">
                      <InputField label="Current Password" type="password" placeholder="••••••••" />
                      <InputField label="New Password" type="password" placeholder="••••••••" />
                      <InputField label="Confirm New Password" type="password" placeholder="••••••••" />
                      <button className="px-6 py-3 mt-4 bg-surface-hover hover:bg-surface-active text-foreground font-bold rounded-xl transition-colors text-sm w-fit border border-border">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm mt-8">
                    <div className="p-6 md:p-8 border-b border-border">
                      <h3 className="text-xl font-bold text-foreground mb-1">Biometric Login</h3>
                      <p className="text-sm text-text-muted">Use Face ID, Touch ID, or Windows Hello for a faster, passwordless login experience.</p>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
                          <Fingerprint className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Passkey Setup</h4>
                          <p className="text-sm text-text-muted">Secure your account with biometric data.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleSetupPasskey}
                        className="px-6 py-2.5 bg-foreground text-background font-bold rounded-full transition-colors text-sm shrink-0 hover:bg-foreground/90 w-full sm:w-auto"
                      >
                        Setup Passkey
                      </button>
                    </div>
                  </div>
`;
content = content.replace(/<div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">[\s\S]*?Update Password\s*<\/button>\s*<\/div>\s*<\/div>/, newSecurityUI.trim());

// Update Notifications tab UI
const newNotificationsUI = `
                  <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm mb-8">
                    <div className="p-6 md:p-8 border-b border-border flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">Push Notifications</h3>
                        <p className="text-sm text-text-muted">Get updates on your orders, price drops, and restocks directly on your device.</p>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
                          <Bell className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Browser Push</h4>
                          <p className="text-sm text-text-muted">Enable to receive live updates.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handlePushToggle}
                        disabled={isSubscribing}
                        className={\`px-6 py-2.5 rounded-full font-bold text-sm transition-colors shrink-0 w-full sm:w-auto \${pushEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-foreground text-background hover:bg-foreground/90'}\`}
                      >
                        {isSubscribing ? 'Updating...' : pushEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
`;
content = content.replace(/<div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">\s*<div className="p-6 md:p-8 border-b border-border flex justify-between items-center">/, newNotificationsUI.trim());


fs.writeFileSync(profilePath, content);
console.log('Profile updated successfully');
