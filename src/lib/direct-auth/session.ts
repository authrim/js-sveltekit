/**
 * Session Management for Direct Auth
 */

import {
  AuthrimError,
  type SessionAuth,
  type Session,
  type DirectAuthLogoutOptions,
  type DirectAuthTokenRequest,
  type DirectAuthTokenResponse,
  type User,
} from '@authrim/core';
import type { BrowserHttpClient } from '../providers/http.js';

const ENDPOINTS = {
  TOKEN: '/api/v1/auth/direct/token',
  SESSION: '/api/v1/auth/direct/session',
  LOGOUT: '/api/v1/auth/direct/logout',
};

const STORAGE_KEY_PREFIX = 'authrim_session';

export interface SessionManagerOptions {
  issuer: string;
  clientId: string;
  http: BrowserHttpClient;
}

function getStorageKey(issuer: string, clientId: string): string {
  const key = `${issuer}:${clientId}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${STORAGE_KEY_PREFIX}_${Math.abs(hash).toString(36)}`;
}

export class SessionAuthImpl implements SessionAuth {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly http: BrowserHttpClient;
  private readonly storageKey: string;
  private cachedSession: Session | null = null;
  private cachedUser: User | null = null;
  private sessionCacheExpiry: number = 0;
  private readonly SESSION_CACHE_TTL = 60000;

  constructor(options: SessionManagerOptions) {
    this.issuer = options.issuer;
    this.clientId = options.clientId;
    this.http = options.http;
    this.storageKey = getStorageKey(options.issuer, options.clientId);
  }

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  private storeToken(token: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, token);
    } catch {
      console.warn('[Authrim] Failed to store token in localStorage');
    }
  }

  private removeStoredToken(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // localStorage not available
    }
  }

  async get(): Promise<Session | null> {
    if (this.cachedSession && Date.now() < this.sessionCacheExpiry) {
      return this.cachedSession;
    }

    const token = this.getStoredToken();
    if (!token) {
      this.clearCache();
      return null;
    }

    try {
      const response = await this.http.fetch<{
        session: Session;
        user: User;
      }>(`${this.issuer}${ENDPOINTS.SESSION}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok || !response.data) {
        if (response.status === 401) {
          this.removeStoredToken();
        }
        this.clearCache();
        return null;
      }

      this.cachedSession = response.data.session;
      this.cachedUser = response.data.user;
      this.sessionCacheExpiry = Date.now() + this.SESSION_CACHE_TTL;

      return response.data.session;
    } catch {
      this.clearCache();
      return null;
    }
  }

  async getUser(): Promise<User | null> {
    if (this.cachedUser && Date.now() < this.sessionCacheExpiry) {
      return this.cachedUser;
    }

    await this.get();
    return this.cachedUser;
  }

  async validate(): Promise<boolean> {
    try {
      const session = await this.get();
      if (!session) return false;

      const expiresAt = new Date(session.expiresAt).getTime();
      return Date.now() < expiresAt;
    } catch {
      return false;
    }
  }

  async logout(options?: DirectAuthLogoutOptions): Promise<void> {
    const token = this.getStoredToken();

    if (token) {
      try {
        const requestBody: {
          client_id: string;
          revoke_tokens?: boolean;
        } = {
          client_id: this.clientId,
        };

        if (options?.revokeTokens !== undefined) {
          requestBody.revoke_tokens = options.revokeTokens;
        }

        await this.http.fetch(`${this.issuer}${ENDPOINTS.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    this.removeStoredToken();
    this.clearCache();

    if (options?.redirectUri && typeof window !== 'undefined') {
      window.location.href = options.redirectUri;
    }
  }

  async exchangeToken(
    authCode: string,
    codeVerifier: string,
    requestRefreshToken?: boolean
  ): Promise<{ session?: Session; user?: User }> {
    const request: DirectAuthTokenRequest = {
      grant_type: 'authorization_code',
      code: authCode,
      client_id: this.clientId,
      code_verifier: codeVerifier,
      request_refresh_token: requestRefreshToken,
    };

    const response = await this.http.fetch<DirectAuthTokenResponse>(
      `${this.issuer}${ENDPOINTS.TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok || !response.data) {
      if (response.status === 400) {
        const errorData = response.data as unknown as {
          error?: string;
          error_description?: string;
        };

        if (errorData?.error === 'invalid_grant') {
          throw new AuthrimError(
            'auth_code_invalid',
            errorData.error_description || 'Invalid authorization code'
          );
        }

        if (errorData?.error === 'expired_token') {
          throw new AuthrimError(
            'auth_code_expired',
            errorData.error_description || 'Authorization code has expired'
          );
        }
      }

      throw new AuthrimError('token_error', 'Failed to exchange authorization code for tokens');
    }

    const tokenResponse = response.data;

    if (tokenResponse.access_token) {
      this.storeToken(tokenResponse.access_token);
    }

    if (tokenResponse.session) {
      this.cachedSession = tokenResponse.session;
      this.sessionCacheExpiry = Date.now() + this.SESSION_CACHE_TTL;
    }

    if (tokenResponse.user) {
      this.cachedUser = tokenResponse.user;
    }

    return {
      session: tokenResponse.session,
      user: tokenResponse.user,
    };
  }

  /**
   * Revalidate the current session by clearing cache and fetching fresh data.
   *
   * Note: This does NOT perform OAuth token refresh (grant_type: 'refresh_token').
   * Token refresh is handled automatically by the server when the access token
   * is still valid but needs renewal.
   *
   * For explicit token refresh, use the refresh token flow through the server.
   *
   * @returns Fresh session data or null if not authenticated
   */
  async refresh(): Promise<Session | null> {
    this.clearCache();
    return this.get();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }

    const session = await this.get();
    return session !== null;
  }

  clearCache(): void {
    this.cachedSession = null;
    this.cachedUser = null;
    this.sessionCacheExpiry = 0;
  }

  getToken(): string | null {
    return this.getStoredToken();
  }
}
