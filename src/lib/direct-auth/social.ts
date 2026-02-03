/**
 * Social Login Authentication
 */

import {
  AuthrimError,
  PKCEHelper,
  type CryptoProvider,
  type AuthrimStorage,
  type SocialAuth,
  type SocialProvider,
  type SocialLoginOptions,
  type AuthResult,
  type Session,
  type User,
} from '@authrim/core';
import { getAuthrimCode, mapSeverity } from '../utils/error-mapping.js';

const STORAGE_KEYS = {
  STATE: 'authrim:direct:social:state',
  CODE_VERIFIER: 'authrim:direct:social:code_verifier',
  PROVIDER: 'authrim:direct:social:provider',
  REDIRECT_URI: 'authrim:direct:social:redirect_uri',
};

// =============================================================================
// Redirect Path Validation & State Encoding
// =============================================================================

/**
 * Validates that a path is a safe relative path (no open redirect).
 * Only allows paths starting with '/' and blocks protocol schemes.
 */
function isValidRelativePath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  // Block protocol schemes (e.g., https:, javascript:, data:)
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return false;
  // Block protocol-relative URLs (e.g., //evil.com)
  if (path.startsWith('//')) return false;
  // Block backslashes (some browsers normalize \/ to //)
  if (path.includes('\\')) return false;
  // Must start with '/' (relative to origin)
  if (!path.startsWith('/')) return false;
  return true;
}

/**
 * Base64url encode (URL-safe base64 without padding)
 */
