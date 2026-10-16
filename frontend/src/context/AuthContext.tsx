import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous initialization from localStorage prevents any frame-0 jitter or unlogged-in flash on hard refresh (Ctrl+Shift+R)
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cinema_token');
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('cinema_user');
      const savedToken = localStorage.getItem('cinema_token');
      if (savedToken && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      return null;
    }
    return null;
  });

  const [loading] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('cinema_token');
    if (!savedToken) {
      return;
    }

    // Silent background token verification (does not cause UI flicker)
    api.getProfile()
      .then((verifiedUser) => {
        setUser(verifiedUser);
        localStorage.setItem('cinema_user', JSON.stringify(verifiedUser));
      })
      .catch((err: any) => {
        const status = err?.status || err?.response?.status;
        if (status === 401 || status === 403) {
          logout();
        }
      });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    await api.register(name, email, password);
    await login(email, password);
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const refreshed = await api.getProfile();
      setUser(refreshed);
      localStorage.setItem('cinema_user', JSON.stringify(refreshed));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
