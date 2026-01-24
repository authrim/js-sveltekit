/**
 * Email Code Authentication (OTP)
 *
 * IMPORTANT: Multi-tab limitation
 * The pending verification state (codeVerifier, attemptId) is stored in memory.
 * This means that if a user opens multiple tabs:
 * - Each tab has its own EmailCodeAuthImpl instance
 * - send() in Tab A creates state only in Tab A
 * - verify() in Tab B will fail because Tab B has no state
 *
 * For multi-tab support, consider using BroadcastChannel or SharedWorker.
 * For most use cases, this limitation is acceptable.
 */

import {
  AuthrimError,
  PKCEHelper,
  type HttpClient,
  type CryptoProvider,
  type EmailCodeAuth,
  type EmailCodeSendOptions,
  type EmailCodeSendResult,
  type EmailCodeVerifyOptions,
  type AuthResult,
  type EmailCodeSendRequest,
  type EmailCodeSendResponse,
  type EmailCodeVerifyRequest,
  type EmailCodeVerifyResponse,
  type Session,
  type User,
} from '@authrim/core';
import { getAuthrimCode, mapSeverity } from '../utils/error-mapping.js';

const ENDPOINTS = {
  EMAIL_CODE_SEND: '/api/v1/auth/direct/email-code/send',
  EMAIL_CODE_VERIFY: '/api/v1/auth/direct/email-code/verify',
};

export interface EmailCodeAuthOptions {
  issuer: string;
  clientId: string;
  http: HttpClient;
  crypto: CryptoProvider;
  exchangeToken: (
    authCode: string,
    codeVerifier: string
  ) => Promise<{
    session?: Session;
    user?: User;
  }>;
}

interface EmailCodeState {
  email: string;
  attemptId: string;
  codeVerifier: string;
  expiresAt: number;
}

const CLEANUP_INTERVAL = 5 * 60 * 1000;

