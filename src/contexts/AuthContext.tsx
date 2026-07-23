'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('mockAuthState');
    if (savedState === 'true') {
      // eslint-disable-next-line
      setIsLoggedIn(true);
    }
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem('mockAuthState', 'true');
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('mockAuthState', 'false');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
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
