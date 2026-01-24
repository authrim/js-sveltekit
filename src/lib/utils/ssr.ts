/**
 * SSR Utilities for Authrim Svelte SDK
 *
 * ブラウザ/サーバー環境の判定とSSR対応ヘルパー
 */

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if running in server environment
 */
export function isServer(): boolean {
  return !isBrowser();
}

/**
 * Execute callback only in browser environment
 */
export function onBrowser<T>(callback: () => T): T | undefined {
  if (isBrowser()) {
    return callback();
  }
  return undefined;
}

/**
 * Execute callback only in server environment
 */
export function onServer<T>(callback: () => T): T | undefined {
  if (isServer()) {
    return callback();
  }
  return undefined;
}

/**
 * Safe window access (returns undefined on server)
 */
export function getWindow(): Window | undefined {
  return isBrowser() ? window : undefined;
}

/**
 * Safe document access (returns undefined on server)
 */
export function getDocument(): Document | undefined {
  return isBrowser() ? document : undefined;
}

/**
 * Safe localStorage access (returns null on server)
 */
export function getLocalStorage(): Storage | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Safe sessionStorage access (returns null on server)
 */
export function getSessionStorage(): Storage | null {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
