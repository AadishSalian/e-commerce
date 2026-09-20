import { create } from 'zustand';
import { useUIStore } from './useUIStore';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  hashedPassword?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  user: null,

  initialize: () => {
    if (typeof window === 'undefined') return;
    const savedState = localStorage.getItem('mockAuthState');
    const savedUser = localStorage.getItem('mockUser');
    const lastActive = localStorage.getItem('mockAuthTimestamp');
    
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