function base64urlEncode(bytes: Uint8Array): string {
  // Use reduce instead of spread to avoid stack overflow with large arrays
  const binary = bytes.reduce((str, byte) => str + String.fromCharCode(byte), '');
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64url decode (URL-safe base64)
 */
function base64urlDecode(encoded: string): Uint8Array {
  // Restore standard base64 characters
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface StateData {
  nonce: string;
  redirectTo?: string;
}

/**
 * Encode state data (nonce + optional redirectTo) into a string.
 * Uses base64url encoding with TextEncoder for Unicode support.
 */
function encodeStateData(nonce: string, redirectTo?: string): string {
  // If no redirectTo, return plain nonce for backwards compatibility
  if (!redirectTo) return nonce;

  const data: StateData = { nonce, redirectTo };
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  return base64urlEncode(bytes);
}

/**
 * Decode state data from encoded string.
 * Supports both legacy plain nonce and new JSON format.
 */
function decodeStateData(encoded: string): StateData | null {
  if (!encoded) return null;

  // Legacy format: plain hex nonce (64 chars of hex)
  if (/^[0-9a-f]+$/i.test(encoded)) {
    return { nonce: encoded };
  }

  // New format: base64url encoded JSON
  try {
    const bytes = base64urlDecode(encoded);
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json) as StateData;
    // Validate structure
    if (typeof data.nonce !== 'string') return null;
    if (data.redirectTo !== undefined && typeof data.redirectTo !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}

export interface SocialAuthOptions {
  issuer: string;
  clientId: string;
  crypto: CryptoProvider;
  storage: AuthrimStorage;
  exchangeToken: (
    authCode: string,
    codeVerifier: string,
    providerId?: string
  ) => Promise<{
    session?: Session;
    user?: User;
  }>;
  /**
   * Popup close detection interval in milliseconds.
   * Lower values provide faster detection but use more CPU.
   * Default: 200ms
   */
  popupCheckInterval?: number;
}

/** Default interval for checking if popup is closed (ms) */
const DEFAULT_POPUP_CHECK_INTERVAL = 200;

interface PopupFeatures {
  width: number;
  height: number;
  left: number;
  top: number;
}

export class SocialAuthImpl implements SocialAuth {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly pkce: PKCEHelper;
  private readonly storage: AuthrimStorage;
  private readonly exchangeToken: SocialAuthOptions['exchangeToken'];
  private readonly popupCheckIntervalMs: number;
  private popupWindow: Window | null = null;
  private popupCheckIntervalId: number | null = null;
  private popupResolve: ((result: AuthResult) => void) | null = null;
  private readonly boundHandlePopupMessage: (event: MessageEvent) => void;

  constructor(options: SocialAuthOptions) {
    this.issuer = options.issuer;
    this.clientId = options.clientId;
    this.pkce = new PKCEHelper(options.crypto);
    this.storage = options.storage;
    this.exchangeToken = options.exchangeToken;
    this.popupCheckIntervalMs = options.popupCheckInterval ?? DEFAULT_POPUP_CHECK_INTERVAL;

    this.boundHandlePopupMessage = this.handlePopupMessage.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.boundHandlePopupMessage);
    }
  }

  /**
   * Cleanup resources (must be called when the auth client is destroyed)
   */
  destroy(): void {
    this.cleanupPopup();
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.boundHandlePopupMessage);
    }
  }

  async loginWithPopup(
    provider: SocialProvider,
    options?: SocialLoginOptions & { redirectTo?: string }
  ): Promise<AuthResult> {
    const { codeVerifier, codeChallenge } = await this.pkce.generatePKCE();
    const nonce = await this.generateState();

    // Validate redirectTo and encode into state
    const validatedRedirectTo =
      options?.redirectTo && isValidRelativePath(options.redirectTo)
        ? options.redirectTo
        : undefined;
    const state = encodeStateData(nonce, validatedRedirectTo);

    const redirectUri = options?.redirectUri || this.getPopupCallbackUrl();
    const authUrl = this.buildAuthorizationUrl(provider, {
      state,
      codeChallenge,
      redirectUri,
      scopes: options?.scopes,
      loginHint: options?.loginHint,
    });

    const popupFeatures = this.getPopupFeatures(options?.popupFeatures);
    const popup = window.open(
      authUrl,
      'authrim_social_popup',
      this.buildPopupFeaturesString(popupFeatures)
    );

    if (!popup) {
      return {
        success: false,
        error: {
          error: 'popup_blocked',
          error_description: 'Popup was blocked by the browser. Please allow popups and try again.',
          code: 'AR004001',
          meta: { retryable: false, severity: 'warn' },
        },
      };
    }

    this.popupWindow = popup;

    await this.storage.set(STORAGE_KEYS.STATE, state);
    await this.storage.set(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    await this.storage.set(STORAGE_KEYS.PROVIDER, provider);
    await this.storage.set(STORAGE_KEYS.REDIRECT_URI, redirectUri);

    return new Promise<AuthResult>((resolve, reject) => {
      this.popupResolve = resolve;
      void reject;

      this.popupCheckIntervalId = window.setInterval(() => {
        if (popup.closed) {
          this.cleanupPopup();
          resolve({
            success: false,
            error: {
              error: 'popup_closed',
              error_description: 'The login popup was closed before completing authentication.',
              code: 'AR004002',
              meta: { retryable: false, severity: 'warn' },
            },
          });
        }
      }, this.popupCheckIntervalMs);
    });
  }

  async loginWithRedirect(
    provider: SocialProvider,
    options?: SocialLoginOptions & { redirectTo?: string }
  ): Promise<void> {
    const { codeVerifier, codeChallenge } = await this.pkce.generatePKCE();
    const nonce = await this.generateState();

    // Validate redirectTo and encode into state
    const validatedRedirectTo =
      options?.redirectTo && isValidRelativePath(options.redirectTo)
        ? options.redirectTo
        : undefined;
    const state = encodeStateData(nonce, validatedRedirectTo);

    const redirectUri = options?.redirectUri || window.location.href.split('?')[0];

    await this.storage.set(STORAGE_KEYS.STATE, state);
    await this.storage.set(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    await this.storage.set(STORAGE_KEYS.PROVIDER, provider);
    await this.storage.set(STORAGE_KEYS.REDIRECT_URI, redirectUri);

    const authUrl = this.buildAuthorizationUrl(provider, {
      state,
      codeChallenge,
      redirectUri,
      scopes: options?.scopes,
      loginHint: options?.loginHint,
    });

    window.location.href = authUrl;
  }

  async handleCallback(): Promise<AuthResult> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      await this.clearStoredState();
      return {
        success: false,
        error: {
          error: error,
          error_description: errorDescription || 'Authentication failed',
          code: 'AR004003',
          meta: { retryable: false, severity: 'error' },
        },
      };
    }

    if (!code || !state) {
      await this.clearStoredState();
      return {
        success: false,
        error: {
          error: 'invalid_response',
          error_description: 'Missing authorization code or state parameter',
          code: 'AR004004',
          meta: { retryable: false, severity: 'error' },
        },
      };
    }

    const storedState = await this.storage.get(STORAGE_KEYS.STATE);
    const codeVerifier = await this.storage.get(STORAGE_KEYS.CODE_VERIFIER);

    if (state !== storedState) {
      await this.clearStoredState();
      return {
        success: false,
        error: {
          error: 'state_mismatch',
          error_description: 'State parameter mismatch. Please try again.',
          code: 'AR004005',
          meta: { retryable: false, severity: 'error' },
        },
      };
    }

    if (!codeVerifier) {
      await this.clearStoredState();
      return {
        success: false,
        error: {
          error: 'invalid_state',
          error_description: 'No code verifier found. Please try again.',
          code: 'AR004006',
          meta: { retryable: false, severity: 'error' },
        },
      };
    }

    const providerId = await this.storage.get(STORAGE_KEYS.PROVIDER);
    if (!providerId) {
      await this.clearStoredState();
      return {
        success: false,
        error: {
          error: 'invalid_state',
          error_description: 'No provider found. Please try again.',
          code: 'AR004006',
          meta: { retryable: false, severity: 'error' },
        },
      };
    }

    try {
      const { session, user } = await this.exchangeToken(code, codeVerifier, providerId);

      // Extract redirectTo from state (after validation)
      const stateData = storedState ? decodeStateData(storedState) : null;
      const redirectTo =
        stateData?.redirectTo && isValidRelativePath(stateData.redirectTo)
          ? stateData.redirectTo
          : undefined;

      await this.clearStoredState();
      this.clearUrlParams();

      return {
        success: true,
        session,
        user,
        redirectTo,
      } as AuthResult & { redirectTo?: string };
    } catch (err) {
      await this.clearStoredState();

      if (err instanceof AuthrimError) {
        return {
          success: false,
          error: {
            error: err.code,
            error_description: err.message,
            code: getAuthrimCode(err.code, 'AR004000'),
            meta: {
              retryable: err.meta.retryable,
              severity: mapSeverity(err.meta.severity),
            },
          },
        };
      }

      return {
        success: false,
        error: {
          error: 'token_error',
          error_description: err instanceof Error ? err.message : 'Failed to exchange token',
          code: 'AR004007',
          meta: { retryable: false, severity: 'error' },
        },
      };
    }
  }

  hasCallbackParams(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('error');
  }

  getSupportedProviders(): SocialProvider[] {
    return ['google', 'github', 'apple', 'microsoft', 'facebook'];
  }

  private async generateState(): Promise<string> {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  private buildAuthorizationUrl(
    provider: SocialProvider,
    options: {
      state: string;
      codeChallenge: string;
      redirectUri: string;
      scopes?: string[];
      loginHint?: string;
    }
  ): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: options.redirectUri,
      state: options.state,
      code_challenge: options.codeChallenge,
      code_challenge_method: 'S256',
      provider,
    });

    if (options.scopes && options.scopes.length > 0) {
      params.set('scope', options.scopes.join(' '));
    }

    if (options.loginHint) {
      params.set('login_hint', options.loginHint);
    }

    return `${this.issuer}/api/v1/auth/authorize?${params.toString()}`;
  }

  private getPopupCallbackUrl(): string {
    return `${window.location.origin}/auth/callback/popup`;
  }

  private getPopupFeatures(options?: { width?: number; height?: number }): PopupFeatures {
    const width = options?.width || 500;
    const height = options?.height || 600;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);

    return { width, height, left, top };
  }

  private buildPopupFeaturesString(features: PopupFeatures): string {
    return [
      `width=${features.width}`,
      `height=${features.height}`,
      `left=${features.left}`,
      `top=${features.top}`,
      'scrollbars=yes',
      'resizable=yes',
      'status=no',
      'menubar=no',
      'toolbar=no',
      'location=yes',
    ].join(',');
  }

  private async handlePopupMessage(event: MessageEvent): Promise<void> {
    if (event.origin !== window.location.origin) {
      return;
    }

    const data = event.data as {
      type?: string;
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };

    if (data.type !== 'authrim:social:callback') {
      return;
    }

    const resolve = this.popupResolve;
    if (!resolve) {
      return;
    }

    this.cleanupPopup();

    if (data.error) {
      resolve({
        success: false,
        error: {
          error: data.error,
          error_description: data.error_description || 'Authentication failed',
          code: 'AR004003',
          meta: { retryable: false, severity: 'error' },
        },
      });
      await this.clearStoredState();
      return;
    }

    if (!data.code || !data.state) {
      resolve({
        success: false,
        error: {
          error: 'invalid_response',
          error_description: 'Missing authorization code or state',
          code: 'AR004004',
          meta: { retryable: false, severity: 'error' },
        },
      });
      await this.clearStoredState();
      return;
    }

    const storedState = await this.storage.get(STORAGE_KEYS.STATE);
    const codeVerifier = await this.storage.get(STORAGE_KEYS.CODE_VERIFIER);

    if (data.state !== storedState) {
      resolve({
        success: false,
        error: {
          error: 'state_mismatch',
          error_description: 'State parameter mismatch',
          code: 'AR004005',
          meta: { retryable: false, severity: 'error' },
        },
      });
      await this.clearStoredState();
      return;
    }

    if (!codeVerifier) {
      resolve({
        success: false,
        error: {
          error: 'invalid_state',
          error_description: 'No code verifier found',
          code: 'AR004006',
          meta: { retryable: false, severity: 'error' },
        },
      });
      await this.clearStoredState();
      return;
    }

    const providerId = await this.storage.get(STORAGE_KEYS.PROVIDER);
    if (!providerId) {
      resolve({
        success: false,
        error: {
          error: 'invalid_state',
          error_description: 'No provider found',
          code: 'AR004006',
          meta: { retryable: false, severity: 'error' },
        },
      });
      await this.clearStoredState();
      return;
    }

    try {
      const { session, user } = await this.exchangeToken(data.code, codeVerifier, providerId);

      // Extract redirectTo from state (after validation)
      const stateData = storedState ? decodeStateData(storedState) : null;
      const redirectTo =
        stateData?.redirectTo && isValidRelativePath(stateData.redirectTo)
          ? stateData.redirectTo
          : undefined;

      await this.clearStoredState();

      resolve({
        success: true,
        session,
        user,
        redirectTo,
      } as AuthResult & { redirectTo?: string });
    } catch (err) {
      await this.clearStoredState();

      resolve({
        success: false,
        error: {
          error: 'token_error',
          error_description: err instanceof Error ? err.message : 'Failed to exchange token',
          code: 'AR004007',
          meta: { retryable: false, severity: 'error' },
        },
      });
    }
  }

  private cleanupPopup(): void {
    if (this.popupCheckIntervalId) {
      clearInterval(this.popupCheckIntervalId);
      this.popupCheckIntervalId = null;
    }

    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
    }
    this.popupWindow = null;
    this.popupResolve = null;
  }

  private async clearStoredState(): Promise<void> {
    await this.storage.remove(STORAGE_KEYS.STATE);
    await this.storage.remove(STORAGE_KEYS.CODE_VERIFIER);
    await this.storage.remove(STORAGE_KEYS.PROVIDER);
    await this.storage.remove(STORAGE_KEYS.REDIRECT_URI);
  }

  private clearUrlParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    window.history.replaceState({}, '', url.toString());
  }
}
