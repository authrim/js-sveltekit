/**
 * Response utilities for Authrim Svelte SDK
 */

import type { AuthResult, DirectAuthError } from '@authrim/core';
import type { AuthResponse, AuthError, AuthSessionData } from '../types.js';

export function success<T>(data: T): AuthResponse<T> {
  return { data, error: null };
}

export function failure<T>(error: AuthError): AuthResponse<T> {
  return { data: null, error };
}

export function failureFromParams(params: {
  code: string;
  error: string;
  message: string;
  retryable: boolean;
  severity: 'info' | 'warn' | 'error' | 'critical';
  cause?: unknown;
}): AuthResponse<never> {
  return {
    data: null,
    error: {
      code: params.code,
      error: params.error,
      message: params.message,
      retryable: params.retryable,
      severity: params.severity,
      cause: params.cause,
    },
  };
}

export function toAuthError(error: DirectAuthError): AuthError {
  return {
    code: error.code,
    error: error.error,
    message: error.error_description || error.error || 'An error occurred',
    retryable: error.meta?.retryable ?? false,
    severity: mapSeverity(error.meta?.severity),
  };
}

function mapSeverity(severity?: string): 'info' | 'warn' | 'error' | 'critical' {
  switch (severity) {
    case 'info':
      return 'info';
    case 'warn':
    case 'warning':
      return 'warn';
    case 'critical':
    case 'fatal':
      return 'critical';
    default:
      return 'error';
  }
}

export function authResultToResponse(
  result: AuthResult & { redirectTo?: string }
): AuthResponse<AuthSessionData> {
  if (result.success && result.session && result.user) {
    return success({
      session: result.session,
      user: result.user,
      nextAction: result.nextAction,
      redirectTo: result.redirectTo,
    });
  }

  if (result.error) {
    return failure(toAuthError(result.error));
  }

  return failureFromParams({
    code: 'AR000000',
    error: 'unknown_error',
    message: 'Unknown error occurred',
    retryable: false,
    severity: 'error',
  });
}

export async function wrapWithAuthResponse<T>(
  fn: () => Promise<T>,
  defaultErrorCode = 'AR000000'
): Promise<AuthResponse<T>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      return failure(toAuthError(error as DirectAuthError));
    }

    return failureFromParams({
      code: defaultErrorCode,
      error: 'unknown_error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      retryable: false,
      severity: 'error',
      cause: error,
    });
  }
}
