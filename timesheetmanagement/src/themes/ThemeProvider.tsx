// packages/theme/src/ThemeProvider.tsx
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react';

// Import all styles
import '../tokens/index.css';
import './light.css';
import './dark.css';
import './brand-a.css';

// Available themes
export const THEMES = ['light', 'dark', 'brand-a', 'brand-a-dark'] as const;
export type ThemeName = (typeof THEMES)[number];

// Context type
interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleDarkMode: () => void;
  isDark: boolean;
}

// Create context with default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleDarkMode: () => {},
  isDark: false,
});

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
}

// Helper to safely access localStorage
function getStoredTheme(key: string, fallback: ThemeName): ThemeName {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored && THEMES.includes(stored as ThemeName)) {
      return stored as ThemeName;
    }
  } catch (e) {
    // localStorage not available
  }
  return fallback;
}

// Helper to safely set localStorage
function setStoredTheme(key: string, theme: ThemeName): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, theme);
  } catch (e) {
    // localStorage not available
  }
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'light',
  storageKey = 'app-theme'
}: ThemeProviderProps) {
  
  const [theme, setThemeState] = useState<ThemeName>(
    () => getStoredTheme(storageKey, defaultTheme)
  );

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme attribute
    root.removeAttribute('data-theme');
    
    // Apply new theme (light is default, no attribute needed)
    if (theme !== 'light') {
      root.setAttribute('data-theme', theme);
    }
    
    // Persist to localStorage
    setStoredTheme(storageKey, theme);
    
    // Update meta theme-color for mobile browsers
    const isDark = theme.includes('dark');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#0f172a' : '#ffffff');
    }
  }, [theme, storageKey]);

  // Theme setter with validation
  const setTheme = useCallback((newTheme: ThemeName) => {
    if (THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setThemeState(current => {
      switch (current) {
        case 'light': return 'dark';
        case 'dark': return 'light';
        case 'brand-a': return 'brand-a-dark';
        case 'brand-a-dark': return 'brand-a';
        default: return 'dark';
      }
    });
  }, []);

  const isDark = theme.includes('dark');

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleDarkMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook for consuming theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context;
}

// Theme Switcher Component
export function ThemeSwitcher() {
  const { theme, setTheme, toggleDarkMode, isDark } = useTheme();

  return (
    <div className="row" style={{ alignItems: 'center', gap: 'var(--spacing-2)' }}>
      <select 
        className="input" 
        value={theme} 
        onChange={(e) => setTheme(e.target.value as ThemeName)}
        style={{ width: 'auto' }}
      >
        {THEMES.map(t => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
          </option>
        ))}
      </select>
      
      <button className="btn btn-secondary" onClick={toggleDarkMode}>
        {isDark ? '☀️ Light' : '🌙 Dark'}
      </button>
    </div>
  );
}

export default ThemeProvider;