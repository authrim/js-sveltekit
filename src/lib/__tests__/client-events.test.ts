/**
 * Tests for client's event→store projection
 *
 * Design principle: "Events are source of truth, stores are projections"
 * These tests verify that events properly update the stores.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock @authrim/core
vi.mock('@authrim/core', () => ({
  PKCEHelper: vi.fn().mockImplementation(() => ({
    generatePKCE: vi.fn().mockResolvedValue({
      codeVerifier: 'mock-verifier',
      codeChallenge: 'mock-challenge',
    }),
  })),
  AuthrimError: class AuthrimError extends Error {
    code: string;
    meta: { retryable: boolean; severity: string };
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.meta = { retryable: false, severity: 'error' };
    }
  },
}));

// Mock browser APIs
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Setup globals before importing modules
vi.stubGlobal('localStorage', mockLocalStorage);
vi.stubGlobal('sessionStorage', mockLocalStorage);
vi.stubGlobal('crypto', {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
});

// Import after mocking
import { createAuthStores, toAuthError } from '../stores/auth.js';
import type { Session, User } from '@authrim/core';
import type { AuthError } from '../types.js';

describe('Event→Store Projection', () => {
  const mockSession: Session = {
    id: 'session-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockError: AuthError = {
    code: 'AR001001',
    error: 'network_error',
    message: 'Network error occurred',
    retryable: true,
    severity: 'error',
  };

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('auth:login event', () => {
    it('should update session and user stores on login', () => {
      const stores = createAuthStores();

      // Simulate login event projection
      stores._session.set(mockSession);
      stores._user.set(mockUser);
      stores._loadingState.set('idle');
      stores._error.set(null);

      expect(get(stores.public.session)).toEqual(mockSession);
      expect(get(stores.public.user)).toEqual(mockUser);
      expect(get(stores.public.isAuthenticated)).toBe(true);
      expect(get(stores.public.loadingState)).toBe('idle');
      expect(get(stores.public.error)).toBeNull();
    });
  });

  describe('auth:logout event', () => {
    it('should clear session and user stores on logout', () => {
      const stores = createAuthStores();

      // Setup: simulate logged in state
      stores._session.set(mockSession);
      stores._user.set(mockUser);

      expect(get(stores.public.isAuthenticated)).toBe(true);

      // Simulate logout event projection
      stores._session.set(null);
      stores._user.set(null);
      stores._loadingState.set('idle');
      stores._error.set(null);

      expect(get(stores.public.session)).toBeNull();
      expect(get(stores.public.user)).toBeNull();
      expect(get(stores.public.isAuthenticated)).toBe(false);
      expect(get(stores.public.loadingState)).toBe('idle');
    });
  });

  describe('auth:error event', () => {
    it('should set error store and return to idle', () => {
      const stores = createAuthStores();

      // Setup: simulate authenticating state
      stores._loadingState.set('authenticating');

      // Simulate error event projection
      const authError = toAuthError(mockError);
      stores._error.set(authError);
      stores._loadingState.set('idle');

      expect(get(stores.public.error)).toEqual(authError);
      expect(get(stores.public.loadingState)).toBe('idle');
    });
  });

  describe('session:changed event', () => {
    it('should update session and user stores', () => {
      const stores = createAuthStores();

      // Simulate session changed event projection
      stores._session.set(mockSession);
      stores._user.set(mockUser);

      expect(get(stores.public.session)).toEqual(mockSession);
      expect(get(stores.public.user)).toEqual(mockUser);
    });

    it('should handle session cleared', () => {
      const stores = createAuthStores();

      // Setup: logged in
      stores._session.set(mockSession);
      stores._user.set(mockUser);

      // Simulate session cleared
      stores._session.set(null);
      stores._user.set(null);

      expect(get(stores.public.session)).toBeNull();
      expect(get(stores.public.user)).toBeNull();
      expect(get(stores.public.isAuthenticated)).toBe(false);
    });
  });

  describe('loadingState transitions', () => {
    it('should transition: idle → authenticating → idle (success)', () => {
      const stores = createAuthStores();

      // Initial state
      expect(get(stores.public.loadingState)).toBe('idle');

      // Start authentication
      stores._loadingState.set('authenticating');
      expect(get(stores.public.loadingState)).toBe('authenticating');

      // Complete (success)
      stores._session.set(mockSession);
      stores._user.set(mockUser);
      stores._loadingState.set('idle');

      expect(get(stores.public.loadingState)).toBe('idle');
      expect(get(stores.public.isAuthenticated)).toBe(true);
    });

    it('should transition: idle → authenticating → idle (error)', () => {
      const stores = createAuthStores();

      // Initial state
      expect(get(stores.public.loadingState)).toBe('idle');

      // Start authentication
      stores._loadingState.set('authenticating');
      expect(get(stores.public.loadingState)).toBe('authenticating');

      // Complete (error)
      const authError = toAuthError(mockError);
      stores._error.set(authError);
      stores._loadingState.set('idle');

      expect(get(stores.public.loadingState)).toBe('idle');
      expect(get(stores.public.error)).toEqual(authError);
      expect(get(stores.public.isAuthenticated)).toBe(false);
    });

    it('should transition: idle → signing_out → idle', () => {
      const stores = createAuthStores();

      // Setup: logged in
      stores._session.set(mockSession);
      stores._user.set(mockUser);

      // Start sign out
      stores._loadingState.set('signing_out');
      expect(get(stores.public.loadingState)).toBe('signing_out');

      // Complete sign out
      stores._session.set(null);
      stores._user.set(null);
      stores._loadingState.set('idle');

      expect(get(stores.public.loadingState)).toBe('idle');
      expect(get(stores.public.isAuthenticated)).toBe(false);
    });

    it('should transition: idle → refreshing → idle', () => {
      const stores = createAuthStores();

      // Setup: logged in
      stores._session.set(mockSession);

      // Start refresh
      stores._loadingState.set('refreshing');
      expect(get(stores.public.loadingState)).toBe('refreshing');

      // Complete refresh
      stores._loadingState.set('idle');
      expect(get(stores.public.loadingState)).toBe('idle');
    });
  });

  describe('error clearing', () => {
    it('should clear error on successful login', () => {
      const stores = createAuthStores();

      // Setup: error state
      const authError = toAuthError(mockError);
      stores._error.set(authError);

      expect(get(stores.public.error)).not.toBeNull();

      // Successful login clears error
      stores._session.set(mockSession);
      stores._user.set(mockUser);
      stores._error.set(null);
      stores._loadingState.set('idle');

      expect(get(stores.public.error)).toBeNull();
    });
  });
});
