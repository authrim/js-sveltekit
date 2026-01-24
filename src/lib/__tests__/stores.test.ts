import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { createAuthStores, toAuthError } from '../stores/auth.js';

describe('createAuthStores', () => {
  it('should create stores with initial values', () => {
    const stores = createAuthStores();

    expect(get(stores.public.session)).toBeNull();
    expect(get(stores.public.user)).toBeNull();
    expect(get(stores.public.isAuthenticated)).toBe(false);
    expect(get(stores.public.loadingState)).toBe('idle');
    expect(get(stores.public.error)).toBeNull();
  });

  it('should update session store', () => {
    const stores = createAuthStores();
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    stores._session.set(mockSession);

    expect(get(stores.public.session)).toEqual(mockSession);
    expect(get(stores.public.isAuthenticated)).toBe(true);
  });

  it('should update user store', () => {
    const stores = createAuthStores();
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    };

    stores._user.set(mockUser);

    expect(get(stores.public.user)).toEqual(mockUser);
  });

  it('should update loading state', () => {
    const stores = createAuthStores();

    stores._loadingState.set('authenticating');
    expect(get(stores.public.loadingState)).toBe('authenticating');

    stores._loadingState.set('idle');
    expect(get(stores.public.loadingState)).toBe('idle');
  });

  it('should update error store', () => {
    const stores = createAuthStores();
    const error = {
      code: 'AR001001',
      message: 'Network error',
    };

    stores._error.set(error);

    expect(get(stores.public.error)).toEqual(error);
  });

  it('should derive isAuthenticated from session', () => {
    const stores = createAuthStores();

    expect(get(stores.public.isAuthenticated)).toBe(false);

    stores._session.set({
      id: 'session-1',
      userId: 'user-1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });

    expect(get(stores.public.isAuthenticated)).toBe(true);

    stores._session.set(null);

    expect(get(stores.public.isAuthenticated)).toBe(false);
  });
});

describe('toAuthError', () => {
  it('should convert DirectAuthError to AuthError', () => {
    const directAuthError = {
      code: 'AR001001',
      error: 'network_error',
      error_description: 'Network request failed',
      meta: {
        retryable: true,
        severity: 'error',
      },
    };

    const authError = toAuthError(directAuthError);

    expect(authError.code).toBe('AR001001');
    expect(authError.message).toBe('Network request failed');
  });

  it('should handle Error instances', () => {
    const error = new Error('Something went wrong');

    const authError = toAuthError(error);

    expect(authError.code).toBe('UNKNOWN_ERROR');
    expect(authError.message).toBe('Something went wrong');
  });

  it('should handle unknown errors', () => {
    const authError = toAuthError('Unknown error string');

    expect(authError.code).toBe('UNKNOWN_ERROR');
    expect(authError.message).toBe('Unknown error string');
  });
});
