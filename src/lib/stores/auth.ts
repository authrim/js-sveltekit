/**
 * Svelte Auth Stores
 *
 * 設計原則:
 * - 全て Readable（Writable は export しない）
 * - イベントが Source of Truth（Store はイベントの projection）
 * - loadingState は 'idle' が完全安定状態
 */

import { writable, derived, type Readable, type Writable } from 'svelte/store';
import type { Session, User, DirectAuthError } from '@authrim/core';

/**
 * ローディング状態
 *
 * ルール:
 * - 'idle' は「完全に安定」状態
 * - 全処理完了後は必ず 'idle' に戻る
 * - エラー発生時も 'idle' に戻す（error !== null が唯一の異常判定）
 */
export type AuthLoadingState =
  | 'idle'
  | 'initializing'
  | 'authenticating'
  | 'refreshing'
  | 'signing_out';

/**
 * Auth Error (UI 向けに簡略化)
 */
export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 公開ストアインターフェース（全て Readable）
 */
export interface AuthStores {
  session: Readable<Session | null>;
  user: Readable<User | null>;
  isAuthenticated: Readable<boolean>;
  loadingState: Readable<AuthLoadingState>;
  error: Readable<AuthError | null>;
}

/**
 * 内部ストアインターフェース（writable アクセス）
 */
export interface InternalAuthStores {
  _session: Writable<Session | null>;
  _user: Writable<User | null>;
  _loadingState: Writable<AuthLoadingState>;
  _error: Writable<AuthError | null>;
  public: AuthStores;
}

/**
 * ストアファクトリ
 */
export function createAuthStores(): InternalAuthStores {
  // Internal writable stores
  const _session = writable<Session | null>(null);
  const _user = writable<User | null>(null);
  const _loadingState = writable<AuthLoadingState>('idle');
  const _error = writable<AuthError | null>(null);

  // Derived stores
  const isAuthenticated: Readable<boolean> = derived(_session, ($session) => $session !== null);

  // Public readable stores
  const publicStores: AuthStores = {
    session: { subscribe: _session.subscribe },
    user: { subscribe: _user.subscribe },
    isAuthenticated,
    loadingState: { subscribe: _loadingState.subscribe },
    error: { subscribe: _error.subscribe },
  };

  return {
    _session,
    _user,
    _loadingState,
    _error,
    public: publicStores,
  };
}

/**
 * DirectAuthError から AuthError への変換
 */
export function toAuthError(error: DirectAuthError | Error | unknown): AuthError {
  if (isDirectAuthError(error)) {
    return {
      code: error.code,
      message: error.error_description || error.error || 'An error occurred',
      details: error.meta,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
  };
}

function isDirectAuthError(error: unknown): error is DirectAuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as DirectAuthError).code === 'string'
  );
}
