/**
 * Authrim UI Theme Context
 */

import { setContext, getContext } from 'svelte';
import { writable, get, type Writable } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContext {
  theme: Writable<Theme>;
  resolvedTheme: Writable<'light' | 'dark'>;
  setTheme: (theme: Theme) => void;
  destroy: () => void;
}

export const THEME_CONTEXT_KEY = Symbol('authrim-theme');

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function createThemeContext(initialTheme: Theme = 'system'): ThemeContext {
  const theme = writable<Theme>(initialTheme);
  const resolvedTheme = writable<'light' | 'dark'>(
    initialTheme === 'system' ? getSystemTheme() : initialTheme
  );

  let mediaQuery: MediaQueryList | null = null;
  let handleChange: (() => void) | null = null;

  function updateResolved(t: Theme) {
    resolvedTheme.set(t === 'system' ? getSystemTheme() : t);
  }

  function setTheme(newTheme: Theme) {
    theme.set(newTheme);
    updateResolved(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('authrim-theme', newTheme);
    }
  }

  function destroy() {
    if (mediaQuery && handleChange) {
      mediaQuery.removeEventListener('change', handleChange);
      mediaQuery = null;
      handleChange = null;
    }
  }

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    handleChange = () => {
      const current = get(theme);
      if (current === 'system') {
        resolvedTheme.set(getSystemTheme());
      }
    };
    mediaQuery.addEventListener('change', handleChange);
  }

  const ctx: ThemeContext = { theme, resolvedTheme, setTheme, destroy };
  setContext(THEME_CONTEXT_KEY, ctx);
  return ctx;
}

export function getThemeContext(): ThemeContext {
  const ctx = getContext<ThemeContext>(THEME_CONTEXT_KEY);
  if (!ctx) {
    throw new Error('Theme context not found. Wrap your app with a theme provider.');
  }
  return ctx;
}

export function hasThemeContext(): boolean {
  try {
    return !!getContext<ThemeContext>(THEME_CONTEXT_KEY);
  } catch {
    return false;
  }
}

export function loadSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem('authrim-theme');
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'system';
}
