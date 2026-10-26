import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Context: ThemeContext ---
// Purpose: Manages Dark/Light mode theme preferences across the application.
// Automatically respects the user's OS preference, stores manual choice in localStorage,
// and applies the appropriate CSS classes to <html>.

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;                   // Current active theme ('light' or 'dark')
  toggleTheme: () => void;        // Switches between light and dark
  setTheme: (theme: Theme) => void;// Explicitly sets light or dark
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Step 1: Detect initial theme:
  // First check localStorage for a saved preference; otherwise check the browser's system dark mode setting.
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check local storage first
    const saved = localStorage.getItem('cinema_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // 2. Default to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Step 2: Apply the theme to the <html> root element whenever it changes.
  // Adds/removes CSS class 'dark' and sets attribute data-theme="dark"|"light".
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', theme);
    localStorage.setItem('cinema_theme', theme);
  }, [theme]);

  // Listen to system theme changes if user hasn't overridden
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('cinema_theme');
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
