'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  hashedPassword?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { success, toast } = useToast();

  useEffect(() => {
    const savedState = localStorage.getItem('mockAuthState');
    const savedUser = localStorage.getItem('mockUser');
    const lastActive = localStorage.getItem('mockAuthTimestamp');
    
    if (savedState === 'true' && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // 30 days in milliseconds
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        // Check if session has expired due to inactivity
        if (lastActive && (now - parseInt(lastActive, 10) > THIRTY_DAYS)) {
          console.log('Session expired due to inactivity');
          localStorage.setItem('mockAuthState', 'false');
          localStorage.removeItem('mockUser');
          localStorage.removeItem('mockAuthTimestamp');
          return;
        }

        // Valid session: set user and refresh activity timestamp
        setUser(parsedUser);
        setIsLoggedIn(true);
        localStorage.setItem('mockAuthTimestamp', now.toString());
      } catch (e) {
        console.error('Failed to parse user from local storage', e);
      }
    }
  }, []);

  const login = (userData: User) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem('mockAuthState', 'true');
    localStorage.setItem('mockUser', JSON.stringify(userData));
    localStorage.setItem('mockAuthTimestamp', Date.now().toString());
    success(`Welcome back, ${userData.name}!`);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.setItem('mockAuthState', 'false');
    localStorage.removeItem('mockUser');
    localStorage.removeItem('mockAuthTimestamp');
    toast("You've been securely logged out.");
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
