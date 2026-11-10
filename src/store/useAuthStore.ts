import { create } from 'zustand';
import { useUIStore } from './useUIStore';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  hashedPassword?: string;
}

export const DEFAULT_DEMO_USER: User = {
  id: 'usr-demo-1',
  name: 'Aadish Balakrishna Salian',
  email: 'aadishsalian@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
};

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: true,
  user: DEFAULT_DEMO_USER,

  initialize: () => {
    if (typeof window === 'undefined') return;
    const savedState = localStorage.getItem('mockAuthState');
    const savedUser = localStorage.getItem('mockUser');
    const lastActive = localStorage.getItem('mockAuthTimestamp');

    if (savedState === null) {
      set({ user: DEFAULT_DEMO_USER, isLoggedIn: true });
      localStorage.setItem('mockAuthState', 'true');
      localStorage.setItem('mockUser', JSON.stringify(DEFAULT_DEMO_USER));
      localStorage.setItem('mockAuthTimestamp', Date.now().toString());
      return;
    }
    
    if (savedState === 'true' && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        if (lastActive && (now - parseInt(lastActive, 10) > THIRTY_DAYS)) {
          localStorage.setItem('mockAuthState', 'false');
          localStorage.removeItem('mockUser');
          localStorage.removeItem('mockAuthTimestamp');
          return;
        }

        set({ user: parsedUser, isLoggedIn: true });
        localStorage.setItem('mockAuthTimestamp', now.toString());
      } catch (e) {
        console.error('Failed to parse user from local storage', e);
      }
    }
  },

  login: (userData) => {
    set({ isLoggedIn: true, user: userData });
    localStorage.setItem('mockAuthState', 'true');
    localStorage.setItem('mockUser', JSON.stringify(userData));
    localStorage.setItem('mockAuthTimestamp', Date.now().toString());
    useUIStore.getState().success(`Welcome back, ${userData.name}!`);
  },

  logout: () => {
    set({ isLoggedIn: false, user: null });
    localStorage.setItem('mockAuthState', 'false');
    localStorage.removeItem('mockUser');
    localStorage.removeItem('mockAuthTimestamp');
    useUIStore.getState().addToast("You've been securely logged out.");
  },

  updateUser: (updates) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...updates };
      set({ user: updatedUser });
      localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    }
  },
}));
