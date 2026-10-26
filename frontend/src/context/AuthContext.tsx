import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

// --- Context: AuthContext ---
// Purpose: Provides global user authentication state across all React components.
// Stores: Logged-in user data, JWT access token, and functions to login, register, and logout.

interface AuthContextType {
  user: User | null;              // Currently authenticated user object (or null if guest)
  token: string | null;           // JWT bearer token string from localStorage
  loading: boolean;               // True while validating credentials
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Step 1: Read token synchronously from localStorage on initial render.
  // This prevents any visual "flash" of being logged-out when refreshing the page.
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cinema_token');
    } catch {
      return null;
    }
  });

  // Step 2: Read cached user profile synchronously from localStorage.
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

  // Step 3: Run silent background verification on app load.
  // Calls GET /api/v1/auth/me to verify the token is still valid with the server.
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
