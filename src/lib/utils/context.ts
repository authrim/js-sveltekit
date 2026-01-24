/**
 * Svelte Context utilities for Authrim
 *
 * Svelte 4: setContext/getContext
 * Svelte 5: 互換性維持（将来の $state rune 対応準備）
 */

import { setContext, getContext } from 'svelte';
import type { AuthrimClient } from '../types.js';

export const AUTH_CONTEXT_KEY = Symbol('authrim');

export function setAuthContext(auth: AuthrimClient): void {
  setContext(AUTH_CONTEXT_KEY, auth);
}

export function getAuthContext(): AuthrimClient {
  const auth = getContext<AuthrimClient>(AUTH_CONTEXT_KEY);
  if (!auth) {
    throw new Error(
      'Auth context not found. Make sure to wrap your component with AuthProvider.'
    );
  }
  return auth;
}

export function hasAuthContext(): boolean {
  try {
    return !!getContext<AuthrimClient>(AUTH_CONTEXT_KEY);
  } catch {
    return false;
  }
}
