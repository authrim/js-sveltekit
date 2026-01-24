import { describe, it, expect } from 'vitest';
import {
  success,
  failure,
  failureFromParams,
  toAuthError,
  authResultToResponse,
} from '../utils/response.js';

describe('response utilities', () => {
  describe('success', () => {
    it('should create success response', () => {
      const data = { id: 1, name: 'Test' };
      const result = success(data);

      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
    });
  });

  describe('failure', () => {
    it('should create failure response', () => {
      const error = {
        code: 'AR001001',
        error: 'network_error',
        message: 'Network error',
        retryable: true,
        severity: 'error' as const,
      };
      const result = failure(error);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('failureFromParams', () => {
    it('should create failure response from params', () => {
      const result = failureFromParams({
        code: 'AR001001',
        error: 'network_error',
        message: 'Network error',
        retryable: true,
        severity: 'error',
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('AR001001');
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('toAuthError', () => {
    it('should convert DirectAuthError', () => {
      const directAuthError = {
        code: 'AR003001',
        error: 'passkey_not_found',
        error_description: 'No passkey found',
        meta: {
          retryable: false,
          severity: 'warn' as const,
        },
      };

      const authError = toAuthError(directAuthError);

      expect(authError.code).toBe('AR003001');
      expect(authError.error).toBe('passkey_not_found');
      expect(authError.message).toBe('No passkey found');
      expect(authError.retryable).toBe(false);
      expect(authError.severity).toBe('warn');
    });
  });

  describe('authResultToResponse', () => {
    it('should convert successful AuthResult', () => {
      const result = {
        success: true,
        session: {
          id: 'session-1',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      };

      const response = authResultToResponse(result);

      expect(response.data).toBeDefined();
      expect(response.data?.session).toEqual(result.session);
      expect(response.data?.user).toEqual(result.user);
      expect(response.error).toBeNull();
    });

    it('should convert failed AuthResult', () => {
      const result = {
        success: false,
        error: {
          code: 'AR003001',
          error: 'passkey_not_found',
          error_description: 'No passkey found',
          meta: {
            retryable: false,
            severity: 'warn' as const,
          },
        },
      };

      const response = authResultToResponse(result);

      expect(response.data).toBeNull();
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('AR003001');
    });
  });
});
