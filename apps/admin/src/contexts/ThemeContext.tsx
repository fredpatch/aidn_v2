import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AVAILABLE_PALETTES, DEFAULT_PALETTE, DEFAULT_THEME, STORAGE_PREFIX } from '@/config/app';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type Palette = (typeof AVAILABLE_PALETTES)[number];

const VALID_THEMES: readonly Theme[] = ['light', 'dark', 'system'];
const VALID_PALETTES: readonly Palette[] = AVAILABLE_PALETTES;

const THEME_KEY = `${STORAGE_PREFIX}:theme`;
const PALETTE_KEY = `${STORAGE_PREFIX}:palette`;

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  palette: Palette;
  setPalette: (palette: Palette) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return VALID_THEMES.includes(value as Theme);
}

function isPalette(value: string | null): value is Palette {
  return VALID_PALETTES.includes(value as Palette);
}

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return isTheme(stored) ? stored : DEFAULT_THEME;
}

function getStoredPalette(): Palette {
  const stored = localStorage.getItem(PALETTE_KEY);
  if (stored === 'default') return DEFAULT_PALETTE;
  if (stored === 'blue') return 'aviation';
  if (stored === 'green') return 'gabon';
  return isPalette(stored) ? stored : DEFAULT_PALETTE;
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return theme;
}

function applyTheme(resolvedTheme: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
}

function applyPalette(palette: Palette): void {
  document.documentElement.setAttribute('data-palette', palette);
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [palette, setPaletteState] = useState<Palette>(DEFAULT_PALETTE);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const storedTheme = getStoredTheme();
    const storedPalette = getStoredPalette();
    const resolved = resolveTheme(storedTheme);

    setThemeState(storedTheme);
    setPaletteState(storedPalette);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    applyPalette(storedPalette);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    if (theme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      const nextResolvedTheme = event.matches ? 'dark' : 'light';
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    };

    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [mounted, theme]);

  useEffect(() => {
    if (!mounted) return;
    applyPalette(palette);
  }, [mounted, palette]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        const nextResolvedTheme = resolveTheme(newTheme);
        setResolvedTheme(nextResolvedTheme);
        applyTheme(nextResolvedTheme);
      },
      palette,
      setPalette: (newPalette: Palette) => {
        setPaletteState(newPalette);
        localStorage.setItem(PALETTE_KEY, newPalette);
        applyPalette(newPalette);
      },
    }),
    [palette, resolvedTheme, theme],
  );

  if (!mounted) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
