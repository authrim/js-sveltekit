/**
 * Server Session Manager
 *
 * Cookie を完全に抽象化するレイヤー
 */

import type { RequestEvent } from '@sveltejs/kit';
import type { Session, User } from '@authrim/core';

/**
 * サーバー側の認証コンテキスト
 */
export interface ServerAuthContext {
  session: Session;
  user: User;
}

/**
 * ServerSessionManager のオプション
 */
export interface ServerSessionManagerOptions {
  /** Cookie 名 (default: 'authrim_session') */
  cookieName?: string;
  /** SameSite 設定 (default: 'lax') */
  sameSite?: 'strict' | 'lax' | 'none';
  /** Secure フラグ (default: true in production) */
  secure?: boolean;
  /** Path (default: '/') */
  path?: string;
  /** 有効期限（秒）(default: 7 days) */
  maxAge?: number;
  /** HttpOnly フラグ (default: true) */
  httpOnly?: boolean;
}

/**
 * Cookie API を隠す抽象化レイヤー
 */
export interface ServerSessionManager {
  get(event: RequestEvent): Promise<ServerAuthContext | null>;
  set(event: RequestEvent, context: ServerAuthContext): void;
  clear(event: RequestEvent): void;
}

const DEFAULT_COOKIE_NAME = 'authrim_session';
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/**
 * ServerSessionManager ファクトリ
 */
export function createServerSessionManager(
  options?: ServerSessionManagerOptions
): ServerSessionManager {
  const cookieName = options?.cookieName ?? DEFAULT_COOKIE_NAME;
  const sameSite = options?.sameSite ?? 'lax';
  const secure = options?.secure ?? process.env.NODE_ENV === 'production';
  const path = options?.path ?? '/';
  const maxAge = options?.maxAge ?? DEFAULT_MAX_AGE;
  const httpOnly = options?.httpOnly ?? true;

  return {
    async get(event: RequestEvent): Promise<ServerAuthContext | null> {
      const cookie = event.cookies.get(cookieName);
      if (!cookie) {
        return null;
      }

      try {
        const data = JSON.parse(cookie) as ServerAuthContext;
        // Validate structure
        if (!data.session || !data.user) {
          return null;
        }
        return data;
      } catch {
        return null;
      }
    },

    set(event: RequestEvent, context: ServerAuthContext): void {
      const value = JSON.stringify(context);
      event.cookies.set(cookieName, value, {
        path,
        sameSite,
        secure,
        httpOnly,
        maxAge,
      });
    },

    clear(event: RequestEvent): void {
      event.cookies.delete(cookieName, { path });
    },
  };
}