export class EmailCodeAuthImpl implements EmailCodeAuth {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly http: HttpClient;
  private readonly pkce: PKCEHelper;
  private readonly exchangeToken: EmailCodeAuthOptions['exchangeToken'];
  private pendingVerifications: Map<string, EmailCodeState> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: EmailCodeAuthOptions) {
    this.issuer = options.issuer;
    this.clientId = options.clientId;
    this.http = options.http;
    this.pkce = new PKCEHelper(options.crypto);
    this.exchangeToken = options.exchangeToken;
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return;

    this.cleanupTimer = setInterval(() => {
      this.pruneExpiredVerifications();
    }, CLEANUP_INTERVAL);
  }

  private pruneExpiredVerifications(): void {
    const now = Date.now();
    for (const [email, state] of this.pendingVerifications.entries()) {
      if (now > state.expiresAt) {
        state.codeVerifier = '';
        this.pendingVerifications.delete(email);
      }
    }
  }

  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup resources (must be called when the auth client is destroyed)
   */
  destroy(): void {
    this.stopCleanupTimer();
    // Clear all pending verifications and their codeVerifiers
    for (const state of this.pendingVerifications.values()) {
      state.codeVerifier = '';
    }
    this.pendingVerifications.clear();
  }

  async send(email: string, options?: EmailCodeSendOptions): Promise<EmailCodeSendResult> {
    if (!this.isValidEmail(email)) {
      throw new AuthrimError('invalid_request', 'Invalid email address format');
    }

    const { codeVerifier, codeChallenge } = await this.pkce.generatePKCE();

    const request: EmailCodeSendRequest = {
      client_id: this.clientId,
      email,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      locale: options?.locale,
    };

    const response = await this.http.fetch<EmailCodeSendResponse>(
      `${this.issuer}${ENDPOINTS.EMAIL_CODE_SEND}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok || !response.data) {
      if (response.status === 429) {
        const retryAfter = response.headers?.['retry-after'];
        throw new AuthrimError(
          'email_code_too_many_attempts',
          'Too many email code requests. Please wait before trying again.',
          {
            details: {
              retryAfter: retryAfter ? parseInt(retryAfter, 10) : 300,
            },
          }
        );
      }

      throw new AuthrimError('network_error', 'Failed to send email code');
    }

    const { attempt_id, expires_in, masked_email } = response.data;

    this.pendingVerifications.set(email.toLowerCase(), {
      email,
      attemptId: attempt_id,
      codeVerifier,
      expiresAt: Date.now() + expires_in * 1000,
    });

    return {
      attemptId: attempt_id,
      expiresIn: expires_in,
      maskedEmail: masked_email,
    };
  }

  async verify(
    email: string,
    code: string,
    _options?: EmailCodeVerifyOptions
  ): Promise<AuthResult> {
    if (!/^\d{6,8}$/.test(code)) {
      return {
        success: false,
        error: {
          error: 'email_code_invalid',
          error_description: 'Invalid code format. Please enter a 6-digit code.',
          code: 'AR002001',
          meta: { retryable: true, severity: 'warn' },
        },
      };
    }

    const state = this.pendingVerifications.get(email.toLowerCase());

    if (!state) {
      return {
        success: false,
        error: {
          error: 'challenge_invalid',
          error_description: 'No pending verification found. Please request a new code.',
          code: 'AR002004',
          meta: { retryable: false, severity: 'error' },
        },
      };
    }

    if (Date.now() > state.expiresAt) {
      this.pendingVerifications.delete(email.toLowerCase());
      return {
        success: false,
        error: {
          error: 'email_code_expired',
          error_description: 'Verification code has expired. Please request a new code.',
          code: 'AR002002',
          meta: { retryable: false, severity: 'warn' },
        },
      };
    }

    try {
      const request: EmailCodeVerifyRequest = {
        attempt_id: state.attemptId,
        code,
        code_verifier: state.codeVerifier,
      };

      const response = await this.http.fetch<EmailCodeVerifyResponse>(
        `${this.issuer}${ENDPOINTS.EMAIL_CODE_VERIFY}`,
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

          if (errorData?.error === 'invalid_code') {
            return {
              success: false,
              error: {
                error: 'email_code_invalid',
                error_description: 'Invalid verification code. Please check and try again.',
                code: 'AR002001',
                meta: { retryable: true, severity: 'warn' },
              },
            };
          }

          if (errorData?.error === 'code_expired') {
            this.pendingVerifications.delete(email.toLowerCase());
            return {
              success: false,
              error: {
                error: 'email_code_expired',
                error_description: 'Verification code has expired.',
                code: 'AR002002',
                meta: { retryable: false, severity: 'warn' },
              },
            };
          }

          if (errorData?.error === 'too_many_attempts') {
            this.pendingVerifications.delete(email.toLowerCase());
            return {
              success: false,
              error: {
                error: 'email_code_too_many_attempts',
                error_description: 'Too many incorrect attempts. Please request a new code.',
                code: 'AR002003',
                meta: { retryable: false, retry_after: 300, severity: 'error' },
              },
            };
          }
        }

        throw new AuthrimError('network_error', 'Failed to verify email code');
      }

      // Copy codeVerifier before clearing for security
      const codeVerifier = state.codeVerifier;
      state.codeVerifier = ''; // Clear immediately before exchangeToken
      this.pendingVerifications.delete(email.toLowerCase());

      const { auth_code } = response.data;
      const { session, user } = await this.exchangeToken(auth_code, codeVerifier);

      return {
        success: true,
        session,
        user,
      };
    } catch (error) {
      // Ensure codeVerifier is cleared on error (may already be cleared above)
      if (state && state.codeVerifier) {
        state.codeVerifier = '';
      }

      if (error instanceof AuthrimError) {
        return {
          success: false,
          error: {
            error: error.code,
            error_description: error.message,
            code: getAuthrimCode(error.code, 'AR002000'),
            meta: {
              retryable: error.meta.retryable,
              severity: mapSeverity(error.meta.severity),
            },
          },
        };
      }

      return {
        success: false,
        error: {
          error: 'network_error',
          error_description: error instanceof Error ? error.message : 'Unknown error',
          code: 'AR001001',
          meta: { retryable: true, severity: 'error' },
        },
      };
    }
  }

  hasPendingVerification(email: string): boolean {
    const state = this.pendingVerifications.get(email.toLowerCase());
    if (!state) return false;

    if (Date.now() > state.expiresAt) {
      this.pendingVerifications.delete(email.toLowerCase());
      return false;
    }

    return true;
  }

  getRemainingTime(email: string): number {
    const state = this.pendingVerifications.get(email.toLowerCase());
    if (!state) return 0;

    const remaining = Math.floor((state.expiresAt - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  clearPendingVerification(email: string): void {
    this.pendingVerifications.delete(email.toLowerCase());
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
